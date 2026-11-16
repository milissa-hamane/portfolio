<?php
declare(strict_types=1);
require_once __DIR__ . '/../includes/security.php';

send_security_headers();
start_secure_session();
// Déconnexion uniquement en POST avec jeton CSRF
if ($_SERVER['REQUEST_METHOD'] === 'POST' && csrf_check($_POST['csrf'] ?? null)) {
    logout();
    header('Location: index.php?bye=1');
    exit;
}
header('Location: dashboard.php');
