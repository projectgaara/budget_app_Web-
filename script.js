/**
 * script.js - Gestion du budget personnel
 * 
 * Ce script gère l'interface utilisateur et la logique pour une application de budget personnel.
 * Il inclut des fonctionnalités pour la création, la sauvegarde, le chargement et la suppression de budgets,
 * ainsi que des calculs en temps réel des totaux et des soldes.
 *
 * Dépendances externes:
 * - Requiert une API backend pour la gestion des sessions et le stockage des données (voir les appels fetch).
 * - Utilise une iframe pour afficher le contenu du budget.
 */

// Configuration du débogage
const DEBUG = true;
const debugHistory = [];

/**
 * Fonction de débogage
 * 
 * @param {...any} args - Arguments à logger
 * 
 * Cette fonction enregistre les messages de débogage si DEBUG est activé.
 * Elle ajoute un horodatage à chaque message et maintient un historique limité à 1000 entrées.
 */
function debug(...args) {
    if (DEBUG) {
        const timestamp = new Date().toISOString();
        const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
        const logMessage = `[DEBUG ${timestamp}] ${message}`;
        console.log(logMessage);
        debugHistory.push(logMessage);
        if (debugHistory.length > 1000) debugHistory.shift();
    }
}

// Variables globales
let isLoggedIn = false;
let currentBudgetName = 'Default Budget';

/**
 * Initialisation de l'application
 * 
 * Cette fonction est appelée lorsque le DOM est entièrement chargé.
 * Elle initialise l'application en vérifiant le statut de connexion,
 * en initialisant le contenu de l'iframe et en configurant les écouteurs d'événements.
 */
document.addEventListener('DOMContentLoaded', function() {
    debug('DOM chargé, initialisation de l\'application');
    checkLoginStatus();
    initializeIframeContent();
    setupEventListeners();
});

/**
 * Configuration des écouteurs d'événements
 * 
 * Cette fonction configure tous les écouteurs d'événements nécessaires pour l'interface utilisateur.
 * Elle gère les clics sur les boutons, les changements dans les champs de saisie, et les interactions avec les modals.
 */
function setupEventListeners() {
    debug('Configuration des écouteurs d\'événements');
    
    // Boutons principaux
    document.getElementById('saveLoadButton').addEventListener('click', openSaveLoadModal);
    document.getElementById('saveServerButton').addEventListener('click', sauvegarderBudget);
    document.getElementById('loadServerButton').addEventListener('click', chargerBudgetDuServeur);
    document.getElementById('downloadJSONButton').addEventListener('click', downloadBudgetJSON);
    document.getElementById('uploadJSONButton').addEventListener('click', () => document.getElementById('jsonFileInput').click());
    document.getElementById('jsonFileInput').addEventListener('change', uploadBudgetJSON);
    
    // Gestion des fichiers de budget
    document.getElementById('budgetNameInput').addEventListener('input', updateSaveButtonState);
    document.getElementById('deleteBudgetButton').addEventListener('click', deleteBudget);
    
    // Gestion des modals
    document.querySelectorAll('.modal .close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });

    // Fermeture des modals en cliquant en dehors
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };
}

/**
 * Vérification du statut de connexion
 * 
 * Cette fonction envoie une requête au serveur pour vérifier si l'utilisateur est connecté.
 * Elle met à jour l'interface utilisateur en conséquence et initialise le contenu si l'utilisateur est connecté.
 */
function checkLoginStatus() {
    debug('Vérification du statut de connexion');
    fetch('check_login.php', { credentials: 'include' })
    .then(response => response.json())
    .then(data => {
        isLoggedIn = data.loggedIn;
        updateAuthSection();
        debug('Statut de connexion:', isLoggedIn ? 'Connecté' : 'Non connecté');
        if (isLoggedIn) {
            initializeIframeContent();
            loadBudgetList();
        }
    })
    .catch(error => {
        console.error('Erreur lors de la vérification du statut de connexion:', error);
        isLoggedIn = false;
        updateAuthSection();
    });
}

/**
 * Mise à jour de la section d'authentification
 * 
 * Cette fonction met à jour l'interface utilisateur de la section d'authentification
 * en fonction du statut de connexion de l'utilisateur.
 */
function updateAuthSection() {
    const authSection = document.getElementById('authSection');
    if (isLoggedIn) {
        authSection.innerHTML = '<button id="logoutButton">Déconnexion</button>';
        document.getElementById('logoutButton').addEventListener('click', logout);
    } else {
        authSection.innerHTML = `
            <input type="text" id="username" placeholder="Nom d'utilisateur">
            <input type="password" id="password" placeholder="Mot de passe">
            <button id="loginButton">Connexion</button>
            <button id="signupButton">Inscription</button>
        `;
        document.getElementById('loginButton').addEventListener('click', login);
        document.getElementById('signupButton').addEventListener('click', openSignupModal);
    }
}

/**
 * Connexion de l'utilisateur
 * 
 * Cette fonction gère le processus de connexion de l'utilisateur.
 * Elle envoie les informations d'identification au serveur et met à jour l'interface en conséquence.
 */
function login() {
    debug('Tentative de connexion');
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch('login.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            debug('Connexion réussie');
            isLoggedIn = true;
            updateAuthSection();
            setTimeout(() => {
                initializeIframeContent();
            }, 500);
        } else {
            throw new Error(data.message || 'Échec de la connexion');
        }
    })
    .catch(error => {
        console.error('Erreur lors de la connexion:', error);
        alert('Erreur lors de la connexion: ' + error.message);
    });
}

/**
 * Déconnexion de l'utilisateur
 * 
 * Cette fonction gère le processus de déconnexion de l'utilisateur.
 * Elle envoie une requête au serveur pour terminer la session et met à jour l'interface.
 */
function logout() {
    debug('Tentative de déconnexion');
    fetch('logout.php', { credentials: 'include' })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            isLoggedIn = false;
            updateAuthSection();
            initializeIframeContent();
            debug('Déconnexion réussie');
        } else {
            throw new Error(data.message || 'Échec de la déconnexion');
        }
    })
    .catch(error => {
        console.error('Erreur lors de la déconnexion:', error);
        alert('Erreur lors de la déconnexion: ' + error.message);
    });
}

/**
 * Ouverture du modal d'inscription
 * 
 * Cette fonction affiche le modal d'inscription lorsque l'utilisateur clique sur le bouton d'inscription.
 */
function openSignupModal() {
    document.getElementById('signupModal').style.display = 'block';
}

/**
 * Inscription de l'utilisateur
 * 
 * @param {Event} event - L'événement de soumission du formulaire
 * 
 * Cette fonction gère le processus d'inscription d'un nouvel utilisateur.
 * Elle vérifie que les mots de passe correspondent et envoie les informations au serveur.
 */
function signup(event) {
    event.preventDefault();
    debug('Tentative d\'inscription');
    const newUsername = document.getElementById('newUsername').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        alert("Les mots de passe ne correspondent pas.");
        return;
    }

    fetch('signup.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: newUsername, password: newPassword }),
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
            document.getElementById('signupModal').style.display = 'none';
        } else {
            throw new Error(data.message || 'Erreur lors de l\'inscription');
        }
    })
    .catch(error => {
        console.error('Erreur lors de l\'inscription:', error);
        alert('Erreur lors de l\'inscription: ' + error.message);
    });
}

/**
 * Ouverture du modal de sauvegarde/chargement
 * 
 * Cette fonction affiche le modal permettant de sauvegarder ou charger un budget.
 */
function openSaveLoadModal() {
    document.getElementById('saveLoadModal').style.display = 'block';
}

/**
 * Sauvegarde du budget
 * 
 * Cette fonction gère la sauvegarde du budget actuel sur le serveur.
 * Elle vérifie que l'utilisateur est connecté et qu'un nom de budget est fourni.
 */
function sauvegarderBudget() {
    debug('Tentative de sauvegarde du budget');
    if (!isLoggedIn) {
        alert("Veuillez vous connecter pour sauvegarder votre budget.");
        return;
    }

    const budgetName = document.getElementById('budgetNameInput').value.trim();
    if (!budgetName) {
        alert("Veuillez entrer un nom pour votre budget.");
        return;
    }

    const frame = document.getElementById('content-frame');
    const doc = frame.contentDocument;

    const budget = {
        name: budgetName,
        revenus: getBudgetData(doc, 'revenus'),
        depenses: getBudgetData(doc, 'depenses')
    };

    fetch('save_budget.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(budget),
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Budget sauvegardé avec succès!');
            currentBudgetName = budgetName;
            loadBudgetList();
        } else {
            throw new Error(data.message || 'Erreur inconnue lors de la sauvegarde');
        }
    })
    .catch(error => {
        console.error('Erreur lors de la sauvegarde du budget:', error);
        alert('Erreur lors de la sauvegarde du budget: ' + error.message);
    });
}

/**
 * Chargement d'un budget depuis le serveur
 * 
 * Cette fonction charge un budget spécifique depuis le serveur et met à jour l'interface.
 */
function chargerBudgetDuServeur() {
    debug('Tentative de chargement du budget');
    if (!isLoggedIn) {
        alert("Veuillez vous connecter pour charger votre budget.");
        return;
    }

    const budgetSelect = document.getElementById('budgetSelect');
    const selectedBudgetName = budgetSelect.value;

    if (!selectedBudgetName) {
        alert("Veuillez sélectionner un budget à charger.");
        return;
    }

    fetch(`get_budget.php?name=${encodeURIComponent(selectedBudgetName)}`, { credentials: 'include' })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadBudgetData(data.data);
            currentBudgetName = selectedBudgetName;
            document.getElementById('budgetNameInput').value = currentBudgetName;
            alert('Budget chargé avec succès!');
        } else {
            throw new Error(data.message || 'Erreur inconnue lors du chargement');
        }
    })
    .catch(error => {
        console.error('Erreur lors du chargement du budget:', error);
        alert('Erreur lors du chargement du budget: ' + error.message);
    });
}

/**
 * Chargement de la liste des budgets
 * 
 * Cette fonction récupère la liste des budgets disponibles depuis le serveur
 * et met à jour le menu déroulant de sélection des budgets.
 */
function loadBudgetList() {
    fetch('get_budget_list.php', { credentials: 'include' })
    .then(response => response.json())
    .then(data => {
        const budgetSelect = document.getElementById('budgetSelect');
        budgetSelect.innerHTML = '';
        data.forEach(budget => {
            const option = document.createElement('option');
            option.value = budget.name;
            option.textContent = budget.name;
            budgetSelect.appendChild(option);
        });
    })
    .catch(error => {
        console.error('Erreur lors du chargement de la liste des budgets:', error);
    });
}

/**
 * Suppression d'un budget
 * 
 * Cette fonction gère la suppression d'un budget spécifique après confirmation de l'utilisateur.
 */
function deleteBudget() {
    const budgetSelect = document.getElementById('budgetSelect');
    const selectedBudgetName = budgetSelect.value;

    if (!selectedBudgetName) {
        alert("Veuillez sélectionner un budget à supprimer.");
        return;
    }

    if (confirm(`Êtes-vous sûr de vouloir supprimer le budget "${selectedBudgetName}" ?`)) {
        fetch('delete_budget.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: selectedBudgetName }),
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Budget supprimé avec succès!');
                loadBudgetList();
                if (currentBudgetName === selectedBudgetName) {
                    initializeBudgetStructure(document.getElementById('content-frame').contentDocument);
                    currentBudgetName = '';
                    document.getElementById('budgetNameInput').value = '';
                }
            } else {
                throw new Error(data.message || 'Erreur inconnue lors de la suppression');
            }
        })
        .catch(error => {
            console.error('Erreur lors de la suppression du budget:', error);
            alert('Erreur lors de la suppression du budget: ' + error.message);
        });
    }
}

/**
 * Mise à jour de l'état du bouton de sauvegarde
 * 
 * Cette fonction active ou désactive le bouton de sauvegarde en fonction de la présence
 * d'un nom de budget dans le champ de saisie.
 */
function updateSaveButtonState() {
    const saveButton = document.getElementById('saveServerButton');
    const budgetNameInput = document.getElementById('budgetNameInput');
    saveButton.disabled = !budgetNameInput.value.trim();
}

// Ajoutez cet appel dans votre fonction setupEventListeners()
document.getElementById('budgetSelect').addEventListener('change', function() {
    document.getElementById('budgetNameInput').value = this.value;
    updateSaveButtonState();
});

/**
 * Téléchargement du budget au format JSON
 * 
 * Cette fonction permet à l'utilisateur de télécharger le budget actuel sous forme de fichier JSON.
 */
function downloadBudgetJSON() {
    debug('Téléchargement du budget en JSON');
    const frame = document.getElementById('content-frame');
    const doc = frame.contentDocument;

    const budget = {
        revenus: getBudgetData(doc, 'revenus'),
        depenses: getBudgetData(doc, 'depenses')
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(budget, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "budget.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

/**
 * Chargement d'un budget à partir d'un fichier JSON
 * 
 * @param {Event} event - L'événement de changement du champ de fichier
 * 
 * Cette fonction permet à l'utilisateur de charger un budget à partir d'un fichier JSON.
 */
function uploadBudgetJSON(event) {
    debug('Chargement d\'un fichier JSON');
    const file = event.target.files[0];
    if (!file) {
        alert('Veuillez sélectionner un fichier.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const budget = JSON.parse(e.target.result);
            loadBudgetData(budget);
            alert('Budget chargé avec succès!');
        } catch (error) {
            console.error('Erreur lors du chargement du fichier:', error);
            alert('Erreur lors du chargement du fichier: ' + error.message);
        }
    };
    reader.readAsText(file);
}

/**
 * Récupération des données du budget
 * 
 * @param {Document} doc - Le document de l'iframe contenant les données du budget
 * @param {string} type - Le type de données à récupérer ('revenus' ou 'depenses')
 * @returns {Array} Un tableau d'objets représentant les lignes du budget
 * 
 * Cette fonction extrait les données du budget (revenus ou dépenses) de l'iframe.
 */
function getBudgetData(doc, type) {
    const rows = doc.querySelectorAll(`#${type} tr:not(.total)`);
    return Array.from(rows).map(row => {
        const descriptionInput = row.querySelector('input[type="text"]');
        const montantInput = row.querySelector('input[type="number"]');
        const frequenceSelect = row.querySelector('select');
        
        return {
            description: descriptionInput ? descriptionInput.value : '',
            montant: montantInput ? montantInput.value : '0',
            frequence: frequenceSelect ? frequenceSelect.value : '4'
        };
    }).filter(item => item.description || item.montant !== '0');
}

/**
 * Chargement des données du budget dans l'interface
 * 
 * @param {Object} budget - L'objet contenant les données du budget à charger
 * 
 * Cette fonction met à jour l'interface utilisateur avec les données du budget chargé.
 */
function loadBudgetData(budget) {
    debug('Chargement des données du budget dans l\'interface');
    const frame = document.getElementById('content-frame');
    const doc = frame.contentDocument;

    // Nettoyer les données existantes
    doc.querySelectorAll('#revenus tr:not(.total), #depenses tr:not(.total)').forEach(row => row.remove());

    // Charger les revenus
    budget.revenus.forEach(item => {
        ajouterLigne('revenus', item);
    });

    // Charger les dépenses
    budget.depenses.forEach(item => {
        ajouterLigne('depenses', item);
    });

    calculerTotal();
    addIframeListeners();

    // Forcer une mise à jour visuelle de l'iframe
    frame.style.height = frame.contentWindow.document.body.scrollHeight + 'px';
}

/**
 * Ajout d'une ligne au budget
 * 
 * @param {string} type - Le type de ligne à ajouter ('revenus' ou 'depenses')
 * @param {Object} item - Les données de la ligne à ajouter (optionnel)
 * 
 * Cette fonction ajoute une nouvelle ligne au budget dans l'iframe.
 */
function ajouterLigne(type, item = null) {
    debug('Ajout d\'une ligne', type, item);
    const frame = document.getElementById('content-frame');
    const doc = frame.contentDocument;
    const table = doc.querySelector(`#${type} table tbody`);
    if (!table) {
        console.error(`Table '${type}' non trouvée.`);
        return;
    }

    const newRow = table.insertRow(table.rows.length - 1);
    const cell1 = newRow.insertCell(0);
    const cell2 = newRow.insertCell(1);
    
    cell1.innerHTML = `<input type="text" placeholder="Description" value="${item ? item.description : ''}">`;
    cell2.innerHTML = `<input type="number" value="${item ? item.montant : '0'}"> $CA
                       <select>
                           <option value="1">À la semaine</option>
                           <option value="2">Aux 2 semaines</option>
                           <option value="3">Aux 3 semaines</option>
                           <option value="4">Au mois</option>
                       </select>
                       <button class="delete-btn">X</button>`;
    
    if (item) {
        cell2.querySelector('select').value = item.frequence;
    }

    addRowListeners(newRow);
    calculerTotal();
}

/**
 * Ajout des écouteurs d'événements à une ligne
 * 
 * @param {HTMLElement} row - L'élément de ligne auquel ajouter les écouteurs
 * 
 * Cette fonction ajoute les écouteurs d'événements nécessaires à une ligne du budget.
 */
function addRowListeners(row) {
    row.querySelector('input[type="number"]').addEventListener('change', calculerTotal);
    row.querySelector('select').addEventListener('change', calculerTotal);
    row.querySelector('.delete-btn').addEventListener('click', function(event) {
        supprimerLigne(event.target);
    });
}

/**
 * Suppression d'une ligne du budget
 * 
 * @param {HTMLElement} btn - Le bouton de suppression cliqué
 * 
 * Cette fonction supprime une ligne du budget et recalcule les totaux.
 */
function supprimerLigne(btn) {
    debug('Suppression d\'une ligne');
    const frame = document.getElementById('content-frame');
    const doc = frame.contentDocument;
    const row = btn.closest('tr');
    if (row && row.parentNode) {
        row.parentNode.removeChild(row);
        calculerTotal();
    } else {
        console.error("Impossible de supprimer la ligne : l'élément parent n'a pas été trouvé.", btn);
    }
}

/**
 * Calcul des totaux du budget
 * 
 * Cette fonction calcule et met à jour tous les totaux et soldes du budget.
 */
function calculerTotal() {
    debug('Calcul des totaux');
    const frame = document.getElementById('content-frame');
    const doc = frame.contentDocument;

    let totalRevenusMensuels = 0;
    let totalDepensesMensuelles = 0;

    doc.querySelectorAll('#revenus tr:not(.total)').forEach(row => {
        const montant = parseFloat(row.querySelector('input[type="number"]')?.value) || 0;
        const frequence = parseInt(row.querySelector('select')?.value) || 4;
        totalRevenusMensuels += montantMensuel(montant, frequence);
    });

    doc.querySelectorAll('#depenses tr:not(.total)').forEach(row => {
        const montant = parseFloat(row.querySelector('input[type="number"]')?.value) || 0;
        const frequence = parseInt(row.querySelector('select')?.value) || 4;
        totalDepensesMensuelles += montantMensuel(montant, frequence);
    });

    const revenusHebdo = totalRevenusMensuels / 4.3;
    const depensesHebdo = totalDepensesMensuelles / 4.3;
    const soldeHebdo = revenusHebdo - depensesHebdo;
    const soldeMensuel = totalRevenusMensuels - totalDepensesMensuelles;

    updateElement(doc, "totalRevenus", totalRevenusMensuels);
    updateElement(doc, "totalDepenses", totalDepensesMensuelles);
    updateElement(doc, "resumeRevenusHebdo", revenusHebdo);
    updateElement(doc, "resumeDepensesHebdo", depensesHebdo);
    updateElement(doc, "soldeHebdo", soldeHebdo);
    updateElement(doc, "resumeRevenusMensuels", totalRevenusMensuels);
    updateElement(doc, "resumeDepensesMensuelles", totalDepensesMensuelles);
    updateElement(doc, "soldeMensuel", soldeMensuel);

    updateElementClass(doc, "soldeHebdo", soldeHebdo >= 0 ? "positive" : "negative");
    updateElementClass(doc, "soldeMensuel", soldeMensuel >= 0 ? "positive" : "negative");
}

/**
 * Mise à jour d'un élément du DOM
 * 
 * @param {Document} doc - Le document de l'iframe
 * @param {string} id - L'identifiant de l'élément à mettre à jour
 * @param {number} value - La nouvelle valeur à afficher
 * 
 * Cette fonction met à jour le contenu textuel d'un élément du DOM avec une valeur formatée.
 */
function updateElement(doc, id, value) {
    const element = doc.getElementById(id);
    if (element) {
        element.textContent = value.toFixed(2) + " $CA";
    } else {
        debug(`Élément non trouvé: ${id}`);
    }
}

/**
 * Mise à jour de la classe d'un élément du DOM
 * 
 * @param {Document} doc - Le document de l'iframe
 * @param {string} id - L'identifiant de l'élément à mettre à jour
 * @param {string} className - La nouvelle classe à appliquer
 * 
 * Cette fonction met à jour la classe d'un élément du DOM.
 */
function updateElementClass(doc, id, className) {
    const element = doc.getElementById(id);
    if (element) {
        element.className = className;
    } else {
        debug(`Élément non trouvé: ${id}`);
    }
}

/**
 * Calcul du montant mensuel
 * 
 * @param {number} montant - Le montant à convertir
 * @param {number} frequence - La fréquence du montant (1: hebdomadaire, 2: bihebdomadaire, 3: aux 3 semaines, 4: mensuel)
 * @returns {number} Le montant converti en équivalent mensuel
 * 
 * Cette fonction convertit un montant en son équivalent mensuel selon sa fréquence.
 */
function montantMensuel(montant, frequence) {
    switch(frequence) {
        case 1: return montant * 4.3;
        case 2: return montant * 2.15;
        case 3: return montant * 1.43;
        case 4: return montant;
        default: return montant;
    }
}

/**
 * Initialisation du contenu de l'iframe
 * 
 * Cette fonction initialise le contenu de l'iframe en chargeant soit un budget existant,
 * soit en créant une structure de budget vide. Elle gère également les différents états
 * de chargement du document de l'iframe.
 */
function initializeIframeContent() {
    debug('Initialisation du contenu de l\'iframe');
    const frame = document.getElementById('content-frame');
    frame.onload = function() {
        const doc = frame.contentDocument;
        if (doc.readyState === 'complete') {
            setTimeout(() => {
                if (isLoggedIn) {
                    chargerBudgetDuServeur();
                } else {
                    initializeBudgetStructure(doc);
                    calculerTotal();
                }
                addIframeListeners();
            }, 100);
        } else {
            doc.addEventListener('DOMContentLoaded', () => {
                if (isLoggedIn) {
                    chargerBudgetDuServeur();
                } else {
                    initializeBudgetStructure(doc);
                    calculerTotal();
                }
                addIframeListeners();
            });
        }
    };
}

/**
 * Initialisation de la structure du budget
 * 
 * @param {Document} doc - Le document de l'iframe
 * 
 * Cette fonction crée la structure HTML de base pour le budget dans l'iframe
 * lorsqu'aucun budget n'est chargé.
 */
function initializeBudgetStructure(doc) {
    const structure = `
        <div id="revenus">
            <h2>Revenus</h2>
            <table>
                <tbody>
                    <tr class="total">
                        <td>Total des revenus mensuels</td>
                        <td id="totalRevenus">0 $CA</td>
                    </tr>
                </tbody>
            </table>
            <button onclick="parent.ajouterLigne('revenus')">Ajouter un revenu</button>
        </div>
        <div id="depenses">
            <h2>Dépenses</h2>
            <table>
                <tbody>
                    <tr class="total">
                        <td>Total des dépenses mensuelles</td>
                        <td id="totalDepenses">0 $CA</td>
                    </tr>
                </tbody>
            </table>
            <button onclick="parent.ajouterLigne('depenses')">Ajouter une dépense</button>
        </div>
        <div id="resume">
            <h2>Résumé</h2>
            <table>
                <tr>
                    <td>Revenus hebdomadaires estimés</td>
                    <td id="resumeRevenusHebdo">0 $CA</td>
                </tr>
                <tr>
                    <td>Dépenses hebdomadaires estimées</td>
                    <td id="resumeDepensesHebdo">0 $CA</td>
                </tr>
                <tr>
                    <td>Solde hebdomadaire estimé</td>
                    <td id="soldeHebdo">0 $CA</td>
                </tr>
                <tr>
                    <td>Revenus mensuels</td>
                    <td id="resumeRevenusMensuels">0 $CA</td>
                </tr>
                <tr>
                    <td>Dépenses mensuelles</td>
                    <td id="resumeDepensesMensuelles">0 $CA</td>
                </tr>
                <tr>
                    <td>Solde mensuel</td>
                    <td id="soldeMensuel">0 $CA</td>
                </tr>
            </table>
        </div>
    `;
    doc.body.innerHTML = structure;
}

/**
 * Ajout des écouteurs d'événements à l'iframe
 * 
 * Cette fonction ajoute tous les écouteurs d'événements nécessaires aux éléments
 * de l'iframe pour gérer les interactions utilisateur avec le budget.
 */
function addIframeListeners() {
    debug('Ajout des écouteurs d\'événements à l\'iframe');
    const frame = document.getElementById('content-frame');
    const doc = frame.contentDocument;

    // Gestion des boutons d'ajout et de suppression
    doc.querySelectorAll('#revenus button, #depenses button').forEach(button => {
        if (button.classList.contains('delete-btn')) {
            button.removeEventListener('click', supprimerLigneHandler);
            button.addEventListener('click', supprimerLigneHandler);
        } else {
            button.removeEventListener('click', ajouterLigneHandler);
            button.addEventListener('click', ajouterLigneHandler);
        }
    });

    // Gestion des changements dans les champs de saisie et les sélecteurs
    doc.querySelectorAll('input, select').forEach(element => {
        element.removeEventListener('change', calculerTotal);
        element.addEventListener('change', calculerTotal);
    });
}

/**
 * Gestionnaire d'événement pour la suppression de ligne
 * 
 * @param {Event} event - L'événement de clic
 * 
 * Cette fonction gère l'événement de clic sur le bouton de suppression d'une ligne.
 */
function supprimerLigneHandler(event) {
    event.preventDefault();
    event.stopPropagation();
    supprimerLigne(event.target);
}

/**
 * Gestionnaire d'événement pour l'ajout de ligne
 * 
 * @param {Event} event - L'événement de clic
 * 
 * Cette fonction gère l'événement de clic sur le bouton d'ajout d'une ligne.
 */
function ajouterLigneHandler(event) {
    event.preventDefault();
    const type = event.target.closest('div').id;
    ajouterLigne(type);
}

// Fonctions de débogage avancées

/**
 * Activation du mode debug
 * 
 * Cette fonction active le mode debug et l'enregistre dans le localStorage.
 */
window.enableDebugMode = function() {
    localStorage.setItem('debugMode', 'true');
    DEBUG = true;
    console.log('Mode debug activé');
}

/**
 * Désactivation du mode debug
 * 
 * Cette fonction désactive le mode debug et met à jour le localStorage.
 */
window.disableDebugMode = function() {
    localStorage.setItem('debugMode', 'false');
    DEBUG = false;
    console.log('Mode debug désactivé');
}

/**
 * Affichage de l'historique de débogage
 * 
 * Cette fonction affiche l'historique complet des messages de débogage dans la console.
 */
window.getDebugHistory = function() {
    console.log(debugHistory.join('\n'));
}

/**
 * Effacement de l'historique de débogage
 * 
 * Cette fonction efface l'historique des messages de débogage.
 */
window.clearDebugHistory = function() {
    debugHistory.length = 0;
    console.log('Historique de débogage effacé');
}

// Initialisation du mode debug basé sur le localStorage
if (localStorage.getItem('debugMode') === 'true') {
    DEBUG = true;
    console.log('Mode debug activé (chargé depuis le localStorage)');
}

// Appels initiaux
checkLoginStatus();
initializeIframeContent();