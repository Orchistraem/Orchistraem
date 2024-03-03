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
                    .then(response => {
                    if (response.ok) {
                        console.log('Fichier téléchargé avec succès');
                        refreshAudioList(); // Rafraîchir la liste après le téléchargement réussi
                    }
                    else {
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
                // Ajouter le bouton d'analyse des sons
                const analyseButton = document.createElement('button');
                analyseButton.textContent = 'Analyser';
                analyseButton.classList.add('btn', 'btn-info');
                analyseButton.addEventListener('click', () => {
                    const audioUrl = `/uploads/${file}`; // URL du fichier audio
                    fetch(audioUrl)
                        .then(response => response.blob())
                        .then(blob => {
                        drawSonogram(blob, audioContainer);
                    });
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
/**
 * Prépare un fichier audio pour l'analyse en le convertissant en `AudioBuffer`.
 *
 * Cette fonction charge un fichier audio à partir d'un objet `Blob` et utilise l'API Web Audio
 * pour le décodage en `AudioBuffer`, permettant une analyse audio ultérieure.
 *
 * @param audioFile - Le fichier audio sous forme de `Blob` à analyser.
 * @returns Promesse résolue avec un `AudioBuffer` contenant les données audio décodées.
 */
function setupAudioAnalysis(audioFile) {
    return __awaiter(this, void 0, void 0, function* () {
        const audioContext = new AudioContext();
        const arrayBuffer = yield audioFile.arrayBuffer();
        return audioContext.decodeAudioData(arrayBuffer);
    });
}
/**
 * Analyse le contenu audio d'un fichier et met à jour l'interface utilisateur avec la fréquence dominante et l'intensité.
 *
 * Cette fonction utilise l'API Web Audio pour analyser le contenu audio d'un fichier. Elle détermine la fréquence dominante
 * et l'intensité du signal audio et met à jour les éléments correspondants dans un conteneur HTML spécifié.
 *
 * @param audioFile - Le fichier audio sous forme de `Blob` qui sera analysé.
 * @param audioContainer - Le conteneur HTML (`HTMLDivElement`) où les résultats de l'analyse seront affichés.
 * @returns Promesse résolue lorsque l'analyse est terminée et que l'interface utilisateur a été mise à jour.
 */
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
/**
 * Dessine un sonogramme à partir d'un fichier audio Blob.
 *
 * @param audioFile Le Blob du fichier audio à analyser.
 * @param audioContainer Le conteneur HTML où le sonogramme sera affiché.
 */
function drawSonogram(audioFile, audioContainer) {
    return __awaiter(this, void 0, void 0, function* () {
        const audioContext = new (window.AudioContext || window.AudioContext)();
        const arrayBuffer = yield audioFile.arrayBuffer();
        audioContext.decodeAudioData(arrayBuffer, (audioBuffer) => {
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 2048;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            source.start();
            // Vérifier si un canvas existe déjà
            let canvas = audioContainer.querySelector('#sonogramCanvas');
            if (!canvas) {
                // S'il n'existe pas, en créer un nouveau
                canvas = document.createElement('canvas');
                canvas.id = 'sonogramCanvas';
                canvas.width = 600; // Largeur du canvas en pixels
                canvas.height = 300; // Hauteur du canvas en pixels
                audioContainer.appendChild(canvas);
            }
            const ctx = canvas.getContext('2d');
            if (!ctx)
                return;
            // Initialisation des variables pour le dessin
            let x = 0;
            const sliceWidth = canvas.width * 1.0 / bufferLength;
            function draw() {
                if (ctx && canvas) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    drawLegends(canvas);
                    requestAnimationFrame(draw);
                    x = 0;
                    analyser.getByteFrequencyData(dataArray);
                    ctx.fillStyle = 'rgb(0, 0, 0)';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    for (let i = 0; i < bufferLength; i++) {
                        const barHeight = dataArray[i];
                        const r = barHeight + (25 * (i / bufferLength));
                        const g = 250 * (i / bufferLength);
                        const b = 50;
                        ctx.fillStyle = `rgb(${r},${g},${b})`;
                        ctx.fillRect(x, canvas.height - barHeight, sliceWidth, barHeight);
                        x += sliceWidth + 1;
                    }
                }
            }
            draw();
        }, (error) => console.error('Erreur de décodage audio', error));
    });
}
function drawLegends(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Impossible de récupérer le contexte 2D du canvas.');
        return;
    }
    // Effacer un espace pour les légendes
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Dimensions et marges
    const width = canvas.width;
    const height = canvas.height;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    // Échelles pour les légendes
    const maxFrequency = 20000; // 20kHz
    const dBRange = [-100, 0]; // plage de décibels
    // Définir la couleur du texte pour le contraste sur fond noir
    ctx.fillStyle = 'white'; // Couleur claire pour le texte
    // Fréquences (verticale)
    ctx.font = '12px Arial';
    ctx.fillText('Fréquence (Hz)', margin.left, margin.top - 5);
    const freqStep = maxFrequency / 5; // 5 étapes sur l'échelle de fréquence
    for (let i = 0; i <= 5; i++) {
        const freq = (i * freqStep) / 1000; // Conversion en kHz
        ctx.fillText(`${freq}kHz`, 5, margin.top + (i * (height - margin.top - margin.bottom) / 5));
    }
    // Niveaux de décibels (couleur)
    const gradient = ctx.createLinearGradient(width - margin.right + 10, margin.top, width - margin.right + 10, height - margin.bottom);
    gradient.addColorStop(0, 'rgb(255, 0, 0)'); // Plus intense
    gradient.addColorStop(1, 'rgb(0, 0, 0)'); // Moins intense
    ctx.fillStyle = gradient;
    ctx.fillRect(width - margin.right + 10, margin.top, 10, height - margin.top - margin.bottom);
    // Étiquettes de dB
    ctx.fillStyle = 'white'; // Assurer que la couleur du texte est bien visible
    const dBStep = (dBRange[1] - dBRange[0]) / 5; // 5 étapes sur l'échelle dB
    for (let i = 0; i <= 5; i++) {
        const dB = dBRange[0] + (i * dBStep);
        ctx.fillText(`${dB}dB`, width - margin.right + 25, margin.top + (i * (height - margin.top - margin.bottom) / 5));
    }
}
window.onload = function () {
    displayAudioList();
    setupUploadAudioForm();
};
