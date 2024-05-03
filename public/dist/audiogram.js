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
// Recupération du bouton de suppression
let toggleDeletionMode = document.getElementById('toggleDeletionMode');
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
        const status = isDeletionModeActive ? "activé" : "désactivé";
        console.log("Mode de suppression est maintenant " + status);
        if (gomme) {
            // Afficher ou masquer l'image de la gomme
            gomme.style.display = isDeletionModeActive ? "block" : "none";
        }
        toggleShakeEffect(isDeletionModeActive);
        // Afficher une notification avec le statut du mode de suppression
        showNotification("Mode de suppression " + status, 3000);
        // Change le curseur
        document.body.style.cursor = isDeletionModeActive ? 'url("./src/Images/gomme.png"), auto' : 'default';
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
function deleteAllPointsFromCharts() {
    // Supprimer tous les points des graphiques
    audiogramChartLeft.data.datasets.forEach((dataset) => dataset.data = []);
    audiogramChartRight.data.datasets.forEach((dataset) => dataset.data = []);
    audiogramChampLibre.data.datasets.forEach((dataset) => dataset.data = []);
    audiogramChampLibre.update();
    audiogramChartLeft.update();
    audiogramChartRight.update();
}
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
// Fonction pour créer un canvas avec une lettre
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
function getPatientIdFromUrl() {
    // Crée un objet URLSearchParams à partir de l'URL actuelle
    const urlParams = new URLSearchParams(window.location.search);
    // Récupère l'ID du patient à partir des paramètres de l'URL
    const patientId = urlParams.get('id');
    // Retourne l'ID du patient ou une chaîne vide si non trouvé
    return patientId || '';
}
function addPointToLeftAudiogram(frequency, decibels, id, style) {
    // Vérifiez que cette fonction ajoute des points seulement à l'audiogramme gauche
    addDataPointAndSort(audiogramChartLeft, frequency, decibels, id, style);
}
function addPointToRightAudiogram(frequency, decibels, id, style) {
    // Vérifiez que cette fonction ajoute des points seulement à l'audiogramme droit
    addDataPointAndSort(audiogramChartRight, frequency, decibels, id, style);
}
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
// Assurez-vous que la liste est triée et unique
const uniqueDecibelLevels = Array.from(new Set(decibelLevels)).sort((a, b) => a - b);
console.log(uniqueDecibelLevels); // Affiche la liste triée pour vérification
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
        // Si le mode de suppression est actif, supprimer le point
        if (isDeletionModeActive) {
            const points = chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, false);
            if (points.length) {
                const datasetIndex = points[0].datasetIndex;
                const index = points[0].index;
                const pointData = chart.data.datasets[datasetIndex].data[index];
                console.log(pointData);
                removeDataPoint(chart, index, ear, pointData.id);
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
// Cette fonction est appelée au chargement de la page pour remplir le sélecteur de sons
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
function displayPatientInfo(patientInfo) {
    const patientNameElement = document.getElementById('patientName');
    const patientImageElement = document.getElementById('patientImage'); // Assertion de type
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
