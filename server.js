const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();
const port = 3000;

// Pour lire le corps des requêtes POST en JSON
app.use(bodyParser.json());

// Middleware pour servir les fichiers statiques (CSS, JS, images, etc.)
app.use(express.static('public')); // Remplacez 'public' par le nom de votre dossier contenant les fichiers statiques

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

app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}/index.html`);
});
