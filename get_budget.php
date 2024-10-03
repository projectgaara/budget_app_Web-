<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

$budget_name = $_GET['name'] ?? '';

if (empty($budget_name)) {
    echo json_encode(['success' => false, 'message' => 'Budget name is required']);
    exit;
}

require_once 'db_config.php';

$stmt = $conn->prepare("SELECT data FROM budgets WHERE user_id = ? AND name = ?");
$stmt->bind_param("is", $_SESSION['user_id'], $budget_name);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    echo json_encode(['success' => true, 'data' => json_decode($row['data'], true)]);
} else {
    echo json_encode(['success' => false, 'message' => 'Budget not found']);
}

$stmt->close();
$conn->close();
?>