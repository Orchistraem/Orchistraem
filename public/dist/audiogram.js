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
// Déclaration des instances de Chart.js pour les audiogrammes de chaque oreille.
let audiogramChartLeft = null;
let audiogramChartRight = null;
let audiogramChampLibre = null;
// Mode de suppression désactivé par défaut
let isDeletionModeActive = false;
// Mode de recommandation desactivé par défaut
let isRecommandationMode = false;
let toggleRecommandationMode = document.getElementById('findSoundsButton');
// Recupération du bouton de suppression
let toggleDeletionMode = document.getElementById('toggleDeletionMode');
/**
 * Affiche une notification à l'utilisateur.
 *
 * Cette fonction affiche un message temporaire à l'écran en utilisant un élément HTML spécifié par son ID.
 * Le message disparaîtra automatiquement après un délai spécifié.
 *
 * @param message - Le message à afficher dans la notification.
 * @param duration - La durée pendant laquelle la notification reste visible en millisecondes (1500 par défaut).
 */
function showNotification(message, duration = 1500) {
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
const gomme = document.getElementById('cursorGomme');
// Ajout de l'écouteur
if (toggleDeletionMode) {
    toggleDeletionMode.addEventListener('click', function () {
        isDeletionModeActive = !isDeletionModeActive;
        if (isDeletionModeActive) {
            if (toggleRecommandationMode) {
                toggleRecommandationMode.disabled = true;
                toggleRecommandationMode.classList.add("disabled");
            }
        }
        else {
            toggleRecommandationMode.disabled = false;
            toggleRecommandationMode.classList.remove("disabled");
        }
        const status = isDeletionModeActive ? "activé" : "désactivé";
        if (gomme) {
            // Afficher ou masquer l'image de la gomme
            gomme.style.display = isDeletionModeActive ? "block" : "none";
        }
        toggleShakeEffect(isDeletionModeActive);
        // Afficher une notification avec le statut du mode de suppression
        showNotification("Mode de suppression " + status, 3000);
        // Change le curseur
        document.body.style.cursor = isDeletionModeActive && !isRecommandationMode ? 'url("./src/Images/gomme.png"), auto' : 'default';
    });
}
const deleteAllPointsButton = document.getElementById('deleteAllPoints');
if (deleteAllPointsButton) {
    deleteAllPointsButton.addEventListener('click', function () {
        Swal.fire({
            title: 'Êtes-vous sûr?',
            text: "Vous ne pourrez pas revenir en arrière!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Oui, supprimez-les!'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteAllPointsFromCharts();
                deleteAllPointsFromServer();
                Swal.fire('Supprimés!', 'Vos points ont été supprimés.', 'success');
            }
        });
    });
}
/**
 * Active ou désactive l'effet de secousse sur les graphiques d'audiogrammes.
 *
 * Cette fonction ajuste visuellement les graphiques d'audiogrammes en modifiant le rayon des points de données.
 * L'effet est appliqué à trois graphiques spécifiques : audiogramChartLeft, audiogramChartRight, et audiogramChampLibre.
 * Un rayon plus grand est utilisé pour "activer" l'effet de secousse, tandis qu'un rayon normal est restauré lorsque l'effet est "désactivé".
 *
 * @param enable - Un booléen ou toute valeur qui peut être évaluée à vrai ou faux, indiquant si l'effet de secousse doit être activé (true) ou désactivé (false).
 */
function toggleShakeEffect(enable) {
    [audiogramChartLeft, audiogramChartRight, audiogramChampLibre].forEach(chart => {
        if (chart) {
            chart.data.datasets.forEach((dataset) => {
                if (enable) {
                    // Augmenter le rayon du point pour un effet visuel
                    dataset.pointRadius = 7; // Taille normale + effet
                }
                else {
                    // Réinitialiser le rayon du point
                    dataset.pointRadius = 5; // Taille normale
                }
            });
            chart.update();
        }
    });
}
/**
 * Supprime tous les points de données de plusieurs graphiques d'audiogrammes.
 *
 * Cette fonction nettoie les jeux de données de trois graphiques spécifiques : audiogramChartLeft, audiogramChartRight, et audiogramChampLibre.
 * Après avoir vidé les points de données de chaque jeu de données, elle met à jour les graphiques pour refléter les changements.
 * Cela entraîne l'affichage de graphiques sans aucun point de données.
 */
function deleteAllPointsFromCharts() {
    // Supprimer tous les points des graphiques
    audiogramChartLeft.data.datasets.forEach((dataset) => dataset.data = []);
    audiogramChartRight.data.datasets.forEach((dataset) => dataset.data = []);
    audiogramChampLibre.data.datasets.forEach((dataset) => dataset.data = []);
    audiogramChampLibre.update();
    audiogramChartLeft.update();
    audiogramChartRight.update();
}
/**
 * Supprime tous les points de données des graphiques d'audiogramme d'un patient sur le serveur.
 *
 * Cette fonction lance des requêtes de suppression pour chaque côté de l'oreille d'un patient spécifique (gauche, droite, champ libre).
 * Elle extrait l'ID du patient depuis l'URL de la page, construit les URL de suppression appropriées, et envoie les requêtes DELETE.
 * Les réponses sont gérées pour confirmer la suppression ou signaler une erreur.
 */
function deleteAllPointsFromServer() {
    let patientId = getPatientIdFromUrl();
    const urls = [
        `/patients/${patientId}/delete-all-points/gauche`,
        `/patients/${patientId}/delete-all-points/droite`,
        `/patients/${patientId}/delete-all-points/champLibre`
    ];
    Promise.all(urls.map(url => fetch(url, { method: 'DELETE' })))
        .then(responses => {
        responses.forEach((response, index) => {
            if (response.ok) {
                console.log(`Tous les points de l'oreille ${urls[index].split('/').pop()} supprimés`);
            }
            else {
                console.error('Erreur lors de la suppression des points:', response.statusText);
            }
        });
    })
        .catch(error => console.error('Erreur lors de la suppression des points:', error));
}
/**
 * Calcule l'écart de décibels pour chaque point et, optionnellement, l'affiche en console.
 *
 * @param points - Tableau des points d'audiogramme.
 * @param log - Booléen indiquant si l'écart doit être affiché en console.
 * @returns Un tableau de tuples représentant l'écart de décibels pour chaque point.
 */
// Fonction pour calculer et afficher l'écart en décibel pour un point unique
function calculateAndLogDecibelRange(point, log = false) {
    const decibelRange = [point.y - 15, point.y + 30];
    if (log) {
        console.log(`Écart de décibels pour ${point.y} dB: (${decibelRange[0]}, ${decibelRange[1]})`);
    }
}
/**
 * Crée un élément canvas HTML personnalisé affichant une lettre ou un texte spécifique.
 *
 * Cette fonction génère un élément canvas sur lequel une lettre ou une combinaison de lettres est dessinée.
 * Elle est utilisée pour créer des styles de points visuels, par exemple dans des graphiques ou des visualisations où
 * chaque point peut être représenté par une lettre pour une identification rapide.
 *
 * @param letter - La lettre ou le texte à dessiner sur le canvas. Si 'AI' est fourni, le texte 'A+I' est dessiné.
 * @returns Un élément canvas HTML avec le texte dessiné dessus. Le canvas est retourné directement, ou une chaîne vide si le contexte du canvas n'est pas disponible.
 */
function createPointStyle(letter) {
    const pointSize = 20;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = pointSize * 2; // Taille du canvas
    const context = canvas.getContext('2d');
    if (context) {
        context.beginPath();
        context.lineWidth = 2;
        context.strokeStyle = '#000';
        context.stroke();
        context.fillStyle = 'black';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.font = `${pointSize}px Arial`;
        if (letter === 'AI') {
            context.fillText('A+I', pointSize, pointSize); // Dessiner 'A+I' au centre pour le style combiné
        }
        else {
            context.fillText(letter, pointSize, pointSize); // Dessiner la lettre au centre pour les autres styles
        }
    }
    return canvas;
}
/**
 * Initialise un audiogramme.
 *
 * Cette fonction crée et configure un audiogramme à l'aide de Chart.js.
 *
 * @param canvasID - L'identifiant de l'élément canvas HTML où afficher l'audiogramme.
 * @param pointColor - Couleur des points de l'audiogramme.
 * @param borderColor - Couleur de la bordure de l'audiogramme.
 * @param earSide - Côté de l'oreille (gauche ou droite) associé à l'audiogramme.
 * @returns L'instance de Chart créée ou null en cas d'échec.
 */
function initAudiogram(canvasID, pointColor, borderColor, earSide) {
    const canvas = document.getElementById(canvasID);
    if (canvas && canvas.getContext) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
            return new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [125, 250, 500, 1000, 1500, 2000, 3000, 4000, 8000],
                    datasets: [{
                            label: 'Oreille nue',
                            data: [],
                            showLine: true,
                            backgroundColor: pointColor,
                            borderColor: borderColor,
                            borderWidth: 1,
                            pointRadius: 5,
                            pointStyle: 'circle',
                        },
                        {
                            label: 'Aide auditive',
                            data: [],
                            showLine: true,
                            backgroundColor: 'rgb(255,0,0)',
                            borderColor: 'rgb(255,0,0)',
                            borderWidth: 1,
                            pointRadius: 5,
                            pointStyle: createPointStyle('A'),
                        },
                        {
                            label: 'Implant',
                            data: [],
                            showLine: true,
                            backgroundColor: 'rgb(0,128,0)',
                            borderColor: 'rgb(0,128,0)',
                            borderWidth: 1,
                            pointRadius: 5,
                            pointStyle: createPointStyle('I'),
                        },
                        {
                            label: 'Aide auditive + Implant',
                            data: [],
                            showLine: true,
                            backgroundColor: 'rgb(0,0,255)',
                            borderColor: 'rgb(0,0,255)',
                            borderWidth: 1,
                            pointRadius: 5,
                            pointStyle: createPointStyle('AI'),
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        y: {
                            beginAtZero: false,
                            reverse: true,
                            min: -10,
                            max: 120,
                            ticks: {
                                stepSize: 10
                            },
                            title: {
                                display: true,
                                text: 'Seuil Auditif (db)'
                            }
                        },
                        x: {
                            type: 'logarithmic',
                            position: 'bottom',
                            min: 100,
                            max: 8000,
                            ticks: {
                                min: 100,
                                max: 8000,
                                callback: function (value, index, ticks) {
                                    return value.toString();
                                }
                            },
                            afterBuildTicks: function (chart) {
                                chart.ticks = [125, 250, 500, 1000, 1500, 2000, 3000, 4000, 8000];
                                chart.ticks.forEach(function (value, index, array) {
                                    array[index] = { value: value.toString() };
                                });
                            },
                            title: {
                                display: true,
                                text: 'Fréquence (Hz)'
                            }
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: earSide,
                            font: {
                                size: 18
                            },
                            padding: {
                                top: 10,
                                bottom: 30
                            },
                        },
                        annotation: {
                            annotations: {}
                        }
                    },
                    elements: {
                        line: {
                            tension: 0 // Lignes droites sans courbure
                        }
                    },
                }
            });
        }
    }
    return null; // Retourne null si le canvas ou le contexte 2D n'existe pas
}
/**
 * Ajuste les fréquences et intensités pour qu'elles respectent les limites prédéfinies d'un graphique.
 *
 * Cette fonction est conçue pour s'assurer que les valeurs de fréquence et d'intensité d'entrée sont ajustées
 * pour respecter les limites maximales et minimales définies pour un graphique. Elle empêche les valeurs
 * d'excéder ou de descendre en dessous des seuils fixés, garantissant ainsi que les données affichées
 * restent dans une plage visible et pertinente sur le graphique.
 *
 * @param minFrequency - La fréquence minimale de l'entrée à ajuster.
 * @param maxFrequency - La fréquence maximale de l'entrée à ajuster.
 * @param minIntensityDb - L'intensité minimale en décibels de l'entrée à ajuster.
 * @param maxIntensityDb - L'intensité maximale en décibels de l'entrée à ajuster.
 * @returns Un objet contenant les valeurs ajustées pour la fréquence minimale (xMin), la fréquence maximale (xMax),
 *          l'intensité minimale (yMin) et l'intensité maximale (yMax).
 */
function adjustValuesToGraphLimits(minFrequency, maxFrequency, minIntensityDb, maxIntensityDb) {
    const graphMinFrequency = 125; // Limite minimale de la fréquence sur le graphique
    const graphMaxFrequency = 8000; // Limite maximale de la fréquence sur le graphique
    const graphMinIntensity = 0; // Limite minimale de l'intensité sur le graphique
    const graphMaxIntensity = 120; // Limite maximale de l'intensité sur le graphique
    // Ajustement des valeurs pour s'assurer qu'elles sont dans les limites du graphique
    const xMin = Math.max(minFrequency, graphMinFrequency);
    const xMax = Math.min(maxFrequency, graphMaxFrequency);
    const yMin = Math.max(minIntensityDb, graphMinIntensity);
    const yMax = Math.min(maxIntensityDb, graphMaxIntensity);
    return { xMin, xMax, yMin, yMax };
}
let select = document.getElementById("soundSelectorChampLibre");
if (select) {
    select.addEventListener("change", function () {
        return __awaiter(this, void 0, void 0, function* () {
            const selectedSound = this.value;
            console.log("Son sélectionné:", selectedSound);
            // Construire l'URL du fichier audio basé sur le son sélectionné
            const audioUrl = `/uploads/${selectedSound}`; // Assurez-vous que ce chemin est correct
            // Chargement et analyse du fichier audio
            try {
                const audioResponse = yield fetch(audioUrl);
                const audioBlob = yield audioResponse.blob();
                // Utilisez les noms de propriétés corrects conformément à la fonction analyseAudioExtremesConsole
                analyseAudioExtremesConsole(audioBlob).then((values) => {
                    console.log("Valeurs extrêmes de l'audio:", values);
                    // Pas besoin de convertir les noms de propriétés ici
                    const adjustedValues = adjustValuesToGraphLimits(values.xMin, values.xMax, values.yMin, values.yMax);
                    updateAudiogramWithNewValues(adjustedValues);
                });
            }
            catch (error) {
                console.error('Erreur lors du chargement ou de l\'analyse du fichier audio:', error);
            }
        });
    });
}
/**
 * Analyse les valeurs extrêmes de fréquence et d'intensité dans un fichier audio.
 *
 * Cette fonction utilise l'API Web Audio pour créer un contexte audio et analyser les données de fréquence
 * d'un fichier audio. Elle calcule les fréquences minimales et maximales où des données sont présentes,
 * ainsi que les intensités minimales et maximales. Les valeurs sont ensuite ajustées pour respecter les limites
 * prédéfinies du graphique d'audiogramme.
 *
 * @param audioFile - Le fichier audio sous forme de Blob à analyser.
 * @returns Une promesse qui résout en un objet contenant les valeurs extrêmes de fréquence et d'intensité (xMin, xMax, yMin, yMax).
 */
function analyseAudioExtremesConsole(audioFile) {
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
        source.connect(audioContext.destination);
        source.start(0);
        const graphMinFrequency = 125;
        const graphMaxFrequency = 8000;
        const graphMinIntensity = 0;
        const graphMaxIntensity = 120;
        return new Promise((resolve, reject) => {
            const checkAudioProcessing = () => {
                analyser.getByteFrequencyData(dataArrayFrequency);
                let minFreqIndex = bufferLength;
                let maxFreqIndex = 0;
                let minIntensityDb = Infinity;
                let maxIntensityDb = -Infinity;
                for (let i = 0; i < bufferLength; i++) {
                    if (dataArrayFrequency[i] > 0) {
                        minFreqIndex = Math.min(minFreqIndex, i);
                        maxFreqIndex = Math.max(maxFreqIndex, i);
                        let intensityDb = 20 * Math.log10(dataArrayFrequency[i] / 255);
                        intensityDb = Math.abs(intensityDb); // Convert to absolute value
                        minIntensityDb = Math.min(minIntensityDb, intensityDb);
                        maxIntensityDb = Math.max(maxIntensityDb, intensityDb);
                    }
                }
                if (minFreqIndex < bufferLength) {
                    let minFrequency = minFreqIndex * audioContext.sampleRate / analyser.fftSize;
                    let maxFrequency = maxFreqIndex * audioContext.sampleRate / analyser.fftSize;
                    minFrequency = Math.max(minFrequency, graphMinFrequency);
                    maxFrequency = Math.min(maxFrequency, graphMaxFrequency);
                    if (minFrequency > maxFrequency) {
                        maxFrequency = minFrequency;
                    }
                    resolve({
                        xMin: minFrequency,
                        xMax: maxFrequency,
                        yMin: Math.max(minIntensityDb, graphMinIntensity),
                        yMax: Math.min(maxIntensityDb, graphMaxIntensity)
                    });
                    source.stop();
                    audioContext.close();
                }
                else {
                    requestAnimationFrame(checkAudioProcessing);
                }
            };
            requestAnimationFrame(checkAudioProcessing);
        });
    });
}
let buttonDeletionToggle = document.getElementById("toggleDeletionMode");
toggleRecommandationMode === null || toggleRecommandationMode === void 0 ? void 0 : toggleRecommandationMode.addEventListener("click", () => __awaiter(void 0, void 0, void 0, function* () {
    const status = isRecommandationMode ? "désactivé" : "activé";
    if (isRecommandationMode) {
        buttonDeletionToggle.disabled = false;
        buttonDeletionToggle.classList.remove("disabled");
        isRecommandationMode = false;
        document.body.style.cursor = isRecommandationMode ? 'url("./src/Images/cursor.cur"), auto' : 'default';
    }
    else {
        buttonDeletionToggle.disabled = true;
        buttonDeletionToggle.classList.add("disabled");
        isRecommandationMode = true;
        toggleShakeEffect(isRecommandationMode);
        document.body.style.cursor = isRecommandationMode ? 'url("./src/Images/cursor.cur"), auto' : 'default';
    }
    showNotification("Mode de recommandation " + status, 3000);
}));
/**
 * Trouve et liste les fichiers sonores contenant des points spécifiés de fréquence et de décibels dans leurs valeurs extrêmes.
 *
 * Cette fonction prend un point de fréquence et un point de décibel et les compare avec une liste de fichiers audio pour déterminer
 * lesquels contiennent ces points dans leurs gammes extrêmes de fréquence et d'intensité. Elle utilise la fonction `analyseAudioExtremesConsole`
 * pour récupérer et analyser les extrêmes de fréquence et d'intensité de chaque fichier audio.
 *
 * @param freqPoint - Le point de fréquence spécifique à vérifier dans les fichiers audio.
 * @param dbPoint - Le point de décibel spécifique à vérifier dans les fichiers audio.
 * @param sounds - Un tableau de chaînes représentant les noms des fichiers audio à analyser.
 * @returns Une promesse qui se résout en un tableau de chaînes, chacune un nom de fichier audio correspondant aux critères.
 */
function findSoundsWithPoint(freqPoint, dbPoint, sounds) {
    return __awaiter(this, void 0, void 0, function* () {
        let matchingSounds = [];
        for (let sound of sounds) {
            try {
                const audioUrl = `/uploads/${sound}`; // Chemin vers le fichier audio
                const audioResponse = yield fetch(audioUrl);
                const audioBlob = yield audioResponse.blob();
                const values = yield analyseAudioExtremesConsole(audioBlob);
                if (freqPoint >= values.xMin && freqPoint <= values.xMax &&
                    dbPoint >= values.yMin && dbPoint <= values.yMax) {
                    matchingSounds.push(sound);
                }
            }
            catch (error) {
                console.error('Erreur lors du chargement ou de l\'analyse du fichier audio:', error);
            }
        }
        return matchingSounds;
    });
}
/**
 * Met à jour les annotations des graphiques d'audiogrammes avec de nouvelles valeurs.
 *
 * Cette fonction met à jour les graphiques d'audiogrammes pour les oreilles droite et gauche ainsi que pour le champ libre
 * en appliquant de nouvelles annotations basées sur les valeurs fournies. Les annotations délimitent une zone rectangulaire
 * indiquant une plage de fréquences et d'intensités sur les graphiques. Chaque graphique est mis à jour pour refléter
 * ces nouvelles annotations. Si une instance de graphique n'est pas définie, une erreur est enregistrée dans la console.
 *
 * @param values - Un objet contenant les valeurs `xMin`, `xMax`, `yMin` et `yMax` pour définir les limites des annotations sur les graphiques.
 */
function updateAudiogramWithNewValues(values) {
    // Check if the right audiogram chart instance is defined
    if (!audiogramChartRight) {
        console.error("The right audiogram chart instance is not defined.");
        return;
    }
    // Check if the left audiogram chart instance is defined
    if (!audiogramChartLeft) {
        console.error("The left audiogram chart instance is not defined.");
        return;
    }
    if (!audiogramChampLibre) {
        console.error("The left audiogram chart instance is not defined.");
        return;
    }
    // Update annotations for the right audiogram
    const annotationsRight = audiogramChartRight.options.plugins.annotation.annotations;
    annotationsRight.box1 = {
        type: 'box',
        xMin: values.xMin,
        xMax: values.xMax,
        yMin: values.yMin,
        yMax: values.yMax,
        backgroundColor: 'rgba(255, 99, 132, 0.25)'
    };
    // Update annotations for the left audiogram
    const annotationsLeft = audiogramChartLeft.options.plugins.annotation.annotations;
    annotationsLeft.box1 = {
        type: 'box',
        xMin: values.xMin,
        xMax: values.xMax,
        yMin: values.yMin,
        yMax: values.yMax,
        backgroundColor: 'rgba(255, 99, 132, 0.25)'
    };
    const annotationsChampLibre = audiogramChampLibre.options.plugins.annotation.annotations;
    annotationsChampLibre.box1 = {
        type: 'box',
        xMin: values.xMin,
        xMax: values.xMax,
        yMin: values.yMin,
        yMax: values.yMax,
        backgroundColor: 'rgba(255, 99, 132, 0.25)'
    };
    // Redraw both charts with the new annotations
    audiogramChartRight.update();
    audiogramChartLeft.update();
    audiogramChampLibre.update();
}
/**
 * Initialise un audiogramme.
 *
 * Cette fonction crée et configure un audiogramme à l'aide de Chart.js.
 *
 * @param canvasID - L'identifiant de l'élément canvas HTML où afficher l'audiogramme.
 * @param pointColor - Couleur des points de l'audiogramme.
 * @param borderColor - Couleur de la bordure de l'audiogramme.
 * @param earSide - Côté de l'oreille (gauche ou droite) associé à l'audiogramme.
 * @returns L'instance de Chart créée ou null en cas d'échec.
 */
function initAudiogramChampLibre(canvasID, pointColor, borderColor, earSide) {
    const canvas = document.getElementById(canvasID);
    if (canvas && canvas.getContext) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
            return new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [125, 250, 500, 1000, 1500, 2000, 3000, 4000, 8000],
                    datasets: [{
                            label: 'Oreille nue',
                            data: [],
                            showLine: true,
                            backgroundColor: pointColor,
                            borderColor: borderColor,
                            borderWidth: 1,
                            pointRadius: 5,
                            pointStyle: 'circle',
                        },
                        {
                            label: 'Aide auditive',
                            data: [],
                            showLine: true,
                            backgroundColor: 'rgb(255,0,0)',
                            borderColor: 'rgb(255,0,0)',
                            borderWidth: 1,
                            pointRadius: 5,
                            pointStyle: createPointStyle('A'),
                        },
                        {
                            label: 'Implant',
                            data: [],
                            showLine: true,
                            backgroundColor: 'rgb(0,128,0)',
                            borderColor: 'rgb(0,128,0)',
                            borderWidth: 1,
                            pointRadius: 5,
                            pointStyle: createPointStyle('I'),
                        },
                        {
                            label: 'Aide auditive + Implant',
                            data: [],
                            showLine: true,
                            backgroundColor: 'rgb(0,0,255)',
                            borderColor: 'rgb(0,0,255)',
                            borderWidth: 1,
                            pointRadius: 5,
                            pointStyle: createPointStyle('AI'),
                        }
                    ]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: false,
                            reverse: true,
                            min: -10,
                            max: 120,
                            ticks: {
                                stepSize: 10
                            },
                            title: {
                                display: true,
                                text: 'Seuil Auditif (db)'
                            }
                        },
                        x: {
                            type: 'logarithmic',
                            position: 'bottom',
                            min: 100,
                            max: 8000,
                            ticks: {
                                min: 100,
                                max: 8000,
                                callback: function (value, index, ticks) {
                                    return value.toString();
                                }
                            },
                            afterBuildTicks: function (chart) {
                                chart.ticks = [125, 250, 500, 1000, 1500, 2000, 3000, 4000, 8000];
                                chart.ticks.forEach(function (value, index, array) {
                                    array[index] = { value: value.toString() };
                                });
                            },
                            title: {
                                display: true,
                                text: 'Fréquence (Hz)'
                            }
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: earSide,
                            font: {
                                size: 18
                            },
                            padding: {
                                top: 10,
                                bottom: 30
                            }
                        },
                        annotation: {
                            annotations: {}
                        },
                    },
                    elements: {
                        line: {
                            tension: 0 // Lignes droites sans courbure
                        }
                    },
                    responsive: true,
                    maintainAspectRatio: true
                }
            });
        }
    }
    return null; // Retourne null si le canvas ou le contexte 2D n'existe pas
}
/**
 * Détermine si un point avec une fréquence spécifique et un style donné est déjà présent sur un graphique.
 *
 * Cette fonction parcourt les jeux de données d'un graphique pour vérifier si un point ayant la même fréquence
 * et le même style spécifiés existe déjà. Elle est utile pour éviter les doublons de points sur le graphique
 * lors de l'ajout de nouvelles données.
 *
 * @param chart - L'instance du graphique dans laquelle chercher le point.
 * @param frequency - La fréquence du point à vérifier.
 * @param style - Le style visuel du point à vérifier.
 * @returns `true` si un point avec la fréquence et le style donnés est trouvé, sinon `false`.
 */
function isPointAlreadyPresent(chart, frequency, style) {
    return chart.data.datasets.some((dataset) => {
        return dataset.data.some((point) => {
            // Vérifier si le point a la même fréquence et un style différent
            const isFrequencyMatch = Math.abs(point.x - frequency) < 0.1; // Check for same frequency
            const isDifferentStyle = point.styleLabel === style; // Check for different style
            return isFrequencyMatch && isDifferentStyle; // Should return true if frequency matches but style is different
        });
    });
}
/**
 * Vérifie si un point avec des coordonnées de fréquence, de décibels et un style spécifique existe déjà sur un graphique d'audiogramme.
 *
 * Cette fonction parcourt tous les datasets du graphique d'audiogramme pour chercher un point existant avec des coordonnées
 * et un style correspondants aux valeurs fournies. Elle compare la fréquence et les décibels avec une certaine tolérance pour les
 * différences mineures, et vérifie également si le style du point (représenté par 'circle', 'A', 'I', etc.) correspond.
 *
 * @param chart - L'instance de l'audiogramme Chart.js dans laquelle la recherche est effectuée.
 * @param frequency - La fréquence du point à vérifier.
 * @param decibels - Le niveau de décibels du point à vérifier.
 * @param style - Le style du point (comme 'circle', 'A', 'I', etc.) à vérifier.
 * @returns `true` si un point correspondant est trouvé, sinon `false`.
 *
 * @example
 * // Vérifie si un point avec 1000 Hz, 20 dB et le style 'A' existe déjà
 * isPointAlreadyPresentWithStyle(audiogramChart, 1000, 20, 'A');
 */
function isPointAlreadyPresentWithStyle(chart, frequency, style) {
    return chart.data.datasets.some((dataset) => {
        return dataset.data.some((point) => {
            const isFrequencyMatch = Math.abs(point.x - frequency) < 0.1; // même fréquence
            const isSameStyle = point.style === style; // même style
            return isFrequencyMatch && isSameStyle; // Problème si même fréquence mais style différent
        });
    });
}
/**
 * Ajoute un point à l'audiogramme et trie le point.
 *
 * @param chart - L'instance de l'audiogramme Chart.js.
 * @param frequency - La fréquence à ajouter ou mettre à jour.
 * @param decibels - Le niveau en décibels correspondant à la fréquence.
 *
 * @example
 * addDataPointAndSort(audiogramChart, 1000, 20); // Ajoute ou met à jour le point à 1000 Hz avec 20 dB
 */
function addDataPointAndSort(chart, frequency, decibels, id, style) {
    if (isPointAlreadyPresentWithStyle(chart, frequency, style)) {
        console.log("Swal should trigger now.");
        Swal.fire({
            title: 'Erreur!',
            text: 'Un point avec la même fréquence et un style différent existe déjà.',
            icon: 'error',
            confirmButtonText: 'OK'
        });
        return; // Ne pas ajouter le point si un autre avec un style différent existe déjà
    }
    if (isPointAlreadyExist(chart, frequency, decibels)) {
        console.log("Point with the same frequency and decibels already exists.");
        return; // Ne pas ajouter le point si un autre avec les mêmes fréquences et décibels existe déjà
    }
    // Ajout du point si aucun point conflictuel n'est détecté
    const newDataPoint = {
        x: frequency,
        y: decibels,
        id: id,
        style: style === 'circle' ? 'circle' : createPointStyle(style),
        styleLabel: style
    };
    // Calcule et affiche l'écart de décibels
    calculateAndLogDecibelRange(newDataPoint, true);
    // Déterminer l'index du dataset en fonction du style
    let datasetIndex = style === 'circle' ? 0 :
        style === 'A' ? 1 :
            style === 'I' ? 2 :
                style === 'AI' ? 3 : 0;
    // Ajoute le point au dataset approprié
    chart.data.datasets[datasetIndex].data.push(newDataPoint);
    // Trie les points pour maintenir l'ordre des fréquences
    chart.data.datasets[datasetIndex].data.sort((a, b) => a.x - b.x);
    // Met à jour le graphique pour refléter les changements
    chart.update();
}
/**
 * Configure les gestionnaires d'événements pour les formulaires d'ajout de points aux audiogrammes.
 *
 * Cette fonction associe des gestionnaires d'événements 'submit' aux formulaires qui permettent d'ajouter des points aux graphiques d'audiogrammes gauche et droit.
 *
 * @param chartLeft - L'instance de l'audiogramme pour l'oreille gauche.
 * @param chartRight - L'instance de l'audiogramme pour l'oreille droite.
 */
function setupEventHandlers(chartLeft, chartRight, chartChampLibre, legendSelector) {
    const addPointFormLeft = document.getElementById('addPointFormLeft');
    const addPointFormRight = document.getElementById('addPointFormRight');
    const addPointFormChampLibre = document.getElementById('addPointFormThird'); // Assurez-vous que l'ID est correct
    // Gestionnaire pour l'audiogramme de gauche
    addPointFormLeft === null || addPointFormLeft === void 0 ? void 0 : addPointFormLeft.addEventListener('submit', function (event) {
        event.preventDefault();
        const frequenciesInput = document.getElementById('frequenciesLeft');
        const decibelsInput = document.getElementById('decibelsLeft');
        const frequencies = frequenciesInput.value.split(',').map(f => parseFloat(f.trim()));
        const decibels = decibelsInput.value.split(',').map(d => parseFloat(d.trim()));
        let isValid = true;
        let errorMessage = '';
        frequencies.forEach((frequency, index) => {
            const decibel = decibels[index];
            if (isNaN(frequency) || frequency < 0 || frequency > 8000) {
                isValid = false;
                errorMessage += 'Fréquence doit être comprise entre 0 et 8000 Hz.\n';
            }
            if (isNaN(decibel) || decibel < -10 || decibel > 120) {
                isValid = false;
                errorMessage += 'Décibels doivent être compris entre -10 et 120 dB.\n';
            }
            if (isValid) {
                const uniqueId = Date.now().toString(); // Générer un ID unique ici
                const pointStyle = legendSelector.value;
                addDataPointAndSort(chartLeft, frequency, decibel, uniqueId, pointStyle);
                document.getElementById('frequenciesLeft').value = '';
                document.getElementById('decibelsLeft').value = '';
                const audiogramDataLeft = {
                    ear: 'gauche',
                    frequency: frequency,
                    decibels: decibel,
                    id: uniqueId,
                    style: pointStyle,
                };
                sendDataToServer(audiogramDataLeft);
            }
            else {
                alert(errorMessage);
            }
        });
    });
    // Gestionnaire pour l'audiogramme de droite
    addPointFormRight === null || addPointFormRight === void 0 ? void 0 : addPointFormRight.addEventListener('submit', function (event) {
        event.preventDefault();
        const frequenciesInput = document.getElementById('frequenciesRight');
        const decibelsInput = document.getElementById('decibelsRight');
        const frequencies = frequenciesInput.value.split(',').map(f => parseFloat(f.trim()));
        const decibels = decibelsInput.value.split(',').map(d => parseFloat(d.trim()));
        let isValid = true;
        let errorMessage = '';
        frequencies.forEach((frequency, index) => {
            const decibel = decibels[index];
            if (isNaN(frequency) || frequency < 0 || frequency > 8000) {
                isValid = false;
                errorMessage += 'Fréquence doit être comprise entre 0 et 8000 Hz.\n';
            }
            if (isNaN(decibel) || decibel < -10 || decibel > 120) {
                isValid = false;
                errorMessage += 'Décibels doivent être compris entre -10 et 120 dB.\n';
            }
            if (isValid) {
                const uniqueId = Date.now().toString(); // Générer un ID unique ici
                const pointStyle = legendSelector.value;
                addDataPointAndSort(chartRight, frequency, decibel, uniqueId, pointStyle);
                document.getElementById('frequenciesRight').value = '';
                document.getElementById('decibelsRight').value = '';
                const audiogramDataRight = {
                    ear: 'droite',
                    frequency: frequency,
                    decibels: decibel,
                    id: uniqueId,
                    style: pointStyle,
                };
                sendDataToServer(audiogramDataRight);
            }
        });
    });
    // Gestionnaire pour l'audiogramme champ libre
    addPointFormChampLibre === null || addPointFormChampLibre === void 0 ? void 0 : addPointFormChampLibre.addEventListener('submit', function (event) {
        event.preventDefault();
        const frequenciesInput = document.getElementById('frequenciesThird'); // Assurez-vous que l'ID est correct
        const decibelsInput = document.getElementById('decibelsThird'); // Assurez-vous que l'ID est correct
        const frequency = parseFloat(frequenciesInput.value.trim());
        const decibel = parseFloat(decibelsInput.value.trim());
        let isValid = !isNaN(frequency) && frequency > 0 && frequency <= 8000 && !isNaN(decibel) && decibel >= -10 && decibel <= 120;
        if (isValid) {
            const uniqueId = Date.now().toString();
            const pointStyle = legendSelector.value;
            addDataPointAndSort(chartChampLibre, frequency, decibel, uniqueId, pointStyle);
            document.getElementById('frequenciesThird').value = '';
            document.getElementById('decibelsThird').value = '';
            const audiogramDataChampLibre = {
                ear: 'champLibre',
                frequency: frequency,
                decibels: decibel,
                id: uniqueId,
                style: pointStyle,
            };
            sendDataToServer(audiogramDataChampLibre);
        }
        else {
            alert("Fréquence doit être comprise entre 0 et 8000 Hz.\nDécibels doivent être compris entre -10 et 120 dB.");
        }
    });
}
/**
 * Extrait l'ID du patient à partir des paramètres de l'URL de la page actuelle.
 *
 * Cette fonction utilise l'objet URLSearchParams pour analyser les paramètres de requête de l'URL actuelle
 * et tente de récupérer l'ID du patient. Elle est utilisée pour obtenir l'identifiant du patient à partir de l'URL
 * dans des applications web où l'ID est passé comme paramètre de requête.
 *
 * @returns L'ID du patient sous forme de chaîne de caractères. Si l'ID n'est pas trouvé, retourne une chaîne vide.
 */
function getPatientIdFromUrl() {
    // Crée un objet URLSearchParams à partir de l'URL actuelle
    const urlParams = new URLSearchParams(window.location.search);
    // Récupère l'ID du patient à partir des paramètres de l'URL
    const patientId = urlParams.get('id');
    // Retourne l'ID du patient ou une chaîne vide si non trouvé
    return patientId || '';
}
/**
 * Ajoute un point à l'audiogramme de l'oreille gauche.
 *
 * Cette fonction est spécifiquement destinée à ajouter des points de données à l'audiogramme de l'oreille gauche.
 * Elle utilise une fonction d'aide pour ajouter un point de données et s'assure qu'il est correctement trié
 * en fonction de sa fréquence. Les points peuvent avoir un style particulier, ce qui est utile pour les distinctions
 * visuelles sur l'audiogramme.
 *
 * @param frequency - La fréquence du point en Hz.
 * @param decibels - L'intensité du point en décibels.
 * @param id - Un identifiant pour le point, utile pour les références ultérieures ou le traitement.
 * @param style - Un objet ou une chaîne décrivant le style visuel du point (par exemple, couleur, taille).
 */
function addPointToLeftAudiogram(frequency, decibels, id, style) {
    // Vérifiez que cette fonction ajoute des points seulement à l'audiogramme gauche
    addDataPointAndSort(audiogramChartLeft, frequency, decibels, id, style);
}
/**
 * Ajoute un point à l'audiogramme de l'oreille droite.
 *
 * Cette fonction est spécifiquement conçue pour ajouter des points de données à l'audiogramme de l'oreille droite.
 * Elle utilise une fonction d'aide pour insérer le point de données et pour s'assurer qu'il est correctement trié
 * en fonction de sa fréquence. Les points peuvent comporter un style spécifique, ce qui est utile pour les distinctions
 * visuelles importantes sur l'audiogramme.
 *
 * @param frequency - La fréquence du point en Hz, indiquant la fréquence auditive représentée par le point.
 * @param decibels - L'intensité du point en décibels, indiquant le niveau de perte auditive à cette fréquence.
 * @param id - Un identifiant pour le point, utilisé pour le suivi ou la manipulation spécifique du point dans les interactions futures.
 * @param style - Un objet ou une chaîne définissant le style visuel du point, qui peut inclure des aspects comme la couleur ou la taille du point.
 */
function addPointToRightAudiogram(frequency, decibels, id, style) {
    // Vérifiez que cette fonction ajoute des points seulement à l'audiogramme droit
    addDataPointAndSort(audiogramChartRight, frequency, decibels, id, style);
}
/**
 * Ajoute un point à l'audiogramme de champ libre.
 *
 * Cette fonction est destinée à l'ajout de points de données sur l'audiogramme de champ libre, qui est utilisé pour
 * tester l'audition sans différencier l'oreille gauche de l'oreille droite. Elle intègre une fonction d'aide pour
 * insérer le point de données et pour s'assurer que celui-ci est correctement trié selon sa fréquence. Le style du point
 * peut être personnalisé pour faciliter les distinctions visuelles sur l'audiogramme.
 *
 * @param frequency - La fréquence du point en Hz, indiquant la fréquence auditive représentée par le point.
 * @param decibels - L'intensité du point en décibels, indiquant le niveau de perte auditive à cette fréquence.
 * @param id - Un identifiant pour le point, utilisé pour le suivi ou la manipulation spécifique du point dans des interactions futures.
 * @param style - Un objet ou une chaîne définissant le style visuel du point, qui peut inclure des aspects comme la couleur ou la taille du point.
 */
function addPointToChampLibre(frequency, decibels, id, style) {
    // Vérifiez que cette fonction ajoute des points seulement à l'audiogramme droit
    addDataPointAndSort(audiogramChampLibre, frequency, decibels, id, style);
}
/**
 * Envoie les données d'audiogramme au serveur via une requête POST.
 *
 * @param audiogramData - Les données de l'audiogramme à envoyer.
 * @throws {Error} - Lance une erreur si l'envoi des données échoue.
 */
function sendDataToServer(audiogramData) {
    const patientId = getPatientIdFromUrl(); // Obtenir l'ID du patient
    let url;
    switch (audiogramData.ear) {
        case 'gauche':
            url = `/patients/${patientId}/audiogram/left`; // Utiliser l'ID dans l'URL
            break;
        case 'droite':
            url = `/patients/${patientId}/audiogram/right`;
            break;
        case 'champLibre':
            url = `/patients/${patientId}/audiogram/champLibre`;
            break;
        default:
            throw new Error("Côté d'oreille non spécifié");
    }
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(audiogramData),
    })
        .then(response => {
        if (response.ok) {
            return response.json(); // Assure-toi de gérer le JSON si le serveur renvoie JSON
        }
        throw new Error('Erreur dans l\'envoi des données');
    })
        .then(data => console.log('Données enregistrées:', data))
        .catch(error => console.error('Erreur:', error));
}
/**
 * Récupère les données d'audiogramme d'un patient spécifique du serveur et met à jour le graphique d'audiogramme correspondant.
 *
 * @param chart - L'instance de l'audiogramme Chart.js à mettre à jour avec les données récupérées.
 * @param ear - La partie de l'audiogramme à récupérer ('gauche', 'droite', 'champLibre').
 * @param legendSelector - Le sélecteur HTML pour choisir le style de point à appliquer aux nouveaux points.
 * @param patientId - L'ID du patient dont les données d'audiogramme doivent être récupérées.
 */
function getAudiogramData(chart, ear, legendSelector, patientId) {
    const url = `/patients/${patientId}/audiogram/${ear}`;
    fetch(url)
        .then(response => {
        if (!response.ok) {
            throw new Error('Erreur de réseau lors de la récupération des données');
        }
        return response.json();
    })
        .then(data => {
        updateAudiogramWithData(data, chart);
    })
        .catch(error => console.error('Erreur lors de la récupération des données:', error));
}
function updateAudiogramWithData(data, chart) {
    data.forEach((point) => {
        // Vérifier si un point avec le même style et la même fréquence existe déjà mais sans tenir compte du style
        if (!isPointAlreadyPresentWithStyle(chart, point.frequency, point.style) && !isPointAlreadyExist(chart, point.frequency, point.decibels)) {
            // Choix du graphique approprié en fonction de l'oreille
            let targetChart;
            if (point.ear === 'gauche') {
                targetChart = audiogramChartLeft;
            }
            else if (point.ear === 'droite') {
                targetChart = audiogramChartRight;
            }
            else if (point.ear === 'champLibre') {
                targetChart = audiogramChampLibre;
            }
            if (targetChart) {
                addDataPointAndSort(targetChart, point.frequency, point.decibels, point.id, point.style);
            }
        }
    });
}
/**
 * Vérifie si un point spécifique, identifié par son ID unique, existe déjà dans un graphique d'audiogramme.
 *
 * Cette fonction parcourt tous les datasets du graphique d'audiogramme et chaque point dans ces datasets pour déterminer si un point
 * avec l'ID spécifié existe déjà. Cela permet d'éviter les doublons basés sur l'identité unique du point, indépendamment de ses
 * coordonnées ou de son style.
 *
 * @param chart - L'instance de l'audiogramme Chart.js où la recherche est effectuée.
 * @param pointTest - L'objet représentant le point à vérifier, contenant au moins l'ID unique du point.
 * @returns `true` si un point avec l'ID donné est trouvé, sinon `false`.
 *
 * @example
 * // Vérifie si un point avec l'ID spécifique existe déjà
 * const pointToTest = { id: "12345", frequency: 1000, decibels: 20, style: 'A' };
 * isPointAlreadyExist(audiogramChart, pointToTest);
 */
function isPointAlreadyExist(chart, frequency, decibels) {
    return chart.data.datasets.some((dataset) => {
        return dataset.data.some((point) => {
            return Math.abs(point.x - frequency) < 0.1 && Math.abs(point.y - decibels) < 0.1; // Tolérance ajustable
        });
    });
}
const standardFrequencies = [125, 250, 500, 1000, 2000, 4000, 8000];
const decibelLevels = [];
// Cette boucle crée une liste de -10 à 120 avec un pas de 10
for (let i = -10; i <= 120; i += 10) {
    decibelLevels.push(i);
}
const uniqueDecibelLevels = Array.from(new Set(decibelLevels)).sort((a, b) => a - b);
/**
 * Initialise les onglets et configure les gestionnaires d'événements pour les interactions.
 *
 * Cette fonction sélectionne les éléments d'onglet dans le document et associe des gestionnaires d'événements pour gérer les clics.
 * Elle gère également l'erreur si un onglet spécifique n'est pas trouvé dans le document.
 */
function initTabs() {
    const tab1 = document.querySelector('.tab2');
    const tab2 = document.querySelector('.tab1');
    if (tab1) {
        tab1.addEventListener('click', () => {
            // Code pour la première onglet
        });
    }
    else {
        console.error("L'élément .tab2 n'a pas été trouvé dans le document.");
    }
    if (tab2) {
        tab2.addEventListener('click', toggleDropdownMenu);
    }
    else {
        console.error("L'élément .tab1 n'a pas été trouvé dans le document.");
    }
}
/**
 * Bascule l'affichage du menu déroulant.
 *
 * Cette fonction cherche le menu déroulant dans le document et bascule sa visibilité.
 * Elle affiche le menu si celui-ci est caché, ou le cache si celui-ci est visible.
 */
function toggleDropdownMenu() {
    const dropdownMenu = document.querySelector('.dropdown-menu');
    if (dropdownMenu) {
        dropdownMenu.classList.toggle('show');
    }
}
/**
 * Configure un écouteur d'événements pour gérer les clics sur un graphique d'audiogramme.
 *
 * Cette fonction ajoute un écouteur d'événements 'click' au canvas du graphique. Lorsqu'un clic est détecté, la fonction
 * détermine si le mode de suppression est actif. Si c'est le cas, elle tente de supprimer le point cliqué après confirmation.
 * Sinon, elle ajoute un nouveau point d'audiogramme à l'emplacement cliqué, en ajustant la fréquence et les décibels
 * en fonction de la position du clic et du style sélectionné dans le menu déroulant.
 *
 * @param chart - L'instance de l'audiogramme Chart.js sur laquelle les clics sont écoutés.
 * @param ear - Indique l'oreille concernée ('gauche' ou 'droite') pour identifier où ajouter le point.
 * @param legendSelector - Le sélecteur HTML pour choisir le style du point ajouté.
 *
 * @example
 * setupClickListeners(audiogramChartLeft, 'gauche', legendSelectorLeft); // Configure l'écouteur pour l'audiogramme de l'oreille gauche
 */
function setupClickListeners(chart, ear, legendSelector) {
    const canvas = chart.canvas;
    canvas.addEventListener('click', function (event) {
        if (isRecommandationMode) {
            if (isDeletionModeActive) {
                showNotification("Le mode de suppression est déjà activé");
            }
            else {
                const points = chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, false);
                if (points.length) {
                    const datasetIndex = points[0].datasetIndex;
                    const index = points[0].index;
                    const pointData = chart.data.datasets[datasetIndex].data[index];
                    callRecommendation(pointData.x, pointData.y);
                }
            }
        }
        // Si le mode de suppression est actif, supprimer le point
        else if (isDeletionModeActive) {
            if (isRecommandationMode) {
                showNotification("Le mode de recommandation est déjà activé");
            }
            else {
                const points = chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, false);
                if (points.length) {
                    const datasetIndex = points[0].datasetIndex;
                    const index = points[0].index;
                    const pointData = chart.data.datasets[datasetIndex].data[index];
                    console.log(pointData);
                    removeDataPoint(chart, index, ear, pointData.id);
                }
            }
        }
        else {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            let { frequency, decibels } = convertClickToChartData(chart, x, y);
            frequency = findNearestFrequency(frequency, standardFrequencies);
            const pointStyle = legendSelector.value;
            if (!isPointAlreadyPresent(chart, frequency, pointStyle)) {
                decibels = snapToDecibelLevels(decibels); // Ajustement des décibels si nécessaire
                const style = legendSelector.value;
                const id = Date.now().toString(); // Générer un ID unique ici
                addDataPointAndSort(chart, frequency, decibels, id, style);
                sendDataToServer({ ear, frequency, decibels, id, style });
            }
        }
    });
}
function callRecommendation(freqPoint, dbPoint) {
    return __awaiter(this, void 0, void 0, function* () {
        const modal = document.getElementById("resultModal");
        const modalText = document.getElementById("modalText");
        const closeSpan = document.querySelector(".close_reco");
        if (!modal || !modalText || !closeSpan) {
            console.error("Erreur: certains éléments d'interface utilisateur ne sont pas trouvés.");
            return; // Stop the function if necessary elements are missing
        }
        try {
            const response = yield fetch('/list-audios');
            if (!response.ok) {
                throw new Error(`Failed to fetch sound files: ${response.statusText}`);
            }
            const soundFiles = yield response.json();
            const result = yield findSoundsWithPoint(freqPoint, dbPoint, soundFiles);
            if (result.length == 0) {
                modalText.textContent = "Aucun fichiers ne correspond";
                modal.style.display = "block"; // Show the modal
            }
            else {
                modalText.textContent = "Fichiers correspondants: " + result.join(", ");
                modal.style.display = "block"; // Show the modal
            }
        }
        catch (error) {
            console.error("Erreur lors de la récupération ou de la recherche des fichiers audio:", error);
            modalText.textContent = "Erreur lors de la recherche des fichiers.";
        }
        // When the user clicks on <span> (x), close the modal
        closeSpan.onclick = function () {
            modal.style.display = "none";
        };
        // When the user clicks anywhere outside of the modal, close it
        window.onclick = function (event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        };
    });
}
/**
 * Supprime un point de l'audiogramme et met à jour le graphique.
 *
 * Cette fonction retire un point spécifique du graphique d'audiogramme basé sur son index.
 * Elle envoie également une requête DELETE au serveur pour supprimer ce point des données stockées.
 *
 * @param chart - L'instance de l'audiogramme Chart.js à laquelle le point est retiré.
 * @param index - L'index du point dans le dataset du graphique Chart.js.
 * @param ear - Indique l'oreille concernée ('gauche' ou 'droite') pour identifier le bon endpoint sur le serveur.
 * @param pointId - L'identifiant unique du point à supprimer, utilisé dans l'URL de la requête DELETE.
 *
 * @example
 * removeDataPoint(audiogramChart, 2, 'gauche', '123456789'); // Supprime le point d'index 2 pour l'oreille gauche avec l'ID '123456789'
 */
function removeDataPoint(chart, index, ear, pointId) {
    chart.data.datasets.forEach((dataset) => {
        const pointIndex = dataset.data.findIndex((point) => point.id === pointId);
        if (pointIndex !== -1) {
            dataset.data.splice(pointIndex, 1);
            chart.update();
        }
    });
    let patientId = getPatientIdFromUrl();
    // Mise à jour de l'URL pour inclure l'identifiant du patient
    const url = `/patients/${patientId}/audiogram/${ear}/${pointId}`;
    // Envoyer la requête DELETE au serveur
    fetch(url, {
        method: 'DELETE'
    })
        .then(response => {
        if (!response.ok) {
            throw new Error('Erreur lors de la suppression du point');
        }
        console.log("Point supprimé avec succès");
    })
        .catch(error => console.error('Erreur:', error));
}
/**
 * Convertit les coordonnées d'un clic sur un graphique en fréquence et décibels.
 *
 * Cette fonction calcule la fréquence et les décibels correspondants à la position d'un clic sur le graphique.
 * Elle utilise les échelles du graphique pour convertir les coordonnées en pixels en valeurs significatives.
 *
 * @param chart - L'instance de l'audiogramme Chart.js.
 * @param clickX - La position en pixels sur l'axe X du clic.
 * @param clickY - La position en pixels sur l'axe Y du clic.
 * @returns Un objet contenant la fréquence et les décibels correspondants aux coordonnées du clic.
 */
function convertClickToChartData(chart, clickX, clickY) {
    const xAxis = chart.scales.x;
    const yAxis = chart.scales.y;
    const frequency = xAxis.getValueForPixel(clickX);
    const decibels = yAxis.getValueForPixel(clickY);
    return { frequency, decibels };
}
/**
 * Trouve la fréquence standard la plus proche d'une fréquence donnée.
 *
 * Cette fonction compare une fréquence donnée avec un ensemble de fréquences standard et retourne
 * la fréquence standard la plus proche de la valeur donnée.
 *
 * @param frequency - La fréquence à comparer.
 * @returns La fréquence standard la plus proche de la fréquence donnée.
 */
function findNearestFrequency(frequency, standardFrequencies) {
    if (frequency <= standardFrequencies[0])
        return standardFrequencies[0];
    if (frequency >= standardFrequencies[standardFrequencies.length - 1])
        return standardFrequencies[standardFrequencies.length - 1];
    for (let i = 0; i < standardFrequencies.length - 1; i++) {
        const lower = standardFrequencies[i];
        const upper = standardFrequencies[i + 1];
        const middle = (lower + upper) / 2;
        if (frequency === middle) {
            // Si la fréquence est exactement au milieu, on la retourne
            return frequency;
        }
        else if (frequency > lower && frequency < middle) {
            // Si la fréquence est plus proche de la borne inférieure, on retourne la borne inférieure
            return lower;
        }
        else if (frequency > middle && frequency < upper) {
            // Si la fréquence est plus proche de la borne supérieure, on retourne le milieu
            return middle;
        }
    }
    // Par sécurité, si aucune condition n'est remplie, on retourne la fréquence la plus basse
    return standardFrequencies[0];
}
/**
 * Ajuste un niveau de décibels pour qu'il corresponde au niveau le plus proche dans une gamme prédéfinie.
 *
 * Cette fonction trouve le niveau de décibels le plus proche dans un ensemble prédéfini de niveaux
 * et retourne ce niveau ajusté. Elle est utile pour aligner les décibels à des seuils standard.
 *
 * @param decibels - Le niveau de décibels à ajuster.
 * @returns Le niveau de décibels ajusté au plus proche dans la gamme prédéfinie.
 */
function snapToDecibelLevels(decibels) {
    console.log(`Décibels cliqués: ${decibels}`); // Ajouter pour le débogage
    const snappedDecibels = decibelLevels.reduce((prev, curr) => {
        return (Math.abs(curr - decibels) < Math.abs(prev - decibels) ? curr : prev);
    });
    console.log(`Décibels ajustés: ${snappedDecibels}`); // Ajouter pour le débogage
    return snappedDecibels;
}
function toggleAnnotation(chart, annotationId) {
    var _a, _b;
    // Vérifier si l'annotation est déjà présente
    const annotation = (_b = (_a = chart.options.plugins) === null || _a === void 0 ? void 0 : _a.annotation) === null || _b === void 0 ? void 0 : _b.annotations[annotationId];
    if (annotation) {
        // Si elle est présente, la supprimer
        delete chart.options.plugins.annotation.annotations[annotationId];
    }
    else {
        // Sinon, la créer
        chart.options.plugins = chart.options.plugins || {};
        chart.options.plugins.annotation = chart.options.plugins.annotation || { annotations: {} };
        chart.options.plugins.annotation.annotations[annotationId] = {
            type: 'box',
            xMin: 500,
            xMax: 2000,
            yMin: 20,
            yMax: 60,
            backgroundColor: 'rgba(255, 99, 132, 0.25)'
        };
    }
    // Mettre à jour le graphique pour refléter les changements
    chart.update();
}
/**
 * Remplit le sélecteur de sons avec les options disponibles lors du chargement de la page.
 *
 * Cette fonction récupère la liste des fichiers audio disponibles depuis le serveur via une requête GET à `/list-audios`.
 * Elle ajoute ensuite ces fichiers sous forme d'options dans un élément de sélection HTML (`<select>`). Une option par défaut
 * est également ajoutée pour inciter l'utilisateur à faire une sélection. Des écouteurs d'événements sont ajoutés pour gérer
 * les interactions avec le sélecteur de sons.
 */
function fillSoundSelector() {
    fetch('/list-audios')
        .then(response => response.json())
        .then((sounds) => {
        const soundSelector = document.getElementById('soundSelectorChampLibre');
        ;
        // Vérification pour s'assurer que soundSelector n'est pas null
        if (soundSelector) {
            // Ajouter une option par défaut qui n'est pas sélectionnable
            const defaultOption = document.createElement('option');
            defaultOption.textContent = 'Sélectionner un son'; // Texte d'incitation à choisir
            defaultOption.value = ''; // Valeur vide pour indiquer qu'aucune sélection n'a été faite
            defaultOption.selected = true; // Faire de cette option la sélection par défaut
            soundSelector.appendChild(defaultOption);
            // Ajouter les sons disponibles comme options
            sounds.forEach(sound => {
                const option = document.createElement('option');
                option.value = sound;
                option.textContent = sound; // Affiche le nom du fichier comme texte de l'option
                soundSelector.appendChild(option);
            });
            // Ajouter un écouteur d'événements pour gérer les changements
            soundSelector.addEventListener('change', () => {
                if (soundSelector.value === '') {
                    // Si l'option par défaut est sélectionnée, supprimer l'annotation
                    toggleAnnotation(audiogramChartLeft, 'box1');
                    toggleAnnotation(audiogramChartRight, 'box1');
                    toggleAnnotation(audiogramChampLibre, 'box1');
                }
                else {
                    // Sinon, afficher ou ajuster l'annotation selon le son sélectionné
                    updateAnnotation(audiogramChartLeft, 'box1', soundSelector.value);
                    updateAnnotation(audiogramChartRight, 'box1', soundSelector.value);
                    updateAnnotation(audiogramChampLibre, 'box1', soundSelector.value);
                }
            });
        }
        else {
            console.error('Le sélecteur de sons est introuvable.');
        }
    })
        .catch(error => console.error('Erreur lors de la récupération des sons:', error));
}
/**
 * Met à jour une annotation spécifique sur un graphique d'audiogramme en fonction d'un son sélectionné.
 *
 * Cette fonction ajuste les paramètres d'une annotation sur un graphique d'audiogramme, tels que les limites de fréquence
 * et d'intensité (décibels), en fonction du son sélectionné. L'annotation est identifiée par un ID unique et est utilisée
 * pour visualiser graphiquement une plage spécifique sur le graphique. Les valeurs d'exemple sont fixées ici pour simplifier,
 * mais devraient être dynamiquement ajustées selon les caractéristiques du son sélectionné.
 *
 * @param chart - L'instance du graphique Chart.js sur laquelle l'annotation doit être mise à jour.
 * @param annotationId - L'identifiant de l'annotation à mettre à jour.
 * @param sound - Le nom du fichier sonore sélectionné qui détermine les valeurs des annotations.
 */
function updateAnnotation(chart, annotationId, sound) {
    // Mettre à jour l'annotation en fonction du son sélectionné (ici, simplifié)
    if (!chart.options.plugins.annotation.annotations[annotationId]) {
        chart.options.plugins.annotation.annotations[annotationId] = {
            type: 'box',
            xMin: 500, // Ces valeurs devraient être ajustées en fonction du son
            xMax: 2000,
            yMin: 20,
            yMax: 60,
            backgroundColor: 'rgba(255, 99, 132, 0.25)'
        };
    }
    else {
        // Ajuster les valeurs de l'annotation existante selon le son
    }
    chart.update();
}
// Assurez-vous d'appeler fillSoundSelector lorsque la page est chargée
document.addEventListener('DOMContentLoaded', fillSoundSelector);
// Assurez-vous que ce script s'exécute après que le DOM est entièrement chargé
document.addEventListener('DOMContentLoaded', () => {
    const select = document.getElementById('soundSelectorChampLibre');
    if (select instanceof HTMLSelectElement) { // Vérifie si 'select' est bien un élément HTMLSelectElement
        fetch('/list-audios')
            .then(response => {
            if (!response.ok) {
                throw new Error('Réponse réseau non OK');
            }
            return response.json();
        })
            .then((audios) => {
            audios.forEach((audio) => {
                const option = new Option(audio, audio); // Utilise le nom du fichier comme valeur et texte
                select.add(option);
            });
        })
            .catch(error => console.error('Erreur lors de la récupération des audios:', error));
    }
    else {
        console.error('Élément select non trouvé ou n\'est pas un élément select');
    }
});
/**
 * Récupère les informations d'un patient à partir d'un serveur et les affiche.
 *
 * Cette fonction extrait l'ID du patient de l'URL de la page actuelle, construit une URL pour accéder aux informations
 * du patient, et envoie une requête pour récupérer ces données. Si les informations sont récupérées avec succès,
 * elles sont passées à une fonction d'affichage. En cas d'échec de la requête, une erreur est enregistrée dans la console.
 */
function fetchPatientInfo() {
    let patientId = getPatientIdFromUrl();
    const url = `/patients/${patientId}/info.json`;
    fetch(url)
        .then(response => {
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des informations du patient');
        }
        return response.json();
    })
        .then(patientInfo => {
        displayPatientInfo(patientInfo);
    })
        .catch(error => {
        console.error('Erreur:', error);
    });
}
/**
 * Affiche les informations d'un patient sur l'interface utilisateur.
 *
 * Cette fonction met à jour les éléments HTML avec les informations du patient, telles que son nom et sa photo de profil.
 * Elle requiert que les éléments HTML pour afficher le nom et la photo du patient soient présents dans le DOM. Si les
 * informations ou les éléments HTML nécessaires sont manquants, une erreur est enregistrée dans la console.
 *
 * @param patientInfo - Un objet contenant les informations du patient, notamment son nom (`name`) et l'URL de sa photo de profil (`pic`).
 */
function displayPatientInfo(patientInfo) {
    const patientNameElement = document.getElementById('patientName');
    const patientImageElement = document.getElementById('patientImage');
    if (patientNameElement && patientImageElement) { // Vérification que les éléments ne sont pas null
        patientNameElement.textContent = patientInfo.name;
        if (patientInfo.pic) {
            patientImageElement.src = "src/Images/profile_pics/" + patientInfo.pic;
            patientImageElement.alt = `Photo de profil de ${patientInfo.name}`;
        }
    }
    else {
        console.error("Un des éléments HTML est manquant");
    }
}
/**
 * Initialise les audiogrammes lorsque la fenêtre se charge.
 * Crée les graphiques d'audiogramme et configure les gestionnaires d'événements pour les formulaires d'ajout de points.
 */
window.onload = function () {
    audiogramChartLeft = initAudiogram('audiogramLeft', 'rgb(0, 0, 0)', 'rgba(0, 1, 1)', 'Oreille Droite');
    audiogramChartRight = initAudiogram('audiogramRight', 'rgb(0,0,0)', 'rgb(0,1,1)', 'Oreille Gauche');
    audiogramChampLibre = initAudiogramChampLibre('audiogramChampLibre', 'rgb(0,0,0)', 'rgb(0,1,1)', 'Champ Libre');
    const legendSelector = document.getElementById('legendSelector');
    if (audiogramChartLeft && audiogramChartRight && audiogramChampLibre) {
        setupEventHandlers(audiogramChartLeft, audiogramChartRight, audiogramChampLibre, legendSelector);
    }
    fetchPatientInfo();
    getAudiogramData(audiogramChartLeft, 'left', legendSelector, getPatientIdFromUrl());
    getAudiogramData(audiogramChartRight, 'right', legendSelector, getPatientIdFromUrl());
    getAudiogramData(audiogramChampLibre, 'champLibre', legendSelector, getPatientIdFromUrl());
    setupClickListeners(audiogramChartLeft, 'gauche', legendSelector);
    setupClickListeners(audiogramChartRight, 'droite', legendSelector);
    setupClickListeners(audiogramChampLibre, 'champLibre', legendSelector);
    initTabs();
};
