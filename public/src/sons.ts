/**
 * Configure le formulaire pour le téléchargement de fichiers audio.
 *
 * Cette fonction prépare le formulaire pour télécharger des fichiers audio. 
 * Elle définit un gestionnaire d'événements pour le formulaire et gère l'envoi du fichier audio sélectionné au serveur.
 * @returns aucune valeur n'est retourné
 */

// Assurez-vous que les catégories sont correctement typées.
interface Category {
    name: string;
}

let categories: Category[] = []; // Initialisez les catégories, vous devrez les charger depuis le serveur.

function setupUploadAudioForm(): void {
    const uploadAudioForm = document.getElementById('uploadAudioForm') as HTMLFormElement | null;
    const audioFileInput = document.getElementById('audioFile') as HTMLInputElement | null;

    if (uploadAudioForm && audioFileInput) {
        uploadAudioForm.addEventListener('submit', function (event: Event): void {
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
                    } else {
                        throw new Error('Erreur lors du téléchargement du fichier');
                    }
                })
                .catch(error => console.error('Erreur:', error));
            } else {
                console.error('Aucun fichier n\'a été sélectionné.');
            }
        });
    } else {
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
function refreshAudioList(): void {
    const audioListContainer = document.getElementById('audioList') as HTMLDivElement | null;
    if (audioListContainer) {
        audioListContainer.innerHTML = ''; // Vider la liste existante
        displayAudioList(); // Recharger la liste
    }
}

/**
 * Affiche la liste des fichiers audio.
 * @returns aucune valeur n'est retourné
 */
function displayAudioList(): void {
    // D'abord, récupérez les catégories disponibles
    fetch('/categories')
    .then(response => response.json())
    .then((categories) => {
        // Ensuite, récupérez la liste des fichiers audio
        fetch('/list-audios')
        .then(response => response.json())
        .then((audioFiles: string[]) => {
            const audioListContainer = document.getElementById('audioList') as HTMLDivElement | null;
            if (audioListContainer) {
                audioListContainer.innerHTML = ''; // Vider la liste existante
                audioFiles.forEach((file: string) => {
                    const audioContainer = document.createElement('div');
                    audioContainer.classList.add('audio-container');
                    audioContainer.setAttribute('data-file', file);

                    const fileNameParagraph = document.createElement('p');
                    fileNameParagraph.textContent = file.replace(/\.mp3$/, '').replace(/[_-]/g, ' ');

                    const audioElement = document.createElement('audio');
                    audioElement.setAttribute('controls', '');
                    audioElement.src = `/uploads/${file}`;

                    const modifyButton = document.createElement('button');
                    modifyButton.textContent = 'Modifier';
                    modifyButton.classList.add('btn', 'btn-primary');
                    modifyButton.onclick = () => modifyName(file);

                    const deleteButton = document.createElement('button');
                    deleteButton.textContent = 'Supprimer';
                    deleteButton.classList.add('btn', 'btn-danger');
                    deleteButton.onclick = () => deleteSong(file);

                    const analyseButton = document.createElement('button');
                    analyseButton.textContent = 'Analyser';
                    analyseButton.classList.add('btn', 'btn-info');
                    analyseButton.onclick = () => {
                        const audioUrl = `/uploads/${file}`;
                        fetch(audioUrl)
                        .then(response => response.blob())
                        .then(blob => analyseAudio(blob, audioContainer)); // Utilisation correcte du Blob
                    };

                    // Menu déroulant pour les catégories
                    const categorySelect = document.createElement('select');
                    categories.forEach((category: Category) => {
                        const option = document.createElement('option');
                        option.value = category.name;
                        option.textContent = category.name;
                        categorySelect.appendChild(option);
                    });

                    // Bouton pour assigner la catégorie
                    const assignCategoryButton = document.createElement('button');
                    assignCategoryButton.textContent = 'Assigner Catégorie';
                    assignCategoryButton.classList.add('btn', 'btn-secondary');
                    assignCategoryButton.onclick = () => assignCategoryToFile(file, categorySelect.value);


                    audioContainer.appendChild(fileNameParagraph);
                    audioContainer.appendChild(audioElement);
                    audioContainer.appendChild(modifyButton);
                    audioContainer.appendChild(deleteButton);
                    audioContainer.appendChild(analyseButton);
                    audioContainer.appendChild(categorySelect);
                    audioContainer.appendChild(assignCategoryButton);

                    audioListContainer.appendChild(audioContainer);
                });
            }
        })
        .catch(error => console.error('Erreur lors de la récupération des fichiers audio:', error));
    })
    .catch(error => console.error('Erreur lors de la récupération des catégories:', error));
}



/**
 * Modifie le nom d'un fichier audio.
 * @param currentFileName Le nom actuel du fichier audio.
 * @returns aucune valeur n'est retourné
 */
function modifyName(currentFileName: string): void {
    const audioContainer = document.querySelector(`.audio-container[data-file="${currentFileName}"]`) as HTMLDivElement | null;

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
                } else {
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
    } else if (!audioContainer) {
        console.error(`Aucun élément audio correspondant à ${currentFileName} n'a été trouvé.`);
    }
}

/**
 * Supprime un fichier audio après confirmation.
 * @param fileName Le nom du fichier audio à supprimer.
 * @returns aucune valeur n'est retourné
 */
function deleteSong(fileName: string): void {
    const audioContainer = document.querySelector(`.audio-container[data-file="${fileName}"]`) as HTMLDivElement | null;

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
                } else {
                    console.error('Erreur lors de la suppression du fichier');
                }
            })
            .catch(error => console.error('Erreur:', error));
        });

        cancelButton.addEventListener('click', () => {
            confirmContainer.remove();
        });
    } else if (!audioContainer) {
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
async function setupAudioAnalysis(audioFile: Blob): Promise<AudioBuffer> {
    const audioContext = new AudioContext();
    const arrayBuffer = await audioFile.arrayBuffer();
    return audioContext.decodeAudioData(arrayBuffer);
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
async function analyseAudio(audioFile: Blob, audioContainer: HTMLDivElement): Promise<void> {
    const audioContext = new AudioContext();
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
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
        } else {
            requestAnimationFrame(checkAudioProcessing);
        }
    };

    requestAnimationFrame(checkAudioProcessing);
}




async function loadAndDisplayCategories(): Promise<void> {
    const categoriesListDiv = document.getElementById('categoriesList') as HTMLDivElement; // Assertion de type pour éviter les erreurs de nullabilité.
    if (!categoriesListDiv) return;

    const response = await fetch('/categories');
    const categories: Category[] = await response.json(); // Assurez-vous que la réponse correspond à l'interface Category[].

    categoriesListDiv.innerHTML = '';
    categories.forEach((category: Category) => {
        const categoryDiv = document.createElement('div');
        categoryDiv.textContent = category.name;

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Supprimer';
        deleteBtn.onclick = () => deleteCategory(category.name);

        categoryDiv.appendChild(deleteBtn);
        categoriesListDiv.appendChild(categoryDiv);
    });
}

async function addCategory(): Promise<void> {
    const newCategoryNameInput = document.getElementById('newCategoryName') as HTMLInputElement | null;
    if (!newCategoryNameInput) return;

    const newCategoryName = newCategoryNameInput.value;
    const response = await fetch('/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName })
    });

    if (response.ok) {
        await loadAndDisplayCategories(); // Recharger la liste des catégories
    } else {
        alert('Erreur lors de l\'ajout de la catégorie');
    }
}

async function deleteCategory(categoryName: string): Promise<void> {
    const response = await fetch(`/categories/${categoryName}`, { method: 'DELETE' });
    if (response.ok) {
        await loadAndDisplayCategories(); // Recharger la liste des catégories
    } else {
        alert('Erreur lors de la suppression de la catégorie');
    }
}

async function assignCategoryToFile(fileName: string, categoryName: string) {
    try {
        const response = await fetch('/assign-category', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName, categoryName })
        });

        if (!response.ok) {
            throw new Error('Erreur lors de l\'affectation de la catégorie');
        }

        console.log(`Catégorie ${categoryName} affectée à ${fileName}`);
        refreshAudioList(); // Optionnel: Rafraîchir la liste pour refléter les changements
    } catch (error) {
        console.error('Erreur:', error);
    }
}





window.onload = async (): Promise<void> => {
    await displayAudioList();
    await loadAndDisplayCategories();
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    if (addCategoryBtn) {
        addCategoryBtn.onclick = addCategory;
    }
}