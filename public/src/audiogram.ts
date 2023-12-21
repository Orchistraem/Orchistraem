// Déclare Chart.js comme une variable globale
declare var Chart: any; 
let audiogramChartLeft: any = null;
let audiogramChartRight: any = null;

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
  const addPointFormLeft = document.getElementById('addPointFormLeft') as HTMLFormElement;
  const addPointFormRight = document.getElementById('addPointFormRight') as HTMLFormElement;

  addPointFormLeft?.addEventListener('submit', function(event) {
    event.preventDefault();
    const frequenciesInput = document.getElementById('frequenciesLeft') as HTMLInputElement;
    const decibelsInput = document.getElementById('decibelsLeft') as HTMLInputElement;

    const frequencies = frequenciesInput.value.split(',').map(f => parseFloat(f.trim()));
    const decibels = decibelsInput.value.split(',').map(d => parseFloat(d.trim()));

    frequencies.forEach((frequency, index) => {
      const decibel = decibels[index];
      if (!isNaN(frequency) && !isNaN(decibel)) {
        addDataPoint(chartLeft, frequency, decibel);

        const audiogramDataLeft = {
          ear: 'gauche',
          frequency: frequency,
          decibels: decibel,
        };

        sendDataToServer(audiogramDataLeft);
      }
    });
  });

  addPointFormRight?.addEventListener('submit', function(event) {
    event.preventDefault();
    const frequenciesInput = document.getElementById('frequenciesRight') as HTMLInputElement;
    const decibelsInput = document.getElementById('decibelsRight') as HTMLInputElement;

    const frequencies = frequenciesInput.value.split(',').map(f => parseFloat(f.trim()));
    const decibels = decibelsInput.value.split(',').map(d => parseFloat(d.trim()));

    frequencies.forEach((frequency, index) => {
      const decibel = decibels[index];
      if (!isNaN(frequency) && !isNaN(decibel)) {
        addDataPoint(chartRight, frequency, decibel);

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


interface AudiogramData {
  ear: string;
  frequency: number;
  decibels: number;
}

function sendDataToServer(audiogramData : AudiogramData) {
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


function getAudiogramData() {
  fetch('/get-audiogram-data')
    .then(response => {
      if (!response.ok) {
        throw new Error('Erreur de réseau lors de la récupération des données');
      }
      return response.json();
    })
    .then(data => {
      // Mettez à jour l'état de votre application avec ces données
      console.log(data);
      updateAudiogramWithData(data);
    })
    .catch(error => console.error('Erreur lors de la récupération des données:', error));
}

function updateAudiogramWithData(data : AudiogramData[]) {
  if (Array.isArray(data)) {
      data.forEach((point) => {
          if (point.ear === 'gauche' && audiogramChartLeft) {
              addDataPoint(audiogramChartLeft, point.frequency, point.decibels);
          } else if (point.ear === 'droite' && audiogramChartRight) {
              addDataPoint(audiogramChartRight, point.frequency, point.decibels);
          }
      });
  }
}

// Initialise les audiogrammes lorsque la fenêtre se charge.
window.onload = function () {
  audiogramChartLeft = initAudiogram('audiogramLeft', 'rgba(0, 123, 255, 0.2)', 'rgba(0, 123, 255, 1)', 'Oreille Gauche');
  audiogramChartRight = initAudiogram('audiogramRight', 'rgb(255,160,122)', 'rgb(220,20,60)', 'Oreille Droite');
  if (audiogramChartLeft && audiogramChartRight) {
      setupEventHandlers(audiogramChartLeft, audiogramChartRight);
  }
  getAudiogramData();
};


