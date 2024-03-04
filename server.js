const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();
const port = 3000;
const path = require('path');


// Pour lire le corps des requêtes POST en JSON
app.use(bodyParser.json());
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
        res.status(201).send('Catégorie ajoutée');
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
app.delete('/categories/:name', (req, res) => {
    const { name } = req.params;
    let categories = JSON.parse(fs.readFileSync(categoriesFilePath, 'utf-8'));
    categories = categories.filter(category => category.name !== name);
    fs.writeFileSync(categoriesFilePath, JSON.stringify(categories, null, 2), 'utf-8');
    res.send('Catégorie supprimée');
});
// Route pour la racine qui répond aux requêtes GET
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html')); // Assurez-vous que le chemin est correct
});

// Répertoire pour stocker les données (assurez-vous qu'il existe)
const DATA_DIR = './data';

// Répertoires pour stocker les données
const LEFT_DATA_DIR = './data/left';
const RIGHT_DATA_DIR = './data/right';

// Point de terminaison pour stocker les données des audiogrammes de l'oreille gauche
app.post('/audiogram/left', (req, res) => {
  saveAudiogramData(req.body, LEFT_DATA_DIR, res);
});

// Point de terminaison pour stocker les données des audiogrammes de l'oreille droite
app.post('/audiogram/right', (req, res) => {
  saveAudiogramData(req.body, RIGHT_DATA_DIR, res);
});

// Fonction pour enregistrer les données d'audiogramme
function saveAudiogramData(data, directory, res) {
  try {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    // Utilisez l'ID fourni dans les données pour nommer le fichier
    const filename = `${data.id}.json`;
    const filePath = `${directory}/${filename}`;

    fs.writeFileSync(filePath, JSON.stringify(data));
    console.log('Données enregistrées:', data);
    res.status(200).send('Données enregistrées');
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des données:', error);
    res.status(500).send('Erreur interne du serveur');
  }
}

// Point de terminaison pour stocker les données des audiogrammes
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
});

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

app.get('/get-audiogram-data', (req, res) => {
  const LEFT_DATA_DIR = './data/left';
  const RIGHT_DATA_DIR = './data/right';

  // Fonction pour lire les données d'un dossier spécifique
  function readAudiogramData(directory) {
    let audiograms = [];
    const files = fs.readdirSync(directory);

    files.forEach(file => {
      if (file.endsWith('.json')) {
        const data = fs.readFileSync(`${directory}/${file}`, 'utf8');
        audiograms.push(JSON.parse(data));
      }
    });

    return audiograms;
  }

  // Lire les données des deux dossiers
  try {
    const leftAudiograms = readAudiogramData(LEFT_DATA_DIR);
    const rightAudiograms = readAudiogramData(RIGHT_DATA_DIR);

    // Fusionner les données des audiogrammes gauche et droite
    const allAudiograms = leftAudiograms.concat(rightAudiograms);

    // Envoyer les données combinées
    res.json(allAudiograms);
  } catch (error) {
    console.error('Erreur lors de la lecture des dossiers:', error);
    res.status(500).send('Erreur interne du serveur');
  }
});



// Route pour supprimer un point
app.delete('/audiogram/:ear/:pointId', (req, res) => {
  const { ear, pointId } = req.params;
  const directory = ear === 'gauche' ? LEFT_DATA_DIR : RIGHT_DATA_DIR;

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

// Supprimer tous les points pour une oreille spécifique
app.delete('/delete-all-points/:ear', (req, res) => {
  const ear = req.params.ear;
  const directory = ear === 'gauche' ? LEFT_DATA_DIR : RIGHT_DATA_DIR;

  try {
      fs.readdir(directory, (err, files) => {
          if (err) {
              throw err;
          }

          for (const file of files) {
              fs.unlinkSync(path.join(directory, file));
          }

          res.status(200).send('Tous les points ont été supprimés.');
      });
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

const audioMetadataPath = path.join(__dirname, 'data', 'audioMetadata.json');

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
  const audioMetadata = JSON.parse(fs.readFileSync(audioMetadataPath, 'utf-8'));

  audioMetadata.push({ name: req.file.filename, category });
  fs.writeFileSync(audioMetadataPath, JSON.stringify(audioMetadata, null, 2), 'utf-8');

  res.send("Fichier audio téléchargé avec succès");
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

app.post('/assign-category', (req, res) => {
  const { fileName, categoryName } = req.body;
  let audioMetadata = JSON.parse(fs.readFileSync(audioMetadataPath, 'utf-8'));

  const fileIndex = audioMetadata.findIndex(meta => meta.name === fileName);
  if (fileIndex !== -1) {
      audioMetadata[fileIndex].category = categoryName;
      fs.writeFileSync(audioMetadataPath, JSON.stringify(audioMetadata, null, 2), 'utf-8');
      res.send('Catégorie mise à jour avec succès');
  } else {
      res.status(404).send('Fichier non trouvé');
  }
});



app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}/index.html`);
});

