<?php
$audioDirectory = 'audio/';
$audioFiles = array();

// Lire les fichiers du dossier
if (is_dir($audioDirectory)) {
    if ($dh = opendir($audioDirectory)) {
        while (($file = readdir($dh)) !== false) {
            if (pathinfo($file, PATHINFO_EXTENSION) === 'mp3') {
                $audioFiles[] = $file;
            }
        }
        closedir($dh);
    }
}

// Afficher la liste des fichiers audio
foreach ($audioFiles as $file) {
    echo '<div class="audio-file">';
    echo '<p>' . htmlspecialchars($file) . '</p>';
    echo '<audio controls><source src="' . htmlspecialchars($audioDirectory . '/' . $file) . '" type="audio/mpeg"></audio>';
    echo '</div>';
}
?>