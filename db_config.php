<?php
define('DEBUG', true);  // Set to false in production
include_once 'debug_function.php';

$servername = "localhost";
$username = "gaaara";
$password = "b1mnwzz23";
$dbname = "budget_app";

try {
    $conn = new mysqli($servername, $username, $password, $dbname);
    if ($conn->connect_error) {
        debug("Database connection failed", $conn->connect_error);
        die("Connection failed: " . $conn->connect_error);
    }
    debug("Database connection successful");
} catch (Exception $e) {
    debug("Database connection exception", $e->getMessage());
    die("Connection failed: " . $e->getMessage());
}
?>