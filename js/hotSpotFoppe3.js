/**
 * Created by DrTone on 21/12/2015.
 */

$(document).ready(function() {

    //Play audio
    $('#foppe3Story1').on("click", function() {
        audioManager.playAudio(this.id);
    });

});