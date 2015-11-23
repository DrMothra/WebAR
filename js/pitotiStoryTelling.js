/**
 * Created by atg on 20/11/2015.
 */


var storyPlayer = (function() {
    //Init any vars
    var videoPlayer;
    var videoChecker;
    var currentStory = 0;

    return {
        init: function() {
            videoPlayer = document.getElementById("videoPlayer");
            if(!videoPlayer) {
                console.log("No video player!!");
            }
            var vidIndex = sessionStorage.getItem("videoStory0");
            if(!vidIndex) {
                alert("No videos downloaded!");
                return;
            }
            videoPlayer.src = videoManager.getVideoSource(vidIndex, HIGH);

            this.startVideoTimer();
        },

        startVideoTimer: function() {
            videoChecker = setInterval(function() {
                if(videoPlayer.ended) {
                    //Get next video
                    if(videoPlayer.currentTime === 0) return;
                    //DEBUG
                    console.log("Video ended");
                    ++currentStory;
                    console.log("Timeslot now ", currentTimeslot);
                    var playing = false;
                    for(var i=currentTimeslot; i<TIMELINE_SLOTS; ++i) {
                        if(timelineSlots[i]) {
                            //DEBUG
                            console.log("Playing next video");
                            videoPlayer.src = videoManager.getVideoSource(videoSources[i]);
                            videoPlayer.play();
                            playing = true;
                            currentTimeslot = i;
                            //DEBUG
                            console.log("current timeslot =", currentTimeslot);
                            break;
                        }
                    }
                    if(!playing) {
                        //Finished
                        //DEBUG
                        console.log("Finished");
                        videoPlaying = false;
                        currentTimeslot = 0;
                        videoPlayer.currentTime = 0;
                        videoPlayer.src = videoManager.getVideoSource(videoSources[0]);
                    }
                }
            }, checkInterval)
        }
    }
})();
