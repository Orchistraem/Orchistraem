window.onload = () => {
    const bouton = document.getElementById('monBouton');
    const audio = document.getElementById('monSon') as HTMLAudioElement;

    bouton.addEventListener('click', () => {
        audio.play();
    });
};