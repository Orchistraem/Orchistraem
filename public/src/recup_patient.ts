interface Patient {
    id: string;
    name: string;
    archived: boolean;
}


/**
 * Récupère les informations d'un patient à partir d'un serveur et les affiche.
 *
 * Cette fonction extrait l'ID du patient de l'URL de la page actuelle, construit une URL pour accéder aux informations
 * du patient, et envoie une requête pour récupérer ces données. Si les informations sont récupérées avec succès,
 * elles sont passées à une fonction d'affichage. En cas d'échec de la requête, une erreur est enregistrée dans la console.
 */
function fetchPatientInfo() {
    let patientId = getPatientIdFromUrl()
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
  
  
  /**
   * Affiche les informations d'un patient sur l'interface utilisateur.
   *
   * Cette fonction met à jour les éléments HTML avec les informations du patient, telles que son nom et sa photo de profil.
   * Elle requiert que les éléments HTML pour afficher le nom et la photo du patient soient présents dans le DOM. Si les
   * informations ou les éléments HTML nécessaires sont manquants, une erreur est enregistrée dans la console.
   *
   * @param patientInfo - Un objet contenant les informations du patient, notamment son nom (`name`) et l'URL de sa photo de profil (`pic`).
   */
  function displayPatientInfo(patientInfo: any) {
    const patientNameElement = document.getElementById('patientName');
    const patientImageElement = document.getElementById('patientImage') as HTMLImageElement | null;
  
    if (patientNameElement && patientImageElement) { // Vérification que les éléments ne sont pas null
      patientNameElement.textContent = patientInfo.name;
      if (patientInfo.pic) {
          patientImageElement.src = "src/Images/profile_pics/"+patientInfo.pic;
          patientImageElement.alt = `Photo de profil de ${patientInfo.name}`;
      }
    } else {
      console.error("Un des éléments HTML est manquant");
    }
  }

async function fetchAllPatientInfo(): Promise<Patient[]> {
    try {
        const response = await fetch('/all-patient-info');
        if (!response.ok) {
            console.error('Erreur lors de la récupération des informations des patients:', response.statusText);
            return [];
        }
        return await response.json() as Patient[];
    } catch (error) {
        console.error('Erreur lors de la récupération des informations des patients:', error);
        return [];
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const patientId = getPatientIdFromUrl();
    fetch(`/patients/${patientId}/info.json`)
        .then(response => response.json())
        .then(patientData => {
            const archiveButton = document.getElementById('archiverPatient');
            if(archiveButton){
            updateArchiveButton(archiveButton, patientData.archived);
            }
        });

    const archiveButton = document.getElementById('archiverPatient');
    if(archiveButton) archiveButton.addEventListener('click', function() {
        console.log("click bouton archive")
        toggleArchiveStatus(patientId);
    });
});

function updateArchiveButton(button : HTMLElement, isArchived : Boolean) {
    if (isArchived) {
        button.textContent = 'Désarchiver ce patient';
    } else {
        button.textContent = 'Archiver ce patient';
    }
}

function toggleArchiveStatus(patientId : String) {
    fetch(`/toggle-archive/${patientId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.ok) {
            window.location.href = '/creer_patient.html';
            return response.json();
        } else {
            throw new Error('Failed to toggle archive status');
        }
    })
    .then(data => {
        
         const archiveButton = document.getElementById('archiverPatient');
         if(archiveButton)updateArchiveButton(archiveButton, data.newStatus);
    })
    .catch(error => {
        console.error(error);
    });
}


document.addEventListener('DOMContentLoaded', async () => {
    const patientsList = document.getElementById('patientsList');

    const patientInfos = await fetchAllPatientInfo();

    patientInfos.forEach((patient) => {
        const listItem = document.createElement('li');
        listItem.textContent = `${patient.name}`;
        if(patientsList) patientsList.appendChild(listItem);
    });
    
    if(patientsList)
    patientsList.addEventListener('click', (event) => {
        const listItem = event.target as Element;
        const patientIndex = Array.from(patientsList.children).indexOf(listItem);

        if (patientIndex !== -1) {
            const patientId = patientInfos[patientIndex].id;
            window.location.href = `patient.html?id=${patientId}`;
        }
    });
});

document.addEventListener('DOMContentLoaded', async () => {
    const patientsList = document.getElementById('patientsList') as HTMLUListElement;
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    const showArchived = document.getElementById('showArchived') as HTMLInputElement;

    let allPatientInfos = await fetchAllPatientInfo();

    function renderPatientList(patients: Patient[]) {
        if (patientsList) {
            patientsList.innerHTML = ''; 
            patients.forEach((patient) => {
                if (!patient.archived || showArchived.checked) {
                    const listItem = document.createElement('li');
                    listItem.textContent = patient.name;
                    listItem.setAttribute('data-patient-id', patient.id);
                    listItem.dataset.archived = patient.archived?.toString() || 'false';
                    patientsList.appendChild(listItem);
                }

            });
        }
    }

    renderPatientList(allPatientInfos);

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.toLowerCase();
            const filteredPatients = allPatientInfos.filter((patient: { name: string; }) => patient.name.toLowerCase().includes(searchTerm));
            renderPatientList(filteredPatients);
        });
    }

    if (showArchived) {
        showArchived.addEventListener('change', () => {
            renderPatientList(allPatientInfos); 
        });
    }

    if (patientsList) {
        patientsList.addEventListener('click', (event) => {
            const listItem = event.target as HTMLElement; 
            const patientId = listItem.getAttribute('data-patient-id'); 
    
            if (patientId) {
                window.location.href = `patient.html?id=${patientId}`;
            }
        });
    }
});
