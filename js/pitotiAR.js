/**
 * Created by DrTone on 30/03/2015.
 */
var NUM_CONTAINERS = 8;

//Augmented reality app for 3D Pitoti
function copyMatrix(mat, cm) {
    cm[0] = mat.m00;
    cm[1] = -mat.m10;
    cm[2] = mat.m20;
    cm[3] = 0;
    cm[4] = mat.m01;
    cm[5] = -mat.m11;
    cm[6] = mat.m21;
    cm[7] = 0;
    cm[8] = -mat.m02;
    cm[9] = mat.m12;
    cm[10] = -mat.m22;
    cm[11] = 0;
    cm[12] = mat.m03;
    cm[13] = -mat.m13;
    cm[14] = mat.m23;
    cm[15] = 1;
}

THREE.Matrix4.prototype.setFromArray = function(m) {
    return this.set(
        m[0], m[4], m[8], m[12],
        m[1], m[5], m[9], m[13],
        m[2], m[6], m[10], m[14],
        m[3], m[7], m[11], m[15]
    );
};

var ARSystem = (function() {
    //Initialise variables
    var threshold = 128;
    window.DEBUG = false;

    var raster;
    var detector;
    var resultMat;

    var video = document.createElement('video');
    video.width = 640;
    video.height = 480;
    video.loop = true;
    video.volume = 0;
    video.autoplay = true;
    video.controls = true;

    //Create canvases
    var canvas = document.createElement('canvas');
    var videoCanvas = document.createElement('canvas');

    var defaultCanvasWidth = 320;
    var defaultCanvasHeight = 240;
    var defaultVideoWidth = 640;
    var defaultVideoHeight = 480;

    var params;

    var getUserMedia = function(t, onsuccess, onerror) {
        if (navigator.getUserMedia) {
            return navigator.getUserMedia(t, onsuccess, onerror);
        } else if (navigator.webkitGetUserMedia) {
            return navigator.webkitGetUserMedia(t, onsuccess, onerror);
        } else if (navigator.mozGetUserMedia) {
            return navigator.mozGetUserMedia(t, onsuccess, onerror);
        } else if (navigator.msGetUserMedia) {
            return navigator.msGetUserMedia(t, onsuccess, onerror);
        } else {
            onerror(new Error("No getUserMedia implementation found."));
        }
    };

    var URL = window.URL || window.webkitURL;
    var createObjectURL = URL.createObjectURL || webkitURL.createObjectURL;
    if (!createObjectURL) {
        throw new Error("URL.createObjectURL not found.");
    }

    getUserMedia({'video': true},
        function(stream) {
            var url = createObjectURL(stream);
            video.src = url;
        },
        function(error) {
            alert("Couldn't access webcam.");
        }
    );

    return {
        setupSystem: function() {
            canvas.width = defaultCanvasWidth;
            canvas.height = defaultCanvasHeight;

            videoCanvas.width = defaultVideoWidth;
            videoCanvas.height = defaultVideoHeight;

            raster = new NyARRgbRaster_Canvas2D(canvas);
            params = new FLARParam(defaultCanvasWidth, defaultCanvasHeight);

            resultMat = new NyARTransMatResult();

            detector = new FLARMultiIdMarkerDetector(params, 120);
            detector.setContinueMode(true);
        },

        getThreshold: function() {
            return threshold;
        },

        getResultsMat: function () {
            return resultMat;
        },

        getRaster: function() {
            return raster;
        },

        getDetector: function() {
            return detector;
        },

        getVideo: function() {
            return video;
        },

        getARCanvas: function() {
            return canvas;
        },

        getCanvasWidth: function() {
            return defaultCanvasWidth;
        },

        getCanvasHeight: function() {
            return defaultCanvasHeight;
        },

        getCanvasContext: function() {
            return canvas.getContext('2d');
        },

        getARParams: function() {
            return params;
        },

        getVideoCanvas: function() {
            return videoCanvas;
        }
    }
})();

function __log(e, data) {
    log.innerHTML += "\n" + e + " " + (data || '');
}

//Init this app from base
function PitotiAR() {
    BaseApp.call(this);
}

PitotiAR.prototype = new BaseApp();
var DEFAULT_RENDER_WIDTH = 640, DEFAULT_RENDER_HEIGHT = 480;

PitotiAR.prototype.init = function(container) {
    //Setup AR system
    ARSystem.setupSystem();
    this.container = document.getElementById(container);

    //Clear videos from film clips
    this.numVideos = videoManager.getNumVideos();
    //sessionStorage.clear();
    sessionStorage.setItem('numVideos', this.numVideos);
    this.occupied = new Array(NUM_CONTAINERS);
    for(var i=0; i<NUM_CONTAINERS; ++i) {
        this.occupied[i] = false;
    }

    //Video clips
    this.lastTime = 0;
    this.videoClips = [];
    this.videoPlaying = false;
    this.currentMarker = -1;

    //Matrix store
    this.tmp = new Float32Array(16);
    this.markers = [];

    this.resultMat = ARSystem.getResultsMat();

    //Triggered video parameters
    this.videoWidth = window.innerWidth/2;
    this.videoHeight = window.innerHeight/2;
    this.triggerElem = $("#triggerVideo");
    this.triggerElem.width(this.videoWidth * 0.9);
    this.triggerElem.height(this.videoHeight * 0.9);
    var elem = $('#'+container);
    var pos = elem.position();
    var width = elem.width();
    var defaultPadding = window.innerWidth < 1024 ? this.videoWidth * 0.1 : this.videoWidth * 0.05;
    var triggerLeft = pos.left + defaultPadding;
    this.triggerElem.css("left", triggerLeft + "px");
    this.triggerElem.css("top", "5%");
    this.triggerElem.defaultLeft = triggerLeft;

    this.triggerVideo = document.getElementById("triggerVideo");

    //Dragged elements
    var elem = document.getElementById("slot0");
    this.dragImage = document.createElement("img");
    this.dragImage.src = "images/drag.png";
    this.dragImage.style.width = elem.clientWidth+"px";

    this.dragTrashImage = document.createElement("img");
    this.dragTrashImage.src = "images/dragTrash.png";
    this.dragTrashImage.style.width = elem.clientWidth+"px";

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth*0.5, window.innerHeight*0.5);
    var glCanvas = this.renderer.domElement;
    this.container.appendChild(glCanvas);

    //Paused video contents
    this.detectMarkers = false;
    this.pausedImage = document.createElement("img");
    this.pausedImage.src = "images/blackout.jpg";
    this.pausedImage.style.width = this.triggerElem.width + "px";

    //Don't strictly need these anymore
    this.scene = new THREE.Scene();
    var light = new THREE.PointLight(0xffffff);
    light.position.set(400, 500, 100);
    this.scene.add(light);
    var light = new THREE.PointLight(0xffffff);
    light.position.set(-400, -500, -100);
    this.scene.add(light);

    // Create a camera and a marker root object for your Three.js scene.
    this.camera = new THREE.Camera();
    this.scene.add(this.camera);
};

PitotiAR.prototype.getDragImage = function() {
    return this.dragImage;
};

PitotiAR.prototype.createScene = function() {
    //Create scene
    //BaseApp.prototype.createScene.call(this);

    // Next we need to make the Three.js camera use the FLARParam matrix.
    var params = ARSystem.getARParams();
    params.copyCameraMatrix(this.tmp, 10, 10000);
    this.camera.projectionMatrix.setFromArray(this.tmp);

    this.ARCanvas = ARSystem.getARCanvas();
    this.vidCanvas = ARSystem.getVideoCanvas();
    this.videoTex = new THREE.Texture(this.vidCanvas);

    // Create scene and quad for the video.
    var plane = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2, 0),
        new THREE.MeshBasicMaterial({map: this.videoTex})
    );
    plane.material.depthTest = false;
    plane.material.depthWrite = false;

    this.videoCam = new THREE.Camera();
    this.videoScene = new THREE.Scene();
    this.videoScene.add(plane);
    this.videoScene.add(this.videoCam);


    this.video = ARSystem.getVideo();
    this.detector = ARSystem.getDetector();
    this.raster = ARSystem.getRaster();

    this.renderer.autoClear = false;
};

PitotiAR.prototype.drag = function(event) {
    //Dragged video clip
    if(this.currentMarker < 0) return;

    var icon = 'snapShot' + this.currentMarker;
    event.originalEvent.originalEvent.dataTransfer.setData("text", icon);
};

PitotiAR.prototype.drop = function(event) {
    //Dragged video clip
    this.triggerVideo.play();
    var id = event.target.id;
    var slot = parseInt(id.charAt(id.length-1));
    if(isNaN(slot)) return;
    if(this.currentMarker < 0 || this.occupied[slot]) {
        return;
    }

    var _this = this;
    event.preventDefault();
    var image = document.getElementById(id);
    image.className = "imgDraggable";

    $(image).draggable( {
        revert: "invalid",
        helper: function(event) {
            return _this.dragTrashImage;
        }
    });

    image.src = "images/video" + this.currentMarker + ".jpg";

    image.style.width = event.target.clientWidth + 'px';
    image.style.height = event.target.clientHeight + 'px';

    this.occupied[slot] = true;

    $('#' + event.target.id + 'drop').hide();

    //Hide video
    this.stopVideo();

    //Store video name
    sessionStorage.setItem(event.target.id, "video" + this.currentMarker + ".jpg");
};

PitotiAR.prototype.dropVideo = function(event, ui) {
    //Either delete or stop video
    var dragged = $(ui.draggable);
    if(dragged.hasClass("imgDraggable")) {
        var id = dragged.attr('id');
        var slot = parseInt(id.charAt(id.length-1));
        if(!isNaN(slot)) {
            this.occupied[slot] = false;
        }
        ++slot;
        dragged.attr('src', 'images/clip'+slot+'.png');
        /*
        var id = dragged.parent().attr('id');
        $('#'+id+'drop').show();
        dragged.remove();
        sessionStorage.removeItem(id);
        var slot = parseInt(id.charAt(id.length-1));
        if(!isNaN(slot)) {
            this.occupied[slot] = false;
        }
        */
    }else {
        this.stopVideo();
    }
};

PitotiAR.prototype.stopVideo = function() {
    //Stop video playing
    this.triggerVideo.playing = false;
    this.videoPlaying = false;
    this.currentMarker = -1;
    this.triggerElem.hide();

    //this.restoreVideoPlayer();
};

PitotiAR.prototype.allowDrop = function(event) {
    event.preventDefault();
};

PitotiAR.prototype.restoreVideoPlayer = function() {
    //Put video player back in default position
    this.triggerElem.css("left", this.triggerElem.defaultLeft + "px");
    this.triggerElem.css("top", "5%");
};

PitotiAR.prototype.playVideo = function() {
    this.triggerVideo.play();
};

PitotiAR.prototype.update = function() {
    //Perform any updates
    if (this.video.ended) this.video.play();

    if (this.video.currentTime == this.video.duration) {
        this.video.currentTime = 0;
    }

    this.lastTime = this.video.currentTime;

    if(this.video.paused && !this.videoPlaying) {
        var _this = this;
        this.detectMarkers = false;
        this.video.play();
        setTimeout(function(){
            _this.detectMarkers = true;
        }, 1000);
    }

    if(this.video.paused) {
        this.vidCanvas.getContext('2d').drawImage(this.pausedImage, 0, 0);
    } else {
        this.vidCanvas.getContext('2d').drawImage(this.video,0,0);
    }
    ARSystem.getCanvasContext().drawImage(this.vidCanvas, 0,0,ARSystem.getCanvasWidth(),ARSystem.getCanvasHeight());

    this.ARCanvas.changed = true;
    this.videoTex.needsUpdate = true;

    //Don't do detection if videos playing
    if(!this.videoPlaying && this.detectMarkers) {
        this.currentMarker = -1;
        var detected = this.detector.detectMarkerLite(this.raster, ARSystem.getThreshold());
        if(detected) {
            var id = this.detector.getIdMarkerData(0);
            var currId;
            if (id.packetLength > 4) {
                currId = -1;
            } else {
                currId = 0;
                for (var i = 0; i < id.packetLength; i++) {
                    currId = (currId << 8) | id.getPacketData(i);
                }
            }
            this.currentMarker = currId;
        }
    }

    if(this.currentMarker >= 0 && !this.videoPlaying) {
        //DEBUG
        //console.log("Marker =", this.currentMarker);
        if(this.currentMarker >= this.numVideos) return;
        this.triggerVideo.src = videoManager.getVideoSource(this.currentMarker);
        this.videoPlaying = true;
        this.video.pause();
    }

    //See if any videos triggered
    if(this.videoPlaying) {
        if(!this.triggerVideo.playing) {
            //Show video pane
            this.triggerElem.show();
            this.triggerVideo.play();
            this.triggerVideo.playing = true;
        } else {
            if(this.triggerVideo.ended) {
                this.stopVideo();
            }
        }
    }

    this.renderer.render(this.videoScene, this.videoCam);
    this.renderer.render(this.scene, this.camera);

    BaseApp.prototype.update.call(this);
};

$(document).ready(function() {
    //Initialise app

    if(!Detector.webgl) {
        alert("WebGL not supported");
        $('#notSupported').show();
    } else {
        skel.init();

        //DEBUG
        console.log("Username =", sessionStorage.getItem("userName"));

        var app = new PitotiAR();
        app.init('ARoutput');
        app.createScene();

        //GUI callbacks
        var dragElem = $('#triggerVideo');
        dragElem.draggable( {
            revert: "invalid",
            cursorAt: { top: 0, left: 0 },
            helper: function(event) {
                this.pause();
                return app.getDragImage();
            }
        });

        var targetElem = $('.drop img');
        targetElem.droppable( {
            accept: "#triggerVideo",
            drop: function( event, ui) {
                app.drop(event);
            }
        });

        var trashElem = $('.trash');
        trashElem.droppable( {
            accept: "#triggerVideo, .drop img",
            drop: function( event, ui) {
                app.dropVideo(event, ui);
            }
        });

        app.run();
    }

});