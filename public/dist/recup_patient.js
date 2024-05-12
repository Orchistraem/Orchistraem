"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function fetchAllPatientInfo() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch('/all-patient-info');
            if (!response.ok) {
                console.error('Erreur lors de la récupération des informations des patients:', response.statusText);
                return [];
            }
            return yield response.json();
        }
        catch (error) {
            console.error('Erreur lors de la récupération des informations des patients:', error);
            return [];
        }
    });
}
document.addEventListener('DOMContentLoaded', function () {
    const patientId = getPatientIdFromUrl();
    fetch(`/patients/${patientId}/info.json`)
        .then(response => response.json())
        .then(patientData => {
        const archiveButton = document.getElementById('archiverPatient');
        if (archiveButton) {
            updateArchiveButton(archiveButton, patientData.archived);
        }
    });
    const archiveButton = document.getElementById('archiverPatient');
    if (archiveButton)
        archiveButton.addEventListener('click', function () {
            console.log("click bouton archive");
            toggleArchiveStatus(patientId);
        });
});
function updateArchiveButton(button, isArchived) {
    if (isArchived) {
        button.textContent = 'Désarchiver ce patient';
    }
    else {
        button.textContent = 'Archiver ce patient';
    }
}
function toggleArchiveStatus(patientId) {
    fetch(`/toggle-archive/${patientId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
        if (response.ok) {
            return response.json();
        }
        else {
            throw new Error('Failed to toggle archive status');
        }
    })
        .then(data => {
        const archiveButton = document.getElementById('archiverPatient');
        if (archiveButton)
            updateArchiveButton(archiveButton, data.newStatus);
    })
        .catch(error => {
        console.error(error);
    });
}
document.addEventListener('DOMContentLoaded', () => __awaiter(void 0, void 0, void 0, function* () {
    const patientsList = document.getElementById('patientsList');
    const patientInfos = yield fetchAllPatientInfo();
    patientInfos.forEach((patient) => {
        const listItem = document.createElement('li');
        listItem.textContent = `${patient.name}`;
        if (patientsList)
            patientsList.appendChild(listItem);
    });
    if (patientsList)
        patientsList.addEventListener('click', (event) => {
            const listItem = event.target;
            const patientIndex = Array.from(patientsList.children).indexOf(listItem);
            if (patientIndex !== -1) {
                const patientId = patientInfos[patientIndex].id;
                window.location.href = `patient.html?id=${patientId}`;
            }
        });
}));
document.addEventListener('DOMContentLoaded', () => __awaiter(void 0, void 0, void 0, function* () {
    const patientsList = document.getElementById('patientsList');
    const searchInput = document.getElementById('searchInput');
    const showArchived = document.getElementById('showArchived');
    let allPatientInfos = yield fetchAllPatientInfo();
    function renderPatientList(patients) {
        if (patientsList) {
            patientsList.innerHTML = '';
            patients.forEach(patient => {
                var _a;
                if (!patient.archived || showArchived.checked) {
                    const listItem = document.createElement('li');
                    listItem.textContent = patient.name;
                    listItem.dataset.archived = ((_a = patient.archived) === null || _a === void 0 ? void 0 : _a.toString()) || 'false';
                    patientsList.appendChild(listItem);
                }
            });
        }
    }
    renderPatientList(allPatientInfos);
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.toLowerCase();
            const filteredPatients = allPatientInfos.filter((patient) => patient.name.toLowerCase().includes(searchTerm));
            renderPatientList(filteredPatients);
        });
    }
    if (showArchived) {
        showArchived.addEventListener('change', () => {
            renderPatientList(allPatientInfos); // Re-rendre la liste avec le nouveau filtre
        });
    }
    if (patientsList) {
        patientsList.addEventListener('click', (event) => {
            const listItem = event.target;
            const patientIndex = Array.from(patientsList.children).indexOf(listItem);
            if (patientIndex !== -1) {
                const patientId = allPatientInfos[patientIndex].id;
                window.location.href = `patient.html?id=${patientId}`;
            }
        });
    }
}));
