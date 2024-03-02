const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

// Middleware pour parser le corps des requêtes en JSON
app.use(express.json());

// Serveur de fichiers statiques
app.use(express.static('public')); // Assurez-vous d'avoir un dossier public pour les fichiers statiques
app.use('/uploads', express.static('uploads')); // Rendre les fichiers uploadés accessibles

// Configuration de multer pour le téléchargement des fichiers
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/'); // Assurez-vous que ce dossier existe
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Préfixe le nom de fichier par un timestamp
    }
});
const upload = multer({ storage: storage });

// Route pour la page d'accueil
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); // Assurez-vous que ce fichier existe
});

// Route pour télécharger un fichier audio
app.post('/upload-audio', upload.single('audioFile'), (req, res) => {
    console.log('Fichier reçu:', req.file);
    res.send("Fichier audio téléchargé avec succès");
});

// Route pour renommer un fichier audio
app.post('/rename-audio', (req, res) => {
    const { oldName, newName } = req.body;
    fs.rename(`uploads/${oldName}`, `uploads/${newName}`, err => {
        if (err) {
            console.error('Erreur lors du renommage:', err);
            return res.status(500).send('Erreur lors du renommage');
        }
        res.send('Fichier renommé avec succès');
    });
});

// Route pour supprimer un fichier audio
app.delete('/delete-audio', (req, res) => {
    const { fileName } = req.body;
    fs.unlink(`uploads/${fileName}`, err => {
        if (err) {
            console.error('Erreur lors de la suppression:', err);
            return res.status(500).send('Erreur lors de la suppression');
        }
        res.send('Fichier supprimé avec succès');
    });
});

// Route pour lister les fichiers audio
app.get('/list-audios', (req, res) => {
    fs.readdir('uploads/', (err, files) => {
        if (err) {
            console.error('Erreur lors de la liste:', err);
            return res.status(500).send('Erreur lors de la liste');
        }
        res.json(files);
    });
});

// Route pour gérer les catégories
app.get('/categories', (req, res) => {
    fs.readFile("./categories.json", (err, data) => {
        if (err) {
            console.error("Erreur lors de la lecture des catégories:", err);
            return res.status(500).send("Erreur lors de la lecture des catégories");
        }
        res.json(JSON.parse(data));
    });
});

app.post("/categories", (req, res) => {
    const newCategory = req.body;
    fs.readFile("./categories.json", (err, data) => {
        if (err) {
            console.error("Erreur lors de la lecture des catégories:", err);
            return res.status(500).send("Erreur lors de la lecture des catégories");
        }
        const categories = JSON.parse(data);
        categories.push(newCategory);
        fs.writeFile('./categories.json', JSON.stringify(categories, null, 2), err => {
            if (err) {
                console.error("Erreur lors de l'ajout d'une catégorie:", err);
                return res.status(500).send("Erreur lors de l'ajout d'une catégorie");
            }
            res.status(201).send("Catégorie ajoutée avec succès");
        });
    });
});

app.listen(port, () => {
    console.log("Serveur démarré sur http://localhost:3000");
});
