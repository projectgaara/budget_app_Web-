<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$budget_name = $input['name'] ?? '';
$budget_data = json_encode($input);

if (empty($budget_name)) {
    echo json_encode(['success' => false, 'message' => 'Budget name is required']);
    exit;
}

require_once 'db_config.php';

$stmt = $conn->prepare("INSERT INTO budgets (user_id, name, data) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE data = ?");
$stmt->bind_param("isss", $_SESSION['user_id'], $budget_name, $budget_data, $budget_data);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Budget saved successfully']);
} else {
    echo json_encode(['success' => false, 'message' => 'Error saving budget: ' . $stmt->error]);
}

$stmt->close();
$conn->close();
?>