/**
 * Created by DrTone on 30/03/2015.
 */
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

//Init this app from base
function PitotiAR() {
    BaseApp.call(this);
}

PitotiAR.prototype = new BaseApp();

PitotiAR.prototype.init = function(container) {
    //BaseApp.prototype.init.call(this, container);
    ARSystem.setupSystem();
    //GUI
    this.guiControls = null;
    this.gui = null;
    this.rotPerSec = 1;
    this.loadedModel = null;

    this.lastTime = 0;

    //Matrix store
    this.tmp = new Float32Array(16);

    this.markers = {};
    this.resultMat = ARSystem.getResultsMat();

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(640, 480);
    var glCanvas = this.renderer.domElement;
    document.body.appendChild(glCanvas);

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

    this.scaleFactor = new THREE.Vector3(120, 120, 120);
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

    this.modelLoader = new THREE.OBJMTLLoader();
    var _this = this;
    /*
    this.modelLoader.load( 'models/Morph.obj', 'models/Morph.mtl', function ( object ) {
        //object.rotation.x = Math.PI/2;
        //object.position.y = 7;
        //object.position.z = 10;
        //object.scale.set(1000, 1000, 1000);
        //_this.scene.add(object);
        _this.loadedModel = object;
    }, null, null);
    */

    //Load videos
    this.videos = [];
    this.videoPlanes = [];
    var videoImage, videoImageContext, videoTexture, planeMaterial, plane, planeMesh, currentVideo;
    for(var i=0; i<1; ++i) {
        videoImage = document.createElement('canvas');
        videoImage.width = 320;
        videoImage.height = 240;
        videoImageContext = videoImage.getContext('2d');
        videoTexture = new THREE.Texture(videoImage);
        videoTexture.minFilter = THREE.LinearFilter;
        videoTexture.magFilter = THREE.LinearFilter;
        planeMaterial = new THREE.MeshBasicMaterial( {map: videoTexture, overdraw: true, side:THREE.DoubleSide});
        //planeMaterial = new THREE.MeshBasicMaterial( {color: 0x0000ff});
        plane = new THREE.PlaneGeometry(100, 100, 4, 4);
        planeMesh = new THREE.Mesh(plane, planeMaterial);
        planeMesh.doubleSided = true;
        this.videoPlanes.push(planeMesh);
        planeMesh.visible = true;
        //this.scene.add(planeMesh);
        planeMesh.name = 'plane' + i;
        currentVideo = document.getElementById('video'+i);
        currentVideo.load();
        currentVideo.videoContext = videoImageContext;
        currentVideo.videoTexture = videoTexture;
        currentVideo.volume = 1.0;
        currentVideo.triggered = false;
        currentVideo.playing = false;
        this.videos.push(currentVideo);
        //this.loadedModel = planeMesh;
    }

    /*
    var sphereGeom = new THREE.SphereGeometry(50, 12, 12);
    var sphereMat = new THREE.MeshLambertMaterial( {color: 0x0000ff});
    var sphere = new THREE.Mesh(sphereGeom, sphereMat);
    sphere.position.z = -37.5;
    this.scene.add(sphere);
    */
};

PitotiAR.prototype.createGUI = function() {
    //GUI - using dat.GUI
    this.guiControls = new function() {

    };

    var gui = new dat.GUI();

    //Add some folders
    this.guiAppear = gui.addFolder("Appearance");
    this.guiData = gui.addFolder("Data");
    this.gui = gui;
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

    var detected = this.detector.detectMarkerLite(this.raster, ARSystem.getThreshold());
    for (var idx = 0; idx<detected; idx++) {
        var id = this.detector.getIdMarkerData(idx);
        var currId;
        if (id.packetLength > 4) {
            currId = -1;
        }else{
            currId=0;
            for (var i = 0; i < id.packetLength; i++ ) {
                currId = (currId << 8) | id.getPacketData(i);
            }
        }
        if (!this.markers[currId]) {
            this.markers[currId] = {};
        }
        this.detector.getTransformMatrix(idx, this.resultMat);
        this.markers[currId].age = 0;
        this.markers[currId].transform = Object.asCopy(this.resultMat);
    }
    for (var i in this.markers) {
        var r = this.markers[i];
        if (r.age > 1) {
            delete this.markers[i];
            this.scene.remove(r.model);
        }
        r.age++;
    }
    for (var i in this.markers) {
        var m = this.markers[i];
        if (!m.model) {
            /*
            m.model = new THREE.Object3D();
            var cube = new THREE.Mesh(
                new THREE.BoxGeometry(100,100,100),
                new THREE.MeshLambertMaterial({color: 0x0000ff})
            );
            console.log("Triggered");
            cube.position.z = -50;
            //cube.doubleSided = true;
            m.model.matrixAutoUpdate = false;
            m.model.add(cube);
            this.scene.add(m.model);
            */
            m.model = this.videoPlanes[0];
            this.scene.add(m.model);
            m.model.matrixAutoUpdate = false;
            this.videos[0].triggered = true;
        }
        copyMatrix(m.transform, this.tmp);
        m.model.matrix.setFromArray(this.tmp);
        //m.model.matrix.scale(this.scaleFactor);
        m.model.matrixWorldNeedsUpdate = true;
    }

    //See if any videos triggered
    for(var i= 0, len = this.videos.length; i<len; ++i) {
        if(this.videos[i].triggered) {
            var currentVid = this.videos[i];
            if(!currentVid.playing) {
                var plane = this.scene.getObjectByName('plane'+i, true);
                if(plane) {
                    plane.visible = true;
                }
                currentVid.play();
                currentVid.playing = true;
            }

            if(currentVid.readyState === currentVid.HAVE_ENOUGH_DATA) {
                currentVid.videoContext.drawImage(currentVid, 0, 0);
                if(currentVid.videoTexture) {
                    currentVid.videoTexture.needsUpdate = true;
                }
            }
            break;
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
        //var container = document.getElementById("WebGLAR-output");
        var app = new PitotiAR();
        app.init(null);
        app.createScene();
        //app.createGUI();

        //GUI callbacks

        app.run();
    }

});