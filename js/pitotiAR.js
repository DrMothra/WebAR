/**
 * Created by DrTone on 30/03/2015.
 */
var NUM_VIDEOS = 3;
var NUM_CONTAINERS = 3;

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
    sessionStorage.clear();
    sessionStorage.setItem('numVideos', NUM_VIDEOS);
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
    this.markers = {};
    this.resultMat = ARSystem.getResultsMat();

    //Triggered video parameters
    this.videoWidth = window.innerWidth/3;
    this.videoHeight = window.innerHeight * 0.4;
    this.triggerElem = $("#triggerVideo");
    this.triggerElem.width(this.videoWidth * 0.9);
    this.triggerElem.height(this.videoHeight * 0.9);
    var elem = $('#'+container);
    var pos = elem.position();
    var width = elem.width();
    var defaultPadding = 40;
    var triggerLeft = pos.left + defaultPadding + ((width-this.videoWidth)/2) + (this.videoWidth*0.05);
    this.triggerElem.css("left", triggerLeft + "px");
    this.triggerElem.css("top", "0px");
    this.triggerElem.defaultLeft = triggerLeft;

    this.triggerVideo = document.getElementById("triggerVideo");

    this.numVideos = 0;

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(this.videoWidth, this.videoHeight);
    var glCanvas = this.renderer.domElement;
    this.container.appendChild(glCanvas);

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

    //Load video sources
    this.videoSources = ['videos/HuntSmall.mp4', 'videos/deersSmall.mp4', 'videos/HouseSmall.mp4'];
};

PitotiAR.prototype.drag = function(event) {
    //Dragged video clip
    if(this.currentMarker < 0) return;

    var icon = 'snapShot' + this.currentMarker;
    event.originalEvent.originalEvent.dataTransfer.setData("text", icon);
};

PitotiAR.prototype.drop = function(event) {
    //Dragged video clip
    var id = event.target.id;
    var slot = parseInt(id.charAt(id.length-1));
    if(isNaN(slot)) return;
    if(this.currentMarker < 0 || this.occupied[slot]) {
        this.restoreVideoPlayer();
        return;
    }

    event.preventDefault();
    var image = document.createElement("img");
    image.className = "imgDraggable";

    $(image).draggable( {
        revert: "invalid"
    });

    image.src = "images/video" + this.currentMarker + ".jpg";

    image.style.width = event.target.clientWidth + 'px';
    image.style.height = event.target.clientHeight + 'px';
    event.target.appendChild(image);
    this.occupied[slot] = true;

    this.restoreVideoPlayer();

    $('#' + event.target.id + 'drop').hide();

    //Store video name
    sessionStorage.setItem(event.target.id, this.videoSources[this.currentMarker]);
};

PitotiAR.prototype.dropVideo = function(event, ui) {
    //Either delete or stop video
    var dragged = $(ui.draggable);
    if(dragged.hasClass("imgDraggable")) {
        var id = dragged.parent().attr('id');
        $('#'+id+'drop').show();
        dragged.remove();
        sessionStorage.removeItem(id);
        var slot = parseInt(id.charAt(id.length-1));
        if(!isNaN(slot)) {
            this.occupied[slot] = false;
        }
    }else {
        this.stopVideo();
    }
};

PitotiAR.prototype.stopVideo = function() {
    //Stop video playing
    this.triggerVideo.playing = false;
    this.videoPlaying = false;
    this.markers[this.currentMarker].video = false;
    this.currentMarker = -1;
    this.triggerElem.hide();

    this.restoreVideoPlayer();
};

PitotiAR.prototype.allowDrop = function(event) {
    event.preventDefault();
};

PitotiAR.prototype.restoreVideoPlayer = function() {
    //Put video player back in default position
    this.triggerElem.css("left", this.triggerElem.defaultLeft + "px");
    this.triggerElem.css("top", 0);
};

PitotiAR.prototype.update = function() {
    //Perform any updates
    //this.delta = this.clock.getDelta();

    if (this.video.ended) this.video.play();
    if (this.video.paused) return;
    if (window.paused) return;
    if (this.video.currentTime == this.video.duration) {
        this.video.currentTime = 0;
    }
    if (this.video.currentTime == this.lastTime) return;
    this.lastTime = this.video.currentTime;

    this.vidCanvas.getContext('2d').drawImage(this.video,0,0);
    ARSystem.getCanvasContext().drawImage(this.vidCanvas, 0,0,320,240);

    this.ARCanvas.changed = true;
    this.videoTex.needsUpdate = true;

    //Don't do detection if videos playing
    if(!this.videoPlaying) {
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
            if (!this.markers[currId]) {
                this.markers[currId] = {};
            }
            this.currentMarker = currId;
        }
    }

    if(this.currentMarker >= 0) {
        var m = this.markers[this.currentMarker];
        if (!m.video) {
            if(this.currentMarker >= NUM_VIDEOS) return;
            this.triggerVideo.src = this.videoSources[this.currentMarker];
            this.triggerVideo.load();
            this.videoPlaying = true;
            m.video = true;
        }
    }

    //See if any videos triggered
    if(this.videoPlaying) {
        if(!this.triggerVideo.playing) {
            //Show video pane
            this.triggerElem.show();
            if(this.triggerVideo.readyState === 4) {
                this.triggerVideo.play();
                this.triggerVideo.playing = true;
            }
            //DEBUG
            console.log("Playing");
        } else {
            if(this.triggerVideo.ended) {
                this.stopVideo();
                //DEBUG
                console.log("Stopped");
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
        $('#notSupported').show();
    } else {
        skel.init();

        var app = new PitotiAR();
        app.init('ARoutput');
        app.createScene();

        //GUI callbacks
        var dragElem = $('#triggerVideo');
        dragElem.draggable( {
            revert: "invalid"
        });

        var targetElem = $('.filmStrip div');
        targetElem.droppable( {
            accept: "#triggerVideo",
            drop: function( event, ui) {
                app.drop(event);
            }
        });

        var trashElem = $('.trash');
        trashElem.droppable( {
            accept: "#triggerVideo, .imgDraggable",
            drop: function( event, ui) {
                app.dropVideo(event, ui);
            }
        });

        app.run();
    }

});