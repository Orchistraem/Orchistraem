interface Category {
    name: string;
}

let categories: Category[] = []; // Initialisez les catégories, vous devrez les charger depuis le serveur.

/**
 * Charge et affiche la liste des catégories depuis le serveur.
 *
 * Cette fonction effectue une requête HTTP GET pour récupérer les catégories du serveur et les affiche
 * dans un conteneur HTML spécifié. Pour chaque catégorie, un élément div est créé pour afficher le nom
 * de la catégorie ainsi qu'un bouton pour la supprimer. Si le conteneur n'est pas trouvé dans le DOM,
 * la fonction s'arrête prématurément.
 *
 * @returns Une promesse qui se résout lorsque toutes les catégories ont été traitées et affichées.
 */
async function loadAndDisplayCategories(): Promise<void> {
    // Récupère le conteneur HTML pour afficher les catégories
    const categoriesListDiv = document.getElementById('categoriesList') as HTMLDivElement; // Assertion de type pour éviter les erreurs de nullabilité.
    if (!categoriesListDiv) return;// Arrête la fonction si le conteneur n'est pas trouvé

    // Effectue une requête GET vers "/categories" pour obtenir les catégories depuis le serveur
    const response = await fetch('/categories');
    const categories: Category[] = await response.json(); // Assurez-vous que la réponse correspond à l'interface Category[].

    // Vide le contenu actuel du conteneur des catégories
    categoriesListDiv.innerHTML = '';

    // Pour chaque catégorie récupérée, crée un élément div pour l'affichage
    categories.forEach((category: Category) => {
        const categoryDiv = document.createElement('div');
        categoryDiv.textContent = category.name;

        // Crée un bouton de suppression pour chaque catégorie
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Supprimer';
        deleteBtn.classList.add('btn', 'btn-danger');
        deleteBtn.onclick = () => deleteCategory(category.name);// Associe la suppression au clic du bouton

        // Ajoute le bouton de suppression à l'élément div de la catégorie
        categoryDiv.appendChild(deleteBtn);

        // Ajoute l'élément div de la catégorie au conteneur des catégories
        categoriesListDiv.appendChild(categoryDiv);
    });
}

/**
 * Ajoute une nouvelle catégorie côté client et la sauvegarde sur le serveur.
 *
 * Cette fonction récupère le nom d'une nouvelle catégorie à partir d'un élément d'input HTML, puis envoie
 * une requête POST au serveur pour enregistrer cette nouvelle catégorie. Si la requête réussit, la catégorie
 * est ajoutée à la liste des catégories côté client et le champ d'input est vidé. La liste des catégories est
 * également mise à jour pour inclure la nouvelle entrée.
 *
 * @returns Une promesse qui se résout lorsque la catégorie a été ajoutée et la liste mise à jour, ou affiche une alerte en cas d'échec.
 */
async function addCategory(): Promise<void> {
    const newCategoryNameInput = document.getElementById('newCategoryName') as HTMLInputElement | null;
    if (!newCategoryNameInput) return; // Arrête la fonction si l'input n'est pas trouvé

    // Récupère le nom de la nouvelle catégorie depuis l'input
    const newCategoryName = newCategoryNameInput.value;

    // Effectue une requête POST vers "/categories" pour ajouter la nouvelle catégorie
    const response = await fetch('/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName })
    });

    // Si la requête est réussie, met à jour la liste des catégories côté client
    if (response.ok) {
        const newCategory = await response.json(); // Supposer que le serveur renvoie la catégorie ajoutée
        // Mise à jour de la liste des catégories côté client
        categories.push(newCategory); // Supposons que 'categories' est la liste des catégories maintenue côté client
        const categorySelects = document.querySelectorAll('.categSelect');
        categorySelects.forEach(select => {
            const option = document.createElement('option');
            option.value = newCategory.name;
            option.textContent = newCategory.name;
            select.appendChild(option);
        });
        newCategoryNameInput.value = ''; // Effacer le champ après l'ajout

        // Recharge la liste des catégories pour afficher la nouvelle catégorie
        await loadAndDisplayCategories();
    } else {
        alert("Erreur lors de l'ajout de la catégorie");
    }
}

/**
 * Supprime une catégorie existante à la fois côté client et sur le serveur.
 *
 * Cette fonction envoie une requête DELETE au serveur pour supprimer une catégorie spécifiée par son nom.
 * Si la suppression est réussie, elle recharge la liste des catégories et met à jour l'interface utilisateur
 * en supprimant l'option correspondante dans tous les sélecteurs de catégories présents. Elle peut également,
 * si nécessaire, réassigner à "Non catégorisé" les fichiers audio qui étaient classés sous cette catégorie.
 *
 * @param categoryName - Le nom de la catégorie à supprimer.
 * @returns Une promesse qui se résout quand la catégorie a été supprimée et que l'interface utilisateur a été mise à jour.
 */
async function deleteCategory(categoryName: string): Promise<void> {
    // Effectue une requête DELETE vers "/categories/{categoryName}" pour supprimer la catégorie
    const response = await fetch(`/categories/${categoryName}`, { method: 'DELETE' });

    // Si la suppression est réussie, recharge la liste des catégories et met à jour l'interface utilisateur
    if (response.ok) {
        await loadAndDisplayCategories(); // Recharge la liste des catégories
        // Met à jour l'interface utilisateur en supprimant l'option de la catégorie supprimée dans les sélecteurs HTML
        document.querySelectorAll('.categSelect').forEach(selectElement => {
            const select = selectElement as HTMLSelectElement;
            Array.from(select.options).forEach(option => {
                if (option.value === categoryName) {
                    option.remove(); // Supprime l'option de la catégorie supprimée
                }
            });
        });

        // Optionnel : Met à jour la catégorie des fichiers audio affectés à "Non catégorisé"
        refreshAudioList();
    } else {
        alert('Erreur lors de la suppression de la catégorie'); // Affiche une alerte en cas d'erreur
    }
}



/**
 * Affecte une catégorie à un fichier audio spécifique et met à jour l'interface utilisateur pour refléter ce changement.
 *
 * Cette fonction envoie une requête POST à un serveur pour associer une catégorie spécifiée à un fichier audio donné.
 * Le serveur est supposé accepter et traiter cette association via l'URL fournie. En cas de réussite, l'interface utilisateur
 * est mise à jour pour afficher la nouvelle catégorie du fichier audio. En cas d'échec, une erreur est affichée dans la console.
 *
 * @param fileName - Le nom du fichier audio auquel la catégorie doit être affectée.
 * @param categoryName - Le nom de la catégorie à affecter au fichier audio.
 */
async function assignCategoryToFile(fileName: string, categoryName: string) {
    try {
        const url = `http://localhost:3000/assign-category`;
        // Effectue une requête POST pour affecter la catégorie au fichier audio
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName, categoryName })
        });

        // Si la requête échoue, affiche une erreur
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur lors de l'affectation de la catégorie : ${errorText}`);
        }

        // Si la requête réussit, met à jour l'affichage côté client avec la nouvelle catégorie assignée
        console.log(`Catégorie ${categoryName} affectée à ${fileName}`);
        const categoryParagraph = document.getElementById(`category-${fileName}`) as HTMLParagraphElement;
        if (categoryParagraph) {
            // Met à jour la catégorie affichée sans recharger toute la liste
            categoryParagraph.textContent = `Catégorie : ${categoryName}`;
        }
    } catch (error) {
        console.error('Erreur:', error); // Affiche l'erreur dans la console en cas d'échec
    }
}

// Fonction exécutée lorsque la page est entièrement chargée
window.onload = async (): Promise<void> => {
    await displayAudioList(); // Affiche la liste des fichiers audio
    await loadAndDisplayCategories(); // Charge et affiche la liste des catégories
    setupUploadAudioForm(); // Initialise le formulaire d'upload de fichiers audio

    // Attache un gestionnaire d'événement au bouton "Ajouter une catégorie"
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    if (addCategoryBtn) {
        addCategoryBtn.onclick = addCategory; // Associe l'ajout de catégorie à un clic sur le bouton
    }
}