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
                    }else if (response.status === 409) {
                        alert('Un fichier portant le même nom existe déjà. Veuillez renommer votre fichier et réessayer.');
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
function displayAudioList() {
    // Récupérez les catégories disponibles
    fetch('/categories')
      .then(response => response.json())
      .then(categories => {
        // Récupérez ensuite les métadonnées audio pour connaître les catégories assignées à chaque fichier
        fetch('/audio-metadata')
          .then(response => response.json())
          .then(audioMetadata => {
            // Ensuite, récupérez la liste des fichiers audio
            fetch('/list-audios')
              .then(response => response.json())
              .then(audioFiles => {
                const audioListContainer = document.getElementById('audioList');
                if (audioListContainer) {
                  audioListContainer.innerHTML = ''; // Vider la liste existante
                  
                  audioFiles.forEach((file : any) => {
                    const audioContainer = document.createElement('div');
                    audioContainer.classList.add('audio-container');
                    audioContainer.setAttribute('data-file', file);
                    
                    const fileNameParagraph = document.createElement('p');
                    fileNameParagraph.textContent = file.replace(/\.(mp3|wav)$/, '').replace(/[_-]/g, ' ');
                    audioContainer.appendChild(fileNameParagraph);
  
                    const fileMetadata = audioMetadata.find((meta : any) => meta.name === file);
                    const fileCategory = fileMetadata ? fileMetadata.category : 'Non catégorisé';
                    const fileCategoryParagraph = document.createElement('p');
                    fileCategoryParagraph.textContent = `Catégorie: ${fileCategory}`;
                    audioContainer.appendChild(fileCategoryParagraph);
  
                    const audioElement = document.createElement('audio');
                    audioElement.setAttribute('controls', '');
                    audioElement.src = `/uploads/${file}`;
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

                    // Bouton Supprimer
                    const deleteButton = document.createElement('button');
                    deleteButton.textContent = 'Supprimer';
                    deleteButton.classList.add('btn', 'btn-danger');
                    deleteButton.onclick = () => deleteSong(file);
                    editSon.appendChild(deleteButton);

                    // Ajouter le bouton d'analyse des sons
                    const analyseButton = document.createElement('button');
                    analyseButton.textContent = 'Analyser';
                    analyseButton.classList.add('btn', 'btn-info');
                    analyseButton.addEventListener('click', () => {
                        let closeButton = audioContainer.querySelector('#closeButtonAnalyse');
                        if (!closeButton) {
                            closeButton = document.createElement('button');
                            closeButton.textContent = 'Fermer';
                            closeButton.classList.add('btn', 'btn-secondary');
                            closeButton.id = 'closeButtonAnalyse';
                            closeButton.addEventListener('click', () => {
                                closeCanvas(audioContainer);
                                if(closeButton)
                                closeButton.remove();
                            });
                            editSon.appendChild(closeButton);
                        }
                        
                        const audioUrl = `/uploads/${file}`; // URL du fichier audio
                        fetch(audioUrl)
                            .then(response => response.blob())
                            .then(blob => {
                                drawSonogram(blob, editSon);
                            });
                    });

                    editSon.appendChild(analyseButton);

                    // Ajouter le div "editSon" au conteneur principal
                    audioContainer.appendChild(editSon);

                    // Créer le div "categSon"
                    const categSon = document.createElement('div');
                    categSon.classList.add('categSon');
  
                    // Menu déroulant pour les catégories
                    const categorySelect = document.createElement('select');
                    categorySelect.classList.add('categSelect');
                    categories.forEach((category : any) => {
                      const option = document.createElement('option');
                      option.value = category.name;
                      option.textContent = category.name;
                      categorySelect.appendChild(option);
                    });
                    categorySelect.value = fileCategory; // Sélectionner la catégorie actuelle
                    categSon.appendChild(categorySelect);
  
                    // Bouton pour assigner la catégorie
                    const assignCategoryButton = document.createElement('button');
                    assignCategoryButton.textContent = 'Assigner Catégorie';
                    assignCategoryButton.classList.add('btn', 'btn-secondary');
                    assignCategoryButton.onclick = () => {
                      assignCategoryToFile(file, categorySelect.value);
                      fileCategoryParagraph.textContent = `Catégorie: ${categorySelect.value}`; // Mise à jour immédiate de l'affichage de la catégorie
                    };
                    categSon.appendChild(assignCategoryButton);
                    
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
  

function closeCanvas(audioContainer: HTMLDivElement) {
    const canvas = audioContainer.querySelector('#sonogramCanvas') as HTMLCanvasElement;
    if (canvas) {
        canvas.remove(); 
    }
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


/**
 * Dessine un sonogramme à partir d'un fichier audio Blob.
 * 
 * @param audioFile Le Blob du fichier audio à analyser.
 * @param audioContainer Le conteneur HTML où le sonogramme sera affiché.
 */
async function drawSonogram(audioFile: Blob, audioContainer: HTMLDivElement): Promise<void> {
    const audioContext = new (window.AudioContext || window.AudioContext)();
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    source.start();

    let canvas = audioContainer.querySelector('#sonogramCanvas') as HTMLCanvasElement;
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'sonogramCanvas';
        canvas.width = 600;
        canvas.height = 300;
        canvas.style.backgroundColor = "rgb(0, 0, 0)";
        audioContainer.appendChild(canvas);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Impossible de récupérer le contexte 2D du canvas.');
        return;
    }

    // Dessinez les légendes une seule fois si elles ne changent pas
    drawLegends(canvas);

    const sliceWidth = canvas.width / bufferLength;
    let x = 0;

    function draw() {
        requestAnimationFrame(draw);
        
        analyser.getByteFrequencyData(dataArray);

        if(ctx){

            ctx.fillStyle = 'rgb(0, 0, 0)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            drawLegends(canvas);


            for (let i = 0; i < bufferLength; i++) {
                const barHeight = dataArray[i];
                ctx.fillStyle = `rgb(${barHeight + 100},50,50)`;
                ctx.fillRect(x, canvas.height - barHeight / 2, sliceWidth, barHeight / 2);
                x += sliceWidth + 1;
            }

        }


        // Réinitialiser x pour la prochaine frame
        x = 0;
    }

    // Commencez à dessiner le sonogramme
    draw();
}


/**
 * Dessine les légendes sur le canvas.
 * 
 * @param ctx Le contexte du canvas sur lequel dessiner.
 */
function drawLegends(canvas: HTMLCanvasElement): void {
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
    const dBRange = [-100, 50]; // plage de décibels

    // Définir la couleur du texte pour le contraste sur fond noir
    ctx.fillStyle = 'white'; // Couleur claire pour le texte

    // Fréquences (verticale)
    ctx.font = '12px Arial';
    ctx.fillText('Fréquence (Hz)', margin.left, height - margin.bottom + 15); // Modifier la position du texte de l'axe des fréquences
    const freqStep = maxFrequency / 5; // 5 étapes sur l'échelle de fréquence
    for (let i = 0; i <= 5; i++) {
        const freq = maxFrequency - (i * freqStep);
        ctx.fillText(`${freq / 1000}kHz`, 5, margin.top + (i * (height - margin.top - margin.bottom) / 5));
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
        ctx.fillText(`${dB}dB`, width - margin.right - 25, margin.top + (i * (height - margin.top - margin.bottom) / 5));
    }
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
        deleteBtn.classList.add('btn', 'btn-danger');
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
        const url = `http://localhost:3000/assign-category`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName, categoryName })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur lors de l'affectation de la catégorie : ${errorText}`);
        }

        console.log(`Catégorie ${categoryName} affectée à ${fileName}`);
        const categoryParagraph = document.getElementById(`category-${fileName}`) as HTMLParagraphElement;
        if (categoryParagraph) {
            categoryParagraph.textContent = `Catégorie : ${categoryName}`; // Mise à jour de la catégorie affichée sans recharger toute la liste
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
}



window.onload = async (): Promise<void> => {
    await displayAudioList();
    await loadAndDisplayCategories();
    setupUploadAudioForm()
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    if (addCategoryBtn) {
        addCategoryBtn.onclick = addCategory;
    }
}