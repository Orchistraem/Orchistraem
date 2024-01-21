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
            audioFiles.forEach((file:string) => {
                // Créer un conteneur div pour chaque ligne
                const rowContainer = document.createElement('div');
                rowContainer.classList.add('audio-row');

                // Extraire le nom du fichier sans l'extension .mp3 et remplacer '_' et '-' par des espaces
                const fileName = file.replace(/\.mp3$/, '').replace(/[_-]/g, ' ');

                // Ajoute un paragraphe avec le nom du fichier
                const fileNameParagraph = document.createElement('p');
                fileNameParagraph.textContent = fileName;

                // Ajoute un bouton à côté du nom du fichier
                const modifyButton = document.createElement('button');
                modifyButton.textContent = 'Modifier';
                modifyButton.addEventListener('click', () => {
                    
                });

                // Ajouter les éléments à la ligne
                rowContainer.appendChild(fileNameParagraph);
                rowContainer.appendChild(modifyButton);

                // Ajouter le conteneur de ligne à la liste
                if(audioListContainer){audioListContainer.appendChild(rowContainer);}
                

                const audioElement = document.createElement('audio');
                audioElement.setAttribute('controls', '');
                audioElement.src = `/uploads/${file}`;
                if(audioListContainer){audioListContainer.appendChild(audioElement);}
            });

        })
        .catch(error => console.error('Erreur:', error));
});

window.onload = function () {
    setupUploadAudioForm();
}