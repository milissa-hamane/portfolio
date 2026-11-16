<?php
/** API publique : renvoie le contenu du portfolio (lecture seule). */
declare(strict_types=1);
require_once __DIR__ . '/../includes/security.php';

send_security_headers();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['error' => 'Méthode non autorisée'], 405);
}
$data = read_json(PORTFOLIO_FILE, []);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=60');
echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
