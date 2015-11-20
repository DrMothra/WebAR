/**
 * Created by DrTone on 30/07/2015.
 */
//Manages video clips
var LOW= 0, HIGH=1;
var videoManager = (function() {

    var videoSourcesLowRes = ['videos/axeMan.mp4', 'videos/deers.mp4', 'videos/horseWarrior.mp4', 'videos/house.mp4', 'videos/manHorse.mp4', 'videos/manBeasts.mp4',
        'videos/manHunt.mp4', 'videos/warrior1.mp4', 'videos/marching.mp4', 'videos/morph.mp4', 'videos/headDress.mp4', 'videos/spearHunt.mp4', 'videos/tallMorph.mp4',
        'videos/manuel.mp4', 'videos/warrior2.mp4', 'videos/plough.mp4'];

    var videoSourcesHighRes = ['videos/axeManHigh.mp4', 'videos/deersHigh.mp4', 'videos/horseWarriorHigh.mp4', 'videos/houseHigh.mp4', 'videos/manHorseHigh.mp4', 'videos/manBeastsHigh.mp4',
        'videos/manHuntHigh.mp4', 'videos/warrior1High.mp4', 'videos/marchingHigh.mp4', 'videos/morphHigh.mp4', 'videos/headDressHigh.mp4', 'videos/spearHuntHigh.mp4', 'videos/tallMorphHigh.mp4',
        'videos/manuelHigh.mp4', 'videos/warrior2High.mp4', 'videos/ploughHigh.mp4'];

    var numVideos = videoSourcesLowRes.length;

    return {
        getNumVideos: function() {
            return numVideos;
        },

        getVideoSource: function(index, resolution) {
            if(index<0 || index >= numVideos) {
                displayError("Invalid video index");
                return;
            }
            if(resolution === undefined) {
                resolution = LOW;
            } else {
                if(resolution < LOW || resolution > HIGH) {
                    displayError("Invalid resolution");
                    return;
                }
            }

            var videoSources;
            switch (resolution) {
                case LOW:
                    videoSources = videoSourcesLowRes;
                    break;

                case HIGH:
                    videoSources = videoSourcesHighRes;
                    break;

                default:
                    break;
            }
            return videoSources[index];
        }
    };

    function displayError(msg) {
        alert(msg);
    }
})();