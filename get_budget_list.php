<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode([]);
    exit;
}

require_once 'db_config.php';

$stmt = $conn->prepare("SELECT name FROM budgets WHERE user_id = ?");
$stmt->bind_param("i", $_SESSION['user_id']);
$stmt->execute();
$result = $stmt->get_result();

$budgets = [];
while ($row = $result->fetch_assoc()) {
    $budgets[] = ['name' => $row['name']];
}

echo json_encode($budgets);

$stmt->close();
$conn->close();
?>