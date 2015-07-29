/**
 * Created by DrTone on 10/07/2015.
 */

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
            } else if(currentId === id) {
                audioPlayer.pause();
            } else {
                var currentPlayer = document.getElementById("audio"+currentId);
                currentPlayer.pause();
                audioPlayer.play();
            }
        }
    };

    function displayError(msg) {
        alert(msg);
    }
})();

$(document).ready(function() {
    //Do any init
    skel.init();

    //Play audio
    $('#story1').on("click", function() {
        var audioPlayer = document.getElementById("audioRose");
        audioPlayer.play();
    });

    $('#story2').on("click", function() {
        var audioPlayer = document.getElementById("audioWarrior");
        audioPlayer.play();
    });
});
