/**
 * Created by DrTone on 04/12/2014.
 */
//Visualisation framework

//Init this app from base
function Pitoti() {
    BaseApp.call(this);
}

Pitoti.prototype = new BaseApp();

Pitoti.prototype.init = function(container) {
    BaseApp.prototype.init.call(this, container);
    //GUI
    this.guiControls = null;
    this.gui = null;
    this.rotPerSec = 1;
};

Pitoti.prototype.createScene = function() {
    //Create scene
    BaseApp.prototype.createScene.call(this);

    //Load floor grid
    var width = 420;
    var height = 640;
    //var gridGeom = new THREE.PlaneGeometry(width, height);
    var sphereGeom = new THREE.SphereGeometry(30, 16, 16);
    var texture = THREE.ImageUtils.loadTexture("images/IZIR.png");
    var sphereMaterial = new THREE.MeshPhongMaterial({ map : texture, transparent: true, opacity: 1});
    this.sphere = new THREE.Mesh(sphereGeom, sphereMaterial);
    this.sphere.name = 'IZIR';
    this.scene.add(this.sphere);
};

Pitoti.prototype.createGUI = function() {
    //GUI - using dat.GUI
    this.guiControls = new function() {

    };

    var gui = new dat.GUI();

    //Add some folders
    this.guiAppear = gui.addFolder("Appearance");
    this.guiData = gui.addFolder("Data");
    this.gui = gui;
};

Pitoti.prototype.update = function() {
    //Perform any updates
    this.delta = this.clock.getDelta();

    this.sphere.rotation.y += this.delta * this.rotPerSec;

    BaseApp.prototype.update.call(this);
};

$(document).ready(function() {
    //Initialise app
    if(!Detector.webgl) {
        $('#notSupported').show();
    } else {
        var container = document.getElementById("WebGL-output");
        var app = new Pitoti();
        app.init(container);
        app.createScene();
        //app.createGUI();

        //GUI callbacks

        app.run();
    }

});