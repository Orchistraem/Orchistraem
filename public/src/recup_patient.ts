interface PatientInfo {
    id: string;
    name: string;
    age?: number;
    profile_pic?: string;
}

async function fetchAllPatientInfo(): Promise<PatientInfo[]> {
    const patientsDir = './data/patients';
    const patientInfos: PatientInfo[] = [];

    try {
        const patientFolderNames = await fetchPatientFolders(patientsDir);
        
        for (const folderName of patientFolderNames) {
            const infoFilePath = `${patientsDir}/${folderName}/info.json`;
            const response = await fetch(infoFilePath);

            if (response.ok) {
                const patientData = await response.json();
                const patientInfo: PatientInfo = { id: folderName, name: patientData.name };
                patientInfos.push(patientInfo);
            } else {
                console.error(`Erreur lors de la récupération des informations du patient ${folderName}: ${response.statusText}`);
            }
        }

        return patientInfos;
    } catch (error) {
        console.error('Erreur lors de la récupération des informations des patients:', error);
        return [];
    }
}

async function fetchPatientFolders(patientsDir: string): Promise<string[]> {
    try {
        const response = await fetch(patientsDir);
        if (response.ok) {
            const folderNames = await response.json();
            return folderNames;
        } else {
            console.error(`Erreur lors de la récupération des dossiers patients: ${response.statusText}`);
            return [];
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des dossiers patients:', error);
        return [];
    }
}
