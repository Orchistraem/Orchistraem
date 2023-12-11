"use strict";
window.onload = function () {
    const canvas = document.getElementById('audiogram');
    if (!canvas) {
        console.error('Élément canvas non trouvé dans le DOM');
        return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Impossible de récupérer le contexte de rendu 2D');
        return;
    }
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: [125, 250, 500, '1k', '2k', '4k', '8k'],
            datasets: [{
                    label: 'Hearing Level (dB)',
                    data: Array(7).fill(null),
                    backgroundColor: 'rgba(0, 123, 255, 0.2)',
                    borderColor: 'rgba(0, 123, 255, 1)',
                    borderWidth: 1,
                    pointRadius: 0
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
            options: {
                responsive: false, // Empêche le redimensionnement automatique
                maintainAspectRatio: true, // Maintient l'aspect ratio si nécessaire
                // Autres options...
            },
        }
    });
};
