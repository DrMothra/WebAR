/**
 * Created by DrTone on 17/12/2015.
 */

var NUM_CONTAINERS = 8;

$(document).ready(function() {

    //Reset video tiles
    for(var i=0; i<NUM_CONTAINERS; ++i) {
        sessionStorage.removeItem("slot"+i);
    }
});
