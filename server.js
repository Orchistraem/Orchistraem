const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const multer = require('multer');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();
const port = 3000;
const path = require('path');


// Configuration de Swagger
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'API Express',
      version: '1.0.0',
      description: 'Documentation de l\'API Express',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
  },
  apis: ['./server.js'], // Fichiers à documenter
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Pour lire le corps des requêtes POST en JSON
app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

const audioMetadataPath = path.join(__dirname, 'data', 'audioMetadata.json');

/**
 * @swagger
 * /assign-category:
 *   post:
 *     summary: Assigner une catégorie à un fichier audio
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fileName:
 *                 type: string
 *               categoryName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Catégorie mise à jour avec succès
 *       404:
 *         description: Fichier non trouvé dans les uploads
 */
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

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Ajouter une nouvelle catégorie
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Catégorie ajoutée avec succès
 *       409:
 *         description: Catégorie déjà existante
 */
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


/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Lister toutes les catégories
 *     responses:
 *       200:
 *         description: Liste de toutes les catégories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 */
app.get('/categories', (req, res) => {
    const categories = JSON.parse(fs.readFileSync(categoriesFilePath, 'utf-8'));
    res.json(categories);
});

/**
 * @swagger
 * /categories/{name}:
 *   delete:
 *     summary: Supprimer une catégorie
 *     parameters:
 *       - in: path
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *         description: Nom de la catégorie à supprimer
 *     responses:
 *       200:
 *         description: Catégorie supprimée et fichiers audio mis à jour
 *       500:
 *         description: Erreur interne du serveur
 */
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

/**
 * @swagger
 * /:
 *   get:
 *     summary: Route principale qui retourne la page d'accueil
 *     responses:
 *       200:
 *         description: Page d'accueil
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html')); // Assurez-vous que le chemin est correct
});

/**
 * @swagger
 * /patients/{id}/audiogram/left:
 *   post:
 *     summary: Enregistrer les données d'audiogramme pour l'oreille gauche d'un patient
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du patient
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: Données enregistrées avec succès
 *       500:
 *         description: Erreur interne du serveur
 */
app.post('/patients/:id/audiogram/left', (req, res) => {
  const patientId = req.params.id;
  const patientDir = path.join(PATIENTS_DIR, patientId, 'left');
  saveAudiogramData(req.body, patientDir, res);
});

/**
 * @swagger
 * /patients/{id}/audiogram/right:
 *   post:
 *     summary: Enregistrer les données d'audiogramme pour l'oreille droite d'un patient
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du patient
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: Données enregistrées avec succès
 *       500:
 *         description: Erreur interne du serveur
 */
app.post('/patients/:id/audiogram/right', (req, res) => {
  const patientId = req.params.id;
  const patientDir = path.join(PATIENTS_DIR, patientId, 'right');
  saveAudiogramData(req.body, patientDir, res);
});

/**
 * @swagger
 * /patients/{id}/audiogram/champLibre:
 *   post:
 *     summary: Enregistrer les données d'audiogramme pour le champ libre d'un patient
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du patient
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: Données enregistrées avec succès
 *       500:
 *         description: Erreur interne du serveur
 */
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


/**
 * @swagger
 * /patients/{id}/audiogram/{ear}:
 *   get:
 *     summary: Obtenir les données d'audiogramme pour une oreille spécifique d'un patient
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du patient
 *       - in: path
 *         name: ear
 *         schema:
 *           type: string
 *         required: true
 *         description: Oreille ('left', 'right', 'champLibre')
 *     responses:
 *       200:
 *         description: Données de l'oreille spécifiée
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       500:
 *         description: Erreur interne du serveur
 */
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



/**
 * @swagger
 * /patients/{patientId}/audiogram/{ear}/{pointId}:
 *   delete:
 *     summary: Supprimer un point spécifique pour un patient
 *     parameters:
 *       - in: path
 *         name: patientId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du patient
 *       - in: path
 *         name: ear
 *         schema:
 *           type: string
 *         required: true
 *         description: Oreille ('left', 'right', 'champLibre')
 *       - in: path
 *         name: pointId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du point à supprimer
 *     responses:
 *       200:
 *         description: Point supprimé
 *       400:
 *         description: Côté de l'oreille non valide
 *       404:
 *         description: Point non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
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

/**
 * @swagger
 * /patients/{patientId}/delete-all-points/{ear}:
 *   delete:
 *     summary: Supprimer tous les points d'une oreille spécifique ou du champ libre pour un patient
 *     parameters:
 *       - in: path
 *         name: patientId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du patient
 *       - in: path
 *         name: ear
 *         schema:
 *           type: string
 *         required: true
 *         description: Oreille ('left', 'right', 'champLibre')
 *     responses:
 *       200:
 *         description: Tous les points ont été supprimés
 *       400:
 *         description: Côté de l'oreille non valide
 *       500:
 *         description: Erreur interne du serveur
 */
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

/**
 * @swagger
 * /audio-metadata:
 *   get:
 *     summary: Obtenir les métadonnées audio
 *     responses:
 *       200:
 *         description: Métadonnées audio
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       404:
 *         description: Métadonnées audio non trouvées
 */
app.get('/audio-metadata', (req, res) => {
  if (fs.existsSync(audioMetadataPath)) {
      const metadata = fs.readFileSync(audioMetadataPath, 'utf-8');
      res.json(JSON.parse(metadata));
  } else {
      res.status(404).send({ error: "Métadonnées audio non trouvées." });
  }
});

/**
 * @swagger
 * /upload-audio:
 *   post:
 *     summary: Télécharger un fichier audio
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               audioFile:
 *                 type: string
 *                 format: binary
 *               category:
 *                 type: string
 *     responses:
 *       200:
 *         description: Fichier audio téléchargé et métadonnées enregistrées avec succès
 *       409:
 *         description: Le fichier existe déjà
 */
app.post('/upload-audio', upload.single('audioFile'), (req, res) => {
  const category = req.body.category || 'Non catégorisé'; // Fallback si aucune catégorie n'est fournie
  const audioMetadataPath = './audioMetadata.json'; // Chemin vers le fichier de métadonnées

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


/**
 * @swagger
 * /rename-audio:
 *   post:
 *     summary: Renommer un fichier audio
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldName:
 *                 type: string
 *               newName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Fichier renommé avec succès
 *       500:
 *         description: Erreur lors du renommage du fichier
 */
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

/**
 * @swagger
 * /delete-audio:
 *   post:
 *     summary: Supprimer un fichier audio
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fileName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Fichier supprimé avec succès
 *       500:
 *         description: Erreur lors de la suppression du fichier
 */
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

/**
 * @swagger
 * /list-audios:
 *   get:
 *     summary: Lister tous les fichiers audio
 *     responses:
 *       200:
 *         description: Liste des fichiers audio
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 */
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

/**
 * @swagger
 * /patients:
 *   post:
 *     summary: Ajouter un nouveau patient
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               age:
 *                 type: number
 *               pic:
 *                 type: string
 *     responses:
 *       201:
 *         description: Patient ajouté avec succès
 *       500:
 *         description: Erreur interne du serveur
 */
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

/**
 * @swagger
 * /toggle-archive/{patientId}:
 *   post:
 *     summary: Basculer l'état d'archivage d'un patient
 *     parameters:
 *       - in: path
 *         name: patientId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du patient
 *     responses:
 *       200:
 *         description: État d'archivage basculé avec succès
 *       500:
 *         description: Erreur lors de la mise à jour de l'état d'archivage
 */
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


/**
 * @swagger
 * /patients/{id}:
 *   delete:
 *     summary: Supprimer un patient spécifique
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du patient
 *     responses:
 *       200:
 *         description: Patient supprimé avec succès
 *       500:
 *         description: Erreur interne du serveur
 */
app.delete('/patients/:id', (req, res) => {
  const { id } = req.params; // Extraction de l'ID du patient à partir de l'URL

  try {
      const patientDir = path.join(__dirname, 'data', 'patients', id);

      // Fonction récursive pour supprimer le répertoire du patient
      fs.rmdirSync(patientDir, { recursive: true });

      res.status(200).json({ message: 'Patient supprimé avec succès' });
  } catch (error) {
      console.error('Erreur lors de la suppression du patient:', error);
      res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});



// Fonction utilitaire pour générer un identifiant unique
function generateUniqueId() {
  return Math.random().toString(36).substr(2, 9); // Exemple simple d'identifiant aléatoire
}

/**
 * @swagger
 * /all-patient-info:
 *   get:
 *     summary: Obtenir les informations de tous les patients
 *     responses:
 *       200:
 *         description: Liste des informations de tous les patients
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
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

/**
 * @swagger
 * /patients/{id}/info.json:
 *   get:
 *     summary: Obtenir les informations d'un patient spécifique
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du patient
 *     responses:
 *       200:
 *         description: Informations du patient
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: Patient non trouvé
 */
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

