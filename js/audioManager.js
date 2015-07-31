/**
 * Created by DrTone on 30/07/2015.
 */

//Manages audio clips
var audioManager = (function() {

    var audioPlayer = null;
    var currentId = null;

    return {
        playAudio: function(id) {
            audioPlayer = document.getElementById("audio"+id);
            if(!audioPlayer) {
                displayError("No such audio player");
                return;
            }
            if(!currentId) {
                currentId = id;
                audioPlayer.play();
                //DEBUG
                //console.log("Playing");
            } else if(currentId === id) {
                if(audioPlayer.paused) {
                    audioPlayer.play();
                } else {
                    audioPlayer.pause();
                }
                //DEBUG
                //console.log("Paused");
            } else {
                var currentPlayer = document.getElementById("audio"+currentId);
                currentPlayer.pause();
                audioPlayer.play();
                currentId = id;
                //DEBUG
                //console.log("Paused old, played new");
            }
        }
    };

    function displayError(msg) {
        alert(msg);
    }
})();
