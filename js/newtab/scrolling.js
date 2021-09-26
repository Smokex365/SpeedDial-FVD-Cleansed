/* Serve horizontal and vertical scrolling types for thumbs modes */

fvdSpeedDial.SpeedDial.Scrolling = new function(){

  var effectiveMode = null;
  var self = this;
  this.additionalGroupsListOpen = false;
  this.manageGroupsDialogOpen = false;

  function refresh( params ){

    params = params || {};

    document.getElementById( "cellsContainer" ).style.height = "";

  }

  function prefListener( key, value ){

    if( key == "sd.scrolling" || key == "sd.display_mode" ){

      var sdContent = document.getElementById( "speedDialContent" );
      sdContent.style.opacity = 0;

      setTimeout( function(){

        fvdSpeedDial.SpeedDial.sheduleRebuild();
        refresh();

        setTimeout( function(){
          sdContent.style.opacity = 1;
        }, 500 );

      }, 200 );

    }

  }

  this.activeScrollingType = function(){
    if( fvdSpeedDial.SpeedDial.currentThumbsMode() == "list" ){
      return "vertical";
    }
    if( fvdSpeedDial.Prefs.get( "sd.display_mode" ) == "fancy" ){
      return "vertical";
    }
    return fvdSpeedDial.Prefs.get("sd.scrolling");
  };

  this.refresh = function(){
    refresh.apply( window, arguments );
  };
    
    document.addEventListener( "DOMContentLoaded", function(){
        refresh();
      
    /*
    document.addEventListener( "mousewheel", function( event ){
      document.body.scrollLeft -= event.wheelDelta * 5;
    }, false );
    */
    
        document.addEventListener('mousewheel', function (event) {
            //console.info(self.additionalGroupsListOpen, event.target.tagName, event.target.id, event.target.classList);
            
            if(
                self.additionalGroupsListOpen
                &&
                $(event.target).parents(".additionalGroupsList").length
                /*
                (
                    String(event.target.id).indexOf('group_select_') === 0
                    ||
                    (
                        event.target.classList.length
                        &&
                        ['group', 'groupName', 'groupCount', 'manageGroups'].indexOf(event.target.classList[0]) !== -1    
                    )
                )
                */
            ){
                var menu = document.getElementsByClassName("additionalGroupsElemList")[0];
                
                //console.info('Menu', event.wheelDelta, menu.scrollHeight, menu.scrollTop + menu.offsetHeight, menu.scrollTop, menu.offsetHeight);
                
                if(
                    event.wheelDelta < 0  && 
                    menu.scrollHeight == (menu.scrollTop + menu.offsetHeight)
                ){
                    event.preventDefault();
                    event.stopPropagation();
                    event.returnValue = false;  
                    return false;
                    
                }                
            }else
            if(
                self.manageGroupsDialogOpen
                &&
                $(event.target).parents(".dialog").length
            ){
                var list = document.getElementById("dialogManageGroups_groupsListContainer");
                
                if(
                    event.wheelDelta < 0  && 
                    list.scrollHeight == (list.scrollTop + list.offsetHeight)
                ){
                    event.preventDefault();
                    event.stopPropagation();
                    event.returnValue = false;  
                    return false;
                } 
            }else{
                //document.body.scrollLeft -= event.wheelDelta * 5;
                
                window.scrollTo(window.scrollX - event.wheelDelta * 5, window.scrollY); // Task #1358
            }
        }, true);
  }, false );
    
    
  Broadcaster.onMessage.addListener(function(msg) {
    if(msg.action == "pref:changed") {
      prefListener(msg.name, msg.value);
    }
  });

}();
