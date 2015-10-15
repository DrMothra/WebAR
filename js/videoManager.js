/**
 * Created by DrTone on 30/07/2015.
 */
//Manages video clips

var videoManager = (function() {

    var videoSources = ['videos/axeMan.mp4', 'videos/deers.mp4', 'videos/horseWarrior.mp4', 'videos/house.mp4', 'videos/manHorse.mp4', 'videos/manBeasts.mp4',
        'videos/manHunt.mp4', 'videos/warrior1.mp4', 'videos/marching.mp4', 'videos/morph.mp4', 'videos/headDress.mp4', 'videos/spearHunt.mp4', 'videos/tallMorph.mp4',
        'videos/manuel.mp4', 'videos/warrior2.mp4', 'videos/plough.mp4'];
    var numVideos = videoSources.length;

    return {
        getNumVideos: function() {
            return numVideos;
        },

        getVideoSource: function(index) {
            if(index<0 || index >= numVideos) {
                displayError("Invalid video index");
                return;
            }
            return videoSources[index];
        }
    };

    function displayError(msg) {
        alert(msg);
    }
})();