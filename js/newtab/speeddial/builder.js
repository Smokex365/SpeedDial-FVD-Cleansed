(function(){

  const mirrorSurfaceDistance = 0;
  const CLICK_SCREEN_OVER = 100;

  var cellsMirrors = {};
  var mirrorsElemsAttrs = {};


  var mirrorsCheckInterval = null;
  const mirrorUpdatePeriod = 100;
  const mirrorFadeTimeout = 200;

  var Builder = function(){
    var that = this;
  };

  Builder.prototype = {
    _effSizeDim: function(dim) {
      return dim + fvdSpeedDial.SpeedDial._dialBodyPadding * 2;
    },

    listViewContainerSize: function( container, countInRow ){

      var countChilds = container.childNodes.length;
      var countInCol = this.listElemCountInCol( countInRow, countChilds );

      if( countInRow > countChilds ){
        countInRow = countChilds;
      }

      var size = fvdSpeedDial.SpeedDial._currentListElemSize();

      var width = size.width * countInRow + fvdSpeedDial.SpeedDial._listElemMarginX * (countInRow);
      var height = size.height * countInCol + fvdSpeedDial.SpeedDial._listElemMarginY * (countInCol);

      return {
        width: width,
        height: height
      };

    },

    listCol: function(){

      var row = document.createElement( "div" );
      row.className = "listCol";
      return row;

    },

    listElemCountInCol: function( inRow, totalCount ){

      return  Math.ceil( totalCount / inRow );

    },

    listElem: function(num, countInCol, data, displayType, adv) {
      var dataPreview = this.getDialPreviewData(data);

      var cell = fvdSpeedDial.Templates.clone( "prototype_"+displayType+"ListElem" );

      cell.setAttribute( "id", "dialCell_" + data.id );
      cell.setAttribute( "type", displayType );

      var textNode = cell.getElementsByClassName("text")[0];
      textNode.textContent = data.displayTitle;

      var favicon = cell.getElementsByTagName("img")[0];
      favicon.setAttribute( "src", "chrome://favicon/"+data.url );

      this._assignEvents( cell, data, displayType, "list" );

      fvdSpeedDial.ContextMenus.assignToElem( cell, displayType );


        //this.setListElemPos( cell, num, countInCol ); // Task #1423
        var countInColInd = countInCol;
        var numInd = num;

        if(typeof adv == "object" && adv.total && adv.countInRow){ // Task #1423
            if(
                countInCol == 2
                &&
                (
                    (adv.total == 4 && adv.countInRow == 3 && num > 1)
                    ||
                    (adv.total == 5 && adv.countInRow == 4 && num > 2)
                )
            ){
                countInColInd = 1;
                numInd = num - 1;
            }
        }

        this.setListElemPos( cell, numInd, countInColInd );


      cell.style.position = "absolute";
      if( displayType == "speeddial" ){
        cell.setAttribute( "position", data.position);
      }

      var size = fvdSpeedDial.SpeedDial._currentListElemSize();

      cell.style.height = size.height + "px";

      // for list view type selection

      if( !data.displayTitle ){

        if( displayType != "recentlyclosed" ) {

          if( data.get_screen_method == "manual" ){
            cell.setAttribute( "_title", _("newtab_click_to_get_title") );
          }
          else{
            cell.setAttribute( "_title", _("newtab_getting_title") );

            fvdSpeedDial.SpeedDial.ThumbManager.hiddenCaptureThumb( {
              data: data,
              type: cell.getAttribute("type"),
              saveImage: false,
              resetScreenMaked: false,
              interval: fvdSpeedDial.SpeedDial.currentGroupId(),
              elemId: cell.getAttribute("id"),
              elem: cell
            } );
          }

          cell.setAttribute("notitle", 1);
        }
        else {
          cell.setAttribute("_title", "");
        }
      }
      else {
        cell.setAttribute("_title", data.displayTitle);
      }

      cell.setAttribute( "_url", dataPreview.url );

      if( displayType == "mostvisited" ){

        var viewsText = cell.getElementsByClassName( "views" )[0];
        var inGroup = cell.getElementsByClassName( "ingroup" )[0];

        var views = null;
        var ingroup = null;

        views = _( "newtab_mostvisited_views" );
        ingroup = _( "newtab_mostvisited_ingroup" );

        viewsText.textContent = views + ": " + data.totalVisits;
        inGroup.textContent = ingroup + ": " + data.inGroup;

      }

      return cell;

    },

    setListElemPos: function( cell, num, countInCol ){
      var pos = this._listElemPos( num, countInCol );

        console.debug("setListElemPos", num, countInCol, pos);

      cell.style.top = pos.y + "px";
      cell.style.left = pos.x + "px";
      cell.setAttribute( "col", pos.col );
      cell.setAttribute( "row", pos.row );
      cell.setAttribute( "index", num );
    },

    plusCell: function( num, countInRow, size, countRowsTotal ){
      var cell = fvdSpeedDial.Templates.clone( "prototype_speeddialCell" );

      cell.removeAttribute("id");

      cell.setAttribute( "width", size.width );
      cell.setAttribute( "height", size.height );

      var dialPos = this._getDialXY(num, countInRow, size);

      cell.style.left = dialPos.x + "px";
      cell.style.top = dialPos.y + "px";

      cell.setAttribute( "col", dialPos.col );
      cell.setAttribute( "row", dialPos.row );

      var body = cell.getElementsByClassName("body")[0];

      body.style.width = this._effSizeDim(size.width) + "px";
      body.style.height = this._effSizeDim(size.height) + "px";
      cell.style.width = this._effSizeDim(size.width) + fvdSpeedDial.SpeedDial._dialBodyPadding * 2 + "px";

      cell.setAttribute( "type", "plus" );

      this.setDialSkew( cell, dialPos, countInRow, size, countRowsTotal );

      // events

      cell.onclick = function( event ){
        if( event.button == 0 ){
          fvdSpeedDial.Dialogs.addDial();
        }
      };

      cell.querySelector( ".footer span" ).innerHTML = "&nbsp;";

      return cell;
    },

    cellsContainerHeight: function( countCells, countInRow, size ){
      var height = 0;

      var num = countCells - 1;
      var dialPos = this._getDialXY(num, countInRow, size);
      height = dialPos.y + size.height + fvdSpeedDial.SpeedDial.cellsMarginY();

      if (fvdSpeedDial.Prefs.get("sd.display_mode") == "fancy") {
        height += 100; // experimental
      }
      return height;
    },

    refreshLastRow: function(){

      var _dials = document.querySelectorAll( ".newtabCell" );

      var maxRow = 0,
          i,
          row;

      for( i = 0; i != _dials.length; i++ ){
        _dials[i].removeAttribute( "lastrow" );

        row = parseInt(_dials[i].getAttribute("row"), 10);
        if( row > maxRow ){
          maxRow = row;
        }
      }

      for( i = 0; i != _dials.length; i++ ){
        row = parseInt(_dials[i].getAttribute("row"), 10);
        if( row == maxRow ){
          _dials[i].setAttribute( "lastrow", 1 );
        }
      }

    },

    // if have position changes of dials, this function reorder dials list and change visually their positions
    refreshDialsByPositions: function( countInRow, displayMode, size ){
      var i,
          _dials,
          dials;
      if( displayMode == "list" ){
        _dials = document.getElementsByClassName( "newtabListElem" );
        var countInCol = this.listElemCountInCol( countInRow.cols, _dials.length );

        if( typeof countInRow == "object" ){
          countInRow = countInRow.cols;
        }

        // to array
        dials = [];
        for( i = 0; i != _dials.length; i++ ){
          dials.push( _dials[i] );
        }

        // order list
        dials.sort(function( a,b ){
          return a.getAttribute("position") - b.getAttribute("position");
        });

        for( i = 0; i != dials.length; i++ ){
          this.setListElemPos( dials[i], i, countInCol );
        }
      }
      else{
        _dials = document.querySelectorAll( ".newtabCell[type=speeddial]" );

        // need to recalc in horizontal mode
        if( fvdSpeedDial.SpeedDial.Scrolling.activeScrollingType() == "horizontal" ){
          countInRow = fvdSpeedDial.SpeedDial.cellsInRowMax( null, null, {
            objects: _dials.length
          } );
        }

        if( typeof countInRow == "object" ){
          if( countInRow.rows ){
            countInRow = Math.ceil( _dials.length / countInRow.rows );

            if( _b( fvdSpeedDial.Prefs.get("sd.display_plus_cells") ) ){
              countInRow++;
            }
          }
          else{
            countInRow = countInRow.cols;
          }
        }

        // to array
        dials = [];
        for(i = 0; i != _dials.length; i++){
          if( _dials[i].hasAttribute("type") && _dials[i].getAttribute("type") == "plus" ){
            continue;
          }
          dials.push( _dials[i] );
        }

        // order list
        dials.sort(function( a,b ){
          return a.getAttribute("position") - b.getAttribute("position");
        });

        var countRows = document.getElementById("cellsContainer").getAttribute("rows");

        for(i = 0; i != dials.length; i++){
          var cell = dials[i];

          var dialPos = this._getDialXY(i, countInRow, size);

          this.setDialPosition( cell, dialPos );
          this.setDialSkew(cell, dialPos, countInRow, size, countRows);
        }
      }

      this.refreshLastRow();

    },

    skewAngle: function( col, row, middle, countRowsTotal, inRow ){
      var skewMax = 1.7;

      var middleRow = Math.floor(countRowsTotal/2);

      if(inRow % 2 === 0){
        middle++;
      }

      var skewDeg = skewMax * Math.abs( col - middle ) / middle;

      var type = "top";

      if( row >= middleRow ){
        type = "down";
      }

      if( type == "down" ){
      }

      return {
        deg: skewDeg,
        type: type
      };
    },


    rotateAngle: function( col, row, middle, countRowsTotal, inRow ){
      if( inRow % 2 === 0 ){
        inRow++;
        middle = Math.ceil( inRow/2 ) - 1;

        if( col >= middle ){
          col++;
        }
      }

      var skewMax = fvdSpeedDial.Prefs.get("sd.rotate_angle_max");
      var newSkewMax;
      var originLeft;
      var middleRow = Math.floor(countRowsTotal/2);

      newSkewMax = inRow/10 * skewMax;

      if( newSkewMax > skewMax ){
        newSkewMax = skewMax;
      }
      skewMax = newSkewMax;

      var fixedMiddle = false;

      var skewDeg = skewMax * Math.abs( col - middle ) / middle;

      var type = "top";

      if( row >= middleRow ){
        type = "down";
      }

      if( type == "down" ){
      }

      var originTop = 0;

      if( skewDeg == 0 ){
        originLeft = 0;
      }
      else{
        if( col <= middle ){
          originLeft = 100 + (middle - col - 1) * 50;
        }
        else{
          originLeft = 0 - (col - middle - 1) * 50;
        }

      }

      return {
        deg: skewDeg,
        type: type,
        originLeft: originLeft,
        originTop: originTop
      };
    },

    dialZ: function( col, row, middle, countRowsTotal, inRow, size ){
      // get z pos
      var z = 0;
      if( col != middle ){
        var c = middle;
        var inc = col < middle ? -1 : 1;
        while( c != col ){
          z = z + size.width * Math.sin( this.rotateAngle( c, row, middle, countRowsTotal, inRow ).deg * Math.PI/180 );
          c += inc;
        }
      }
      return z;
    },

    setDialSkew: function( cell, dialPos, inRow, size, countRowsTotal ){

      if( fvdSpeedDial.Prefs.get("sd.display_mode") != "fancy" ){
        return;
      }

      var middle = Math.ceil( inRow/2 ) - 1;

      var angle = 0;
      if( dialPos.col != middle || inRow % 2 == 0 ){
        angle = this.rotateAngle( dialPos.col, dialPos.row, middle, countRowsTotal, inRow );

        if( dialPos.col > middle ){
          angle.deg = -angle.deg;
        }

        cell.style.webkitTransform = "rotateY("+angle.deg+"deg)"; //"rotateY("+(angle.deg * 40)+"deg)" //"skewY("+angle.deg+"deg)";

        cell.style.webkitTransformOrigin = angle.originLeft + "% "+angle.originTop+"%";

        cell.setAttribute( "skew", angle.deg );
      }
      else{
        cell.style.webkitTransform = "";
      }

      var relPos = dialPos.col;
      if( relPos > middle ){
        relPos = inRow - 1 - dialPos.col;
      }

    },

    setDialPosition: function( cell, dialPos ){
      cell.style.left = dialPos.x + "px";
      cell.style.top = dialPos.y + "px";

      cell.setAttribute( "row", dialPos.row );
      cell.setAttribute( "col", dialPos.col );
    },

    cellTitle: function(data) {
      var params = {
        url: data.url,
        title: data.title
      };


        var title = String(params.title + "\n" + params.url);



      return this.cutTitle(title);// Task #1273
    },

    cutTitle: function(title){
        var limit = 100;

        title = String(title);

        if(title.length > limit) title = title.substr(0,limit) + '...'; // Task #1273

        return title;
    },

    getDialPreviewData: function(data) {
      var previewData = {};
      var override = {};
      if(data.display_url) {
        override.url = data.display_url;
      }
      for(var k in data) {
        var v = data[k];
        if(override && override[k]) {
          v = override[k];
        }
        previewData[k] = v;
      }
      return previewData;
    },

    cell: function(data, num, countInRow, displayType, displayMode, size, countRowsTotal) {
      var cell = fvdSpeedDial.Templates.clone("prototype_"+displayType+"Cell");
      var dataPreview = this.getDialPreviewData(data);

      cell.setAttribute("data-url", data.url);
      if(data.display_url) {
        cell.setAttribute("data-display-url", data.display_url);
      }
      cell.setAttribute("width", size.width);
      cell.setAttribute("height", size.height);
      cell.setAttribute("id", "dialCell_" + data.id);
      cell.setAttribute("type", displayType);

      var dialPos = this._getDialXY(num, countInRow, size);

      // postitioning things
      this.setDialPosition( cell, dialPos, countInRow );

      this.setDialSkew( cell, dialPos, countInRow, size, countRowsTotal );

      cell.setAttribute( "position", data.position );

      if( data.displayDialBg ){
        cell.setAttribute("displayDialBg", data.displayDialBg);
      }

      var body = cell.getElementsByClassName("body")[0];

      body.style.width = this._effSizeDim(size.width) + "px";
      body.style.height = this._effSizeDim(size.height) + "px";
      cell.style.width = this._effSizeDim(size.width) + fvdSpeedDial.SpeedDial._dialBodyPadding * 2 + "px";

      var titleBlock = cell.getElementsByClassName("head")[0].getElementsByTagName("span")[0];

      if(data.displayTitle) {
        titleBlock.textContent = data.displayTitle;
        titleBlock.setAttribute("title", this.cutTitle(data.displayTitle)); // Task #1273
      }
      else{
        if( data.get_screen_method == "manual" ){
          titleBlock.textContent = _("newtab_click_to_get_title");
        }
        else{
          titleBlock.textContent = _("newtab_getting_title");
        }
      }

      if(
          fvdSpeedDial.Prefs.get("sd.display_mode") == "fancy"
          ||
          true // Task #1494
      ) {
        cell.setAttribute("title", this.cellTitle({
          title: titleBlock.textContent,
          url: dataPreview.url
        }));
      }

      if( !data.displayTitle ){
        cell.setAttribute( "notitle", 1 );
      }

      var footerTitleBlock = cell.getElementsByClassName("footer")[0].getElementsByTagName("span")[0];
      footerTitleBlock.textContent = fvdSpeedDial.Utils.urlToCompareForm(dataPreview.url);

      var favicon = cell.getElementsByClassName("head")[0].getElementsByTagName("img")[0];
      favicon.setAttribute( "src", "chrome://favicon/"+data.url );

      var that = this;

      var screenParent = body.getElementsByClassName("screenParent")[0];
      fvdSpeedDial.SpeedDial.ThumbManager.setThumbToElement( {
        elem: cell,
        data: data,
        cellSize: size,
        interval: fvdSpeedDial.SpeedDial.currentGroupId(),
        nocache: data.thumb_version
      } );

      var menuOverlay = cell.getElementsByClassName("menuOverlay")[0];

      if( displayType == "speeddial" ){
        var clicksText = menuOverlay.getElementsByClassName( "text" )[0];

        var spanClicksCount = document.createElement( "span" );
        spanClicksCount.className = "clicksCount";
        spanClicksCount.textContent = data.clicks;

        clicksText.appendChild( document.createTextNode( _("newtab_dial_clicks") + ": " ) );
        clicksText.appendChild( spanClicksCount );
      }
      else if( displayType == "mostvisited" ){
        // set views and in group
        var viewsText = cell.getElementsByClassName( "views" )[0];
        var inGroup = cell.getElementsByClassName( "ingroup" )[0];

        var views = null;
        var ingroup = null;

        if( displayMode != "small" ){
          views = _( "newtab_mostvisited_views" );
          ingroup = _( "newtab_mostvisited_ingroup" );
        }
        else{
          views = _( "newtab_mostvisited_views_small" );
          ingroup = _( "newtab_mostvisited_ingroup_small" );
        }

        viewsText.textContent = views + ": " + data.totalVisits;
        inGroup.textContent = ingroup + ": " + data.inGroup;
      }

      // context menu
      fvdSpeedDial.ContextMenus.assignToElem( cell, displayType );

      // assign events
      this._assignEvents( cell, data, displayType, displayMode );

      return cell;
    },

    documentTitle: function(text){
        text = String(text).split('(')[0].trim();

        if(text == _('newtab_default') || text == "Default" ){
            text = '';
        }else{
            text = " - " + text;
        }

        document.title = _('newtab_title') + text;
    },

    Groups: {

      item: function( text, groupId, countDials ){
        var item = document.createElement( "div" );
        item.setAttribute( "class", groupId != "restore" ? "group" : "group restore-session" );// Task #1189
        var spanName = document.createElement("span");
        var spanCount = document.createElement("span");

        spanName.className = "groupName";

        if( typeof countDials != "undefined" ){
          spanName.textContent = text;
          spanCount.textContent = " ("+countDials+")";
            spanCount.className = "groupCount";
        }
        else{
          spanName.textContent = text;
        }

        item.appendChild( spanName );
        item.appendChild( spanCount );

        var that = this;

        // prevents dbl click
        item.addEventListener( "dblclick", function(event){
          event.stopPropagation();
        }, false );


        if(groupId != "restore"){// Task #1189
            item.addEventListener( "click", function( event ){
              fvdSpeedDial.SpeedDial.setCurrentGroupId( groupId );
            }, false );

            // special for right click event. if mouse up - activate group, it uses because context menu prevent propagation of "click" event for right button
            item.addEventListener( "mouseup", function( event ){
              if( event.button == 2 ){
                fvdSpeedDial.SpeedDial.setCurrentGroupId( groupId );
              }
            }, false );
        }else{
            item.addEventListener( "click", function( event ){
                chrome.runtime.sendMessage({
                    action: "previousSession:restore"
                });
            }, false );
        }

        if( fvdSpeedDial.SpeedDial.currentGroupId() == groupId ){
          item.setAttribute( "current", "1" );

            try{
                fvdSpeedDial.SpeedDial.Builder.documentTitle(text);
            }catch(ex){}
        }
        else{
          item.setAttribute( "current", "0" );
        }

        item.setAttribute("id", "group_select_" + groupId);
        item.setAttribute("title", item.textContent);

        return item;
      },

      additionalGroupsButton: function(){
        var additionalGroupsButton = document.createElement( "div" );
        additionalGroupsButton.className = "additionalGroupsButton";
        var img = document.createElement("div");
        img.className = "img";
        additionalGroupsButton.appendChild( img );

        additionalGroupsButton.addEventListener( "click", function( event ){

          fvdSpeedDial.SpeedDial.Groups.displayAdditionalList();

          event.stopPropagation();

        }, false );

        return additionalGroupsButton;
      },

      additionalList: function( groups ){

        var container = document.createElement( "div" );
        container.className = "additionalGroupsList";

        var list = document.createElement( "div" );
        list.className = "additionalGroupsElemList";

        var that = this;

        for( var i = 0; i != groups.length; i++ ){
          var group = groups[i];
          (function(group){
            var groupElem = that.item( group.name, group.id, group.count_dials );
            fvdSpeedDial.ContextMenus.assignToElem( groupElem, "speeddialGroup" );
            //container.appendChild( groupElem );
            list.appendChild( groupElem );
          })(group);
        }

        container.appendChild( list );

        var manageGroups = document.createElement("div");
        manageGroups.className = "manageGroups";

        manageGroups.textContent = _("newtab_manage_groups");

        manageGroups.addEventListener( "click", function(){

          fvdSpeedDial.Dialogs.manageGroups();

        }, false );

        container.appendChild( document.createElement("hr") );

        container.appendChild( manageGroups );

        return container;

      }

    },

    _getDialXY: function( num, countInRow, size ){
      var xInCells = num % countInRow;
      var yInCells = Math.floor(num / countInRow);

      var x = xInCells * size.width + (xInCells > 0 ? (xInCells) * fvdSpeedDial.SpeedDial._cellsMarginX : 0);
      var y = yInCells * size.height + (yInCells > 0 ? (yInCells) * fvdSpeedDial.SpeedDial.cellsMarginY() : 0);

      return {
        "x": x,
        "y": y,
        "row": yInCells,
        "col": xInCells
      };
    },

    _listElemPos: function( num, countInCol ){
      var yInCells = num % countInCol;
      var xInCells = Math.floor(num / countInCol);

      var size = fvdSpeedDial.SpeedDial._currentListElemSize();

      var x = xInCells * size.width + (xInCells > 0 ? (xInCells) * fvdSpeedDial.SpeedDial._listElemMarginX : 0);
      var y = yInCells * size.height + (yInCells > 0 ? (yInCells) * fvdSpeedDial.SpeedDial._listElemMarginY : 0);

      return {
        x: x,
        y: y,
        col: xInCells,
        row: yInCells
      };
    },


    _assignEvents: function( cell, data, displayType, displayMode ){

      var clickEventAssigned = false;

      // prevent scrolling by middel button on dial
      cell.addEventListener( "mousedown", function( event ){
        event.preventDefault();
      });

      if( displayMode != "list" ){
        var favicon = cell.getElementsByClassName("head")[0].getElementsByTagName("img")[0];
        // prevent dragging on favicon iamge
        favicon.addEventListener( "mousedown", function( event ){
          event.preventDefault();
        }, false );

        if( data.thumb_source_type == "screen" && data.get_screen_method == "manual" ) {
          if( data.screen_maked == 0 ) {
            clickEventAssigned = true;
            // onclick make screen
            cell.addEventListener( "click", function( event ){
              if( cell.hasAttribute("noclick") ){
                cell.removeAttribute("noclick");
                return;
              }

              if( event.button == 0 ) {
                fvdSpeedDial.SpeedDial.makeThumb( data.id, data.url, displayType, data.screen_delay );
              }

              event.stopPropagation();
            }, false );
          }
        }
      }


      if( !clickEventAssigned ){
        if( !data.displayTitle && data.get_screen_method == "manual" ){
          clickEventAssigned = true;
          // onclick make screen
          cell.addEventListener( "click", function( event ){
            if( cell.hasAttribute("noclick") ){
              cell.removeAttribute("noclick");
              return;
            }

            if( event.button == 0 ){
              fvdSpeedDial.SpeedDial.makeThumb( data.id, data.url, displayType, data.screen_delay, false );
            }

            event.stopPropagation();
          }, false );
        }
      }
      // events for all types

      // add dbl click listener (empty)
      cell.addEventListener("dblclick", function( event ){
        event.stopPropagation();
      }, false);

      if(!clickEventAssigned) {

        var allowAddClick = true;

        UniClick.add(cell, function(event) {
          if(cell.hasAttribute("noclick")) {
            cell.removeAttribute("noclick");
            return;
          }

          if( displayType == "speeddial" ){
            if( allowAddClick ){
              fvdSpeedDial.SpeedDial.addDialClick( data.id );
              allowAddClick = false;
              setTimeout(function(){
                allowAddClick = true;
              }, 10000);
            }
          }

          let data_url = fvdSpeedDial.SpeedDial.urlReplace(data.url)
          var openedIn = fvdSpeedDial.Utils.Opener.asClicked( data_url, fvdSpeedDial.Prefs.get( "sd.default_open_in" ), event );
          if( displayMode != "list" && openedIn == "current" ){
            if( fvdSpeedDial.Prefs.get( "sd.display_mode" ) == "fancy" ){
              var cells = document.getElementsByClassName( "newtabCell" );
              for( var i = 0; i != cells.length; i++ ){
                if( cells[i] == cell ){
                  continue;
                }
                cells[i].setAttribute( "fadeOut", 1 );
              }
            }
          }

          if( displayType == "recentlyclosed" ){
            fvdSpeedDial.Storage.RecentlyClosed.remove( data.id, function(){
              fvdSpeedDial.SpeedDial.dialRemoveAnimate( data.id );
            } );
          }
          event.stopPropagation();
        });
      }

      var removeButton = cell.getElementsByClassName( "remove" )[0];
      removeButton.addEventListener( "click", function( event ){
        event.stopPropagation();
            var confirmResult = false;
            fvdSpeedDial.Utils.Async.chain( [
                function(chainCallback) {
                    if(!_b(fvdSpeedDial.Prefs.get( "sd.display_dial_remove_dialog" ))){
                        confirmResult = true; chainCallback();
                    }
                    else{
                        fvdSpeedDial.Dialogs.confirmCheck( _("dlg_confirm_remove_dial_title"), _("dlg_confirm_remove_dial_text"), _("dlg_dont_show_it_again"), false, function(result, state){ //fvdSpeedDial.Dialogs.confirm( _("dlg_confirm_remove_dial_title"), _("dlg_confirm_remove_dial_text"), function( confirmResult ){
                            confirmResult = result;
                            if( confirmResult && state ){
                              fvdSpeedDial.Prefs.set( "sd.display_dial_remove_dialog", false );
                            }
                            chainCallback();
                        } );
                    }
                },
                function(chainCallback) {

                  if( confirmResult ){
                    if( displayType == "speeddial" ){

                      fvdSpeedDial.Sync.addDataToSync( {
                        category: "deleteDials",
                        data: data.id,
                        translate: "dial"
                      }, function(){

                        fvdSpeedDial.Storage.deleteDial( data.id, function(){
                          fvdSpeedDial.SpeedDial.dialRemoveAnimate( data.id );
                        } );

                      });


                    }
                    else if( displayType == "recentlyclosed" ){
                      fvdSpeedDial.Storage.RecentlyClosed.remove( data.id, function(){
                        fvdSpeedDial.SpeedDial.dialRemoveAnimate( data.id );
                      } );
                    }
                    else if( displayType == "mostvisited" ){
                      fvdSpeedDial.Storage.MostVisited.deleteId( data.id, function( result ){

                        if( result.result ){
                          fvdSpeedDial.SpeedDial.dialRemoveAnimate( data.id );
                        }

                      } );
                    }
                  }
                }
            ]);
      }, false );

      if( displayType != "recentlyclosed" ){

        var editButton = cell.getElementsByClassName( "edit" )[0];
        editButton.addEventListener( "click", function( event ){

          if( event.button != 0 ){
            return;
          }

          event.stopPropagation();

          fvdSpeedDial.Dialogs.addDial( data, displayType, false );

        }, false );

      }

      if( displayType == "mostvisited" || displayType == "recentlyclosed" ){
        var denyButton = cell.getElementsByClassName( "deny" )[0];
        denyButton.addEventListener( "click", function( event ){

          if( event.button != 0 ){
            return;
          }

          fvdSpeedDial.Dialogs.deny( {
            "type": "url",
            "sign": data.url
          } );

          event.stopPropagation();

        }, false );

        var addButton = cell.getElementsByClassName( "add" )[0];
        addButton.addEventListener( "click", function( event ){

          if( event.button != 0 ){
            return;
          }

          if( data.title ){

          }
          else if( data.auto_title ){
            data.title = data.auto_title;
          }

          fvdSpeedDial.Dialogs.addDial( data, "speeddial", true );

          event.stopPropagation();

        }, false );
      }

      // mostvisited related events
      if( displayType == "mostvisited" ){

        var inGroup = cell.getElementsByClassName( "ingroup" )[0];

        inGroup.addEventListener( "click", function( event ){
          fvdSpeedDial.Dialogs.viewGroup( data.host );
          event.stopPropagation();
        }, false );

      }
      else if( displayType == "recentlyclosed" ){

      }
      else if( displayType == "speeddial" ){
        // speeddial related
        cell.addEventListener( "mousedown", function( event ){
          if( event.button != 0 ){
            return;
          }

          var isFancyMode = false;
          if( fvdSpeedDial.Prefs.get( "sd.display_mode" ) == "fancy" ){
            isFancyMode = true;
          }

          if( isFancyMode ){
            cell.setAttribute( "transformBeforeDrag", cell.style.webkitTransform );
            cell.setAttribute( "transformOriginBeforeDrag", cell.style.webkitTransformOrigin );
          }

          var needStartDrag = true;

          function _startDragMouseUp(){
            needStartDrag = false;
          }

          cell.addEventListener( "mouseup", _startDragMouseUp, false );

          setTimeout( function(){

            cell.removeEventListener( "mouseup", _startDragMouseUp );

            if( !needStartDrag ){
              return;
            }
            if(fvdSpeedDial.SpeedDial.currentGroupId() == 0) {
              fvdSpeedDial.SpeedDialMisc.showCenterScreenNotification(_("newtab_cant_move_dials_in_popular"));
              return;
            }
            fvdSpeedDial.SpeedDial.DragAndDrop.startDrag( cell, function(draggedOn){

              //removeSpecialMirror();

              cell.removeAttribute("transformBeforeDrag");
              cell.removeAttribute("transformOriginBeforeDrag");

              var insertType = draggedOn.getAttribute( "insert_type" );

              // animate
              var dials = [];
              if( displayMode == "list" ){
                dials = document.getElementsByClassName( "newtabListElem" );
              }
              else{
                dials = document.querySelectorAll( ".newtabCell[type=speeddial]" );
              }

              var maxDialPosition = 0;
              // get max dial position
              for( var i = 0; i != dials.length; i++ ){
                var dialPos = parseInt( dials[i].getAttribute("position") );
                if( dialPos > maxDialPosition ){
                  maxDialPosition = dialPos;
                }
              }

              var relDial = {
                position: parseInt( draggedOn.getAttribute("position") )
              };
              var dial = {
                position: parseInt( cell.getAttribute("position") )
              };

              var sign = null;

              if( relDial.position > dial.position ){
                sign = -1;
              }
              else{
                sign = 1;
              }
              var newDialPosition;
              if( insertType == "after" ){
                if( sign == -1 ){
                  newDialPosition = relDial.position;
                }
                else{

                  newDialPosition = relDial.position + 1;

                  if( newDialPosition > maxDialPosition ){
                    newDialPosition = relDial.position;
                  }

                }
              }
              else if( insertType == "before" ){
                if( sign == 1 ){
                  newDialPosition = relDial.position;
                }
                else{
                  newDialPosition = relDial.position - 1;
                  if( newDialPosition < 1 ){
                    newDialPosition = 1;
                  }
                }
              }

              if( newDialPosition == dial.position ){
                // no position changes

                fvdSpeedDial.SpeedDial.Builder.refreshDialsByPositions( fvdSpeedDial.SpeedDial.cellsInRowMax( null, null, {
                  objects: function(){
                    return document.getElementById("cellsContainer").childNodes.length;
                  }
                }), displayMode,  fvdSpeedDial.SpeedDial._currentCellSize() );

                return;
              }

              var dialsRangeStart = Math.min( newDialPosition, dial.position );
              var dialsRangeEnd = Math.max( newDialPosition, dial.position );

              for( var i = 0; i != dials.length; i++ ){
                var dialPos = parseInt( dials[i].getAttribute("position") );
                if( dialPos >= dialsRangeStart && dialPos <= dialsRangeEnd ){
                  dials[i].setAttribute( "position", dialPos + sign );
                }
              }

              cell.setAttribute( "position", newDialPosition );

              fvdSpeedDial.SpeedDial.Builder.refreshDialsByPositions( fvdSpeedDial.SpeedDial.cellsInRowMax( null, null, {
                objects: function(){
                  return document.getElementById("cellsContainer").childNodes.length;
                }
              }), displayMode,  fvdSpeedDial.SpeedDial._currentCellSize() );

              /*
              setTimeout( function(){
                fvdSpeedDial.SpeedDial.Builder.rebuildMirrorsList();
              }, 0 );
              */


              // update storage

              var dialId = fvdSpeedDial.SpeedDial._getDialIdByCell( cell );


              fvdSpeedDial.Storage.insertDialUpdateStorage( dialId, sign == -1 ? "-" : "+",
                {start:dialsRangeStart, end: dialsRangeEnd}, newDialPosition, function( changedIds ){

                fvdSpeedDial.Utils.Async.arrayProcess( changedIds, function( dialId, arrayProcessCallback ){

                  fvdSpeedDial.Sync.addDataToSync( {
                    category: "dials",
                    data: dialId
                  }, function(){

                    arrayProcessCallback();

                  });

                }, function(){

                });

              } );


            }, event, {

              groupFocus: function( groupId ){

                if( groupId > 0 ){
                  var elem = document.getElementById( "group_select_" + groupId );
                  elem.setAttribute( "dragDialTo", 1 );
                }

                cell.setAttribute( "dragovergroup", 1 );

              },

              groupBlured: function(){

                var groups = document.querySelectorAll( "#groupsBox .group" );

                for( var i = 0; i != groups.length; i++ ){
                  if( groups[i] ){
                    groups[i].removeAttribute( "dragDialTo" );
                  }
                }

                cell.removeAttribute( "dragovergroup" );

              },

              dropOnGroup: function( groupId ){

                fvdSpeedDial.SpeedDial.dialMoveToGroup( data.id, groupId ) ;

              },


              dragMove: function( x, y, elems ){

                if( !isFancyMode ){
                  return;
                }

                var elem = null;
                var distance = 99999999999;

                elems.forEach(function( e ){
                  var d = Math.abs(e.centerPos.left - x);
                  if( d < distance ){
                    distance = d;
                    elem = e.elem;
                  }
                });

                if( elem ){

                  var transform = elem.style.webkitTransform;
                  var transformOrigin = elem.style.webkitTransformOrigin;

                  if( elem.hasAttribute("transformBeforeDrag") ){
                    transform = elem.getAttribute("transformBeforeDrag");
                  }
                  if( elem.hasAttribute("transformOriginBeforeDrag") ){
                    transformOrigin = elem.getAttribute("transformOriginBeforeDrag");
                  }

                  cell.style.webkitTransform = transform;
                  cell.style.webkitTransformOrigin = transformOrigin;
                }

              },

              drop: function(){

                if( !isFancyMode ){
                  return;
                }

                cell.style.webkitTransform = cell.getAttribute( "transformBeforeDrag" );
                cell.style.webkitTransformOrigin = cell.getAttribute( "transformOriginBeforeDrag" );

                cell.removeAttribute("transformBeforeDrag");
                cell.removeAttribute("transformOriginBeforeDrag");

              }

            } );


          }, 300 );


          event.stopPropagation();

        }, false );
      }


    }

  };

  this.Builder = new Builder();

}).apply(fvdSpeedDial.SpeedDial);
