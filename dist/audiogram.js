"use strict";
/**
 * Initialise un audiogramme.
 *
 * Cette fonction crée et configure un audiogramme à l'aide de Chart.js.
 *
 * @returns L'instance de Chart créée ou null en cas d'échec.
 *
 */
function initAudiogram() {
    const canvas = document.getElementById('audiogram');
    if (canvas && canvas.getContext) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
            return new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [125, 250, 500, 1000, 2000, 4000, 8000],
                    datasets: [{
                            label: 'Niveau d\'audition (dB)',
                            data: Array(7).fill(null),
                            backgroundColor: 'rgba(0, 123, 255, 0.2)',
                            borderColor: 'rgba(0, 123, 255, 1)',
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
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Fréquence (Hz)'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    elements: {
                        line: {
                            tension: 0
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
    chart.update();
}
/**
 * Configure les gestionnaires d'événements pour l'audiogramme.
 *
 * @param chart - L'instance de l'audiogramme Chart.js.
 *
 * @example
 * setupEventHandlers(audiogramChart); // Configure les gestionnaires d'événements pour l'audiogramme
 */
function setupEventHandlers(chart) {
    const addPointForm = document.getElementById('addPointForm');
    addPointForm === null || addPointForm === void 0 ? void 0 : addPointForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const frequencyInput = document.getElementById('frequency');
        const decibelsInput = document.getElementById('decibels');
        const frequencyValue = parseFloat(frequencyInput.value);
        const decibelsValue = parseFloat(decibelsInput.value);
        addPointToAudiogram(chart, frequencyValue, decibelsValue);
    });
}
// Initialisation de l'audiogramme lorsque la fenêtre se charge
window.onload = function () {
    const audiogramChart = initAudiogram();
    if (audiogramChart) {
        setupEventHandlers(audiogramChart);
    }
};
