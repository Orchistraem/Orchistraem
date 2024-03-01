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
 * Configure le formulaire pour le téléchargement de fichiers audio.
 *
 * Cette fonction prépare le formulaire pour télécharger des fichiers audio.
 * Elle définit un gestionnaire d'événements pour le formulaire et gère l'envoi du fichier audio sélectionné au serveur.
 * @returns aucune valeur n'est retourné
 */
function setupUploadAudioForm() {
    const uploadAudioForm = document.getElementById('uploadAudioForm');
    const audioFileInput = document.getElementById('audioFile');
    const categorySelect = document.getElementById('categorySelect'); // Sélecteur de catégorie ajouté au formulaire HTML

    if (uploadAudioForm && audioFileInput && categorySelect) {
        uploadAudioForm.addEventListener('submit', function (event) {
            event.preventDefault();
            const formData = new FormData();
            const audioFile = audioFileInput.files ? audioFileInput.files[0] : null;
            const category = categorySelect.value; // Récupère la catégorie sélectionnée
            if (audioFile && category) {
                formData.append('audioFile', audioFile);
                formData.append('category', category); // Ajoute la catégorie au formData
                fetch('/upload-audio', {
                    method: 'POST',
                    body: formData
                })
                .then(response => {
                    if (response.ok) {
                        console.log('Fichier téléchargé avec succès');
                        refreshAudioList(); // Rafraîchir la liste après le téléchargement réussi
                    } else {
                        throw new Error('Erreur lors du téléchargement du fichier');
                    }
                })
                .catch(error => console.error('Erreur:', error));
            } else {
                console.error('Aucun fichier ou catégorie n\'a été sélectionné.');
            }
        });
    } else {
        console.error('Élément(s) de formulaire introuvable(s).');
    }
}

function setupCategoryForm() {
    const categoryForm = document.getElementById('categoryForm');
    const categoryNameInput = document.getElementById('categoryName');

    if (categoryForm && categoryNameInput) {
        categoryForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const categoryName = categoryNameInput.value;
            addCategory(categoryName);
        });
    }
}

function addCategory(categoryName) {
    fetch('/add-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryName })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Catégorie ajoutée avec succès');
            fetchCategories(); // Recharge les catégories après l'ajout
        } else {
            console.error('Erreur lors de l\'ajout de la catégorie');
        }
    })
    .catch(error => console.error('Erreur:', error));
}
function fetchCategories() {
    fetch('/get-categories')
    .then(response => response.json())
    .then(categories => {
        const categorySelect = document.getElementById('categorySelect');
        categorySelect.innerHTML = ''; // Vide le sélecteur
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id; // Suppose que chaque catégorie a un ID unique
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    })
    .catch(error => console.error('Erreur lors de la récupération des catégories:', error));
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
function displayAudioList() {
    fetch('/list-audios')
        .then(response => response.json())
        .then((audioFiles) => {
        const audioListContainer = document.getElementById('audioList');
        if (audioListContainer) {
            audioFiles.forEach((file) => {
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
                modifyButton.classList.add('btn', 'btn-primary');
                modifyButton.addEventListener('click', () => {
                    modifyName(file);
                });
                // Créer un bouton supprimer à côté du nom du fichier
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Supprimer';
                deleteButton.classList.add('btn', 'btn-danger');
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
                //Ajouter le bouton d'analyse des sons
                const analyseButton = document.createElement('button');
                analyseButton.textContent = 'Analyser';
                analyseButton.classList.add('btn', 'btn-info');
                analyseButton.addEventListener('click', () => {
                    const audioUrl = `/uploads/${file}`; // URL du fichier audio
                    fetch(audioUrl)
                        .then(response => response.blob())
                        .then(blob => analyseAudio(blob, audioContainer));
                });
                audioContainer.appendChild(analyseButton);
            });
        }
    })
        .catch(error => console.error('Erreur:', error));
}
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
                }
                else {
                    console.error('Erreur lors de la suppression du fichier');
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
function setupAudioAnalysis(audioFile) {
    return __awaiter(this, void 0, void 0, function* () {
        const audioContext = new AudioContext();
        const arrayBuffer = yield audioFile.arrayBuffer();
        return audioContext.decodeAudioData(arrayBuffer);
    });
}
function analyseAudio(audioFile, audioContainer) {
    return __awaiter(this, void 0, void 0, function* () {
        const audioContext = new AudioContext();
        const arrayBuffer = yield audioFile.arrayBuffer();
        const audioBuffer = yield audioContext.decodeAudioData(arrayBuffer);
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(analyser);
        analyser.fftSize = 2048;
        const bufferLength = analyser.frequencyBinCount;
        const dataArrayFrequency = new Uint8Array(bufferLength);
        const dataArrayTime = new Uint8Array(bufferLength);
        source.connect(audioContext.destination);
        source.start(0);
        const checkAudioProcessing = () => {
            analyser.getByteFrequencyData(dataArrayFrequency);
            let maxIndex = 0;
            let maxValue = 0;
            for (let i = 0; i < bufferLength; i++) {
                if (dataArrayFrequency[i] > maxValue) {
                    maxValue = dataArrayFrequency[i];
                    maxIndex = i;
                }
            }
            const dominantFrequency = maxIndex * audioContext.sampleRate / analyser.fftSize;
            if (dominantFrequency > 0) {
                let frequencyText = audioContainer.querySelector("#frequencyText");
                if (!frequencyText) {
                    frequencyText = document.createElement("p");
                    frequencyText.id = "frequencyText";
                    audioContainer.appendChild(frequencyText);
                }
                frequencyText.innerHTML = "Fréquence dominante: " + dominantFrequency.toFixed(2) + "Hz";
                analyser.getByteTimeDomainData(dataArrayTime);
                let sumSquares = 0.0;
                for (let i = 0; i < bufferLength; i++) {
                    let normSample = (dataArrayTime[i] / 128.0) - 1.0; // Normaliser et centrer à 0
                    sumSquares += normSample * normSample;
                }
                let rms = Math.sqrt(sumSquares / bufferLength);
                let volumeDb = 20 * Math.log10(rms);
                let intensityText = audioContainer.querySelector("#intensityText");
                if (!intensityText) {
                    intensityText = document.createElement("p");
                    intensityText.id = "intensityText";
                    audioContainer.appendChild(intensityText);
                }
                intensityText.innerHTML = "Intensité: " + volumeDb.toFixed(2) + "dB";
                source.stop();
            }
            else {
                requestAnimationFrame(checkAudioProcessing);
            }
        };
        requestAnimationFrame(checkAudioProcessing);
    });
}
window.onload = function () {
    setupUploadAudioForm();
    setupCategoryForm(); // Initialise le formulaire de catégorie lors du chargement de la page
    fetchCategories(); // Charge les catégories existantes pour les afficher dans le sélecteur
    displayAudioList(); // Affiche la liste des fichiers audio existants
};
