function uploadFile() {
    var formElement = document.getElementById('uploadForm');
    if (!formElement) {
        console.error('Formulaire non trouvé');
        return;
    }
    var formData = new FormData(formElement);
    fetch('upload.php', {
        method: 'POST',
        body: formData
    })
        .then(function (response) { return response.text(); })
        .then(function (data) {
        console.log(data);
    })
        .catch(function (error) {
        console.error('Error:', error);
    });
}
// Ajout d'un écouteur d'événements pour gérer le clic sur le bouton d'envoi
var uploadButton = document.querySelector('button');
if (uploadButton) {
    uploadButton.addEventListener('click', uploadFile);
}
else {
    console.error('Bouton non trouvé');
}
