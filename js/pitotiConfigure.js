/**
 * Created by DrTone on 10/07/2015.
 */


$(document).ready(function() {
    //Do any init
    skel.init();

    //Store user details
    var form = document.getElementById("enterDetails");
    form.onsubmit = function(event) {
        event.preventDefault();

        var name = $('#name').val();
        var mail = $('#mail').val();
        if(name === "") {
            alert("Please enter valid name");
            return;
        }
        if(mail === "") {
            alert("Please enter valid e-mail");
            return;
        }

        sessionStorage.setItem("userName", name);
        sessionStorage.setItem("userMail", mail);

        $('#entered').show();
    }
});
