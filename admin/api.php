<?php
/**
 * API du back-office (réservée à l'administratrice connectée).
 * Actions : get, save, messages, delete_message, password
 * Toutes les actions POST exigent l'en-tête X-CSRF-Token.
 */
declare(strict_types=1);
require_once __DIR__ . '/../includes/security.php';

send_security_headers();
header('X-Robots-Tag: noindex, nofollow');

if (!is_logged_in()) {
    json_response(['error' => 'Non connectée'], 401);
}

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST' && !csrf_check($_SERVER['HTTP_X_CSRF_TOKEN'] ?? null)) {
    json_response(['error' => 'Jeton CSRF invalide'], 403);
}

function body(): array
{
    $raw = (string) file_get_contents('php://input', false, null, 0, 600000);
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        json_response(['error' => 'JSON invalide'], 400);
    }
    return $data;
}

switch ("$method:$action") {
    case 'GET:get':
        json_response(read_json(PORTFOLIO_FILE, []));

    case 'POST:save':
        $in = body();
        $clean = [];
        foreach (ALLOWED_SECTIONS as $section) {
            if (array_key_exists($section, $in)) {
                $clean[$section] = sanitize_value($in[$section], $section);
            }
        }
        if (!isset($clean['profil']['nom']) || $clean['profil']['nom'] === '') {
            json_response(['error' => 'Le nom du profil est obligatoire.'], 422);
        }
        // Sauvegarde de la version précédente (10 dernières conservées)
        if (!is_dir(BACKUP_DIR)) {
            mkdir(BACKUP_DIR, 0750, true);
        }
        if (is_file(PORTFOLIO_FILE)) {
            copy(PORTFOLIO_FILE, BACKUP_DIR . '/portfolio-' . date('Ymd-His') . '.json');
            $backups = glob(BACKUP_DIR . '/portfolio-*.json') ?: [];
            sort($backups);
            foreach (array_slice($backups, 0, max(0, count($backups) - 10)) as $old) {
                unlink($old);
            }
        }
        if (!write_json(PORTFOLIO_FILE, $clean)) {
            json_response(['error' => 'Impossible d\'écrire le fichier. Vérifie les droits du dossier data/.'], 500);
        }
        json_response(['ok' => true, 'data' => $clean]);

    case 'GET:messages':
        json_response(read_json(MESSAGES_FILE, []));

    case 'POST:delete_message':
        $id = (string) (body()['id'] ?? '');
        $messages = array_values(array_filter(read_json(MESSAGES_FILE, []), fn($m) => ($m['id'] ?? '') !== $id));
        write_json(MESSAGES_FILE, $messages);
        json_response(['ok' => true]);

    case 'POST:password':
        $in = body();
        $admin = read_json(ADMIN_FILE, []);
        $new = (string) ($in['new'] ?? '');
        if (!password_verify((string) ($in['current'] ?? ''), (string) ($admin['hash'] ?? ''))) {
            usleep(800000);
            json_response(['error' => 'Mot de passe actuel incorrect.'], 403);
        }
        if (strlen($new) < 12 || !preg_match('/[A-Z]/', $new) || !preg_match('/[a-z]/', $new)
            || !preg_match('/\d/', $new) || !preg_match('/[^A-Za-z0-9]/', $new)) {
            json_response(['error' => '12 caractères minimum avec majuscule, minuscule, chiffre et caractère spécial.'], 422);
        }
        $algo = defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_DEFAULT;
        $admin['hash'] = password_hash($new, $algo);
        $admin['updated'] = date('c');
        write_json(ADMIN_FILE, $admin);
        session_regenerate_id(true);
        json_response(['ok' => true]);

    default:
        json_response(['error' => 'Action inconnue'], 404);
}
