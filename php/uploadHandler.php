<?php
/**
 * Created by PhpStorm.
 * User: DrTone
 * Date: 04/08/2015
 * Time: 23:58
 */
$NUM_VIDEOS = 4;
$playerName = $_POST["userName"];
if($playerName === "") {
    echo "No player name, set to default" . "\n";
    $playerName = "Player";
}
$playerMail = $_POST["email"];
if($playerMail === "") {
    echo "No player e-mail, terminating";
    return;
}
echo "Name = " . $playerName . "\n";
echo "Mail = " . $playerMail . "\n";

$videoClips = array();
for($i = 0; $i < $NUM_VIDEOS; ++$i) {
    $video = $_POST["video".$i];
    echo "Video " . $i . " = " . $video . "\n";
    if(!empty($video)) {
        array_push($videoClips, $video);
        echo "Stored video\n";
    }
}
print_r($videoClips);

$target_dir = "uploads/";
$target_file = $target_dir . basename($_FILES["audioFile"]["name"]);

$uploadOk = 1;
$fileExtn = pathinfo($target_file,PATHINFO_EXTENSION);

if(isset($_POST["submit"])) {
    if($_FILES["audioFile"]["type"] != "audio/mpeg") {
        echo "File is not audio.";
        $uploadOk = 0;
    }
}

// Check if file already exists
if (file_exists($target_file)) {
    echo "Sorry, file already exists.";
    $uploadOk = 0;
}
// Check file size
/*
if ($_FILES["audioFile"]["size"] > 500000) {
    echo "Sorry, your file is too large.";
    $uploadOk = 0;
}
*/
// Allow certain file formats
if($fileExtn != "mp3") {
    echo "Sorry, only mp3 files are allowed.";
    $uploadOk = 0;
}

// Check if $uploadOk is set to 0 by an error
if ($uploadOk == 0) {
    echo "Sorry, your file was not uploaded.";
// if everything is ok, try to upload file
} else {
    if (move_uploaded_file($_FILES["audioFile"]["tmp_name"], $target_file)) {
        echo "The file ". basename( $_FILES["audioFile"]["name"]). " has been uploaded.";
    } else {
        echo "Sorry, there was an error uploading your file.";
    }
}

//Mail everything to user
require 'PHPMailerAutoload.php';

$mail = new PHPMailer;
$mail->isHTML(true);
$mail->From = 'storytelling@pitoti.com';
$mail->FromName = '3D Pitoti';
$mail->addAddress($playerMail, $playerName);     // Add a recipient
//Add all videos
$videoLength = count($videoClips);
echo "Number of videos = " . $videoLength . "\n";
if($videoLength !== 0) {
    for($clip = 0; $clip<$videoLength; ++$clip) {
        $mail->addAttachment($videoClips[$clip]);
        echo "Added video attachment\n";
    }
}
// Add audio file attachments
$mail->addAttachment($target_file);
$mail->Subject = 'Pitoti stories';
$mail->Body = 'Here is your Pitoti story, thanks for playing!!!<br><br>The Pitoti Team.';

if(!$mail->send()) {
    echo 'Message could not be sent.';
    echo 'Mailer Error: ' . $mail->ErrorInfo;
} else {
    echo 'Message has been sent';
}
?>

