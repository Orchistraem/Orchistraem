const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();
const port = 3000;

// Pour lire le corps des requêtes POST en JSON
app.use(bodyParser.json());

// Middleware pour servir les fichiers statiques (CSS, JS, images, etc.)
app.use(express.static('public')); // Remplacez 'public' par le nom de votre dossier contenant les fichiers statiques
app.use('/uploads', express.static('uploads')); // Pour rendre accessible le dossier des uploads

// Route pour la racine qui répond aux requêtes GET
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html')); // Assurez-vous que le chemin est correct
});

// Répertoire pour stocker les données (assurez-vous qu'il existe)
const DATA_DIR = './data';

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
  const DATA_DIR = './data';

  // Lister tous les fichiers dans le dossier /data
  fs.readdir(DATA_DIR, (err, files) => {
    if (err) {
      console.error('Erreur lors de la lecture du dossier:', err);
      return res.status(500).send('Erreur interne du serveur');
    }

    // Filtrer les fichiers JSON et lire leur contenu
    let audiograms = [];
    files.forEach(file => {
      if (file.endsWith('.json')) {
        const data = fs.readFileSync(`${DATA_DIR}/${file}`, 'utf8');
        audiograms.push(JSON.parse(data));
      }
    });

    // Envoyer les données de tous les audiogrammes
    res.json(audiograms);
  });
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

app.post('/upload-audio', upload.single('audioFile'), (req, res) => {
    console.log('Fichier reçu:', req.file);
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


app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}/index.html`);
});
