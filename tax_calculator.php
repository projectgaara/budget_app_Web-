<?php
require_once 'session_config.php';
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Calculatrice de Taxe</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <h1>Calculatrice de Taxe</h1>
        <form id="taxForm">
            <label for="montant">Montant avant taxes:</label>
            <input type="number" id="montant" name="montant" step="0.01" required>
            <button type="submit">Calculer</button>
        </form>
        <div id="resultat"></div>
    </div>

    <script>
    document.getElementById('taxForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const montant = parseFloat(document.getElementById('montant').value);
        const taxe = montant * 0.14975;
        const total = montant + taxe;
        
        document.getElementById('resultat').innerHTML = `
            <p>Montant avant taxes: ${montant.toFixed(2)} $CA</p>
            <p>Taxes (14.975%): ${taxe.toFixed(2)} $CA</p>
            <p>Total: ${total.toFixed(2)} $CA</p>
        `;
    });
    </script>
</body>
</html>