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

// Récupération des données de connexion
$input = json_decode(file_get_contents('php://input'), true);
$username = $input['username'] ?? '';
$password = $input['password'] ?? '';

if (empty($username) || empty($password)) {
    sendJsonResponse(false, 'Username and password are required');
}

// Connexion à la base de données
require_once 'db_config.php';

try {
    // Préparation de la requête
    $stmt = $conn->prepare("SELECT id, password FROM users WHERE username = ?");
    $stmt->bind_param("s", $username);

    // Exécution de la requête
    $stmt->execute();
    $result = $stmt->get_result();

    if ($user = $result->fetch_assoc()) {
        if (password_verify($password, $user['password'])) {
            $_SESSION['user_id'] = $user['id'];
            sendJsonResponse(true, 'Login successful', ['user_id' => $user['id']]);
        } else {
            sendJsonResponse(false, 'Invalid password');
        }
    } else {
        sendJsonResponse(false, 'User not found');
    }
} catch (Exception $e) {
    sendJsonResponse(false, 'An error occurred: ' . $e->getMessage());
}

$stmt->close();
$conn->close();
?>