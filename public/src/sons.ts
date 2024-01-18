/**
 * Configure le formulaire pour le téléchargement de fichiers audio.
 * 
 * Cette fonction prépare le formulaire pour télécharger des fichiers audio. Elle définit un gestionnaire 
 * d'événements pour le formulaire et gère l'envoi du fichier audio sélectionné au serveur.
 * 
 * @returns Aucune valeur n'est retournée.
 */
function setupUploadAudioForm() {
    const uploadAudioForm = document.getElementById('uploadAudioForm');
    const audioFileInput = document.getElementById('audioFile') as HTMLInputElement | null;
  
    if (uploadAudioForm && audioFileInput) {
        uploadAudioForm.addEventListener('submit', function(event) {
            event.preventDefault();
      
            const formData = new FormData();
            const audioFile = audioFileInput.files ? audioFileInput.files[0] : null;
      
            if (audioFile) {
                formData.append('audioFile', audioFile);
      
                fetch('/upload-audio', {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.text())
                .then(data => console.log(data))
                .catch(error => console.error('Erreur:', error));
            } else {
                console.error('Aucun fichier n\'a été sélectionné.');
            }
        });
    } else {
        console.error('Élément(s) de formulaire introuvable(s).');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetch('/list-audios')
        .then(response => response.json())
        .then(audioFiles => {
            const audioListContainer = document.getElementById('audioList');
            audioFiles.forEach(file => {
                // Ajoute un paragraphe avec le nom du fichier
                const fileNameParagraph = document.createElement('p');
                fileNameParagraph.textContent = file;
                audioListContainer.appendChild(fileNameParagraph);

                audioListContainer.appendChild(modifyButton);
                const audioElement = document.createElement('audio');
                audioElement.setAttribute('controls', '');
                audioElement.src = `/uploads/${file}`;
                audioListContainer.appendChild(audioElement);

                
            });

        })
        .catch(error => console.error('Erreur:', error));
});

window.onload = function () {
    setupUploadAudioForm();
}