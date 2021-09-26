(function(){

  var DragAndDrop = function(){

  }

  DragAndDrop.prototype = {

    elem: null,

    // position of elem
    _elemOffset: null,
    _elemsMargin: null, // margin between elements

    // clear elements positions list
    _elementsPositions: [],
    _elementsGrid: {},

    _dragSuccessListener: null,
    _elemDraggedOn: null,
    _maxColumns: null,

    _onGroupIdNow: -1,

    _callbacks: {}, // list of additional callbacks

    init: function(){
      var that = this;
      document.addEventListener( "mouseup", function( event ){

        if( that.isDragActive() ){
          that.endDrag( event );
        }

      }, true );

      document.addEventListener( "mousemove", function( event ){
        if( 
            that.elem 
            && event.buttons // Task #983
        ){
          // check is under group
          that.elem.style.display = "none";
          var elemUnder = document.elementFromPoint( event.x, event.y );

          var groupBlured = false;
          var groupSelected = false;

          if( elemUnder && elemUnder.parentNode &&
              (elemUnder.parentNode.className == "group" || elemUnder.className == "group") ) {
            var groupId = 0;
            if(elemUnder.className == "group") {
              groupId = parseInt( elemUnder.getAttribute("id").replace( "group_select_", "" ), 10 );
            }
            else {
              groupId = parseInt( elemUnder.parentNode.getAttribute("id").replace( "group_select_", "" ), 10 );
            }
            if( that._onGroupIdNow != groupId ) {
              that._onGroupIdNow = groupId;
              groupBlured = true;
              groupSelected = true;
            }
          }
          else {
            if( that._onGroupIdNow != -1 ){
              that._onGroupIdNow = -1;
              groupBlured = true;
            }

            if( elemUnder && (elemUnder.getAttribute("id") == "groupsBox" || elemUnder.className == "group") ){
              that._onGroupIdNow = 0;
              groupSelected = true;
            }
          }
          that.elem.style.display = "";

          if( groupBlured ){
            if( that._callbacks.groupBlured ){
              that._callbacks.groupBlured();
            }
          }

          if( groupSelected ){
            if( that._callbacks.groupFocus ){
              that._callbacks.groupFocus( that._onGroupIdNow );
            }
          }

          var mouseX = event.x;
          var mouseY = event.y + document.body.scrollTop;

          if( that._elementsPositions.length == 0 ){
            var displayType = fvdSpeedDial.SpeedDial.currentThumbsMode();

            if( displayType == "list" ){
              that._elemsMargin = fvdSpeedDial.SpeedDial._listElemMarginY;
            }
            else{
              that._elemsMargin = fvdSpeedDial.SpeedDial._cellsMarginX;
            }


            // search elements
            var dials = [];
            if( displayType == "list" ){
              dials = document.querySelectorAll( ".newtabListElem[type=\"speeddial\"]" );
            }
            else{
              dials = document.querySelectorAll( ".newtabCell[type=\"speeddial\"]" );
            }

            var cellSize = fvdSpeedDial.SpeedDial._currentCellSize();

            that._elementsGrid = {};

            for( var i = 0; i != dials.length; i++ ){
              var p = fvdSpeedDial.Utils.getOffset( dials[i] );

              var dialPosData = {
                leftTopPos: p,
                rightBottomPos: {
                  left: p.left + dials[i].offsetWidth,
                  top: p.top + dials[i].offsetHeight,
                },
                centerPos:{
                  left: p.left + dials[i].offsetWidth/2,
                  top: p.top + dials[i].offsetHeight/2
                },
                elem: dials[i]
              };

              that._elementsPositions.push(dialPosData);
              that._elementsGrid[dials[i].getAttribute("col")+ "x" + dials[i].getAttribute("row")] = dialPosData;
            }

            that._maxColumns = fvdSpeedDial.SpeedDial.cellsInRowMax();
            that._maxListRows = fvdSpeedDial.SpeedDial.Builder.listElemCountInCol( that._maxColumns, dials.length );

          }

          if( that._callbacks.dragMove ){
            that._callbacks.dragMove( mouseX, mouseY, that._elementsPositions );
          }


          var marginLeft = mouseX - that.elem.getAttribute( "startDragPosX" );
          var marginTop = mouseY - that.elem.getAttribute( "startDragPosY" );

          if( that._elemOffset == null ){
            that._elemOffset = fvdSpeedDial.Utils.getOffset( that.elem );
          }

          if( !that.elem.hasAttribute("noclick") ){
            // chrome can call mouse move when mouse not moved!
            if( marginLeft != 0 || marginTop != 0 ){
              that.elem.setAttribute( "noclick", 1 );
            }
          }

          var viewPortWidth = fvdSpeedDial.SpeedDial._viewportWidth();
          var rightCornerLeft = that._elemOffset.left + marginLeft + that.elem.offsetWidth;

          if( rightCornerLeft < viewPortWidth || fvdSpeedDial.SpeedDial.Scrolling.activeScrollingType() == "horizontal" ){
            that.elem.style.marginLeft = marginLeft + "px";
          }

          that.elem.style.marginTop = marginTop + "px";

          if( !that.elem.hasAttribute( "indrag" ) ){
            that.elem.setAttribute( "indrag", 1 );
            var startDragEvent = new CustomEvent("fvdsd.startdrag", {
              bubbles: true,
              cancelable: true
            });
            that.elem.dispatchEvent(startDragEvent);
          }

          var dialCenterPos = {
            left: that._elemOffset.left + marginLeft + that.elem.offsetWidth / 2,
            top: that._elemOffset.top + marginTop + that.elem.offsetHeight / 2,
          };

          var elemDraggedOn = null;

          // check element is on another element

          var ignoreInCicleElem = null;

          for( var i = 0; i != that._elementsPositions.length; i++ ){
            var elemPos = that._elementsPositions[i];

            if( ignoreInCicleElem == elemPos.elem ){
              continue;
            }

            if( elemPos.elem == that.elem ){
              continue;
            }

            var cond = false;

            if( fvdSpeedDial.SpeedDial.currentThumbsMode() == "list" ){
              cond = ( dialCenterPos.left >= elemPos.leftTopPos.left && dialCenterPos.left <= elemPos.rightBottomPos.left ) &&
                   (dialCenterPos.top >= elemPos.leftTopPos.top - that._elemsMargin && dialCenterPos.top <= elemPos.rightBottomPos.top + that._elemsMargin);
            }
            else{
              cond = ( dialCenterPos.left >= elemPos.leftTopPos.left - that._elemsMargin &&
                       dialCenterPos.left <= elemPos.rightBottomPos.left + that._elemsMargin ) &&
                   (dialCenterPos.top >= elemPos.leftTopPos.top && dialCenterPos.top <= elemPos.rightBottomPos.top);
            }

            if( cond ){


              if( fvdSpeedDial.SpeedDial.currentThumbsMode() == "list" ){

                var insertAttribute = null;

                var col = elemPos.elem.getAttribute("col");
                var row = elemPos.elem.getAttribute("row");

                var newCol = col;
                var newRow = row;

                if( dialCenterPos.top > elemPos.centerPos.top ){
                  insertAttribute = "after";

                  newRow++;
                  if( newRow >= that._maxListRows ){
                    newRow = 0;
                    newCol++;
                  }
                }
                else{
                  insertAttribute = "before";

                  newRow--;
                  if( newRow < 0 ){
                    newCol--;
                    if( newCol < 0 ){
                      newCol = 0;
                      newRow = 0;
                    }
                    else{
                      newRow = that._maxListRows - 1;
                    }
                  }
                }

                if( newCol == that.elem.getAttribute("col") && newRow == that.elem.getAttribute("row") ){
                  // same position - no reaction
                  if( elemPos.elem.hasAttribute( "dragon") ){
                    elemPos.elem.removeAttribute("dragon");
                  }
                  continue;
                }


                if( !elemPos.elem.hasAttribute( "dragon") ){
                  elemPos.elem.setAttribute( "dragon", 1 );
                }


                if( insertAttribute ){
                  elemPos.elem.setAttribute( "insert_type", insertAttribute )
                }

                elemDraggedOn = elemPos.elem;

                if( insertAttribute == "after" ){
                  row++;
                  insertAttribute = "before";
                }
                else if( insertAttribute == "before" ){
                  row--;
                  insertAttribute = "after";
                }

                if( typeof that._elementsGrid[ col + "x" + row ] != "undefined" ){
                  var additionalDraggedElem = that._elementsGrid[ col + "x" + row ].elem;
                  ignoreInCicleElem = additionalDraggedElem;

                  additionalDraggedElem.setAttribute( "insert_type", insertAttribute )
                  additionalDraggedElem.setAttribute( "dragon", 1 );
                }

              }
              else{
                var insertAttribute = null;

                var col = elemPos.elem.getAttribute("col");
                var row = elemPos.elem.getAttribute("row");

                var newCol = col;
                var newRow = row;

                if( dialCenterPos.left > elemPos.centerPos.left ){
                  insertAttribute = "after";

                  newCol++;
                  if( newCol >= that._maxColumns ){
                    newCol = 0;
                    newRow++;
                  }
                }
                else{
                  insertAttribute = "before";

                  newCol--;
                  if( newCol < 0 ){
                    newRow--;
                    if( newRow < 0 ){
                      newRow = 0;
                      newCol = 0;
                    }
                    else{
                      newCol = that._maxColumns - 1;
                    }
                  }
                }

                if( newCol == that.elem.getAttribute("col") && newRow == that.elem.getAttribute("row") ){
                  // same position - no reaction
                  if( elemPos.elem.hasAttribute( "dragon") ){
                    elemPos.elem.removeAttribute("dragon");

                    if( that._callbacks.dragOut ){
                      that._callbacks.dragOut( elemPos.elem );
                    }

                  }
                  continue;
                }


                if( !elemPos.elem.hasAttribute( "dragon") ){
                  elemPos.elem.setAttribute( "dragon", 1 );
                }


                if( insertAttribute ){
                  elemPos.elem.setAttribute( "insert_type", insertAttribute );

                  if( that._callbacks.dragOn ){
                    that._callbacks.dragOn( elemPos.elem );
                  }
                }

                elemDraggedOn = elemPos.elem;

                if( insertAttribute == "after" ){
                  col++;
                  insertAttribute = "before";
                }
                else if( insertAttribute == "before" ){
                  col--;
                  insertAttribute = "after";
                }

                if( typeof that._elementsGrid[ col + "x" + row ] != "undefined" ){
                  var additionalDraggedElem = that._elementsGrid[ col + "x" + row ].elem;
                  ignoreInCicleElem = additionalDraggedElem;

                  additionalDraggedElem.setAttribute( "insert_type", insertAttribute );
                  additionalDraggedElem.setAttribute( "dragon", 1 );

                  if( that._callbacks.dragOn ){
                    that._callbacks.dragOn( additionalDraggedElem );
                  }
                }

              }




            }
            else{

              if( elemPos.elem.hasAttribute( "dragon" ) ){
                elemPos.elem.removeAttribute( "dragon" );
                elemPos.elem.removeAttribute( "insert_type" );

                if( that._callbacks.dragOut ){
                  that._callbacks.dragOut( elemPos.elem );
                }

                /*
                elemPos.elem.removeAttribute( "origleft" );
                elemPos.elem.removeAttribute( "origtop" );
                */
              }

            }
          }

          that._elemDraggedOn = elemDraggedOn;



        }

      }, true );

    },

    startDrag: function( elem, listener, event, callbacks ){
      this._onGroupIdNow = -1;

      this._elementsPositions = [];

      this._callbacks = callbacks || {};

      this._dragSuccessListener = listener;
      this.elem = elem;
      this._elemDraggedOn = null;
      this._elemOffset = null;
      this.elem.setAttribute( "startDragPosX", event.x );
      this.elem.setAttribute( "startDragPosY", event.y + document.body.scrollTop );

      document.getElementById( "speedDialWrapper" ).setAttribute("state", "dragging");
    },

    endDrag: function( event ){

      var that = this;

      document.getElementById( "speedDialWrapper" ).setAttribute("state", "normal");

      this.elem.removeAttribute( "startDragPosX" );
      this.elem.removeAttribute( "startDragPosY" );

      if( this._elemDraggedOn ){
        if( this._dragSuccessListener ){
          this._dragSuccessListener( this._elemDraggedOn );
        }
      }


      //this.elem.style.webkitTransitionDuration = "";

      this.elem.style.marginLeft = "";
      this.elem.style.marginTop = "";

      that.elem.removeAttribute( "indrag", 1 );

      that.elem.setAttribute( "flyAfterDrag", 1 );
      var _elem = that.elem;
      setTimeout( function(){
        try{
          _elem.removeAttribute( "flyAfterDrag" );
        }
        catch( ex ){

        }
      }, 200 );


      this.elem = null;

      // remove dragon in all elements if found
      if( this._elementsPositions.length != 0 ){
        for( var i = 0; i != this._elementsPositions.length; i++ ){
          var elemPos = this._elementsPositions[i];
          if (elemPos.elem.hasAttribute("dragon")) {
            elemPos.elem.removeAttribute("dragon");
            elemPos.elem.removeAttribute( "insert_type" );
            /*
            elemPos.elem.removeAttribute("origleft");
            elemPos.elem.removeAttribute("origtop");
            */
          }
        }
      }

      if( !that._elemDraggedOn ){
        if( that._callbacks.drop ){
          that._callbacks.drop( event );
        }
      }

      if( that._callbacks.groupBlured ){
        that._callbacks.groupBlured();
      }

      if( that._onGroupIdNow > 0 ){

        if( that._callbacks.dropOnGroup ){
          that._callbacks.dropOnGroup( that._onGroupIdNow );
        }

      }

    },

    isDragActive: function(){
      return this.elem != null;
    }

  };

  this.DragAndDrop = new DragAndDrop();

}).apply(fvdSpeedDial.SpeedDial);

