/**
 * Supprime un élément canvas spécifique de son conteneur.
 *
 * Cette fonction recherche et supprime un élément canvas identifié par son ID dans un conteneur HTML donné.
 * Elle est utilisée pour nettoyer l'interface utilisateur en retirant des éléments graphiques qui ne sont plus nécessaires,
 * comme dans le cas où un affichage sonogramme n'est plus requis. La suppression est conditionnelle à la présence effective
 * du canvas dans le conteneur.
 *
 * @param audioContainer - Le conteneur HTML (div) dans lequel le canvas est potentiellement inséré.
 */
function closeCanvas(audioContainer: HTMLDivElement) {
    const canvas = audioContainer.querySelector('#sonogramCanvas') as HTMLCanvasElement;
    if (canvas) {
        canvas.remove();
    }
    const buttons = audioContainer.querySelectorAll('button');
    buttons.forEach(button => button.classList.remove('hidden')); // Afficher les boutons
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
 * Cache tous les boutons liés aux sons dans un conteneur donné.
 *
 * @param {HTMLDivElement} audioContainer - Le conteneur contenant les boutons à cacher.
 */
function hideButtons(audioContainer: HTMLDivElement): void {
    const buttons = audioContainer.querySelectorAll('button:not(#closeButtonAnalyse)');
    buttons.forEach((button) => {
        (button as HTMLButtonElement).classList.add('hidden');
    });
}

/**
 * Affiche tous les boutons liés aux sons dans un conteneur donné.
 *
 * @param {HTMLDivElement} audioContainer - Le conteneur contenant les boutons à afficher.
 */
function showButtons(audioContainer: HTMLDivElement): void {
    const buttons = audioContainer.querySelectorAll('button.hidden');
    buttons.forEach((button) => {
        (button as HTMLButtonElement).classList.remove('hidden');
    });
}

/**
 * Dessine un sonogramme à partir d'un fichier audio et l'affiche dans un élément canvas.
 *
 * Cette fonction crée un sonogramme en analysant les données audio à l'aide d'un contexte AudioContext et
 * d'un analyseur de fréquence. Elle génère un affichage graphique des fréquences et des intensités détectées
 * dans le fichier audio et affiche ce sonogramme dans un élément canvas. Des légendes sont également dessinées
 * pour les fréquences et les niveaux de décibels.
 *
 * @param audioFile - Le fichier audio sous forme de Blob à analyser.
 * @param audioContainer - Le conteneur HTML (div) qui hébergera l'élément canvas.
 * @param sonogramCanvas - L'élément canvas existant ou un nouvel élément créé pour le sonogramme.
 * @returns Une promesse qui se résout lorsque le sonogramme a commencé à être dessiné. La fonction continue de dessiner
 *          le sonogramme en temps réel jusqu'à ce que la source audio soit épuisée.
 */
async function drawSonogram(audioFile: Blob, audioContainer: HTMLDivElement, sonogramCanvas: HTMLCanvasElement | null): Promise<void> {
    const audioContext = new AudioContext();
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const canvas = sonogramCanvas || document.createElement('canvas');
    canvas.id = 'sonogramCanvas';
    canvas.width = 850; // Inclut l'espace pour les légendes
    canvas.height = 350; // Inclut l'espace pour les légendes

    const animationHeight = 300; // Hauteur dédiée à l'animation
    const legendSpaceBottom = 50; // Espace réservé pour les légendes horizontales
    const legendSpaceSide = 150; // Espace réservé pour les légendes verticales
    audioContainer.appendChild(canvas);

    hideButtons(audioContainer);

    // Ajouter un bouton "Fermer" s'il n'existe pas déjà
    let closeButton = audioContainer.querySelector('#closeButtonAnalyse') as HTMLButtonElement | null;
    if (!closeButton) {
        closeButton = document.createElement('button');
        closeButton.textContent = 'Fermer';
        closeButton.classList.add('btn', 'btn-secondary');
        closeButton.id = 'closeButtonAnalyse';
        closeButton.addEventListener('click', () => {
            closeCanvas(audioContainer);
            showButtons(audioContainer);
            if (closeButton) closeButton.remove();
        });
        audioContainer.appendChild(closeButton);
    }

    const canvasContext = canvas.getContext('2d');
    if (!canvasContext) {
        console.error('Impossible de récupérer le contexte du canvas');
        return;
    }

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    source.start(0);

    function drawLegends(ctx: CanvasRenderingContext2D, width: number, sampleRate: number) {
        const specificFrequencies = [125, 250, 500, 1000, 1500, 2000, 3000, 4000, 8000];
        const maxFreq = sampleRate / 2;
        const logMax = Math.log10(maxFreq);
        const logMin = Math.log10(specificFrequencies[0]);
        ctx.font = '12px Arial';
        ctx.fillStyle = 'white';

        const bottomOffset = 20;
        specificFrequencies.forEach(freq => {
            const logFreq = Math.log10(freq);
            const x = ((logFreq - logMin) / (logMax - logMin)) * (width - legendSpaceSide);
            ctx.fillText(`${freq}`, x, canvas.height - bottomOffset);
        });
    }

    function drawDbLegends(ctx: CanvasRenderingContext2D, width: number, height: number, legendSpaceBottom: number, legendSpaceSide: number) {
        const dbValues = Array.from({ length: 13 }, (_, i) => i * 10);
        ctx.font = '12px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        const offsetX = 20;

        const maxLegendWidth = legendSpaceSide - offsetX;
        const effectiveHeight = height - legendSpaceBottom;

        dbValues.forEach((db, index) => {
            const y = (1 - ((db - 0) / (120 - 0))) * effectiveHeight;
            ctx.fillText(`${db} dB`, width - maxLegendWidth, y + (legendSpaceBottom / 4));
        });
    }

    const draw = () => {
        requestAnimationFrame(draw);

        canvasContext.clearRect(0, 0, canvas.width, canvas.height);

        analyser.getByteFrequencyData(dataArray);
        const animationWidth = canvas.width - legendSpaceSide;

        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i];
            if (x < animationWidth) {
                canvasContext.fillStyle = `rgb(${barHeight + 100},50,50)`;
                canvasContext.fillRect(x, canvas.height - 50 - barHeight / 2, barWidth, barHeight / 2);
            }
            x += barWidth + 1;
        }

        drawLegends(canvasContext, canvas.width, audioBuffer.sampleRate);
        drawDbLegends(canvasContext, canvas.width, canvas.height, legendSpaceBottom, legendSpaceSide);
    };

    draw();
}












