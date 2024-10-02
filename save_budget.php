<?php
session_start();
header('Content-Type: application/json');

// Fonction pour envoyer une réponse JSON
function sendJsonResponse($success, $message, $data = null) {
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ]);
    exit;
}

// Vérification de la session
if (!isset($_SESSION['user_id'])) {
    sendJsonResponse(false, 'User not logged in');
}

// Récupération des données du budget
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    sendJsonResponse(false, 'Invalid input data');
}

// Connexion à la base de données
require_once 'db_config.php';

try {
    // Préparation de la requête
    $stmt = $conn->prepare("UPDATE users SET budget = ? WHERE id = ?");
    $budget_json = json_encode($input);
    $stmt->bind_param("si", $budget_json, $_SESSION['user_id']);

    // Exécution de la requête
    if ($stmt->execute()) {
        sendJsonResponse(true, 'Budget saved successfully');
    } else {
        sendJsonResponse(false, 'Error saving budget: ' . $stmt->error);
    }
} catch (Exception $e) {
    sendJsonResponse(false, 'An error occurred: ' . $e->getMessage());
}

$stmt->close();
$conn->close();
?>