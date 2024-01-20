
fetch('/list-audios')
    .then(response => response.json())
    .then(audioFiles => {
        const audioListContainer = document.getElementById('audioList');
        if(audioListContainer){
            audioFiles.forEach((file: File) => {
                const audioElement = document.createElement('audio');
                audioElement.setAttribute('controls', '');
                audioElement.src = `/uploads/${file}`;
                audioListContainer.appendChild(audioElement);
            });
        }

    })
    .catch(error => console.error('Erreur:', error));
