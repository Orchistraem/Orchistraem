"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * Affiche une notification à l'utilisateur.
 *
 * Cette fonction affiche un message temporaire à l'écran en utilisant un élément HTML spécifié par son ID.
 * Le message disparaîtra automatiquement après un délai spécifié.
 *
 * @param message - Le message à afficher dans la notification.
 * @param duration - La durée pendant laquelle la notification reste visible en millisecondes (1500 par défaut).
 */
function showNotification1(message, duration = 1500) {
    const notification = document.getElementById('notification');
    if (notification) {
        notification.innerText = message; // Mettre à jour le texte
        notification.style.display = 'block'; // Afficher la notification
        // Masquer la notification après 'duration' millisecondes
        setTimeout(() => {
            notification.style.display = 'none';
        }, duration);
    }
}
/**
 * Configure le formulaire pour le téléchargement de fichiers audio.
 *
 * Cette fonction prépare le formulaire pour télécharger des fichiers audio.
 * Elle définit un gestionnaire d'événements pour le formulaire et gère l'envoi du fichier audio sélectionné au serveur.
 * @returns aucune valeur n'est retourné
 */
function setupUploadAudioForm() {
    // Récupère les éléments du formulaire et du champ de fichier audio.
    const uploadAudioForm = document.getElementById('uploadAudioForm');
    const audioFileInput = document.getElementById('audioFile');
    if (uploadAudioForm && audioFileInput) {
        // Ajoute un écouteur d'événements pour le formulaire de téléchargement.
        uploadAudioForm.addEventListener('submit', function (event) {
            event.preventDefault();
            // Crée un objet FormData pour envoyer les données du fichier audio.
            const formData = new FormData();
            const audioFile = audioFileInput.files ? audioFileInput.files[0] : null;
            if (audioFile) {
                formData.append('audioFile', audioFile);
                // Envoie les données du formulaire au serveur via une requête fetch.
                fetch('/upload-audio', {
                    method: 'POST',
                    body: formData
                })
                    .then(response => {
                    if (response.ok) {
                        showNotification1('Fichier téléchargé avec succès');
                        console.log('Fichier téléchargé avec succès');
                        refreshAudioList(); // Rafraîchir la liste après le téléchargement réussi
                    }
                    else if (response.status === 409) {
                        console.error('Le fichier existe déjà');
                        showNotification1('Le fichier existe déjà');
                        refreshAudioList();
                    }
                    else {
                        showNotification1('Erreur lors du téléchargement du fichier');
                        throw new Error('Erreur lors du téléchargement du fichier');
                    }
                })
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
/**
 * Rafraîchit et met à jour la liste des fichiers audio affichée sur la page.
 *
 * Cette fonction efface le contenu actuel du conteneur de la liste des fichiers audio,
 * puis recharge et affiche la liste à jour. Elle est utile pour refléter les changements
 * tels que l'ajout ou la suppression de fichiers audio sans avoir besoin de rafraîchir
 * toute la page.
 *
 * @returns Aucune valeur n'est retournée.
 */
function refreshAudioList() {
    const audioListContainer = document.getElementById('audioList');
    if (audioListContainer) {
        audioListContainer.innerHTML = ''; // Vider la liste existante
        displayAudioList(); // Recharger la liste
    }
}
/**
 * Affiche la liste des fichiers audio.
 * @returns aucune valeur n'est retourné
 */
/**
 * Affiche la liste des fichiers audio.
 * @returns aucune valeur n'est retourné
 */
function displayAudioList() {
    // Récupérez les catégories disponibles depuis le serveur.
    fetch('/categories')
        .then(response => response.json())
        .then(categories => {
        // Récupérez ensuite les métadonnées audio pour connaître les catégories assignées à chaque fichier
        fetch('/audio-metadata')
            .then(response => response.json())
            .then(audioMetadata => {
            // Ensuite, récupérez la liste des fichiers audio depuis le serveur.
            fetch('/list-audios')
                .then(response => response.json())
                .then(audioFiles => {
                const audioListContainer = document.getElementById('audioList');
                if (audioListContainer) {
                    audioListContainer.innerHTML = ''; // Vider la liste existante
                    // Parcourt chaque fichier audio pour créer et afficher les éléments HTML correspondants.
                    audioFiles.forEach((file) => {
                        const audioContainer = document.createElement('div');
                        audioContainer.classList.add('audio-container');
                        audioContainer.setAttribute('data-file', file);
                        audioContainer.addEventListener('click', () => {
                            audioContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        });
                        // Ajouter une classe spécifique pour le titre
                        const fileNameParagraph = document.createElement('p');
                        fileNameParagraph.classList.add('audio-title'); // Classe pour le titre
                        fileNameParagraph.textContent = file.replace(/\.mp3$/, '').replace(/[_-]/g, ' ');
                        audioContainer.appendChild(fileNameParagraph);
                        // Ajouter une classe spécifique pour la catégorie
                        const fileMetadata = audioMetadata.find((meta) => meta.name === file);
                        const fileCategory = fileMetadata ? fileMetadata.category : 'Non catégorisé';
                        const fileCategoryParagraph = document.createElement('p');
                        fileCategoryParagraph.classList.add('category-label'); // Classe pour la catégorie
                        fileCategoryParagraph.textContent = ` ${fileCategory}`;
                        audioContainer.appendChild(fileCategoryParagraph);
                        // Crée et affiche un lecteur audio pour écouter le fichier.
                        const audioElement = document.createElement('audio');
                        audioElement.setAttribute('controls', '');
                        audioElement.src = `/uploads/${file}`;
                        audioElement.addEventListener('play', () => {
                            audioContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        });
                        audioContainer.appendChild(audioElement);
                        // Créer le div "editSon"
                        const editSon = document.createElement('div');
                        editSon.classList.add('editSon');
                        // Bouton Modifier
                        const modifyButton = document.createElement('button');
                        modifyButton.textContent = 'Modifier';
                        modifyButton.classList.add('btn', 'btn-primary');
                        modifyButton.onclick = () => modifyName(file);
                        editSon.appendChild(modifyButton);
                        modifyButton.addEventListener('click', () => {
                            audioContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        });
                        // Bouton Supprimer
                        const deleteButton = document.createElement('button');
                        deleteButton.textContent = 'Supprimer';
                        deleteButton.classList.add('btn', 'btn-danger');
                        deleteButton.onclick = () => deleteSong(file);
                        editSon.appendChild(deleteButton);
                        deleteButton.addEventListener('click', () => {
                            audioContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        });
                        // Ajouter le bouton d'analyse des sons
                        const analyseButton = document.createElement('button');
                        analyseButton.textContent = 'Analyser';
                        analyseButton.classList.add('btn', 'btn-info');
                        analyseButton.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
                            const canvas = audioContainer.querySelector('#sonogramCanvas');
                            let closeButton = audioContainer.querySelector('#closeButtonAnalyse');
                            if (!closeButton) {
                                closeButton = document.createElement('button');
                                closeButton.textContent = 'Fermer';
                                closeButton.classList.add('btn', 'btn-secondary');
                                closeButton.id = 'closeButtonAnalyse';
                                closeButton.addEventListener('click', () => {
                                    closeCanvas(audioContainer);
                                    if (closeButton)
                                        closeButton.remove();
                                });
                                editSon.appendChild(closeButton);
                            }
                            const audioUrl = `/uploads/${file}`; // URL du fichier audio
                            const response = yield fetch(audioUrl);
                            const blob = yield response.blob();
                            // Cacher les boutons lorsque l'analyse commence
                            const buttons = audioContainer.querySelectorAll('button:not(#closeButtonAnalyse)');
                            buttons.forEach(button => button.classList.add('hidden'));
                            drawSonogram(blob, editSon, canvas);
                        }));
                        analyseButton.addEventListener('click', () => {
                            audioContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        });
                        editSon.appendChild(analyseButton);
                        // Ajouter le div "editSon" au conteneur principal
                        audioContainer.appendChild(editSon);
                        // Créer le div "categSon"
                        const categSon = document.createElement('div');
                        categSon.classList.add('categSon');
                        // Menu déroulant pour les catégories
                        const categorySelect = document.createElement('select');
                        categories.forEach((category) => {
                            const option = document.createElement('option');
                            option.value = category.name;
                            option.textContent = category.name;
                            categorySelect.appendChild(option);
                        });
                        categorySelect.value = fileCategory; // Sélectionner la catégorie actuelle
                        categSon.appendChild(categorySelect);
                        categorySelect.addEventListener('click', () => {
                            audioContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        });
                        // Bouton pour assigner la catégorie
                        const assignCategoryButton = document.createElement('button');
                        assignCategoryButton.textContent = 'Assigner Catégorie';
                        assignCategoryButton.classList.add('btn', 'btn-secondary');
                        assignCategoryButton.onclick = () => {
                            assignCategoryToFile(file, categorySelect.value);
                            fileCategoryParagraph.textContent = `${categorySelect.value}`; // Mise à jour immédiate de l'affichage de la catégorie
                        };
                        categSon.appendChild(assignCategoryButton);
                        assignCategoryButton.addEventListener('click', () => {
                            audioContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        });
                        audioContainer.appendChild(categSon);
                        audioListContainer.appendChild(audioContainer);
                    });
                }
            })
                .catch(error => console.error('Erreur lors de la récupération des fichiers audio:', error));
        })
            .catch(error => console.error('Erreur lors de la récupération des métadonnées audio:', error));
    })
        .catch(error => console.error('Erreur lors de la récupération des catégories:', error));
}
window.addEventListener('DOMContentLoaded', () => {
    const audioList = document.getElementById('audioList');
    audioList === null || audioList === void 0 ? void 0 : audioList.addEventListener('click', function (event) {
        const target = event.target; // Assurer que target est traité comme un HTMLElement
        if (target && target.classList.contains('audio-container')) {
            target.classList.toggle('minimized');
            target.classList.toggle('expanded');
        }
    });
});
/**
 * Modifie le nom d'un fichier audio.
 * @param currentFileName Le nom actuel du fichier audio.
 * @returns aucune valeur n'est retourné
 */
function modifyName(currentFileName) {
    const audioContainer = document.querySelector(`.audio-container[data-file="${currentFileName}"]`);
    if (audioContainer && !audioContainer.querySelector('input[type="text"]')) {
        // Préremplir la zone de texte avec le nom actuel
        const currentName = currentFileName.replace(/\.mp3$/, '').replace(/[_-]/g, ' ');
        const newFileNameInput = document.createElement('input');
        newFileNameInput.type = 'text';
        newFileNameInput.value = currentName;
        newFileNameInput.classList.add('form-control');
        newFileNameInput.placeholder = "Entrez le nouveau nom du fichier";
        // Créer le bouton de confirmation
        const confirmButton = document.createElement('button');
        confirmButton.classList.add('btn', 'btn-success');
        confirmButton.textContent = 'Confirmer';
        // Créer le bouton d'annulation
        const cancelButton = document.createElement('button');
        cancelButton.classList.add('btn', 'btn-danger');
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
                    if (fileNameDisplay) {
                        fileNameDisplay.textContent = newFileName.replace(/\.mp3$/, '').replace(/[_-]/g, ' ');
                    }
                    audioContainer.setAttribute('data-file', newFileName);
                    refreshAudioList();
                }
                else {
                    console.error('Erreur lors de la modification du nom du fichier');
                }
            })
                .catch(error => console.error('Erreur:', error));
            container.remove();
        });
        // Gérer l'événement de clic sur le bouton d'annulation
        cancelButton.addEventListener('click', () => {
            container.remove();
        });
    }
    else if (!audioContainer) {
        console.error(`Aucun élément audio correspondant à ${currentFileName} n'a été trouvé.`);
    }
}
/**
 * Supprime un fichier audio après confirmation.
 * @param fileName Le nom du fichier audio à supprimer.
 * @returns aucune valeur n'est retourné
 */
function deleteSong(fileName) {
    const audioContainer = document.querySelector(`.audio-container[data-file="${fileName}"]`);
    if (audioContainer && !audioContainer.querySelector('.confirm-container')) {
        const confirmContainer = document.createElement('div');
        confirmContainer.classList.add('confirm-container');
        const confirmMessage = document.createElement('p');
        confirmMessage.textContent = `Êtes-vous sûr de vouloir supprimer le son "${fileName.replace(/\.mp3$/, '').replace(/[_-]/g, ' ')}" ?`;
        confirmContainer.appendChild(confirmMessage);
        const confirmButton = document.createElement('button');
        confirmButton.textContent = 'Confirmer';
        confirmButton.classList.add('btn', 'btn-success'); // Classes pour le bouton de confirmation
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Annuler';
        cancelButton.classList.add('btn', 'btn-danger');
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
                    showNotification1(`Fichier ${fileName} supprimé`);
                }
                else {
                    console.error('Erreur lors de la suppression du fichier');
                    showNotification1('Erreur lors de la suppression du fichier');
                }
            })
                .catch(error => console.error('Erreur:', error));
        });
        cancelButton.addEventListener('click', () => {
            confirmContainer.remove();
        });
    }
    else if (!audioContainer) {
        console.error(`Aucun élément audio correspondant à ${fileName} n'a été trouvé.`);
    }
}
