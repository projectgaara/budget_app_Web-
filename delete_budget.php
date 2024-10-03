<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$budget_name = $input['name'] ?? '';

if (empty($budget_name)) {
    echo json_encode(['success' => false, 'message' => 'Budget name is required']);
    exit;
}

require_once 'db_config.php';

$stmt = $conn->prepare("DELETE FROM budgets WHERE user_id = ? AND name = ?");
$stmt->bind_param("is", $_SESSION['user_id'], $budget_name);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Budget deleted successfully']);
} else {
    echo json_encode(['success' => false, 'message' => 'Error deleting budget: ' . $stmt->error]);
}

$stmt->close();
$conn->close();
?>