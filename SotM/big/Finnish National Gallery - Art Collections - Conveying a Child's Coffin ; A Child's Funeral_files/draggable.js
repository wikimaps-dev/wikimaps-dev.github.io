function pageX(e){
    if(e.type=="touchstart" || e.type=="touchmove"){
        return e.originalEvent.targetTouches[0].pageX;
    }
    else if(e.type=="touchend"){
        return e.originalEvent.changedTouches[0].pageX;
    }
    else return e.pageX;
}
function pageY(e){
    if(e.type=="touchstart" || e.type=="touchmove"){
        return e.originalEvent.targetTouches[0].pageY;
    }
    else if(e.type=="touchend"){
        return e.originalEvent.changedTouches[0].pageY;
    }
    else return e.pageY;
}


function Draggable(elem,callback){
    this.id=Draggable.prototype.draggableID++;
    this.elem=elem;
    this.callback=callback;
    this.elemx=0;
    this.elemy=0;
    this.horizontalOnly=false;
    if(this.callback==undefined){
        var thisi=this;
        this.callback=function(x,y){
            elem.css('left',x+'px');
            if(!thisi.horizontalOnly) elem.css('top',y+'px');    
        };
    }

    this.boundLeft=0;
    this.boundRight=0;
    this.boundTop=0;
    this.boundBottom=0;
    this.elemw=null;
    this.elemh=null;
    
    this.isMouseDown=false;
    this.mouseHistory=[];
    for(var i=0;i<10;i++) this.mouseHistory.push([0,0,0]);
    this.mouseHistoryPtr=0;
    this.historyLength=0;
    this.animID=null;
    this.inertiaX=0;
    this.inertiaY=0;
    
    this.onClick=null;
    var ithis=this;
    this.elem.on('mousedown.draggable'+this.id,function(event){ithis.mouseDown(event);});
    this.elem.on('touchstart.draggable'+this.id,function(event){ithis.mouseDown(event);});
    
    this.elem.bind('mousewheel',function(event,delta){
        if(delta<0) ithis.addInertia(-30);
        else ithis.addInertia(30);
        event.preventDefault();
    });
    
    this.elem.css('cursor','move');
}
Draggable.prototype.draggadleID=0;

/* This is a helper function for click handlers that often need to find an element
 * under the click event that has some specific css class.
 */
Draggable.prototype.findElementWithClass=function(eventOrElement,classList,skipFirst){
    var element=null;
    if("jquery" in eventOrElement) element=eventOrElement;
    else {
        var pagex=pageX(eventOrElement);
        var pagey=pageY(eventOrElement);
        if(!pagex) return null;
        element=document.elementFromPoint(pagex-window.pageXOffset,pagey-window.pageYOffset);
    }
    
    if(!element) return null;
    element=$(element);
    if(skipFirst) element=element.parent();
    while(element && element.length>0){
        for(var i=0;i<classList.length;i++){
            if(element.hasClass(classList[i])) return element;
        }
        element=element.parent();
    }
    return element;
};

Draggable.prototype.setElementSize = function(width,height){
    this.elemw=width;
    this.elemh=height;
};

Draggable.prototype.setBounds = function(boundLeft,boundTop,boundRight,boundBottom){
    this.boundLeft=boundLeft;
    this.boundTop=boundTop;
    this.boundRight=boundRight;
    this.boundBottom=boundBottom;
};

Draggable.prototype.stopAnim = function(){
    if(this.animID!=null){
        window.clearInterval(this.animID);
        this.animID=null;
    }
};

Draggable.prototype.unbind = function(){
    this.elem.off('mousedown.draggable'+this.id);
    this.elem.off('touchstart.draggable'+this.id);
    $(document).off('mouseup.draggable'+this.id);
    $(document).off('mousemove.draggable'+this.id);
    $(document).off('touchend.draggable'+this.id);
    $(document).off('touchmove.draggable'+this.id);
    this.stopAnim();
};

Draggable.prototype.mouseDown = function(event){
    var ithis=this;
    $(document).on('mouseup.draggable'+this.id,function(event){ithis.mouseUp(event);});
    $(document).on('mousemove.draggable'+this.id,function(event){ithis.mouseMove(event);});
    $(document).on('touchend.draggable'+this.id,function(event){ithis.mouseUp(event);});
    $(document).on('touchmove.draggable'+this.id,function(event){ithis.mouseMove(event);});

    event.preventDefault();

    this.isMouseDown=true;
    this.stopInertia();
    this.mouseStartX=pageX(event);
    this.mouseStartY=pageY(event);
    this.startX=this.elemx;
    this.startY=this.elemy;
    this.historyLength=0;
    this.pushMouseHistory(event);
    
    event.preventDefault();
};

Draggable.prototype.clamp = function() {
    var bound=this.getBound();
    if(bound[0]){
        this.elemx+=bound[1];
        if(!this.horizontalOnly) this.elemy+=bound[2];
        this.callback(this.elemx,this.elemy);
    }
};

Draggable.prototype.setPos = function(x,y,clamp){
    this.elemx=x;
    if(!this.horizontalOnly) this.elemy=y;
    if(clamp) {
        var bound=this.getBound();
        if(bound[0]){
            this.elemx+=bound[1];
            if(!this.horizontalOnly) this.elemy+=bound[2];
        }
    }
    this.callback(this.elemx,this.elemy);
};

Draggable.prototype.stopInertia = function() {
    this.inertiaX=0.0;
    this.inertiaY=0.0;
    this.stopAnim();
};

Draggable.prototype.getBound = function() {
    var elemw=(this.elemw!=null?this.elemw:this.elem.width());
    var elemh=(this.elemh!=null?this.elemh:this.elem.height());
    var containerw=this.elem.parent().width();
    var containerh=this.elem.parent().height();
    if(this.boundLeft==null) return [false,0,0];
    var ret=[false,0,0];
    if(this.elemx>this.boundLeft+1) {
        ret[1]=this.boundLeft-this.elemx;
    }
    if(this.elemx+elemw<containerw-this.boundRight-1){
        if(ret[1]!=0.0 || elemw<containerw){
            ret[1]=(containerw-this.boundRight+this.boundLeft)/2-(this.elemx+elemw/2);
        }
        else {
            ret[1]=containerw-this.boundRight-this.elemx-elemw;
        }
    }
    if(!this.horizontalOnly && this.elemy>this.boundTop+1) {
        ret[0]=true;
        ret[2]=this.boundTop-this.elemy;
    }
    if(!this.horizontalOnly && this.elemy+elemh<containerh-this.boundBottom-1){
        if(ret[2]!=0.0 || elemh<containerh){
            ret[2]=(containerh-this.boundBottom+this.boundTop)/2-(this.elemy+elemh/2);
        }
        else {    
            ret[2]=containerh-this.boundBottom-this.elemy-elemh;
        }
    }
    if(Math.abs(ret[1])<=1.0) ret[1]=0.0;
    if(Math.abs(ret[2])<=1.0) ret[2]=0.0;
    ret[0]=(ret[1]!=0.0 || ret[2]!=0.0);
    return ret;
}

Draggable.prototype.addInertia = function(x,y){
    this.inertiaX+=x;
    if(!this.horizontalOnly && y) this.inertiaY+=y;
    this.startAnim();
};

Draggable.prototype.moveTo = function(x,y){
    var dx=x-this.elemx;
    var dy=y-this.elemy;
    this.inertiaX=dx*(1-0.8);
    if(!this.horizontalOnly) this.inertiaY=dy*(1-0.8);
    this.startAnim();
};

Draggable.prototype.doAnim = function(){
    this.elemx=this.elemx+this.inertiaX;
    if(!this.horizontalOnly) this.elemy=this.elemy+this.inertiaY;
    this.inertiaX*=0.8;
    this.inertiaY*=0.8;
    
    var bound=this.getBound();
    if(bound[0]){
        if(Math.abs(bound[1])<=1) this.elemx+=bound[1];
        else this.elemx+=bound[1]*0.5;
        if(!this.horizontalOnly) {
            if(Math.abs(bound[2])<=1) this.elemy+=bound[2];
            else this.elemy+=bound[2]*0.5;
        }
    }
    else {
        if(this.inertiaX*this.inertiaX+this.inertiaY*this.inertiaY<1){
            this.stopAnim();
        }
    }
    this.setPos(this.elemx,this.elemy);
};

Draggable.prototype.startAnim = function(){
    var ithis=this;
    if(this.animID!=null) this.stopAnim();
    this.animID=window.setInterval(function(){ithis.doAnim();},50);
};


Draggable.prototype.mouseUp = function(event){
    $(document).off('mouseup.draggable'+this.id);
    $(document).off('mousemove.draggable'+this.id);
    $(document).off('touchend.draggable'+this.id);
    $(document).off('touchmove.draggable'+this.id);

    if(this.isMouseDown){
        this.mouseMove(event);
        
        this.isMouseDown=false;
        var now=new Date().getTime();
        var lastx=0;
        var lasty=0;
        var time=0;
        var ptr;
        var h;
        var DRAGTIME=400;
        for(var i=0;i<this.mouseHistory.length && i<this.historyLength;i++){
            ptr=((this.mouseHistoryPtr-1-i+this.mouseHistory.length)%this.mouseHistory.length);
            h=this.mouseHistory[ptr];
            if(now-h[2]>=DRAGTIME){
                var t=(DRAGTIME-(now-time))/(time-h[2]);
                lastx=lastx+(h[0]-lastx)*t;
                lasty=lasty+(h[1]-lasty)*t;
                time=now-DRAGTIME;
                break;
            }
            else {
                lastx=h[0];
                lasty=h[1];
                time=h[2];
            }
        }
        time=now-time;
        ptr=((this.mouseHistoryPtr-1+this.mouseHistory.length)%this.mouseHistory.length);
        h=this.mouseHistory[ptr];
                
        this.inertiaX=(h[0]-lastx);
        this.inertiaY=this.horizontalOnly?0:(h[1]-lasty);

        if(time<200 && this.inertiaX*this.inertiaX+this.inertiaY*this.inertiaY<20){
            this.inertiaX=0;
            this.inertiaY=0;
            if(this.onClick!=null){
                this.onClick(event);
            }
            return;
        }
        
        this.inertiaX*=50*0.8/time;
        this.inertiaY*=50*0.8/time;
        if(this.animID==null){
            this.startAnim();
        }
    }
};

Draggable.prototype.pushMouseHistory = function(event) {
    var pagex=pageX(event);
    if(!pagex) return;
    this.mouseHistory[this.mouseHistoryPtr][0]=pagex;
    this.mouseHistory[this.mouseHistoryPtr][1]=(this.horizontalOnly?0:pageY(event));
    this.mouseHistory[this.mouseHistoryPtr][2]=new Date().getTime();
    this.mouseHistoryPtr=((this.mouseHistoryPtr+1)%this.mouseHistory.length);
    this.historyLength++;
}

Draggable.prototype.mouseMove = function(event){
    if(!this.isMouseDown) return;
    event.preventDefault();
    this.pushMouseHistory(event);
    
    var dx=pageX(event);
    if(!dx) return;
    dx-=this.mouseStartX;
    var dy=(this.horizontalOnly?0:(pageY(event)-this.mouseStartY));
    this.setPos(this.startX+dx,this.startY+dy);
};

