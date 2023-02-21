import { Utils } from '../utils.js';
import Config from '../config.js';

const AppAnalyticsClient = {
	getCid: function () {
		if (!localStorage.appanalytics_cid) {
			localStorage.appanalytics_cid
          = new Date().getTime().toString(32) + '-' + Utils.getRandomString(8);
		}

		return localStorage.appanalytics_cid;
	},
	send: function (data) {
		data.v = 1;
		data.tid = Config.ANALYTICS_TID;
		data.an = Config.ANALYTICS_APP;
		data.cid = this.getCid();
		const body = Utils.httpBuildQuery(data);
		const xhr = new XMLHttpRequest();

		xhr.open('POST', 'https://www.google-analytics.com/collect');
		xhr.send(body);
	},
	event: function (category, action, label, data) {
		data = data || {};
		data.ec = category;
		data.ea = action;

		if (label) {
			data.el = label;
		}

		data.t = 'event';
		return this.send(data);
	},
	pageview: function (url, data) {
		data = data || {};
		data.dp = url;
		data.dh = document && document.location.host;
		data.t = 'pageview';
		return this.send(data);
	},
};

export default AppAnalyticsClient;