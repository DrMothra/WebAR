/**
 * Created by DrTone on 10/07/2015.
 */


$(document).ready(function() {
    //Do any init
    skel.init();

    //Play audio
    $('#story1').on("click", function() {
        audioManager.playAudio(this.id);
    });

    var elem = $('#seradina1Augment');
    $('#enhance').on("click", function() {
        if(elem.is(":visible")) {
            elem.hide();
        } else {
            elem.show();
        }
    });
});
