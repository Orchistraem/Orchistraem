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
    const audioFileInput = document.getElementById('audioFile');
    if (uploadAudioForm && audioFileInput) {
        uploadAudioForm.addEventListener('submit', function (event) {
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
            }
            else {
                console.error('Aucun fichier n\'a été sélectionné.');
            }
        });
    }
    else {
        console.error('Élément(s) de formulaire introuvable(s).');
    }
}

function displayAudioList() {
        fetch('/list-audios')
            .then(response => response.json())
            .then(audioFiles => {
                const audioListContainer = document.getElementById('audioList');
                audioFiles.forEach(file => {
                    // Créer un conteneur div pour chaque fichier audio
                    const audioContainer = document.createElement('div');
                    audioContainer.classList.add('audio-container');
                    audioContainer.setAttribute('data-file', file);

                    // Extraire le nom du fichier sans l'extension .mp3 et remplacer '_' et '-' par des espaces
                    const fileName = file.replace(/\.mp3$/, '').replace(/[_-]/g, ' ');

                    // Ajouter le nom du fichier
                    const fileNameParagraph = document.createElement('p');
                    fileNameParagraph.textContent = fileName;

                    // Créer un bouton modifier à côté du nom du fichier
                    const modifyButton = document.createElement('button');
                    modifyButton.textContent = 'Modifier';
                    modifyButton.addEventListener('click', () => {
                        modifyName(file);
                    });

                    // Créer un bouton supprimer à côté du nom du fichier
                    const deleteButton = document.createElement('button');
                    deleteButton.textContent = 'Supprimer';
                    deleteButton.addEventListener('click', () => {
                        deleteSong(file);
                    });
                    

                    // Créer l'élément audio
                    const audioElement = document.createElement('audio');
                    audioElement.setAttribute('controls', '');
                    audioElement.src = `/uploads/${file}`;

                    // Ajouter les éléments au conteneur du fichier audio
                    audioContainer.appendChild(fileNameParagraph);
                    audioContainer.appendChild(modifyButton);
                    audioContainer.appendChild(deleteButton);
                    audioContainer.appendChild(audioElement);

                    // Ajouter le conteneur du fichier audio à la liste
                    audioListContainer.appendChild(audioContainer);
                });

            })
            .catch(error => console.error('Erreur:', error));
}


function modifyName(currentFileName) {
    const audioContainer = document.querySelector(`.audio-container[data-file="${currentFileName}"]`);

    if (audioContainer) {
        if (!audioContainer.querySelector('input[type="text"]')) {
            // Préremplir la zone de texte avec le nom actuel
            const currentName = currentFileName.replace(/\.mp3$/, '').replace(/[_-]/g, ' ');
            const newFileNameInput = document.createElement('input');
            newFileNameInput.type = 'text';
            newFileNameInput.value = currentName;

            // Créer le bouton de confirmation
            const confirmButton = document.createElement('button');
            confirmButton.textContent = 'Confirmer';

            // Créer le bouton d'annulation
            const cancelButton = document.createElement('button');
            cancelButton.textContent = 'Annuler';

            // Créer un conteneur pour la zone de texte, le bouton de confirmation et le bouton d'annulation
            const container = document.createElement('div');
            container.appendChild(newFileNameInput);
            container.appendChild(confirmButton);
            container.appendChild(cancelButton);

            // Ajouter le conteneur sous l'élément .audio-container
            audioContainer.appendChild(container);

            // Activer le bouton "Confirmer" uniquement si la zone de texte n'est pas vide
            newFileNameInput.addEventListener('input', () => {
                confirmButton.disabled = newFileNameInput.value.trim() === '';
            });

            // Gérer l'événement de clic sur le bouton de confirmation
            confirmButton.addEventListener('click', () => {
                const newFileName = newFileNameInput.value.replace(/\s/g, '_') + '.mp3';
                
                fetch('/rename-audio', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ oldName: currentFileName, newName: newFileName }),
                })
                .then(response => {
                    if (response.ok) {
                        console.log(`Nom du fichier modifié : ${newFileName}`);
                        // Mise à jour du nom d'affichage et de l'attribut data-file
                        const fileNameDisplay = audioContainer.querySelector('p');
                        fileNameDisplay.textContent = newFileName.replace(/\.mp3$/, '').replace(/[_-]/g, ' ');
                        audioContainer.setAttribute('data-file', newFileName);
                    } else {
                        console.error('Erreur lors de la modification du nom du fichier');
                    }
                })
                .catch(error => console.error('Erreur:', error));
            
                container.remove();
            });

            // Gérer l'événement de clic sur le bouton d'annulation
            cancelButton.addEventListener('click', () => {
                // Retirer la zone de texte et les boutons sans effectuer de modification
                container.remove();
            });
        }
    } else {
        console.error(`Aucun élément audio correspondant à ${currentFileName} n'a été trouvé.`);
    }
}

function deleteSong(fileName) {
    const audioContainer = document.querySelector(`.audio-container[data-file="${fileName}"]`);

    if (audioContainer) {
        if (!audioContainer.querySelector('.confirm-container')) {
            const confirmContainer = document.createElement('div');
            confirmContainer.classList.add('confirm-container');

            const confirmMessage = document.createElement('p');
            confirmMessage.textContent = `Êtes-vous sûr de vouloir supprimer le son "${fileName.replace(/\.mp3$/, '').replace(/[_-]/g, ' ')}" ?`;
            confirmContainer.appendChild(confirmMessage);

            const confirmButton = document.createElement('button');
            confirmButton.textContent = 'Confirmer';
            const cancelButton = document.createElement('button');
            cancelButton.textContent = 'Annuler';

            confirmContainer.appendChild(confirmButton);
            confirmContainer.appendChild(cancelButton);
            audioContainer.appendChild(confirmContainer);

            confirmButton.addEventListener('click', () => {
                fetch('/delete-audio', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ fileName }),
                })
                .then(response => {
                    if (response.ok) {
                        audioContainer.remove();
                        console.log(`Fichier ${fileName} supprimé`);
                    } else {
                        console.error('Erreur lors de la suppression du fichier');
                    }
                })
                .catch(error => console.error('Erreur:', error));
            });

            cancelButton.addEventListener('click', () => {
                confirmContainer.remove();
            });
        }
    } else {
        console.error(`Aucun élément audio correspondant à ${fileName} n'a été trouvé.`);
    }
}


window.onload = function () {
    displayAudioList();
    setupUploadAudioForm();
}