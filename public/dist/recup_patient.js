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
        const patientsDir = './data/patients';
        const patientInfos = [];
        try {
            const patientFolderNames = yield fetchPatientFolders(patientsDir);
            for (const folderName of patientFolderNames) {
                const infoFilePath = `${patientsDir}/${folderName}/info.json`;
                const response = yield fetch(infoFilePath);
                if (response.ok) {
                    const patientData = yield response.json();
                    const patientInfo = { id: folderName, name: patientData.name };
                    patientInfos.push(patientInfo);
                }
                else {
                    console.error(`Erreur lors de la récupération des informations du patient ${folderName}: ${response.statusText}`);
                }
            }
            return patientInfos;
        }
        catch (error) {
            console.error('Erreur lors de la récupération des informations des patients:', error);
            return [];
        }
    });
}
function fetchPatientFolders(patientsDir) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch(patientsDir);
            if (response.ok) {
                const folderNames = yield response.json();
                return folderNames;
            }
            else {
                console.error(`Erreur lors de la récupération des dossiers patients: ${response.statusText}`);
                return [];
            }
        }
        catch (error) {
            console.error('Erreur lors de la récupération des dossiers patients:', error);
            return [];
        }
    });
}
