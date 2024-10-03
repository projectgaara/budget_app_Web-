<?php
// load_budget.php
session_start();
include 'db_config.php';

header('Content-Type: application/json');

if(!isset($_SESSION["loggedin"]) || $_SESSION["loggedin"] !== true){
    echo json_encode(['success' => false, 'error' => 'Utilisateur non connecté']);
    exit;
}

$user_id = $_SESSION["id"];

$sql = "SELECT revenus, depenses FROM budgets WHERE user_id = ?";

if($stmt = mysqli_prepare($conn, $sql)){
    mysqli_stmt_bind_param($stmt, "i", $user_id);
    
    if(mysqli_stmt_execute($stmt)){
        mysqli_stmt_store_result($stmt);
        
        if(mysqli_stmt_num_rows($stmt) == 1){
            mysqli_stmt_bind_result($stmt, $revenus, $depenses);
            if(mysqli_stmt_fetch($stmt)){
                $budget = [
                    'revenus' => json_decode($revenus, true),
                    'depenses' => json_decode($depenses, true)
                ];
                echo json_encode(['success' => true, 'budget' => $budget]);
            }
        } else {
            echo json_encode(['success' => false, 'error' => 'Aucun budget trouvé']);
        }
    } else {
        echo json_encode(['success' => false, 'error' => 'Erreur lors du chargement du budget']);
    }
    mysqli_stmt_close($stmt);
} else {
    echo json_encode(['success' => false, 'error' => 'Erreur de préparation de la requête']);
}

mysqli_close($conn);
?>