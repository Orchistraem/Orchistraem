"use strict";

document.addEventListener('DOMContentLoaded', function () {
    setupUploadAudioForm();
    setupCategoryForm();
    fetchCategories();
    displayAudioList();
});

function setupUploadAudioForm() {
    const uploadAudioForm = document.getElementById('uploadAudioForm');
    const audioFileInput = document.getElementById('audioFile');
    const categorySelect = document.getElementById('categorySelect');

    uploadAudioForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const formData = new FormData();
        const audioFile = audioFileInput.files ? audioFileInput.files[0] : null;
        const category = categorySelect.value;

        if (audioFile && category) {
            formData.append('audioFile', audioFile);
            formData.append('category', category);
            fetch('/upload-audio', {
                method: 'POST',
                body: formData
            })
            .then(response => response.ok ? console.log('Fichier téléchargé avec succès') : Promise.reject('Erreur lors du téléchargement'))
            .catch(error => console.error('Erreur:', error))
            .finally(() => refreshAudioList());
        } else {
            console.error('Aucun fichier ou catégorie n\'a été sélectionné.');
        }
    });
}

function setupCategoryForm() {
    const categoryForm = document.getElementById('categoryForm');
    const categoryNameInput = document.getElementById('categoryName');

    categoryForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const categoryName = categoryNameInput.value;
        addCategory(categoryName);
    });
}

function addCategory(categoryName) {
    fetch('/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryName })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Catégorie ajoutée avec succès');
        fetchCategories();
    })
    .catch(error => console.error('Erreur:', error));
}

function fetchCategories() {
    fetch('/categories')
    .then(response => response.json())
    .then(categories => {
        const categorySelect = document.getElementById('categorySelect');
        categorySelect.innerHTML = '';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    })
    .catch(error => console.error('Erreur lors de la récupération des catégories:', error));
}

function refreshAudioList() {
    fetch('/list-audios')
    .then(response => response.json())
    .then(audioFiles => {
        const audioListContainer = document.getElementById('audioList');
        audioListContainer.innerHTML = '';
        audioFiles.forEach(file => createAudioElement(file, audioListContainer));
    })
    .catch(error => console.error('Erreur:', error));
}

function createAudioElement(file, container) {
    const audioContainer = document.createElement('div');
    audioContainer.classList.add('audio-container');
    audioContainer.setAttribute('data-file', file);

    const fileName = file.replace(/\.mp3$/, '').replace(/[_-]/g, ' ');
    const fileNameParagraph = document.createElement('p');
    fileNameParagraph.textContent = fileName;
    audioContainer.appendChild(fileNameParagraph);

    const audioElement = document.createElement('audio');
    audioElement.setAttribute('controls', '');
    audioElement.src = `/uploads/${file}`;
    audioContainer.appendChild(audioElement);

    container.appendChild(audioContainer);
}
