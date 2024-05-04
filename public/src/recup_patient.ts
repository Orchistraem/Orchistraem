interface PatientInfo {
    id: string;
    name: string;
    age?: number;
    profile_pic?: string;
}

/**
 * Récupère les informations de tous les patients stockées dans des fichiers JSON spécifiques à chaque dossier de patient.
 *
 * Cette fonction itère sur les dossiers de patients stockés dans un répertoire spécifié, extrait les informations
 * de chaque patient à partir d'un fichier JSON et retourne un tableau contenant ces informations. Chaque entrée
 * du tableau représente un patient et inclut son identifiant (basé sur le nom du dossier) et son nom (extrait du fichier JSON).
 * En cas d'erreur lors de la récupération des fichiers ou des données, une erreur est enregistrée et un tableau vide est retourné.
 *
 * @returns Une promesse qui résout en un tableau d'objets `PatientInfo`, où chaque objet contient l'identifiant et le nom d'un patient.
 *          Si une erreur se produit, retourne un tableau vide.
 */
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

/**
 * Récupère les noms des dossiers des patients à partir d'un répertoire spécifié.
 *
 * Cette fonction envoie une requête HTTP pour accéder au contenu d'un répertoire spécifié et récupérer les noms des dossiers
 * qu'il contient. Ces noms sont supposés représenter des patients individuels. En cas de succès, elle retourne un tableau de chaînes
 * avec les noms des dossiers. Si la requête échoue ou si une erreur survient pendant le processus, elle retourne un tableau vide
 * et enregistre une erreur dans la console.
 *
 * @param patientsDir - Le chemin du répertoire contenant les dossiers des patients.
 * @returns Une promesse qui résout en un tableau de chaînes contenant les noms des dossiers des patients, ou un tableau vide en cas d'erreur.
 */
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
