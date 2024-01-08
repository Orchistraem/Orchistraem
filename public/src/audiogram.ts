// Déclare Chart.js comme une variable globale
declare var Chart: any;

// Déclaration des instances de Chart.js pour les audiogrammes de chaque oreille.
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
  chart.data.datasets[0].data.push({ x: frequency, y: decibels });
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

/**
 * Représente les données d'un audiogramme pour une oreille spécifique.
 * 
 * Cette interface est utilisée pour typer les données envoyées au serveur et celles récupérées.
 */
interface AudiogramData {
  ear: string;
  frequency: number;
  decibels: number;
}

/**
 * Envoie les données d'audiogramme au serveur via une requête POST.
 * 
 * @param audiogramData - Les données de l'audiogramme à envoyer.
 * @throws {Error} - Lance une erreur si l'envoi des données échoue.
 */
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
const standardFrequencies = [125, 250, 500, 1000, 2000, 4000, 8000];
const decibelLevels = [-10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120]; 
for (let i = -10; i <= 120; i += 10) {
  decibelLevels.push(i);
}
document.addEventListener('DOMContentLoaded', (event) => {
  const tab1 = document.querySelector('.tab2');
  const tab2 = document.querySelector('.tab1');

  if (tab1) {
    tab1.addEventListener('click', () => {
        // Code pour couper le son
        muteAllAudio();
    });
  } else {
    console.error("L'élément .tab2 n'a pas été trouvé dans le document.");
  }

  if (tab2) {
    tab2.addEventListener('click', () => {
        // Afficher le menu déroulant
        const dropdownMenu = document.querySelector('.dropdown-menu');
        if (dropdownMenu) {
          dropdownMenu.classList.toggle('show');
        } else {
          console.error("Le menu déroulant n'a pas été trouvé dans le document.");
        }
    });
  } else {
    console.error("L'élément .tab1 n'a pas été trouvé dans le document.");
  }
});

// Exemple de fonction pour couper tous les sons (à adapter selon vos besoins)
function muteAllAudio() {
  const audios = document.querySelectorAll('audio');
  audios.forEach(audio => audio.muted = true);
}

// Exemple de code pour la liste des patients (à adapter selon vos besoins)
function createDropdownMenu() {
  const patients = ['Patient 1', 'Patient 2', 'Patient 3']; // Ajoutez vos patients ici
  const menu = document.createElement('div');
  menu.classList.add('dropdown-menu');

  patients.forEach(patient => {
      const item = document.createElement('div');
      item.textContent = patient;
      menu.appendChild(item);
  });

  document.body.appendChild(menu);
}

function toggleDropdownMenu() {
  const dropdownMenu = document.querySelector('.dropdown-menu');
  if (dropdownMenu) {
    dropdownMenu.classList.toggle('show');
  }
}


/**
 * Écoute les clics sur le graphique et ajoute des points d'audiogramme en fonction de la position du clic.
 */
function setupClickListeners(chart: any, ear: string) {
  const canvas = chart.canvas;
  canvas.addEventListener('click', function(event: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    let { frequency, decibels } = convertClickToChartData(chart, x, y);

    frequency = nearestStandardFrequency(frequency);
    decibels = snapToDecibelLevels(decibels);

    addPointToAudiogram(chart, frequency, decibels);

    sendDataToServer({ ear, frequency, decibels });
  });
}


function convertClickToChartData(chart: any, clickX: number, clickY: number) {
  const xAxis = chart.scales.x;
  const yAxis = chart.scales.y;

  const frequency = xAxis.getValueForPixel(clickX);
  const decibels = yAxis.getValueForPixel(clickY);

  return { frequency, decibels };
}

function nearestStandardFrequency(frequency: number) {
  const standardFrequencies = [125, 250, 500, 1000, 2000, 4000, 8000];
  let nearest = standardFrequencies[0];
  let smallestDifference = Math.abs(frequency - nearest);

  for (let i = 1; i < standardFrequencies.length; i++) {
    const currentDifference = Math.abs(frequency - standardFrequencies[i]);
    if (currentDifference < smallestDifference) {
      smallestDifference = currentDifference;
      nearest = standardFrequencies[i];
    }
  }

  return nearest;
}

function snapToDecibelLevels(decibels: number) {
  return decibelLevels.reduce((prev, curr) => (Math.abs(curr - decibels) < Math.abs(prev - decibels) ? curr : prev));
}

const startRecordButton: HTMLButtonElement = document.getElementById('startRecord') as HTMLButtonElement;
const stopRecordButton: HTMLButtonElement = document.getElementById('stopRecord') as HTMLButtonElement;
let mediaRecorder: MediaRecorder;
let audioChunks: BlobPart[] = [];

navigator.mediaDevices.getUserMedia({ audio: true })
    .then((stream: MediaStream) => {
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (event: BlobEvent) => {
            audioChunks.push(event.data);
        };

        startRecordButton.onclick = () => {
            audioChunks = [];
            mediaRecorder.start();
        };

        stopRecordButton.onclick = () => {
            mediaRecorder.stop();
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const formData = new FormData();
            formData.append("audioFile", audioBlob);

            fetch("/upload-audio", { method: "POST", body: formData });
        };
    }).catch((error: Error) => {
        console.error("Error accessing media devices:", error);
    });


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
};


