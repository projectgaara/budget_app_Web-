<?php
include_once 'debug_function.php';
session_start();

debug("Logout attempt", $_SESSION['user_id'] ?? 'No session');

session_destroy();
header('Content-Type: application/json');
echo json_encode(['success' => true, 'message' => 'Logged out successfully']);
debug("Logout successful");
?>