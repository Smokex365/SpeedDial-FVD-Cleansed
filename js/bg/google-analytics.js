const GA_ENDPOINT = 'https://www.google-analytics.com/mp/collect';
const GA_DEBUG_ENDPOINT = 'https://www.google-analytics.com/debug/mp/collect';

// Get via https://developers.google.com/analytics/devguides/collection/protocol/ga4/sending-events?client_type=gtag#recommended_parameters_for_reports
const MEASUREMENT_ID = 'G-LSCK5BVS7D';
const API_SECRET = 'cRhL51L1R1WBBiOuSoDK-Q';
const DEFAULT_ENGAGEMENT_TIME_MSEC = 100;
const GEOLOCATION_URL = 'https://geoloc.tempest.com';

// Duration of inactivity after which a new session is created
const SESSION_EXPIRATION_IN_MIN = 30;

export class Analytics {
	constructor(debug = false) {
		this.debug = debug;
	}

	async getUserInfo() {
		const storageUserInfo = await chrome.storage.local.get('sync.user-info') || {};
		return storageUserInfo?.['sync.user-info'] || { auth: false, user: null };
	}

	async getUserStatus() {
		const userInfo = await this.getUserInfo();

		if (!userInfo?.auth) {
			return 'Free';
		}

		return (userInfo?.auth && userInfo?.user?.premium?.active) ? 'Premium' : 'Free';
	}

	// Returns the client id, or creates a new one if one doesn't exist.
	// Stores client id in local storage to keep the same client id as long as
	// the extension is installed.
	async getOrCreateClientId() {
		let { clientId } = await chrome.storage.local.get('clientId');
		
		if (!clientId) {
			// Generate a unique client ID, the actual value is not relevant
			clientId = self.crypto.randomUUID();
			await chrome.storage.local.set({ clientId });
		}

		return clientId;
	}

	async getGeolocation() {
		const { sessionData } = await chrome.storage.session.get('sessionData');
		return JSON.parse(sessionData.geolocation);
	}

	// Returns the current session id, or creates a new one if one doesn't exist or
	// the previous one has expired.
	async getOrCreateSessionId() {
		// Use storage.session because it is only in memory
		let { sessionData } = await chrome.storage.session.get('sessionData');
		const currentTimeInMs = Date.now();

		// Check if session exists and is still valid
		if (sessionData && sessionData.timestamp) {
			// Calculate how long ago the session was last updated
			const durationInMin = (currentTimeInMs - sessionData.timestamp) / 60000;

			// Check if last update lays past the session expiration threshold
			if (durationInMin > SESSION_EXPIRATION_IN_MIN) {
				// Clear old session id to start a new session
				sessionData = null;
			} else {
				// Update timestamp to keep session alive
				sessionData.timestamp = currentTimeInMs;
				await chrome.storage.session.set({ sessionData });
			}
		}

		if (!sessionData) {
			// Create and store a new session
			const clientGeolocationResult = await fetch(GEOLOCATION_URL);
			const clientGeolocation = await clientGeolocationResult.json();
			sessionData = {
				session_id: currentTimeInMs.toString(),
				timestamp: currentTimeInMs.toString(),
				geolocation: JSON.stringify(clientGeolocation),
			};
			await chrome.storage.session.set({ sessionData });
		}

		return sessionData.session_id;
	}

	// Fires an event with optional params. Event names must only include letters and underscores.
	async fireEvent(name, params = {}) {
		// Configure session id and engagement time if not present, for more details see:
		// https://developers.google.com/analytics/devguides/collection/protocol/ga4/sending-events?client_type=gtag#recommended_parameters_for_reports
		if (!params.session_id) {
			params.session_id = await this.getOrCreateSessionId();
		}

		if (!params.engagement_time_msec) {
			params.engagement_time_msec = DEFAULT_ENGAGEMENT_TIME_MSEC;
		}

		
		const geolocation = await this.getGeolocation();
		const userId = await this.getOrCreateClientId();
		const { install_date } = await chrome.storage.sync.get('install_date');
		const userStatus = await this.getUserStatus();

		const response = await fetch(
			`${
				this.debug ? GA_DEBUG_ENDPOINT : GA_ENDPOINT
			}?measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`,
			{
				method: 'POST',
				body: JSON.stringify({
					client_id: userId,
					events: [
						{
							name,
							params: {
								...params,
								city_name: geolocation.CityName || 'Undefined',
								country_code: geolocation.CountryCode,
								language: navigator.language.toLocaleLowerCase(),
								user_id: userId,
								user_type: userStatus,
								install_date,
							},
						},
					],
				}),
			}
		);

		if (this.debug) {
			console.log(await response.text());
		}

		return true;
	}

	// Fire a page view event.
	async fireTabViewEvent(params) {
		return this.fireEvent('page_view', {
			page_title: 'New tab',
			...params,
		});
	}

	formatDialParams(dial) {
		const params = {
			dial_title: dial.title,
			dial_url: dial.url,
			dial_id: dial.dial_id || 'Popular',
			dial_group: dial.group,
			dial_group_id: dial.group_id || 'Popular',
			affiliation: dial.affiliation,
		};

		if (dial.group !== 'Recommended' && dial.group !== 'Shop & Travel') {
			delete params.dial_title;
			delete params.dial_url;
		}

		return params;
	}

	async fireDialClickEvent(dial) {
		return this.fireEvent('dial_click', this.formatDialParams(dial));
	}

	async fireGroupVisitEvent(params) {
		return this.fireEvent('group_click', params);
	}

	async fireInstallEvent() {
		await chrome.storage.sync.set({ install_date: new Date().toISOString().slice(0, 10) });
		return this.fireEvent('install');
	}

	async fireUpdateEvent() {
		return this.fireEvent('update');
	}

	async fireRemoveDialEvent(dial) {
		return this.fireEvent('remove_dial', this.formatDialParams(dial));
	}

	async fireRestoreDialEvent(params) {
		return this.fireEvent('restore_dial', params);
	}

	async fireAddDialEvent(dial) {
		return this.fireEvent('add_dial', this.formatDialParams(dial));
	}

	async fireSearchEvent(query, searchEngine) {
		return this.fireEvent('search', { term: query, search_engine: searchEngine });
	}

	// Fire an error event.
	async fireErrorEvent(error, additionalParams = {}) {
		// Note: 'error' is a reserved event name and cannot be used
		// see https://developers.google.com/analytics/devguides/collection/protocol/ga4/reference?client_type=gtag#reserved_names
		return this.fireEvent('extension_error', {
			...error,
			...additionalParams,
		});
	}
}

export default new Analytics();