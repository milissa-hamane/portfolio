<?php
/**
 * Fonctions communes : en-têtes de sécurité, session, CSRF, lecture/écriture JSON.
 */
declare(strict_types=1);

require_once __DIR__ . '/config.php';

/** En-têtes HTTP de sécurité envoyés par toutes les pages PHP. */
function send_security_headers(): void
{
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
    header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'self'");
}

function is_https(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
}

/** Session avec cookie protégé (HttpOnly, SameSite=Strict, Secure en HTTPS). */
function start_secure_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    session_name('PFSESSID');
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'secure'   => is_https(),
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    session_start();
}

function csrf_token(): string
{
    start_secure_session();
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

function csrf_check(?string $token): bool
{
    start_secure_session();
    return is_string($token) && !empty($_SESSION['csrf']) && hash_equals($_SESSION['csrf'], $token);
}

/** Vrai si l'administratrice est connectée (avec expiration et contrôle du navigateur). */
function is_logged_in(): bool
{
    start_secure_session();
    if (empty($_SESSION['admin'])) {
        return false;
    }
    $ua = hash('sha256', $_SERVER['HTTP_USER_AGENT'] ?? '');
    if (!hash_equals($_SESSION['ua'] ?? '', $ua) || time() - ($_SESSION['last'] ?? 0) > SESSION_TIMEOUT) {
        logout();
        return false;
    }
    $_SESSION['last'] = time();
    return true;
}

function logout(): void
{
    start_secure_session();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'] ?? '', $p['secure'], $p['httponly']);
    }
    session_destroy();
}

function e(?string $s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function client_ip(): string
{
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

function read_json(string $file, $default = [])
{
    if (!is_file($file)) {
        return $default;
    }
    $data = json_decode((string) file_get_contents($file), true);
    return is_array($data) ? $data : $default;
}

/** Écriture atomique (fichier temporaire + renommage) avec verrou. */
function write_json(string $file, $data): bool
{
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        return false;
    }
    $tmp = $file . '.' . bin2hex(random_bytes(4)) . '.tmp';
    if (file_put_contents($tmp, $json, LOCK_EX) === false) {
        return false;
    }
    @chmod($tmp, 0640);
    return rename($tmp, $file);
}

function json_response($data, int $code = 200): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/* ---------- Limitation des tentatives (connexion, formulaire de contact) ---------- */

function attempts_key(string $scope): string
{
    return $scope . ':' . hash('sha256', client_ip());
}

/** Retourne le nombre de secondes de blocage restantes (0 si autorisé). */
function rate_limited(string $scope, int $max, int $window): int
{
    $all = read_json(ATTEMPTS_FILE, []);
    $key = attempts_key($scope);
    $now = time();
    $list = array_values(array_filter($all[$key] ?? [], fn($t) => $now - $t < $window));
    if (count($list) >= $max) {
        return $window - ($now - min($list));
    }
    return 0;
}

function record_attempt(string $scope, int $window): void
{
    $all = read_json(ATTEMPTS_FILE, []);
    $now = time();
    foreach ($all as $k => $list) { // nettoyage des vieilles entrées
        $all[$k] = array_values(array_filter($list, fn($t) => $now - $t < 86400));
        if (!$all[$k]) unset($all[$k]);
    }
    $all[attempts_key($scope)][] = $now;
    write_json(ATTEMPTS_FILE, $all);
}

function clear_attempts(string $scope): void
{
    $all = read_json(ATTEMPTS_FILE, []);
    unset($all[attempts_key($scope)]);
    write_json(ATTEMPTS_FILE, $all);
}

/* ---------- Validation du contenu enregistré depuis le back-office ---------- */

const ALLOWED_SECTIONS = ['profil', 'competences', 'projets', 'epreuves', 'formations', 'experiences',
    'certifications', 'langues', 'interets', 'seo'];
const URL_KEYS = ['lien', 'lien_doc', 'lien_demo', 'linkedin', 'github', 'url'];

function clean_url(string $u): string
{
    $u = trim($u);
    if ($u === '') return '';
    if (preg_match('#^(https?://|mailto:)[^\s<>"\']+$#i', $u)) return $u;
    if (preg_match('#^[A-Za-z0-9_\-./\#?=&%]+$#', $u) && !str_starts_with($u, '//')) return $u; // lien relatif
    return '';
}

/** Nettoie récursivement les données : textes limités, caractères de contrôle supprimés, URL vérifiées. */
function sanitize_value($value, string $key = '', int $depth = 0)
{
    if ($depth > 6) return null;
    if (is_array($value)) {
        $out = [];
        $count = 0;
        foreach ($value as $k => $v) {
            if (++$count > 200) break;
            $k = is_int($k) ? $k : preg_replace('/[^a-z0-9_]/i', '', (string) $k);
            $out[$k] = sanitize_value($v, is_int($k) ? $key : $k, $depth + 1);
        }
        return $out;
    }
    if (is_int($value) || is_float($value)) {
        return max(0, min(100, (int) $value));
    }
    if (is_bool($value) || $value === null) {
        return $value;
    }
    $s = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', (string) $value) ?? '';
    $s = mb_substr(trim($s), 0, 5000);
    return in_array($key, URL_KEYS, true) ? clean_url($s) : $s;
}
