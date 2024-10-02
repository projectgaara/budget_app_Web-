// Configuration du débogage
const DEBUG = true;
const debugHistory = [];

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

document.addEventListener('DOMContentLoaded', function() {
    debug('DOM chargé, initialisation de l\'application');
    checkLoginStatus();
    initializeIframeContent();
    setupEventListeners();
});

function setupEventListeners() {
    debug('Configuration des écouteurs d\'événements');
    document.getElementById('saveLoadButton').addEventListener('click', openSaveLoadModal);
    document.getElementById('saveServerButton').addEventListener('click', sauvegarderBudget);
    document.getElementById('loadServerButton').addEventListener('click', chargerBudgetDuServeur);
    document.getElementById('downloadJSONButton').addEventListener('click', downloadBudgetJSON);
    document.getElementById('uploadJSONButton').addEventListener('click', () => document.getElementById('jsonFileInput').click());
    document.getElementById('jsonFileInput').addEventListener('change', uploadBudgetJSON);
    
    // Gestion des modals
    document.querySelectorAll('.modal .close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });

    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };
}

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
        }
    })
    .catch(error => {
        console.error('Erreur lors de la vérification du statut de connexion:', error);
        isLoggedIn = false;
        updateAuthSection();
    });
}

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

function openSignupModal() {
    document.getElementById('signupModal').style.display = 'block';
}

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

function openSaveLoadModal() {
    document.getElementById('saveLoadModal').style.display = 'block';
}

function sauvegarderBudget() {
    debug('Tentative de sauvegarde du budget');
    if (!isLoggedIn) {
        alert("Veuillez vous connecter pour sauvegarder votre budget.");
        return;
    }

    const frame = document.getElementById('content-frame');
    const doc = frame.contentDocument;

    const budget = {
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
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            alert('Budget sauvegardé avec succès!');
        } else {
            throw new Error(data.message || 'Erreur inconnue lors de la sauvegarde');
        }
    })
    .catch(error => {
        console.error('Erreur lors de la sauvegarde du budget:', error);
        alert('Erreur lors de la sauvegarde du budget: ' + error.message);
    });
}

function chargerBudgetDuServeur() {
    debug('Tentative de chargement du budget');
    if (!isLoggedIn) {
        alert("Veuillez vous connecter pour charger votre budget.");
        return;
    }

    fetch('get_budget.php', { credentials: 'include' })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            loadBudgetData(data.data);
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

function addRowListeners(row) {
    row.querySelector('input[type="number"]').addEventListener('change', calculerTotal);
    row.querySelector('select').addEventListener('change', calculerTotal);
    row.querySelector('.delete-btn').addEventListener('click', function(event) {
        supprimerLigne(event.target);
    });
}

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
        totalDepensesMensuelles += montantMens

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

//===============================================
// Fonctions utilitaires
//===============================================

function updateElement(doc, id, value) {
    const element = doc.getElementById(id);
    if (element) {
        element.textContent = value.toFixed(2) + " $CA";
    } else {
        debug(`Élément non trouvé: ${id}`);
    }
}

function updateElementClass(doc, id, className) {
    const element = doc.getElementById(id);
    if (element) {
        element.className = className;
    } else {
        debug(`Élément non trouvé: ${id}`);
    }
}

function montantMensuel(montant, frequence) {
    switch(frequence) {
        case 1: return montant * 4.3;
        case 2: return montant * 2.15;
        case 3: return montant * 1.43;
        case 4: return montant;
        default: return montant;
    }
}

//===============================================
// Initialisation et gestion de l'iframe
//===============================================

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

function addIframeListeners() {
    debug('Ajout des écouteurs d\'événements à l\'iframe');
    const frame = document.getElementById('content-frame');
    const doc = frame.contentDocument;

    doc.querySelectorAll('#revenus button, #depenses button').forEach(button => {
        if (button.classList.contains('delete-btn')) {
            button.removeEventListener('click', supprimerLigneHandler);
            button.addEventListener('click', supprimerLigneHandler);
        } else {
            button.removeEventListener('click', ajouterLigneHandler);
            button.addEventListener('click', ajouterLigneHandler);
        }
    });

    doc.querySelectorAll('input, select').forEach(element => {
        element.removeEventListener('change', calculerTotal);
        element.addEventListener('change', calculerTotal);
    });
}

function supprimerLigneHandler(event) {
    event.preventDefault();
    event.stopPropagation();
    supprimerLigne(event.target);
}

function ajouterLigneHandler(event) {
    event.preventDefault();
    const type = event.target.closest('div').id;
    ajouterLigne(type);
}

//===============================================
// Fonctions de débogage avancées
//===============================================

window.enableDebugMode = function() {
    localStorage.setItem('debugMode', 'true');
    DEBUG = true;
    console.log('Mode debug activé');
}

window.disableDebugMode = function() {
    localStorage.setItem('debugMode', 'false');
    DEBUG = false;
    console.log('Mode debug désactivé');
}

window.getDebugHistory = function() {
    console.log(debugHistory.join('\n'));
}

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
