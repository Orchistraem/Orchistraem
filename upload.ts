function uploadFile(): void {
    const formElement: HTMLFormElement | null = document.getElementById('uploadForm') as HTMLFormElement;
    if (!formElement) {
        console.error('Formulaire non trouvé');
        return;
    }

    const formData: FormData = new FormData(formElement);
    fetch('upload.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.text())
    .then(data => {
        console.log(data);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Ajout d'un écouteur d'événements pour gérer le clic sur le bouton d'envoi
const uploadButton: HTMLElement | null = document.querySelector('button');
if (uploadButton) {
    uploadButton.addEventListener('click', uploadFile);
} else {
    console.error('Bouton non trouvé');
}