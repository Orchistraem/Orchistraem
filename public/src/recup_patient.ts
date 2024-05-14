interface Patient {
    id: string;
    name: string;
    archived: boolean;
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
