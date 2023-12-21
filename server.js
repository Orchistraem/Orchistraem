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
  const data = req.body;
  const filePath = `${DATA_DIR}/audiogram_${Date.now()}.json`;
  fs.writeFileSync(filePath, JSON.stringify(data));
  res.status(200).send('Données enregistrées');
});

app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}/index.html`);
});
