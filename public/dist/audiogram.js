"use strict";
// Déclaration des instances de Chart.js pour les audiogrammes de chaque oreille.
let audiogramChartLeft = null;
let audiogramChartRight = null;
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
                    labels: [125, 250, 500, 1000, 2000, 4000, 8000],
                    datasets: [{
                            label: 'Seuil Auditif (dB)',
                            data: [],
                            showLine: true,
                            backgroundColor: pointColor,
                            borderColor: borderColor,
                            borderWidth: 1,
                            pointRadius: 5
                        }]
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
                                chart.ticks = [125, 250, 500, 1000, 2000, 4000, 8000];
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
                        legend: {
                            display: false
                        },
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
                    },
                    elements: {
                        line: {
                            tension: 0 // Lignes droites sans courbure
                        }
                    },
                    responsive: false,
                    maintainAspectRatio: true
                }
            });
        }
    }
    return null; // Retourne null si le canvas ou le contexte 2D n'existe pas
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
function addDataPointAndSort(chart, frequency, decibels) {
    const newDataPoint = { x: frequency, y: decibels };
    chart.data.datasets[0].data.push(newDataPoint);
    chart.data.datasets[0].data.sort((a, b) => a.x - b.x);
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
function setupEventHandlers(chartLeft, chartRight) {
    const addPointFormLeft = document.getElementById('addPointFormLeft');
    const addPointFormRight = document.getElementById('addPointFormRight');
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
                addDataPointAndSort(chartLeft, frequency, decibel);
                const audiogramDataLeft = {
                    ear: 'gauche',
                    frequency: frequency,
                    decibels: decibel,
                };
                sendDataToServer(audiogramDataLeft);
            }
            else {
                alert(errorMessage);
            }
        });
    });
    addPointFormRight === null || addPointFormRight === void 0 ? void 0 : addPointFormRight.addEventListener('submit', function (event) {
        event.preventDefault();
        const frequenciesInput = document.getElementById('frequenciesRight');
        const decibelsInput = document.getElementById('decibelsRight');
        const frequencies = frequenciesInput.value.split(',').map(f => parseFloat(f.trim()));
        const decibels = decibelsInput.value.split(',').map(d => parseFloat(d.trim()));
        frequencies.forEach((frequency, index) => {
            const decibel = decibels[index];
            if (!isNaN(frequency) && !isNaN(decibel)) {
                addDataPointAndSort(chartRight, frequency, decibel);
                const audiogramDataRight = {
                    ear: 'droite',
                    frequency: frequency,
                    decibels: decibel,
                };
                sendDataToServer(audiogramDataRight);
            }
        });
    });
}
/**
 * Envoie les données d'audiogramme au serveur via une requête POST.
 *
 * @param audiogramData - Les données de l'audiogramme à envoyer.
 * @throws {Error} - Lance une erreur si l'envoi des données échoue.
 */
function sendDataToServer(audiogramData) {
    fetch('/audiogram', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(audiogramData),
    })
        .then(response => {
        if (response.ok) {
            return response.text();
        }
        throw new Error('Erreur dans l\'envoi des données');
    })
        .then(data => console.log(data))
        .catch(error => console.error('Erreur:', error));
}
/**
 * Récupère les données d'audiogramme du serveur.
 *
 * @throws {Error} - Lance une erreur si la récupération des données échoue.
 */
function getAudiogramData() {
    fetch('/get-audiogram-data')
        .then(response => {
        if (!response.ok) {
            throw new Error('Erreur de réseau lors de la récupération des données');
        }
        return response.json();
    })
        .then(data => {
        console.log(data);
        updateAudiogramWithData(data);
    })
        .catch(error => console.error('Erreur lors de la récupération des données:', error));
}
/**
 * Met à jour les graphiques d'audiogramme avec les données récupérées.
 *
 * @param data - Un tableau de données d'audiogramme à utiliser pour mettre à jour les graphiques.
 */
function updateAudiogramWithData(data) {
    if (Array.isArray(data)) {
        data.forEach((point) => {
            if (point.ear === 'gauche' && audiogramChartLeft) {
                addDataPointAndSort(audiogramChartLeft, point.frequency, point.decibels);
            }
            else if (point.ear === 'droite' && audiogramChartRight) {
                addDataPointAndSort(audiogramChartRight, point.frequency, point.decibels);
            }
        });
    }
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
 * Écoute les clics sur le graphique et ajoute des points d'audiogramme en fonction de la position du clic.
 */
function setupClickListeners(chart, ear) {
    const canvas = chart.canvas;
    canvas.addEventListener('click', function (event) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        let { frequency, decibels } = convertClickToChartData(chart, x, y);
        frequency = findNearestFrequency(frequency, standardFrequencies); // Mettre à jour avec la nouvelle méthode
        decibels = snapToDecibelLevels(decibels); // Ajustement des décibels si nécessaire
        addDataPointAndSort(chart, frequency, decibels); // Ajouter et trier
        sendDataToServer({ ear, frequency, decibels }); // Envoyer au serveur
    });
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
/**
 * Initialise les audiogrammes lorsque la fenêtre se charge.
 * Crée les graphiques d'audiogramme et configure les gestionnaires d'événements pour les formulaires d'ajout de points.
 */
window.onload = function () {
    audiogramChartLeft = initAudiogram('audiogramLeft', 'rgb(0, 123, 255)', 'rgba(0, 123, 255)', 'Oreille Gauche');
    audiogramChartRight = initAudiogram('audiogramRight', 'rgb(220,20,60)', 'rgb(220,20,60)', 'Oreille Droite');
    if (audiogramChartLeft && audiogramChartRight) {
        setupEventHandlers(audiogramChartLeft, audiogramChartRight);
    }
    getAudiogramData();
    setupClickListeners(audiogramChartLeft, 'gauche');
    setupClickListeners(audiogramChartRight, 'droite');
    initTabs();
    setupUploadAudioForm();
};
