/**
 * Created by DrTone on 10/07/2015.
 */


$(document).ready(function() {
    //Do any init

    //Play audio
    $('#story1').on("click", function() {
        audioManager.playAudio(this.id);
    });

    var view1Image = $('#seradina1Augment');
    var view2Image = $('#seradina1Augment2');

    $('#view1').on("click", function() {
        if(view1Image.is(":visible")) {
            console.log("Hiding");
            view1Image.hide();
        } else {
            console.log("Showing");
            view1Image.show();
            view2Image.hide();
        }
    });

    $("#view2").on("click", function() {
        if(view2Image.is(":visible")) {
            console.log("Hiding");
            view2Image.hide();
        } else {
            console.log("Showing");
            view2Image.show();
            view1Image.hide();
        }
    });
});
