(function(){
  var placeHolderInserted;
    function Position(x, y){
        this.X = x;
        this.Y = y;
        
        this.Add = function(val){
            var newPos = new Position(this.X, this.Y);
            if (val != null) {
                if (!isNaN(val.X)) 
                    newPos.X += val.X;
                if (!isNaN(val.Y)) 
                    newPos.Y += val.Y
            }
            return newPos;
        }
        
        this.Subtract = function(val){
            var newPos = new Position(this.X, this.Y);
            if (val != null) {
                if (!isNaN(val.X)) 
                    newPos.X -= val.X;
                if (!isNaN(val.Y)) 
                    newPos.Y -= val.Y
            }
            return newPos;
        }
        
        this.Min = function(val){
            var newPos = new Position(this.X, this.Y)
            if (val == null) 
                return newPos;
            
            if (!isNaN(val.X) && this.X > val.X) 
                newPos.X = val.X;
            if (!isNaN(val.Y) && this.Y > val.Y) 
                newPos.Y = val.Y;
            
            return newPos;
        }
        
        this.Max = function(val){
            var newPos = new Position(this.X, this.Y)
            if (val == null) 
                return newPos;
            
            if (!isNaN(val.X) && this.X < val.X) 
                newPos.X = val.X;
            if (!isNaN(val.Y) && this.Y < val.Y) 
                newPos.Y = val.Y;
            
            return newPos;
        }
        
        this.Bound = function(lower, upper){
            var newPos = this.Max(lower);
            return newPos.Min(upper);
        }
        
        this.Check = function(){
            var newPos = new Position(this.X, this.Y);
            if (isNaN(newPos.X)) 
                newPos.X = 0;
            if (isNaN(newPos.Y)) 
                newPos.Y = 0;
            return newPos;
        }
        
        this.Apply = function(element){
            if (typeof(element) == "string") 
                element = document.getElementById(element);
            if (element == null) 
                return;
            if (!isNaN(this.X)) 
                element.style.left = this.X + 'px';
            if (!isNaN(this.Y)) 
                element.style.top = this.Y + 'px';
        }
    }
    
    function hookEvent(element, eventName, callback){
        if (typeof(element) == "string") 
            element = document.getElementById(element);
        if (element == null) 
            return;
        if (element.addEventListener) {
            element.addEventListener(eventName, callback, false);
        }
        else 
            if (element.attachEvent) 
                element.attachEvent("on" + eventName, callback);
    }
    
    function unhookEvent(element, eventName, callback){
        if (typeof(element) == "string") 
            element = document.getElementById(element);
        if (element == null) 
            return;
        if (element.removeEventListener) 
            element.removeEventListener(eventName, callback, false);
        else 
            if (element.detachEvent) 
                element.detachEvent("on" + eventName, callback);
    }
    
    function cancelEvent(e){
        e = e ? e : window.event;
        if (e.stopPropagation) 
            e.stopPropagation();
        if (e.preventDefault) 
            e.preventDefault();
        e.cancelBubble = true;
        e.cancel = true;
        e.returnValue = false;
        return false;
    }
    
    function getEventTarget(e){
        e = e ? e : window.event;
        return e.target ? e.target : e.srcElement;
    }
    
    function absoluteCursorPostion(eventObj){
        eventObj = eventObj ? eventObj : window.event;
        
        if (isNaN(window.scrollX)) 
            return new Position(eventObj.clientX + document.documentElement.scrollLeft + document.body.scrollLeft, eventObj.clientY + document.documentElement.scrollTop + document.body.scrollTop);
        else 
            return new Position(eventObj.clientX + window.scrollX, eventObj.clientY + window.scrollY);
    }
    
    function dragObject(element, attachElement, lowerBound, upperBound, startCallback, moveCallback, endCallback, attachLater){
		
        if (typeof(element) == "string") 
            element = document.getElementById(element);
        if (element == null) 
            return;
        
        if (lowerBound != null && upperBound != null) {
            var temp = lowerBound.Min(upperBound);
            upperBound = lowerBound.Max(upperBound);
            lowerBound = temp;
        }
        
        var cursorStartPos = null;
        var elementStartPos = null;
        var dragging = false;
        var listening = false;
        var disposed = false;

		var scrollTopStart = 0;
		var elemStartPosOrigY = null;
		
		function listScroll(eventObj){
			
			elementStartPos.Y = List.parentNode.scrollTop - scrollTopStart + elemStartPosOrigY;
			
		}
		
        function dragStart(eventObj){
			scrollTopStart = List.parentNode.scrollTop;
			
            if (dragging || !listening || disposed) 
                return;
            dragging = true;
            
            if (startCallback != null) 
                startCallback(eventObj, element);
			
            cursorStartPos = absoluteCursorPostion(eventObj);
            
            elementStartPos = new Position(parseInt(element.style.left), parseInt(element.style.top));
            
			elemStartPosOrigY = elementStartPos.Y;
			
            elementStartPos = elementStartPos.Check();
            			
            hookEvent(document, "mousemove", dragGo);
			hookEvent(List.parentNode, "scroll", listScroll);
            hookEvent(document, "mouseup", dragStopHook);
			
            return cancelEvent(eventObj);
        }
        
        function dragGo(eventObj){
			
            if (!dragging || disposed) 
                return;
            
            var newPos = absoluteCursorPostion(eventObj);
            newPos = newPos.Add(elementStartPos).Subtract(cursorStartPos);
            newPos = newPos.Bound(lowerBound, upperBound)
            newPos.Apply(element);
            if (moveCallback != null) 
                moveCallback(newPos, element, eventObj);
            
            return cancelEvent(eventObj);
        }
        
        function dragStopHook(eventObj){
            dragStop();
            return cancelEvent(eventObj);
        }
        
        function dragStop(){
            if (!dragging || disposed) 
                return;
            unhookEvent(document, "mousemove", dragGo);
            unhookEvent(document, "mouseup", dragStopHook);
			unhookEvent(List.parentNode, "scroll", listScroll);			
            cursorStartPos = null;
            elementStartPos = null;
            if (endCallback != null) 
                endCallback(element);
            dragging = false;
        }
        
        this.Dispose = function(){
            if (disposed) 
                return;
            this.StopListening(true);
            element = null;
            attachElement = null
            lowerBound = null;
            upperBound = null;
            startCallback = null;
            moveCallback = null
            endCallback = null;
            disposed = true;
        }
        
        this.StartListening = function(){
            if (listening || disposed) 
                return;
            listening = true;
            hookEvent(attachElement, "mousedown", dragStart);
        }
        
        this.StopListening = function(stopCurrentDragging){
            if (!listening || disposed) 
                return;
            unhookEvent(attachElement, "mousedown", dragStart);
            listening = false;
            
            if (stopCurrentDragging && dragging) 
                dragStop();
        }
        
        this.IsDragging = function(){
            return dragging;
        }
        this.IsListening = function(){
            return listening;
        }
        this.IsDisposed = function(){
            return disposed;
        }
        
        if (typeof(attachElement) == "string") 
            attachElement = document.getElementById(attachElement);
        if (attachElement == null) 
            attachElement = element;
        
        if (!attachLater) 
            this.StartListening();
    }
    
	var DragLists = function(){
		
	}
	
	DragLists.prototype = {
		
		startDragFor: function( list, items, placeHolderClass, className ){
			
			placeHolderClass = placeHolderClass || "placeHolder";
			
			List = list;
			
			needClassName = className;
			
			if( PlaceHolder != null ){
				PlaceHolder = null;
			}
			
			if( PlaceHolder == null ){
		        PlaceHolder = document.createElement("DIV");
		        PlaceHolder.className = placeHolderClass;
		        PlaceHolder.SourceI = null;
			}
			
			for( var i = 0; i != items.length; i++ ){
				new dragObject(items[i], null, null, null, itemDragBegin, itemMoved, itemDragEnd, false);
			}
			
		}
		
	};
	
	this.DragLists = new DragLists();
	
    var List = null;
    var PlaceHolder = null;
	var needClassName = "";
    
  
    function itemDragBegin(eventObj, element){
		
        element.style.top = element.offsetTop + 'px';
        element.style.left = element.offsetLeft + 'px';
        element.setAttribute("drag", 1);
		
        List.insertBefore(PlaceHolder, element);
		
        PlaceHolder.SourceI = element;
		placeHolderInserted = false;
		
		itemMoved({
			X: element.offsetLeft,
			Y: element.offsetTop
		}, element, eventObj)
    }
    
    function itemMoved(newPos, element, eventObj){		
        var yPos = newPos.Y + element.offsetHeight ;//+ (eventObj.layerY ? eventObj.layerY : eventObj.offsetY);
		
        var temp;
        var bestItem = "end";
		
		var listElements = List.getElementsByClassName( needClassName );
		
        for (var i = 0; i < listElements.length; i++) {

            temp = parseInt(listElements[i].offsetHeight);
			
            if (temp >= yPos) {
                bestItem = listElements[i];
								
                break;
            }
            yPos -= temp;
   
        }
        
        if (bestItem == PlaceHolder || bestItem == PlaceHolder.SourceI) 
            return;
        
        PlaceHolder.SourceI = bestItem;
        if (bestItem != "end") 
            List.insertBefore(PlaceHolder, listElements[i]);
        else 
            List.appendChild(PlaceHolder);
    }
    
    function itemDragEnd(element){
        if (PlaceHolder.SourceI != null) {
            PlaceHolder.SourceI = null;
            List.replaceChild(element, PlaceHolder);
        }
        
		element.removeAttribute("drag");
        element.style.top = '0px';
        element.style.left = '0px';
    }
    
}).apply(fvdSpeedDial);


