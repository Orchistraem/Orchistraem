document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('patientForm') as HTMLFormElement;
    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        const formData = {
            nom: (document.getElementById('nom') as HTMLInputElement).value,
            prenom: (document.getElementById('prenom') as HTMLInputElement).value,
            age: (document.getElementById('age') as HTMLInputElement).value,
            profile_pic: (document.querySelector('input[name="profile_pic"]:checked') as HTMLInputElement).value
        };

        try {
            const response = await fetch('/create-patient', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            const result = await response.json();
            alert(result.message);
        } catch (error) {
            console.error('Erreur lors de l\'envoi du formulaire:', error);
            alert('Erreur lors de l\'envoi du formulaire');
        }
    });
});
