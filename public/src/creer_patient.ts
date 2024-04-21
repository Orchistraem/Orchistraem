interface Patient {
    id: string;
    leftAudiogramData: AudiogramData[];
    rightAudiogramData: AudiogramData[];
    champLibreAudiogramData: AudiogramData[];
  }


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
            gender: profile_pic
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
                alert(`Patient ajouté avec succès. Identifiant : ${result.patientId}`);
            } else {
                throw new Error('Erreur lors de la création du patient');
            }
        } catch (error) {
            console.error('Erreur lors de l\'envoi du formulaire:', error);
            alert('Erreur lors de l\'envoi du formulaire');
        }
    });
});

