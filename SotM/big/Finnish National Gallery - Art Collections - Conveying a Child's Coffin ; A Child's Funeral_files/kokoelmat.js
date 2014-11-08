function appendDiv(parent,cls){
    var e=$(document.createElement("div"));
    if(cls!=null) e.addClass(cls);
    if(parent!=null) parent.append(e);
    return e;
}

function trackPage( page ) {
    var trackPage=lang+"/"+page;
    
    if(typeof(_gaq)!="undefined")
        _gaq.push(['_trackPageview', trackPage]);    
//    if(typeof(console)!="undefined" && typeof(console.log)!="undefined")
//        console.log("track page "+trackPage);   
}

function openSI( si ) {
    //alert("opening "+si);
    location.href = requestStringWithoutSI+"si="+si;
}
function openDecade( decade ) {
    //alert("opening decade "+decade);
    openSI( decade );
//    location.href = requestStringWithoutSI+"si="+decade;
}

function setupCarousel( carousel ){
    carousel.find(".carouselItem").wrapAll("<div class=\"carouselContainer\">");
    carousel.append("<div class=\"leftArrow\"></div>");
    carousel.append("<div class=\"rightArrow\"></div>");
    
    var container=carousel.find('.carouselContainer')
    var drag=new Draggable(container);
    drag.horizontalOnly=true;
    
    container.find('a').addClass("carouselLink");
    
    drag.onClick=function(event){
        var a=drag.findElementWithClass(event,['carouselLink']);
        if(a) {
            var href=a.attr('href');
            if(href) window.location.assign(href);
        }
    };
    
//    setTimeout(function(){drag.clamp();},1);
    
    carousel.data('drag',drag);
    
    carousel.find('.leftArrow').click(function() {drag.addInertia(100);});
    carousel.find('.rightArrow').click(function() {drag.addInertia(-100);});
    
    container.find('a').click(function(event){return false;});
}

function zoomImage( elem, now, modeButtons, nextPageUrl, prevPageUrl ){
    var bigurl=elem.find('.bigurl').text().trim();
    var smallurl=elem.find('.smallurl').text().trim();
    var title=elem.find('.title').html();
    var subtitle=elem.find('.subtitle').html();
    var credits=elem.find('.credits').text().trim();
    var trackCode=elem.find('.trackcode').text().trim();
    
    if(!smallurl) smallurl=bigurl;

    var zoomedImage=$('.zoomedImage');
    if(zoomedImage.length==0) return;
    zoomedImage=zoomedImage.first();

    var component=zoomedImage.data('component');    
    if(!component){
        component=new ZoomScreen(zoomedImage);
        zoomedImage.data('component',component);
    }
    component.nextPageUrl=nextPageUrl;
    component.prevPageUrl=prevPageUrl;
    
    var galleryList=$('.galleryList');
    if(galleryList.length>0){
        var images=[];
        var selected=0;
        var selectedid=null;
        
        var loc=window.location.href;
        var ind=loc.indexOf("#");
        if(ind>=0) selectedid=loc.substring(ind+1);
        
        var galleryImages=galleryList.find('.galleryImage');
        galleryImages.each(function(index){
            var img=$(this);
            var ibigurl=img.find('.bigurl').text().trim();
            var ismallurl=img.find('.smallurl').text().trim();
            var ititle=img.find('.title').html();
            var isubtitle=img.find('.subtitle').html();
            var credits=img.find('.credits').text().trim();
            var trackCode=img.find('.trackcode').text().trim();
            var id=img.attr('id');
            if(id) id=id.substring("galleryImage".length);
            
            if(!isubtitle) isubtitle="";
            
            if(ibigurl){
                if(ibigurl==bigurl) selected=index;
                images.push({imageurl:ibigurl,thumburl:ismallurl,title:ititle,subTitle:isubtitle,credits:credits,id:id,trackCode:trackCode});
            }
            
            if(selectedid && id==selectedid) selected=index;
        });
        
        if(selectedid=="last") selected=galleryImages.length-1;
        
        component.setImages(images,selected,modeButtons);
    }
    else {
        component.setImages(null);
        component.setImage(title,subtitle,bigurl,smallurl,credits,trackCode);
    }
    if(now) component.show();
    else component.fadeIn();
}

function selectImage( elem ){
    var bigurl=elem.find('.bigurl').text().trim();
    var smallurl=elem.find('.smallurl').text().trim();
    var title=elem.find('.title').text().trim();
    var subtitle=elem.find('.subtitle').text().trim();
    var credits=elem.find('.credits').text().trim();
    
    var bigimage=$(".bigImage");
    var img=bigimage.find("img");
    img.attr('src',smallurl);
    
    bigimage.find('.bigurl').text(bigurl);
    bigimage.find('.smallurl').text(smallurl);
    bigimage.find('.title').text(title);
    bigimage.find('.subtitle').text(subtitle);
    bigimage.find('.credits').text(credits);
    bigimage.parent().find('.imageNotes .imageCredits').text(credits);
}

function addRouteImagesListener( routeItem ){
    listener=$("body").data('routeImageListener');
    if(!listener){
        listener={items:[]};
        $("body").data('routeImageListener',listener);
        
        var timeoutid;
        $(window).on('resize',function(){
            clearTimeout(timeoutid);
            timeoutid=setTimeout(function(){
                for(var i=0;i<listener.items.length;i++){
                    alignRouteImages(listener.items[i]);
                }
            },100);
        });
    }
    
    var columns=[];
    routeItem.find('.col').each(function(){
        columns.push({
            col:$(this),
            img:$(this).find('.image img'),
            container:$(this).find('.imageContainer')
        });
    });
    listener.items.push(columns);
    routeItem.find('img').load(function(){alignRouteImages(columns);});
    
    alignRouteImages(columns);
}

function alignRouteImages( columns ){
    // This is adjusted based on window width, some columns may end up stacked rather than side by side.
    // The pixel values are hard coded also in the css file
    var numCols=columns.length; 
    if($(window).width()<=666){
        numCols=0;
    }
    else if($(window).width()<=1000){
        numCols=Math.min(2,numCols);
    }
    if(numCols<=1) numCols=0;
    
    var maxHeight=0;
    for(var i=0;i<numCols;i++){
        var h=columns[i].img.height();
        if(h>maxHeight) maxHeight=h;
    }
    
    for(i=0;i<numCols;i++){
        columns[i].container.css('margin-top',maxHeight-columns[i].img.height());
    }
    for(i=numCols;i<columns.length;i++){
        columns[i].container.css('margin-top','');        
    }
}

$(function(){
    $(".carousel").each(function(){
        setupCarousel($(this));
    });
    $("img.lazyload").lazyload({ 
        threshold: 300,
        load: function(){
            $(this).removeClass('lazyload');
        }
    });
    $(document).ready(function(){
        setTimeout(function(){$(window).trigger("resize");},10);   
    });
});

