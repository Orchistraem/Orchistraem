"use strict";
/**
 * Initialise un audiogramme.
 *
 * Cette fonction crée et configure un audiogramme à l'aide de Chart.js.
 *
 * @returns L'instance de Chart créée ou null en cas d'échec.
 *
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
                            data: Array(7).fill(null),
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
 * Ajoute un point à l'audiogramme.
 *
 * @param chart - L'instance de l'audiogramme Chart.js.
 * @param frequency - La fréquence à ajouter ou mettre à jour.
 * @param decibels - Le niveau en décibels correspondant à la fréquence.
 *
 * @example
 * addPointToAudiogram(audiogramChart, 1000, 20); // Ajoute ou met à jour le point à 1000 Hz avec 20 dB
 */
function addPointToAudiogram(chart, frequency, decibels) {
    const labels = chart.data.labels;
    const data = chart.data.datasets[0].data;
    if (!labels.includes(frequency)) {
        labels.push(frequency);
        data.push(decibels);
    }
    else {
        const index = labels.indexOf(frequency);
        data[index] = decibels;
    }
    console.log(chart.data.datasets[0].data);
    chart.update();
}
function addArbitraryPointToAudiogram(chart, frequency, decibels) {
    chart.data.datasets[0].data.push({
        x: frequency,
        y: decibels
    });
    chart.update();
}
// ... autres parties du script ...
// Cette fonction peut gérer des fréquences arbitraires.
function addDataPoint(chart, frequency, decibels) {
    // Ajoute le nouveau point de données
    chart.data.datasets[0].data.push({ x: frequency, y: decibels });
    // Filtre les valeurs nulles puis trie les données en fonction de la valeur x
    chart.data.datasets[0].data = chart.data.datasets[0].data
        .filter((point) => point !== null && point !== undefined)
        .sort((a, b) => a.x - b.x);
    // Met à jour le graphique
    chart.update();
}
function setupEventHandlers(chartLeft, chartRight) {
    const addPointFormLeft = document.getElementById('addPointFormLeft');
    const addPointFormRight = document.getElementById('addPointFormRight');
    addPointFormLeft === null || addPointFormLeft === void 0 ? void 0 : addPointFormLeft.addEventListener('submit', function (event) {
        event.preventDefault();
        const frequencyInput = document.getElementById('frequencyLeft');
        const decibelsInput = document.getElementById('decibelsLeft');
        const frequencyValue = parseFloat(frequencyInput.value);
        const decibelsValue = parseFloat(decibelsInput.value);
        addDataPoint(chartLeft, frequencyValue, decibelsValue);
    });
    addPointFormRight === null || addPointFormRight === void 0 ? void 0 : addPointFormRight.addEventListener('submit', function (event) {
        event.preventDefault();
        const frequencyInput = document.getElementById('frequencyRight');
        const decibelsInput = document.getElementById('decibelsRight');
        const frequencyValue = parseFloat(frequencyInput.value);
        const decibelsValue = parseFloat(decibelsInput.value);
        addDataPoint(chartRight, frequencyValue, decibelsValue);
    });
}
// Initialise les audiogrammes lorsque la fenêtre se charge.
window.onload = function () {
    const audiogramChartLeft = initAudiogram('audiogramLeft', 'rgba(0, 123, 255, 0.2)', 'rgba(0, 123, 255, 1)', 'Oreille Gauche');
    const audiogramChartRight = initAudiogram('audiogramRight', 'rgb(255,160,122)', 'rgb(220,20,60)', 'Oreille Droite');
    if (audiogramChartLeft && audiogramChartRight) {
        setupEventHandlers(audiogramChartLeft, audiogramChartRight);
    }
};
