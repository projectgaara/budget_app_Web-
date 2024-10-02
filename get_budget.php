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

// Connexion à la base de données
require_once 'db_config.php';

try {
    // Préparation de la requête
    $stmt = $conn->prepare("SELECT budget FROM users WHERE id = ?");
    $stmt->bind_param("i", $_SESSION['user_id']);

    // Exécution de la requête
    $stmt->execute();
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        $budget = json_decode($row['budget'], true);
        sendJsonResponse(true, 'Budget retrieved successfully', $budget);
    } else {
        sendJsonResponse(false, 'No budget found for this user');
    }
} catch (Exception $e) {
    sendJsonResponse(false, 'An error occurred: ' . $e->getMessage());
}

$stmt->close();
$conn->close();
?>