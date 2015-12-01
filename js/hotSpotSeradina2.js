/**
 * Created by DrTone on 10/07/2015.
 */

var ROT_INC = Math.PI/32;
var MOVE_INC = 10;
var STOP=-1, ROT_LEFT=0, ROT_RIGHT=1, ROT_UP=2, ROT_DOWN= 3, ZOOM_IN=4, ZOOM_OUT=5;
var MOVE_UP= 0, MOVE_DOWN= 1, MOVE_LEFT= 2, MOVE_RIGHT=3;
var Z_MAX = 450;

//Init this app from base
function RockFace() {
    BaseApp.call(this);
}

RockFace.prototype = new BaseApp();

RockFace.prototype.init = function(container) {
    this.xRot = 0;
    this.yRot = 0;
    this.zTrans = 0;
    this.checkTime = 100;
    this.rotating = false;
    BaseApp.prototype.init.call(this, container);
};

RockFace.prototype.createScene = function() {
    BaseApp.prototype.createScene.call(this);

    var texture = THREE.ImageUtils.loadTexture("images/seradina2.png");
    var plane = new THREE.PlaneGeometry(512, 256);
    var planeMat = new THREE.MeshPhongMaterial( {
        map: texture,
        transparent: true,
        opacity: 1.0
    });
    var planeMesh = new THREE.Mesh(plane, planeMat);

    this.loadedModel = planeMesh;

    this.scene.add(planeMesh);
};

RockFace.prototype.resetScene = function() {
    this.loadedModel.position.x = this.loadedModel.position.y = this.loadedModel.position.z = 0;
    this.loadedModel.rotation.x = this.loadedModel.rotation.y = this.loadedModel.rotation.z = 0;
    var lookAt = new THREE.Vector3(0, 0, 0);
    this.controls.setLookAt(lookAt);
    this.camera.position.set(0, 0, 700 );
    this.pointLight.position.set(200,200,500);
};

RockFace.prototype.lightToCamera = function() {
    //Move light to camera position
    this.pointLight.position.set(this.camera.position.x, this.camera.position.y, this.pointLight.position.z);
};

RockFace.prototype.repeat = function(direction) {
    if(direction === STOP) {
        if(this.repeatTimer) {
            clearInterval(this.repeatTimer);
        }
        return;
    }
    var _this = this;
    switch(direction) {
        case ROT_LEFT:
            _this.xRot = 0;
            _this.yRot = -ROT_INC;
            _this.rotating = true;
            break;

        case ROT_RIGHT:
            _this.xRot = 0;
            _this.yRot = ROT_INC;
            _this.rotating = true;
            break;

        case ROT_UP:
            _this.xRot = -ROT_INC;
            _this.yRot = 0;
            _this.rotating = true;
            break;

        case ROT_DOWN:
            _this.xRot = ROT_INC;
            _this.yRot = 0;
            _this.rotating = true;
            break;

        case ZOOM_IN:
            _this.zTrans = MOVE_INC;
            _this.rotating = false;
            break;

        case ZOOM_OUT:
            _this.zTrans = -MOVE_INC;
            _this.rotating = false;
            break;

        default:
            break;
    }
    this.repeatTimer = setInterval(function() {
        if(_this.rotating) {
            _this.loadedModel.rotation.x += _this.xRot;
            _this.loadedModel.rotation.y += _this.yRot;
        } else {
            if(_this.loadedModel.position.z >= Z_MAX) return;
            _this.loadedModel.position.z += _this.zTrans;
        }

    }, this.checkTime);
};

RockFace.prototype.repeatLight = function(direction) {
    if(direction === undefined) {
        clearInterval(this.repeatLightTimer);
        return;
    }

    var _this = this;

    switch(direction) {
        case MOVE_UP:
            this.xPos = 0;
            this.yPos = MOVE_INC;
            break;

        case MOVE_DOWN:
            this.xPos = 0;
            this.yPos = -MOVE_INC;
            break;

        case MOVE_LEFT:
            this.xPos = -MOVE_INC;
            this.yPos = 0;
            break;

        case MOVE_RIGHT:
            this.xPos = MOVE_INC;
            this.yPos = 0;
            break;

        default:
            break;
    }

    this.repeatLightTimer = setInterval(function() {
        _this.pointLight.position.x += _this.xPos;
        _this.pointLight.position.y += _this.yPos;
    }, this.checkTime);
};

RockFace.prototype.update = function() {
    BaseApp.prototype.update.call(this);
};

RockFace.prototype.rotateObject = function(direction) {
    switch(direction) {
        case ROT_LEFT:
            this.loadedModel.rotation.y -= ROT_INC;
            this.repeat(ROT_LEFT);
            break;
        case ROT_RIGHT:
            this.loadedModel.rotation.y += ROT_INC;
            this.repeat(ROT_RIGHT);
            break;
        case ROT_UP:
            this.loadedModel.rotation.x -= ROT_INC;
            this.repeat(ROT_UP);
            break;
        case ROT_DOWN:
            this.loadedModel.rotation.x += ROT_INC;
            this.repeat(ROT_DOWN);
            break;
        default:
            break;
    }
};

RockFace.prototype.translateObject = function(direction) {
    if(this.loadedModel) {
        switch(direction) {
            case ZOOM_IN:
                if(this.loadedModel.position.z >= Z_MAX) return;
                this.loadedModel.position.z += MOVE_INC;
                this.repeat(ZOOM_IN);
                break;
            case ZOOM_OUT:
                this.loadedModel.position.z -= MOVE_INC;
                this.repeat(ZOOM_OUT);
                break;
            default:
                break;
        }
    }
};

RockFace.prototype.moveLight = function(direction) {
    if(this.loadedModel) {
        switch(direction) {
            case MOVE_UP:
                this.pointLight.position.y += MOVE_INC;
                this.repeatLight(MOVE_UP);
                break;
            case MOVE_DOWN:
                this.pointLight.position.y -= MOVE_INC;
                this.repeatLight(MOVE_DOWN);
                break;
            case MOVE_LEFT:
                this.pointLight.position.x -= MOVE_INC;
                this.repeatLight(MOVE_LEFT);
                break;
            case MOVE_RIGHT:
                this.pointLight.position.x += MOVE_INC;
                this.repeatLight(MOVE_RIGHT);
                break;
            default:
                break;
        }
    }
};

$(document).ready(function() {
    //Do any init
    if(!Detector.webgl) {
        $('#notSupported').show();
    } else {
        var container = document.getElementById("seradina2Web-GL");
        var app = new RockFace();
        app.init(container);
        app.createScene();

        //GUI callbacks
        //Play audio
        $('#story1').on("click", function () {
            audioManager.playAudio(this.id);
        });

        $('#rotateLeft').on("mousedown", function (event) {
            event.preventDefault();
            app.rotateObject(ROT_LEFT);
        });
        $('#rotateLeft').on("touchstart", function (event) {
            event.preventDefault();
            app.rotateObject(ROT_LEFT);
        });
        $('#rotateRight').on("mousedown", function (event) {
            event.preventDefault();
            app.rotateObject(ROT_RIGHT);
        });
        $('#rotateRight').on("touchstart", function (event) {
            event.preventDefault();
            app.rotateObject(ROT_RIGHT);
        });
        $('#rotateUp').on("mousedown", function (event) {
            event.preventDefault();
            app.rotateObject(ROT_UP);
        });
        $('#rotateUp').on("touchstart", function (event) {
            event.preventDefault();
            app.rotateObject(ROT_UP);
        });
        $('#rotateDown').on("mousedown", function (event) {
            event.preventDefault();
            app.rotateObject(ROT_DOWN);
        });
        $('#rotateDown').on("touchstart", function (event) {
            event.preventDefault();
            app.rotateObject(ROT_DOWN);
        });
        $("[id^=rotate]").on("mouseup", function (event) {
            event.preventDefault();
            app.repeat(STOP);
        });
        $("[id^=rotate]").on("touchend", function (event) {
            event.preventDefault();
            app.repeat(STOP);
        });

        $('#zoomOut').on("mousedown", function (event) {
            event.preventDefault();
            app.translateObject(ZOOM_OUT);
        });
        $('#zoomOut').on("touchstart", function (event) {
            event.preventDefault();
            app.translateObject(ZOOM_OUT);
        });

        $('#zoomIn').on("mousedown", function (event) {
            event.preventDefault();
            app.translateObject(ZOOM_IN);
        });
        $('#zoomIn').on("touchstart", function (event) {
            event.preventDefault();
            app.translateObject(ZOOM_IN);
        });
        $("[id^=zoom]").on("mouseup", function (event) {
            event.preventDefault();
            app.repeat(STOP);
        });
        $("[id^=zoom]").on("touchend", function (event) {
            event.preventDefault();
            app.repeat(STOP);
        });

        $('#lightUp').on("mousedown", function (event) {
            event.preventDefault();
            app.moveLight(MOVE_UP);
        });
        $('#lightUp').on("touchstart", function (event) {
            event.preventDefault();
            app.moveLight(MOVE_UP);
        });
        $('#lightDown').on("mousedown", function (event) {
            event.preventDefault();
            app.moveLight(MOVE_DOWN);
        });
        $('#lightDown').on("touchstart", function (event) {
            event.preventDefault();
            app.moveLight(MOVE_DOWN);
        });
        $('#lightLeft').on("mousedown", function (event) {
            event.preventDefault();
            app.moveLight(MOVE_LEFT);
        });
        $('#lightLeft').on("touchstart", function (event) {
            event.preventDefault();
            app.moveLight(MOVE_LEFT);
        });
        $('#lightRight').on("mousedown", function (event) {
            event.preventDefault();
            app.moveLight(MOVE_RIGHT);
        });
        $('#lightRight').on("touchstart", function (event) {
            event.preventDefault();
            app.moveLight(MOVE_RIGHT);
        });
        $('[id^=light]').on("mouseup", function (event) {
            event.preventDefault();
            app.repeatLight();
        });
        $('[id^=light]').on("touchend", function (event) {
            event.preventDefault();
            app.repeatLight();
        });

        $('#reset').on("click", function () {
            app.resetScene();
        });
        $('#lightToCam').on("click", function() {
            app.lightToCamera();
        });

        app.run();
    }
});
