declare var Swal: any;
  document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('patientForm') as HTMLFormElement;
    form.addEventListener('submit', async function(event) {
        event.preventDefault();

        const nom = (document.getElementById('nom') as HTMLInputElement).value;
        const prenom = (document.getElementById('prenom') as HTMLInputElement).value;
        const age = parseInt((document.getElementById('age') as HTMLInputElement).value, 10);
        const profile_pic = (document.querySelector('input[name="profile_pic"]:checked') as HTMLInputElement).value;

        const formData = {
            name: `${prenom} ${nom}`, 
            age: age,
            pic: profile_pic
        };

        try {
            const response = await fetch('/patients', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const result = await response.json();
                Swal.fire({
                    title: 'Succès !',
                    text: `Patient ajouté avec succès.`,
                    icon: 'success',
                    confirmButtonText: 'Fermer'
                  });
                } else {
                  throw new Error('Erreur lors de la création du patient');
                }
        } catch (error) {
            console.error('Erreur lors de l\'envoi du formulaire:', error);
            // Utilisez Swal.fire pour afficher les erreurs également
            Swal.fire({
              title: 'Erreur !',
              text: 'Erreur lors de l\'envoi du formulaire',
              icon: 'error',
              confirmButtonText: 'Fermer'
            });
        }
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById('patientForm') as HTMLFormElement;
    const profilePics = document.querySelectorAll('.profile_pic');

    form.addEventListener('submit', (event) => {
        event.preventDefault(); // Empêcher la soumission automatique du formulaire
        
        // Réinitialiser le formulaire
        form.reset();

        // Enlever les styles de tous les images de profil et réinitialiser la couleur du fond
        profilePics.forEach(picElement => {
            const pic = picElement as HTMLElement; // Assurer que pic est traité comme HTMLElement
            const img = pic.querySelector('img') as HTMLElement;
            img.style.border = 'none'; // Enlever la bordure des images
            pic.style.backgroundColor = ''; // Réinitialiser la couleur de fond
        });

        // Ajouter ici le code pour la soumission des données si nécessaire
    });

    // Gestionnaire pour les clics sur les images de profil
    profilePics.forEach(picElement => {
        const pic = picElement as HTMLElement; // Assurer que pic est traité comme HTMLElement
        pic.addEventListener('click', () => {
            // Réinitialiser la couleur de fond de tous les divs de profil avant de définir la nouvelle
            profilePics.forEach(otherPicElement => {
                const otherPic = otherPicElement as HTMLElement; // Assurer que otherPic est traité comme HTMLElement
                otherPic.style.backgroundColor = ''; // Réinitialiser la couleur de fond
            });

            // Mettre à jour la couleur de fond du div cliqué
            pic.style.backgroundColor = "#0cff00";
        });
    });
});



// Sélectionnez le div parent de tous les boutons radio
const chooseProfilPic = document.getElementById("chooseProfilPic");

// Vérifiez si l'élément parent existe
if (chooseProfilPic) {
    // Sélectionnez tous les éléments de classe "profile_pic" à l'intérieur de l'élément parent
    const profilePics = chooseProfilPic.getElementsByClassName("profile_pic");

    // Parcourez tous les éléments "profile_pic"
    Array.from(profilePics).forEach((pic: Element) => {
        // Assurez-vous que l'élément est bien un HTMLElement
        if (pic instanceof HTMLElement) {
            // Sélectionnez le bouton radio à l'intérieur de l'élément "profile_pic"
            const radioBtn = pic.querySelector("input[type='radio']") as HTMLInputElement;

            // Vérifiez si le bouton radio existe
            if (radioBtn) {
                // Ajoutez un gestionnaire d'événement pour le changement de l'état du bouton radio
                radioBtn.addEventListener("change", () => {
                    // Réinitialisez la couleur de tous les divs parents
                    Array.from(profilePics).forEach((parent: Element) => {
                        if (parent instanceof HTMLElement) {
                            parent.style.backgroundColor = "";
                        }
                    });

                    // Vérifiez si le bouton radio est coché
                    if (radioBtn.checked) {
                        // Changez la couleur du div parent associé
                        pic.style.backgroundColor = "#0cff00";
                    }
                });
            }

            // Ajoutez également un gestionnaire d'événement pour le clic sur chaque élément "profile_pic"
            pic.addEventListener("click", () => {
                // Réinitialisez la couleur de tous les divs parents
                Array.from(profilePics).forEach((parent: Element) => {
                    if (parent instanceof HTMLElement) {
                        parent.style.backgroundColor = "#0077b6";
                    }
                });

                // Cochez le bouton radio à l'intérieur de l'élément "profile_pic"
                if (radioBtn) {
                    radioBtn.checked = true;

                    // Changez la couleur du div parent associé
                    pic.style.backgroundColor = "#0cff00";
                }
            });
        }
    });
}
