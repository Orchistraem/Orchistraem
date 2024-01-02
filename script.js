window.onload = function () {
    var bouton = document.getElementById('monBouton');
    var audio = document.getElementById('monSon');
    bouton.addEventListener('click', function () {
        audio.play();
    });
};
