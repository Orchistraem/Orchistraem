// Déclare Chart.js comme une variable globale
declare var Chart: any; 

/**
 * Initialise un audiogramme.
 * 
 * Cette fonction crée et configure un audiogramme à l'aide de Chart.js. 
 * 
 * @returns L'instance de Chart créée ou null en cas d'échec.
 * 
 */
function initAudiogram(canvasID: string, pointColor: string, borderColor: string, earSide: string) {
  const canvas = document.getElementById(canvasID) as HTMLCanvasElement | null;
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
                          callback: function(value: number, index: number, ticks: any[]) {
                            return value.toString();
                          }
                        },
                        afterBuildTicks: function(chart: any) {
                          chart.ticks = [125, 250, 500, 1000, 2000, 4000, 8000];
                          chart.ticks.forEach(function(value: number, index: number, array: any[]) {
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
function addPointToAudiogram(chart: any, frequency: number, decibels: number): void {
  const labels = chart.data.labels as Array<number>;
  const data = chart.data.datasets[0].data as number[];

  if (!labels.includes(frequency)) {
    labels.push(frequency);
    data.push(decibels);
  } else {
    const index = labels.indexOf(frequency);
    data[index] = decibels;
  }
  console.log(chart.data.datasets[0].data);
  chart.update();
}

function addArbitraryPointToAudiogram(chart: any, frequency: number, decibels: number): void {
  chart.data.datasets[0].data.push({
    x: frequency,
    y: decibels
  });

  chart.update();
}

/**
 * Ajoute un point de données à un audiogramme.
 * 
 * Cette fonction prend une fréquence et un niveau de décibels, les ajoute au graphique et trie les données pour s'assurer que les points sont affichés dans l'ordre correct. 
 * La fonction filtre également les valeurs nulles avant de trier pour éviter les erreurs.
 * 
 * @param chart - L'instance de l'audiogramme Chart.js à mettre à jour.
 * @param frequency - La fréquence du point à ajouter.
 * @param decibels - Le niveau de décibels correspondant à la fréquence.
 */
function addDataPoint(chart: any, frequency: number, decibels: number): void {
  chart.data.datasets[0].data.push({ x: frequency, y: decibels });

  chart.data.datasets[0].data = chart.data.datasets[0].data
    .filter((point: any) => point !== null && point !== undefined)
    .sort((a: any, b: any) => a.x - b.x);

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
function setupEventHandlers(chartLeft: any, chartRight: any) {
  const addPointFormLeft = document.getElementById('addPointFormLeft');
  const addPointFormRight = document.getElementById('addPointFormRight');

  addPointFormLeft?.addEventListener('submit', function(event) {
    event.preventDefault();
    const frequencyInput = document.getElementById('frequencyLeft') as HTMLInputElement;
    const decibelsInput = document.getElementById('decibelsLeft') as HTMLInputElement;
    const frequencyValue = parseFloat(frequencyInput.value);
    const decibelsValue = parseFloat(decibelsInput.value);
    addDataPoint(chartLeft, frequencyValue, decibelsValue);
  });

  addPointFormRight?.addEventListener('submit', function(event) {
    event.preventDefault();
    const frequencyInput = document.getElementById('frequencyRight') as HTMLInputElement;
    const decibelsInput = document.getElementById('decibelsRight') as HTMLInputElement;
    const frequencyValue = parseFloat(frequencyInput.value);
    const decibelsValue = parseFloat(decibelsInput.value);
    addDataPoint(chartRight, frequencyValue, decibelsValue);
  });
}
