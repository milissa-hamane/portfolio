<?php
/** Formulaire de contact : enregistre les messages dans data/messages.json. */
declare(strict_types=1);
require_once __DIR__ . '/../includes/security.php';

send_security_headers();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Méthode non autorisée'], 405);
}

// La requête doit venir de ce site
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && parse_url($origin, PHP_URL_HOST) !== parse_url('http://' . ($_SERVER['HTTP_HOST'] ?? ''), PHP_URL_HOST)) {
    json_response(['error' => 'Origine refusée'], 403);
}

$in = json_decode((string) file_get_contents('php://input', false, null, 0, 20000), true);
if (!is_array($in)) {
    json_response(['error' => 'Requête invalide'], 400);
}

// Champ piège invisible : rempli uniquement par les robots
if (!empty($in['website'])) {
    json_response(['ok' => true]);
}

if (rate_limited('contact', 3, 600) > 0) {
    json_response(['error' => 'Trop de messages envoyés. Réessaie dans quelques minutes.'], 429);
}

$nom = trim((string) ($in['nom'] ?? ''));
$email = trim((string) ($in['email'] ?? ''));
$message = trim((string) ($in['message'] ?? ''));

if (mb_strlen($nom) < 2 || mb_strlen($nom) > 80) {
    json_response(['error' => 'Merci d\'indiquer ton nom (2 à 80 caractères).'], 422);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 120) {
    json_response(['error' => 'Adresse e-mail invalide.'], 422);
}
if (mb_strlen($message) < 10 || mb_strlen($message) > 3000) {
    json_response(['error' => 'Le message doit contenir entre 10 et 3000 caractères.'], 422);
}

$messages = read_json(MESSAGES_FILE, []);
array_unshift($messages, [
    'id'      => bin2hex(random_bytes(8)),
    'date'    => date('c'),
    'nom'     => sanitize_value($nom),
    'email'   => $email,
    'message' => sanitize_value($message),
]);
$messages = array_slice($messages, 0, 500);

record_attempt('contact', 600);
if (!write_json(MESSAGES_FILE, $messages)) {
    json_response(['error' => 'Erreur serveur, réessaie plus tard.'], 500);
}
json_response(['ok' => true]);
