<?php
/**
 * Création du compte administrateur (une seule fois).
 * Nécessite la clé SETUP_KEY définie dans includes/config.php.
 * Une fois le compte créé, cette page est bloquée.
 */
declare(strict_types=1);
require_once __DIR__ . '/../includes/security.php';

send_security_headers();
header('X-Robots-Tag: noindex, nofollow');
start_secure_session();

$error = '';
$locked = is_file(ADMIN_FILE);
$keyNotChanged = SETUP_KEY === 'CHANGE-MOI-avant-la-mise-en-ligne' || strlen(SETUP_KEY) < 12;

if (!$locked && !$keyNotChanged && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $user = trim((string) ($_POST['username'] ?? ''));
    $pass = (string) ($_POST['password'] ?? '');
    $conf = (string) ($_POST['confirm'] ?? '');

    if (!csrf_check($_POST['csrf'] ?? null)) {
        $error = 'Session expirée, recharge la page.';
    } elseif (rate_limited('setup', 5, LOCKOUT_TIME) > 0) {
        $error = 'Trop de tentatives. Réessaie plus tard.';
    } elseif (!hash_equals(SETUP_KEY, (string) ($_POST['setup_key'] ?? ''))) {
        record_attempt('setup', LOCKOUT_TIME);
        $error = 'Clé d\'installation incorrecte.';
    } elseif (!preg_match('/^[A-Za-z0-9_.-]{3,32}$/', $user)) {
        $error = 'Identifiant : 3 à 32 caractères (lettres, chiffres, . _ -).';
    } elseif (strlen($pass) < 12 || !preg_match('/[A-Z]/', $pass) || !preg_match('/[a-z]/', $pass)
        || !preg_match('/\d/', $pass) || !preg_match('/[^A-Za-z0-9]/', $pass)) {
        $error = 'Mot de passe : 12 caractères minimum avec majuscule, minuscule, chiffre et caractère spécial.';
    } elseif (!hash_equals($pass, $conf)) {
        $error = 'Les deux mots de passe ne correspondent pas.';
    } else {
        $algo = defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_DEFAULT;
        write_json(ADMIN_FILE, ['username' => $user, 'hash' => password_hash($pass, $algo), 'created' => date('c')]);
        header('Location: index.php?setup=ok');
        exit;
    }
}
?>
<!doctype html>
<html lang="fr" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>Installation – Back-office</title>
  <link rel="icon" href="../assets/img/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Space+Grotesk:wght@400;600;700&display=swap">
  <link rel="stylesheet" href="../assets/css/admin.css">
  <script src="../assets/js/theme.js"></script>
</head>
<body class="auth">
  <main class="auth-card">
    <p class="auth-prompt">root@portfolio:~# ./setup.sh</p>
    <h1>Créer le compte administrateur</h1>
    <?php if ($locked): ?>
      <p class="alert">Le compte administrateur existe déjà. Cette page est désactivée.</p>
      <a class="btn" href="index.php">Aller à la connexion</a>
    <?php elseif ($keyNotChanged): ?>
      <p class="alert">Modifie d'abord la constante <code>SETUP_KEY</code> dans <code>includes/config.php</code> (12 caractères minimum).</p>
    <?php else: ?>
      <?php if ($error): ?><p class="alert"><?= e($error) ?></p><?php endif; ?>
      <form method="post" autocomplete="off">
        <input type="hidden" name="csrf" value="<?= e(csrf_token()) ?>">
        <label>Clé d'installation (SETUP_KEY)<input type="password" name="setup_key" required></label>
        <label>Identifiant<input type="text" name="username" required minlength="3" maxlength="32"></label>
        <label>Mot de passe<input type="password" name="password" required minlength="12" autocomplete="new-password"></label>
        <label>Confirmer le mot de passe<input type="password" name="confirm" required minlength="12" autocomplete="new-password"></label>
        <button class="btn" type="submit">Créer le compte</button>
      </form>
    <?php endif; ?>
  </main>
</body>
</html>
