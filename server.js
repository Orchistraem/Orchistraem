const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();
const port = 3000;
const path = require('path');


// Pour lire le corps des requêtes POST en JSON
app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

const audioMetadataPath = path.join(__dirname, 'data', 'audioMetadata.json');

app.post('/assign-category', (req, res) => {
  const { fileName, categoryName } = req.body;

  // Vérifie l'existence du fichier dans le dossier uploads/
  const filePath = path.join(__dirname, 'uploads', fileName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send({ error: 'Fichier non trouvé dans les uploads', fileName });
  }

  let audioMetadata = [];
  if (fs.existsSync(audioMetadataPath)) {
    audioMetadata = JSON.parse(fs.readFileSync(audioMetadataPath, 'utf-8'));
  }

  const fileIndex = audioMetadata.findIndex(meta => meta.name === fileName);

  // Si le fichier est trouvé dans les métadonnées, mettez à jour la catégorie
  if (fileIndex !== -1) {
    audioMetadata[fileIndex].category = categoryName;
  } else {
    // Sinon, ajoutez une nouvelle entrée de métadonnées
    audioMetadata.push({ name: fileName, category: categoryName });
  }

  fs.writeFileSync(audioMetadataPath, JSON.stringify(audioMetadata, null, 2), 'utf-8');
  res.send({ message: 'Catégorie mise à jour avec succès', fileName, categoryName });
});

// Middleware pour servir les fichiers statiques (CSS, JS, images, etc.)
app.use(express.static('public')); // Remplacez 'public' par le nom de votre dossier contenant les fichiers statiques
app.use('/uploads', express.static('uploads')); // Pour rendre accessible le dossier des uploads

const categoriesFilePath = path.join(__dirname, 'data', 'categories.json');

// Vérifier et créer le fichier des catégories s'il n'existe pas
if (!fs.existsSync(categoriesFilePath)) {
    fs.writeFileSync(categoriesFilePath, JSON.stringify([]), 'utf-8');
}


app.post('/categories', (req, res) => {
  const { name } = req.body;
  const categories = JSON.parse(fs.readFileSync(categoriesFilePath, 'utf-8'));
  if (!categories.find(category => category.name === name)) {
      categories.push({ name });
      fs.writeFileSync(categoriesFilePath, JSON.stringify(categories, null, 2), 'utf-8');
      res.status(201).send({name: name}); // Envoyer la catégorie ajoutée dans la réponse
  } else {
      res.status(409).send('Catégorie déjà existante');
  }
});


// Route pour lister toutes les catégories
app.get('/categories', (req, res) => {
    const categories = JSON.parse(fs.readFileSync(categoriesFilePath, 'utf-8'));
    res.json(categories);
});

// Route pour supprimer une catégorie
app.delete('/categories/:name', async (req, res) => {
  const { name } = req.params;
  let categories = JSON.parse(fs.readFileSync(categoriesFilePath, 'utf-8'));
  categories = categories.filter(category => category.name !== name);
  fs.writeFileSync(categoriesFilePath, JSON.stringify(categories, null, 2), 'utf-8');

  // Récupérer et mettre à jour les métadonnées audio
  let audioMetadata = JSON.parse(fs.readFileSync(audioMetadataPath, 'utf-8'));
  audioMetadata.forEach(meta => {
      if (meta.category === name) {
          meta.category = 'Non catégorisé'; // Réaffecter à "Non catégorisé"
      }
  });
  fs.writeFileSync(audioMetadataPath, JSON.stringify(audioMetadata, null, 2), 'utf-8');

  res.send('Catégorie supprimée et fichiers audio mis à jour');
});

// Route pour la racine qui répond aux requêtes GET
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html')); // Assurez-vous que le chemin est correct
});


// Répertoires pour stocker les données
const LEFT_DATA_DIR = './data/left';
const RIGHT_DATA_DIR = './data/right';
const CHAMPLIBRE_DATA_DIR = './data/champLibre';

app.post('/patients/:id/audiogram/left', (req, res) => {
  const patientId = req.params.id;
  const patientDir = path.join(PATIENTS_DIR, patientId, 'left');
  saveAudiogramData(req.body, patientDir, res);
});

app.post('/patients/:id/audiogram/right', (req, res) => {
  const patientId = req.params.id;
  const patientDir = path.join(PATIENTS_DIR, patientId, 'right');
  saveAudiogramData(req.body, patientDir, res);
});

app.post('/patients/:id/audiogram/champLibre', (req, res) => {
  const patientId = req.params.id;
  const patientDir = path.join(PATIENTS_DIR, patientId, 'champLibre');
  saveAudiogramData(req.body, patientDir, res);
});


// Fonction modifiée pour gérer les dossiers de patients
function saveAudiogramData(data, directory, res) {
  try {
    // Vérifie si le dossier existe, sinon le crée
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    // Utilise l'ID de l'audiogramme pour nommer le fichier, ou crée un nom basé sur un timestamp si non fourni
    const filename = data.id ? `${data.id}.json` : `audiogram_${Date.now()}.json`;
    const filePath = path.join(directory, filename);

    fs.writeFileSync(filePath, JSON.stringify(data));
    console.log('Données enregistrées:', data);
    res.status(200).send('Données enregistrées avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des données:', error);
    res.status(500).send('Erreur interne du serveur');
  }
}


/* // Point de terminaison pour stocker les données des audiogrammes
app.post('/audiogram', (req, res) => {
  console.log("Requête reçue:", req.body); // Afficher les données reçues

  // Essayez de stocker les données et capturez les erreurs
  try {
    const data = req.body;
    const filePath = `${DATA_DIR}/audiogram_${Date.now()}.json`;
    fs.writeFileSync(filePath, JSON.stringify(data));
    console.log('Données enregistrées:', data);
    res.status(200).send('Données enregistrées');
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des données:', error);
    res.status(500).send('Erreur interne du serveur');
  }
}); */


app.get('/list-audios', (req, res) => {
  const UPLOADS_DIR = './uploads';

  fs.readdir(UPLOADS_DIR, (err, files) => {
      if (err) {
          console.error('Erreur lors de la lecture du dossier:', err);
          return res.status(500).send('Erreur interne du serveur');
      }

      // Filtrer pour ne garder que les fichiers audio
      let audioFiles = files.filter(file => file.endsWith('.mp3'));

      // Envoyer la liste des fichiers audio
      res.json(audioFiles);
  });
});

app.get('/patients/:id/audiogram/:ear', (req, res) => {
  const patientId = req.params.id;
  const ear = req.params.ear; // Capture l'oreille depuis l'URL
  const PATIENTS_DIR = `./data/patients/${patientId}`;

  // Fonction pour lire les données d'un dossier spécifique
  function readAudiogramData(directory, subFolder) {
    let audiograms = [];
    const folderPath = `${directory}/${subFolder}`;

    try {
      const files = fs.readdirSync(folderPath);

      files.forEach(file => {
        if (file.endsWith('.json')) {
          const data = fs.readFileSync(`${folderPath}/${file}`, 'utf8');
          audiograms.push(JSON.parse(data));
        }
      });
    } catch (error) {
      console.error(`Erreur lors de la lecture des données d'audiogramme pour ${folderPath}:`, error);
    }

    return audiograms;
  }

  // Lire les données du dossier spécifié par l'oreille
  try {
    let audiograms = [];
    if (ear === 'left' || ear === 'right' || ear === 'champLibre') {
      audiograms = readAudiogramData(PATIENTS_DIR, ear);
    } else {
      throw new Error('Invalid ear parameter');
    }

    // Envoyer les données de l'oreille spécifiée
    res.json(audiograms);
  } catch (error) {
    console.error('Erreur lors de la lecture du dossier du patient:', error);
    res.status(500).send('Erreur interne du serveur');
  }
});



// Route pour supprimer un point spécifique pour un patient
app.delete('/patients/:patientId/audiogram/:ear/:pointId', (req, res) => {
  const { patientId, ear, pointId } = req.params;
  const PATIENTS_DIR = `./data/patients/${patientId}`;
  let directory;

  switch (ear) {
    case 'gauche':
      directory = `${PATIENTS_DIR}/left`;
      break;
    case 'droite':
      directory = `${PATIENTS_DIR}/right`;
      break;
    case 'champLibre':
      directory = `${PATIENTS_DIR}/champLibre`;
      break;
    default:
      return res.status(400).send({ error: "Côté de l'oreille non valide." });
  }

  try {
    const files = fs.readdirSync(directory);
    const fileToDelete = files.find(file => file.includes(pointId));
    if (fileToDelete) {
        fs.unlinkSync(`${directory}/${fileToDelete}`);
        res.status(200).send("Point supprimé");
    } else {
        res.status(404).send("Point non trouvé");
    }
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    res.status(500).send("Erreur interne du serveur");
  }
});

// Route pour supprimer tous les points d'une oreille spécifique ou du champ libre pour un patient
app.delete('/patients/:patientId/delete-all-points/:ear', (req, res) => {
  const { patientId, ear } = req.params;
  const PATIENTS_DIR = `./data/patients/${patientId}`;
  let directory;

  switch (ear) {
    case 'gauche':
      directory = `${PATIENTS_DIR}/left`;
      break;
    case 'droite':
      directory = `${PATIENTS_DIR}/right`;
      break;
    case 'champLibre':
      directory = `${PATIENTS_DIR}/champLibre`;
      break;
    default:
      return res.status(400).send({ error: "Côté de l'oreille non valide." });
  }

  try {
    const files = fs.readdirSync(directory);
    files.forEach(file => fs.unlinkSync(path.join(directory, file)));
    res.status(200).send('Tous les points ont été supprimés.');
  } catch (error) {
    console.error('Erreur lors de la suppression des points:', error);
    res.status(500).send('Erreur interne du serveur');
  }
});


const storage = multer.diskStorage({
  destination: function(req, file, cb) {
      cb(null, 'uploads/'); // Chemin du dossier où les fichiers seront enregistrés
  },
  filename: function(req, file, cb) {
      cb(null, file.originalname); // Conserver le nom original du fichier
  }
});

const upload = multer({ storage: storage });


app.get('/audio-metadata', (req, res) => {
  if (fs.existsSync(audioMetadataPath)) {
      const metadata = fs.readFileSync(audioMetadataPath, 'utf-8');
      res.json(JSON.parse(metadata));
  } else {
      res.status(404).send({ error: "Métadonnées audio non trouvées." });
  }
});

app.post('/upload-audio', upload.single('audioFile'), (req, res) => {
  const category = req.body.category || 'Non catégorisé'; // Fallback si aucune catégorie n'est fournie
  if (!fs.existsSync(audioMetadataPath)) {
    fs.writeFileSync(audioMetadataPath, JSON.stringify([]), 'utf-8');
  }
  const audioMetadata = JSON.parse(fs.readFileSync(audioMetadataPath, 'utf-8'));

  // Vérifiez si le fichier existe déjà pour éviter les doublons
  const existingFileIndex = audioMetadata.findIndex(meta => meta.name === req.file.filename);
  if (existingFileIndex === -1) {
    audioMetadata.push({ name: req.file.filename, category });
    fs.writeFileSync(audioMetadataPath, JSON.stringify(audioMetadata, null, 2), 'utf-8');
    res.send("Fichier audio téléchargé et métadonnées enregistrées avec succès");
  } else {
    res.status(409).send("Le fichier existe déjà");
  }
});

// Route pour renommer un fichier audio
app.post('/rename-audio', (req, res) => {
  const { oldName, newName } = req.body;
  const oldPath = `uploads/${oldName}`;
  const newPath = `uploads/${newName}`;

  fs.rename(oldPath, newPath, (err) => {
      if (err) {
          console.error('Erreur lors du renommage du fichier:', err);
          return res.status(500).send('Erreur lors du renommage du fichier');
      }
      res.send(`Fichier renommé en ${newName}`);
  });
});

//Route pour supprimer un fichier audio
app.post('/delete-audio', (req, res) => {
  const { fileName } = req.body;
  const filePath = `uploads/${fileName}`;

  fs.unlink(filePath, (err) => {
      if (err) {
          console.error('Erreur lors de la suppression du fichier:', err);
          return res.status(500).send('Erreur lors de la suppression du fichier');
      }
      res.send(`Fichier ${fileName} supprimé`);
  });
});

app.get('/list-audios', (req, res) => {
  const directoryPath = path.join(__dirname, 'uploads'); // Assurez-vous que le chemin est correct

  fs.readdir(directoryPath, (err, files) => {
      if (err) {
          console.error('Erreur lors de la lecture du dossier:', err);
          return res.status(500).send('Impossible de lire le dossier des fichiers audio');
      }

      // Filtrer pour ne retourner que les fichiers audio, si nécessaire. Ici, on suppose que tous les fichiers dans 'uploads' sont des audios.
      const audioFiles = files.filter(file => file.endsWith('.mp3') || file.endsWith('.wav')); // Vous pouvez ajuster les extensions selon vos besoins

      res.json(audioFiles);
  });
});

const PATIENTS_DIR = './data/patients';

// Route pour ajouter un nouveau patient
app.post('/patients', (req, res) => {
  const { name, age, pic } = req.body;

  // Générer un identifiant unique pour le patient (par exemple, un UUID)
  const patientId = generateUniqueId();

  // Créer le répertoire du patient
  const patientDir = path.join(PATIENTS_DIR, patientId);
  const patientInfoFilePath = path.join(patientDir, 'info.json');
  const patientRightAudiogramDataInfoFilePath = path.join(patientDir, 'right');
  const patientLeftAudiogramDataInfoFilePath = path.join(patientDir, 'left');
  const patientChampLibreAudiogramDataInfoFilePath = path.join(patientDir, 'champLibre');

  try {
    // Vérifiez si le répertoire des patients existe, sinon créez-le
    if (!fs.existsSync(PATIENTS_DIR)) {
      fs.mkdirSync(PATIENTS_DIR, { recursive: true });
    }

    // Créez le répertoire du patient
    fs.mkdirSync(patientDir);
    fs.mkdirSync(patientRightAudiogramDataInfoFilePath)
    fs.mkdirSync(patientLeftAudiogramDataInfoFilePath)
    fs.mkdirSync(patientChampLibreAudiogramDataInfoFilePath)

    // Enregistrez les informations du patient dans un fichier JSON dans le dossier du patient
    const patientData = { id: patientId, name, age,pic };
    fs.writeFileSync(patientInfoFilePath, JSON.stringify(patientData));

    res.status(201).json({ message: 'Patient ajouté avec succès', patientId });
  } catch (error) {
    console.error('Erreur lors de la création du dossier patient:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

app.post('/toggle-archive/:patientId', (req, res) => {
  const { patientId } = req.params;
  const dataPath = path.join(__dirname, 'data', 'patients', patientId,`info.json`);

  fs.readFile(dataPath, (err, data) => {
      if (err) {
          console.error('Error reading file:', err);
          return res.status(500).send('Error reading file');
      }

      let patientData = JSON.parse(data);
      patientData.archived = !patientData.archived; // Toggle the archived status

      fs.writeFile(dataPath, JSON.stringify(patientData, null, 2), (err) => {
          if (err) {
              console.error('Error writing file:', err);
              return res.status(500).send('Error writing file');
          }
          res.json({ newStatus: patientData.archived });
      });
  });
});

// Fonction utilitaire pour générer un identifiant unique
function generateUniqueId() {
  return Math.random().toString(36).substr(2, 9); // Exemple simple d'identifiant aléatoire
}

app.get('/all-patient-info', (req, res) => {
  try {
    const patientsDir = './data/patients';
    const patientInfoList = [];

    fs.readdirSync(patientsDir).forEach(patientId => {
      const infoFilePath = path.join(patientsDir, patientId, 'info.json');
      if (fs.existsSync(infoFilePath)) {
        const patientData = JSON.parse(fs.readFileSync(infoFilePath, 'utf8'));
        patientInfoList.push(patientData);
      }
    });

    res.json(patientInfoList);
  } catch (error) {
    console.error('Error retrieving patient information:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/patients/:id/info.json', (req, res) => {
  const { id } = req.params; // Extraction de l'ID du patient à partir de l'URL
  const infoPath = path.join(__dirname, 'data', 'patients', id, 'info.json'); // Chemin vers le fichier info.json du patient

  fs.readFile(infoPath, 'utf8', (err, data) => {
      if (err) {
          console.error('Erreur lors de la lecture du fichier:', err);
          return res.status(404).json({ error: 'Patient non trouvé' });
      }
      res.json(JSON.parse(data)); // Envoyer les données du patient en réponse
  });
});


app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}/index.html`);
});

