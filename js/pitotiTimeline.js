/**
 * Created by DrTone on 07/07/2015.
 */
var NUM_CONTAINERS = 8;
var videoPanel = (function() {

    return {
        init: function() {
            //Fill video slots
            var i, src, elem;
            for(i=0; i<NUM_CONTAINERS; ++i) {
                src = sessionStorage.getItem("slot" + i);
                if(src) {
                    elem = document.getElementById("slot" + i);
                    elem.src = "images/" + src;
                }
            }
        }
    }
})();


$(document).ready(function() {
    //Init
    skel.init();

    videoPanel.init();

    var dragElem = $('.drag img');
    dragElem.draggable( {
        revert: "invalid",
        helper: "clone"
    });

    var targetElem = $('.drop img');
    targetElem.droppable( {
        accept: ".drag img",
        drop: function( event, ui) {
            videoPanel.drop(event, ui);
        }
    });
});
