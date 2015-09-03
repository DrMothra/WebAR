/**
 * Created by DrTone on 10/07/2015.
 */


$(document).ready(function() {
    //Do any init

    //Play audio
    $('#story1').on("click", function() {
        audioManager.playAudio(this.id);
    });

    var elem = $('#seradina1Augment');
    $('#enhance').on("click", function() {
        if(elem.is(":visible")) {
            console.log("Hiding");
            elem.hide();
        } else {
            console.log("Showing");
            elem.show();
        }
    });

    var augElem = $("#seradina1Augment2");
    $("#enhance2").on("click", function() {
        if(augElem.is(":visible")) {
            console.log("Hiding");
            augElem.hide();
        } else {
            console.log("Showing");
            augElem.show();
        }
    });
});
