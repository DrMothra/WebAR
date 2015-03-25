/**
 * Created by DrTone on 04/12/2014.
 */
//Visualisation framework




//Init this app from base
function Framework() {
    BaseApp.call(this);
}

Framework.prototype = new BaseApp();

Framework.prototype.init = function(container) {
    BaseApp.prototype.init.call(this, container);
    //GUI
    this.guiControls = null;
    this.gui = null;
};

Framework.prototype.createScene = function() {
    //Create scene
    BaseApp.prototype.createScene.call(this);

    //Load floor grid
    var width = 420;
    var height = 640;
    var gridGeom = new THREE.PlaneGeometry(width, height);
    var texture = THREE.ImageUtils.loadTexture("images/grid.png");
    var gridMaterial = new THREE.MeshLambertMaterial({ map : texture, transparent: true, opacity: 0.9});
    var grid = new THREE.Mesh(gridGeom, gridMaterial);
    grid.name = 'grid';
    grid.rotation.x = -Math.PI/2;
    this.scene.add(grid);
};

Framework.prototype.createGUI = function() {
    //GUI - using dat.GUI
    this.guiControls = new function() {

    };

    var gui = new dat.GUI();

    //Add some folders
    this.guiAppear = gui.addFolder("Appearance");
    this.guiData = gui.addFolder("Data");
    this.gui = gui;
};

Framework.prototype.update = function() {
    //Perform any updates

    BaseApp.prototype.update.call(this);
};

$(document).ready(function() {
    //Initialise app
    var container = document.getElementById("WebGL-output");
    var app = new Framework();
    app.init(container);
    app.createScene();
    //app.createGUI();

    //GUI callbacks

    app.run();
});