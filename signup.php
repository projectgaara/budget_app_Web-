<?php
include_once 'debug_function.php';
include_once 'db_config.php';

header('Content-Type: application/json');

function sendJsonResponse($success, $message = '') {
    echo json_encode(['success' => $success, 'message' => $message]);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    debug("Signup attempt", $input);

    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';

    if (empty($username) || empty($password)) {
        debug("Signup failed: Empty username or password");
        sendJsonResponse(false, 'Username and password are required');
    }

    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    $sql = "INSERT INTO users (username, password) VALUES (?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ss", $username, $hashed_password);

    if ($stmt->execute()) {
        debug("Signup successful", $username);
        sendJsonResponse(true, 'Signup successful');
    } else {
        debug("Signup failed: Database error", $stmt->error);
        sendJsonResponse(false, 'Signup failed');
    }
} catch (Exception $e) {
    debug("Signup exception", $e->getMessage());
    sendJsonResponse(false, 'An internal error occurred');
}
?>