function ZoomScreen(element){
    this.zoomFactor=1.0;
    this.x=0.5;
    this.y=0.5;
    this.element=element;
    this.init();
}

ZoomScreen.prototype.init=function(){
    var that=this;

    this.element.addClass("zoomScreen");
    
    this.imageContainer=appendDiv(this.element,"zoomImageContainer");
    this.image=appendDiv(this.imageContainer,"zoomImage");
    this.fullImage=appendDiv(this.image,"zoomImageFull");
    this.drag=new Draggable(this.image);    
    
    this.printImage=$(document.createElement("img"));
    this.printImage.addClass("printImage");
    this.element.append(this.printImage);
    
    this.fullLoadTimeout=null;
    
    this.transformHandler=function(event){
        that.setZoom(this.zoomFactor*event.scale);
    };
    this.element.bind('transform',this.transformHandler);
    
    this.wheelHandler=function(event,delta){
        if(delta<0) that.zoomOut();
        else that.zoomIn();
    };
    this.element.bind('mousewheel',this.wheelHandler);
        
    
    this.bottomToolBarContainerElem=appendDiv(this.element,"bottomToolBarContainer");
    this.bottomToolBarElem=appendDiv(this.bottomToolBarContainerElem,"bottomToolBar");
    this.menuItems=appendDiv(this.bottomToolBarElem,"menuBarItems");
    
    this.titleContainer=appendDiv(this.bottomToolBarContainerElem,"titleContainer");
    this.title=appendDiv(this.titleContainer,"title");
    this.credits=appendDiv(this.titleContainer,"credits");
    this.subTitle=appendDiv(this.titleContainer,"subTitle");
    
    this.nextPageUrl=null;
    this.prevPageUrl=null;
    
    this.closeButton=appendDiv(this.menuItems,"closeButton menuBarItem");
    this.closeButton.on('click',function(){
        if(that.element.hasClass("modeButtons"))
            location.href=galleryModeGridUrl;
        else that.fadeOut();
    });
    this.zoomInButton=appendDiv(this.menuItems,"zoomInButton menuBarItem");
    this.zoomInButton.on('click',function(){
        that.zoomIn();
    });
    this.zoomOutButton=appendDiv(this.menuItems,"zoomOutButton menuBarItem");
    this.zoomOutButton.on('click',function(){
        that.zoomOut();
    });
    this.prevButton=appendDiv(this.menuItems,"prevButton menuBarItem");
    this.prevButton.on('click',function(){
        that.setPrevImage();
    });
    this.nextButton=appendDiv(this.menuItems,"nextButton menuBarItem");
    this.nextButton.on('click',function(){
        that.setNextImage();
    });
    this.listModeButton=appendDiv(this.menuItems,"listButton menuBarItem");
    this.listModeButton.on('click',function(){
        location.href=galleryModeListUrl;
    });
    this.gridModeButton=appendDiv(this.menuItems,"gridButton menuBarItem");
    this.gridModeButton.on('click',function(){
        location.href=galleryModeGridUrl;
    });
    this.singleModeButton=appendDiv(this.menuItems,"singleButton menuBarItem");
    this.singleModeButton.on('click',function(){
        // do nothing
    });
    
};

ZoomScreen.prototype.madeVisible=function(){
    this.refreshPosition(true);
};

ZoomScreen.prototype.show=function(){
    this.element.show();
    this.fullImage.show();
};

ZoomScreen.prototype.fadeIn=function(callback,rev){
    var that=this;
    this.fullImage.hide();
    this.element.fadeIn(function(){
        that.fullImage.show();
    });
};
ZoomScreen.prototype.fadeOut=function(callback,rev){
    this.fullImage.hide();
    this.element.fadeOut();
};

ZoomScreen.prototype.preloadImage=function(url){
    var img=new Image();
    img.src=url;
};


ZoomScreen.prototype.setImage=function(title,subTitle,imageurl,thumburl,credits,trackCode){
    if(title) this.title.html(title);
    else this.title.html("");
    if(subTitle && subTitle.trim().length>0) {
        this.subTitle.html(subTitle);
        this.titleContainer.removeClass("nosubtitle");
    }
    else {
        this.subTitle.html("");
        this.titleContainer.addClass("nosubtitle");
    }
    if(credits && credits.trim().length>0) {
        this.credits.html(credits);
        this.titleContainer.removeClass("nocredits");
    }
    else {
        this.credits.html("");
        this.titleContainer.addClass("nocredits");
    }

    this.originalImageURL=imageurl;
    if(!thumburl) thumburl=imageurl;

    this.imageURL=imageurl;
    
    this.fullImage.hide();
    this.fullImage.css('background-image','none');
    this.image.css('background-image',"url('"+thumburl+"')");
    
    var that=this;
    if(this.fullLoadTimeout) clearTimeout(this.fullLoadTimeout);
    this.fullLoadTimeout=setTimeout(function(){
        that.fullImage.css('background-image',"url('"+imageurl+"')");
        that.fullImage.show();
        that.fullLoadTimeout=null;
    },1000);
    
    this.printImage.attr('src',imageurl);
    this.zoomFactor=1.0;
    this.resetPos();
    
    if(trackCode) trackPage(trackCode);
};


ZoomScreen.prototype.setImages=function(imageData,selected,modeButtons){
    this.imageData=imageData;
    if(imageData) {
        this.setImageIndex(selected);
        this.element.addClass("galleryMode");
        if(modeButtons) this.element.addClass("modeButtons");
        else this.element.removeClass("modeButtons");
    }
    else {
        this.element.removeClass("galleryMode");
        this.element.removeClass("modeButtons");
    }
};

ZoomScreen.prototype.setImageIndex=function(index,rev){
    this.selected=index;
    var image=this.imageData[index];
    
    var that=this;
    
    if(image.id) {
        var loc=window.location;
        var ind=loc.href.indexOf("#");
        if(ind<0) ind=window.location.href.length;
        window.location.replace(window.location.href.substring(0,ind)+"#"+image.id);
    }

    this.imageContainer.stop(true);
    this.imageContainer.animate( { 'left': (rev?100:-100), opacity: 0 }, 100, 
        function(){
            // set black image temporarily to clear it, otherwise IE will show the old image until the new one has loaded
            that.image.css({'background-image':'none'});
            that.imageContainer.css({'opacity':'0.01'});
            that.imageContainer.animate({},10,function(){
                that.setImage(image.title,image.subTitle,image.imageurl,image.thumburl,image.credits,image.trackCode);
                
                that.imageContainer.css( { 'left': (rev? -100:100), opacity: 0 } )
                that.imageContainer.animate( { 'left': 0, opacity: 1 }, 100 );
                
                if(that.imageData.length>1) {
                    that.preloadImage(that.imageData[(index+1)%(that.imageData.length)].thumburl);
                    if(that.imageData.length>2) {
                        that.preloadImage(that.imageData[(index-1+that.imageData.length)%(that.imageData.length)].thumburl);
                    }
                }
            });
        });

};

ZoomScreen.prototype.setNextImage=function(){
    if(this.selected+1>=this.imageData.length && this.nextPageUrl){
        window.location.assign(this.nextPageUrl);
    }
    else this.setImageIndex( (this.selected+1)%(this.imageData.length) , false);
};

ZoomScreen.prototype.setPrevImage=function(){
    if(this.selected==0 && this.prevPageUrl) {
        window.location.assign(this.prevPageUrl);
    }
    else this.setImageIndex( (this.selected-1+this.imageData.length)%(this.imageData.length) , true);
};

ZoomScreen.prototype.resetPos=function(){
    this.drag.stopInertia();
    this.image.stop();
    this.x=0.5;
    this.y=0.5;
    this.image.css({'left':'0px','right':'0px','width':'100%','height':'100%'});
    this.drag.setPos(0,0);
    this.drag.startAnim();
};

ZoomScreen.prototype.getPos=function(){
    return {
        'left':this.imageContainer.width()/2-this.imageContainer.width()*this.zoomFactor*this.x,
        'top':this.imageContainer.height()/2-this.imageContainer.height()*this.zoomFactor*this.y,
        'width':100*this.zoomFactor+"%",
        'height':100*this.zoomFactor+"%"
    };
};

ZoomScreen.prototype.refreshPosition=function(now){
    now=(now || false);

    var that=this;
    this.drag.stopInertia();
    var pos=this.getPos();
    this.image.stop();
    if(!now){
        this.image.animate(pos,function(){
            that.drag.setPos(pos.left,pos.top);
            that.drag.startAnim();
        });    
    }
    else {
        this.image.css(pos);
        this.drag.setPos(pos.left,pos.top);
        this.drag.startAnim();
    }
};

ZoomScreen.prototype.pullPos=function(){
    var pos=this.image.position();
    this.x=(this.imageContainer.width()/2-pos.left)/this.image.width();
    this.y=(this.imageContainer.height()/2-pos.top)/this.image.height();
};

ZoomScreen.prototype.setZoom=function(factor){
    this.pullPos();
    this.zoomFactor=factor;
    if(this.zoomFactor>5.0) this.zoomFactor=5.0;
    if(this.zoomFactor<0.1) this.zoomFactor=0.1;
    this.refreshPosition();
};

ZoomScreen.prototype.zoomIn=function(){
    this.pullPos();
    this.zoomFactor*=(4/3);
    if(this.zoomFactor>5.0) this.zoomFactor=5.0;
    this.refreshPosition();
};
ZoomScreen.prototype.zoomOut=function(){
    this.pullPos();
    this.zoomFactor*=(3/4);
    if(this.zoomFactor<0.1) this.zoomFactor=0.1;
    this.refreshPosition();
};

