// Déclare Chart.js comme une variable globale
declare var Chart: any;

// Déclaration des instances de Chart.js pour les audiogrammes de chaque oreille.
let audiogramChartLeft: any = null;
let audiogramChartRight: any = null;

// Mode de suppression désactivé par défaut
let isDeletionModeActive = false;

// Recupération du bouton de suppression
let toggleDeletionMode = document.getElementById('toggleDeletionMode');

// Ajout de l'ecouteur
if (toggleDeletionMode){
  toggleDeletionMode.addEventListener('click', function() {
    isDeletionModeActive = !isDeletionModeActive;
    console.log("Mode de suppression est maintenant " + (isDeletionModeActive ? "activé" : "désactivé"));
  });
}

// On recupère le bouton de selection de légende
let legendSelector = document.getElementById('legendSelector');

// On ajoute l'ecouteur pour chaque changement de légende
if(legendSelector){

  legendSelector.addEventListener('change', (event) => {
    const selectedLegend = (event.target as HTMLSelectElement).value;
    updatePointStyle(selectedLegend);
  });
}

/**
 * Met à jour le style des points de l'audiogramme.
 * 
 * Cette fonction modifie le style des points sur le graphique de l'audiogramme de l'oreille gauche.
 * Elle permet de choisir entre un style de point standard (cercle) ou une lettre personnalisée.
 * 
 * @param selectedStyle - Le style de point sélectionné (par exemple 'A', 'I', ou 'circle').
 */
function updatePointStyle(selectedStyle: string): void {
  audiogramChartLeft.data.datasets.forEach((dataset:any) => {
    dataset.pointStyle = selectedStyle === 'circle' ? 'circle' : createPointStyle(selectedStyle);
  });
  audiogramChartLeft.update(); // Changement de style pour l'audiogram de gauche
}




/**
 * Représente les données d'un audiogramme pour une oreille spécifique.
 * 
 * Cette interface est utilisée pour typer les données envoyées au serveur et celles récupérées.
 */
interface AudiogramData {
  id: string;
  ear: string;
  frequency: number;
  decibels: number;
}

// Define un type pour les points sur l'audiogramme
type DataPoint = {
  x: number; // Frequency
  y: number; // Decibels
};

// Fonction pour créer un canvas avec une lettre
function createPointStyle(letter: string): HTMLCanvasElement | string {
  if (letter === 'circle') {
    return 'circle';
  }
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
    context.fillText(letter, pointSize, pointSize); // Dessiner la lettre au centre
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
                      pointRadius: 5,
                      pointStyle: (context: any, index: any) => createPointStyle('A')
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
 * Ajoute un point à l'audiogramme et trie le point.
 * 
 * @param chart - L'instance de l'audiogramme Chart.js.
 * @param frequency - La fréquence à ajouter ou mettre à jour.
 * @param decibels - Le niveau en décibels correspondant à la fréquence.
 * 
 * @example
 * addDataPointAndSort(audiogramChart, 1000, 20); // Ajoute ou met à jour le point à 1000 Hz avec 20 dB
 */
function addDataPointAndSort(chart: any, frequency: number, decibels: number, id : string): void {
  const newDataPoint = { x: frequency, y: decibels, id: id };
  chart.data.datasets[0].data.push(newDataPoint);
  chart.data.datasets[0].data.sort((a: { x: number }, b: { x: number }) => a.x - b.x);
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
              addDataPointAndSort(chartLeft, frequency, decibel, uniqueId);
        const audiogramDataLeft = {
          ear: 'gauche',
          frequency: frequency,
          decibels: decibel,
          id: uniqueId
        };
        sendDataToServer(audiogramDataLeft);
      }else {
        alert(errorMessage);
    }
    });
  });

  addPointFormRight?.addEventListener('submit', function(event) {
    event.preventDefault();
    const frequenciesInput = document.getElementById('frequenciesRight') as HTMLInputElement;
    const decibelsInput = document.getElementById('decibelsRight') as HTMLInputElement;

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
      addDataPointAndSort(chartLeft, frequency, decibel, uniqueId);

        const audiogramDataRight = {
          ear: 'droite',
          frequency: frequency,
          decibels: decibel,
          id: uniqueId,
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
function sendDataToServer(audiogramData: AudiogramData) {
  let url = '/audiogram'; // URL de base

  // Vérifie si l'audiogramme est pour l'oreille gauche ou droite
  if (audiogramData.ear === 'gauche') {
      url = '/audiogram/left'; // Modifiez ceci pour le chemin du dossier de l'oreille gauche
  } else if (audiogramData.ear === 'droite') {
      url = '/audiogram/right'; // Modifiez ceci pour le chemin du dossier de l'oreille droite
  }

  // La requête POST est envoyée à l'URL appropriée
  fetch(url, {
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
function updateAudiogramWithData(data: AudiogramData[]) {
  data.forEach((point) => {
    if (point.ear === 'gauche' && audiogramChartLeft) {
      addDataPointAndSort(audiogramChartLeft, point.frequency, point.decibels, point.id);
    } else if (point.ear === 'droite' && audiogramChartRight) {
      addDataPointAndSort(audiogramChartRight, point.frequency, point.decibels, point.id);
    }
  });
}

const standardFrequencies = [125, 250, 500, 1000, 2000, 4000, 8000];
const decibelLevels: number[] = [];

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
  } else {
    console.error("L'élément .tab2 n'a pas été trouvé dans le document.");
  }

  if (tab2) {
    tab2.addEventListener('click', toggleDropdownMenu);
  } else {
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
function setupClickListeners(chart: any, ear: string) {
  const canvas = chart.canvas;
  canvas.addEventListener('click', function(event: MouseEvent) {

     // Si le mode de suppression est actif, supprimer le point
     if (isDeletionModeActive) {
      const points = chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, false);
      if (points.length) {
        const index = points[0].index;
        const pointData = chart.data.datasets[0].data[index];

        if (window.confirm("Voulez-vous supprimer ce point ?")) {
          removeDataPoint(chart, index, ear, pointData.id);
        }
      }
    } else {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
      
        let { frequency, decibels } = convertClickToChartData(chart, x, y);
      
        frequency = findNearestFrequency(frequency, standardFrequencies); // Mettre à jour avec la nouvelle méthode
        decibels = snapToDecibelLevels(decibels); // Ajustement des décibels si nécessaire
      
        const id = Date.now().toString(); // Générer un ID unique ici
        addDataPointAndSort(chart, frequency, decibels, id);
        sendDataToServer({ ear, frequency, decibels, id }); // Envoyer au serveur
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
function removeDataPoint(chart: any, index : number, ear : string, pointId : string) {
  // Supprimer le point du graphique
  chart.data.datasets[0].data.splice(index, 1);
  chart.update();

  // Construire l'URL pour la requête DELETE
  const url = `/audiogram/${ear}/${pointId}`;

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
function convertClickToChartData(chart: any, clickX: number, clickY: number) {
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
function findNearestFrequency(frequency: number, standardFrequencies: number[]): number {
  if (frequency <= standardFrequencies[0]) return standardFrequencies[0];
  if (frequency >= standardFrequencies[standardFrequencies.length - 1]) return standardFrequencies[standardFrequencies.length - 1];

  for (let i = 0; i < standardFrequencies.length - 1; i++) {
    const lower = standardFrequencies[i];
    const upper = standardFrequencies[i + 1];
    const middle = (lower + upper) / 2;

    if (frequency === middle) {
      // Si la fréquence est exactement au milieu, on la retourne
      return frequency;
    } else if (frequency > lower && frequency < middle) {
      // Si la fréquence est plus proche de la borne inférieure, on retourne la borne inférieure
      return lower;
    } else if (frequency > middle && frequency < upper) {
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
function snapToDecibelLevels(decibels: number): number {
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
  const audioFileInput = document.getElementById('audioFile') as HTMLInputElement | null;

  if (uploadAudioForm && audioFileInput) {
      uploadAudioForm.addEventListener('submit', function(event) {
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
          } else {
              console.error('Aucun fichier n\'a été sélectionné.');
          }
      });
  } else {
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


