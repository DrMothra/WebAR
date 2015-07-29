/**
 * Created by DrTone on 10/07/2015.
 */


$(document).ready(function() {
    //Do any init
    skel.init();

    //Play audio
    $('#story1').on("click", function() {
        var audioPlayer = document.getElementById("audioHunting");
        audioPlayer.play();
    });
});
