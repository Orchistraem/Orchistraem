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
function initAudiogram() {
  const canvas = document.getElementById('audiogram') as HTMLCanvasElement | null;
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
                      showLine: true,
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
                      }
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


// This function can handle arbitrary frequencies.
function addDataPoint(chart: any, frequency: number, decibels: number): void {
  // Add the new data point
  chart.data.datasets[0].data.push({ x: frequency, y: decibels });

  // Filter out null values and then sort the data based on the x value
  chart.data.datasets[0].data = chart.data.datasets[0].data
    .filter((point: any) => point !== null && point !== undefined)
    .sort((a: any, b: any) => a.x - b.x);

  // Update the chart
  chart.update();
}


// Set up event handlers for the form.
function setupEventHandlers(chart: any) {
  const addPointForm = document.getElementById('addPointForm');
  addPointForm?.addEventListener('submit', function(event) {
    event.preventDefault();
    const frequencyInput = document.getElementById('frequency') as HTMLInputElement;
    const decibelsInput = document.getElementById('decibels') as HTMLInputElement;
    const frequencyValue = parseFloat(frequencyInput.value);
    const decibelsValue = parseFloat(decibelsInput.value);
    addDataPoint(chart, frequencyValue, decibelsValue);
  });
}

// Initialize the audiogram when the window loads.
window.onload = function () {
  const audiogramChart= initAudiogram();
  if (audiogramChart) {
    setupEventHandlers(audiogramChart);
  }
}
