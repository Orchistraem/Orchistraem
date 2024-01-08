<?php
$target_dir = "audio/";
$target_file = $target_dir . basename($_FILES["audioFile"]["name"]);

// Vérifiez si le fichier est un fichier audio MP3
$audioFileType = strtolower(pathinfo($target_file,PATHINFO_EXTENSION));
if($audioFileType != "mp3") {
    echo "Désolé, seuls les fichiers MP3 sont autorisés.";
    exit;
}

// Téléchargez le fichier
if (move_uploaded_file($_FILES["audioFile"]["tmp_name"], $target_file)) {
    echo "Le fichier ". htmlspecialchars( basename( $_FILES["audioFile"]["name"])). " a été téléchargé.";
} else {
    echo "Désolé, une erreur s'est produite lors du téléchargement de votre fichier.";
}
?>