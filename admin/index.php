<?php
/** Connexion au back-office (mot de passe haché, CSRF, blocage après 5 échecs). */
declare(strict_types=1);
require_once __DIR__ . '/../includes/security.php';

send_security_headers();
header('X-Robots-Tag: noindex, nofollow');

if (!is_file(ADMIN_FILE)) {
    header('Location: setup.php');
    exit;
}
if (is_logged_in()) {
    header('Location: dashboard.php');
    exit;
}

$error = '';
$info = isset($_GET['setup']) ? 'Compte créé. Tu peux te connecter.' : (isset($_GET['bye']) ? 'Tu es déconnectée.' : '');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $wait = rate_limited('login', MAX_LOGIN_ATTEMPTS, LOCKOUT_TIME);
    if (!csrf_check($_POST['csrf'] ?? null)) {
        $error = 'Session expirée, recharge la page.';
    } elseif ($wait > 0) {
        $error = 'Trop de tentatives. Réessaie dans ' . ceil($wait / 60) . ' min.';
    } else {
        $admin = read_json(ADMIN_FILE, []);
        $user = (string) ($_POST['username'] ?? '');
        $pass = (string) ($_POST['password'] ?? '');
        $okUser = hash_equals((string) ($admin['username'] ?? ''), $user);
        $okPass = password_verify($pass, (string) ($admin['hash'] ?? ''));
        if ($okUser && $okPass) {
            clear_attempts('login');
            session_regenerate_id(true);
            $_SESSION['admin'] = true;
            $_SESSION['last'] = time();
            $_SESSION['ua'] = hash('sha256', $_SERVER['HTTP_USER_AGENT'] ?? '');
            $_SESSION['csrf'] = bin2hex(random_bytes(32));
            header('Location: dashboard.php');
            exit;
        }
        record_attempt('login', LOCKOUT_TIME);
        usleep(800000); // ralentit les attaques automatiques
        $error = 'Identifiant ou mot de passe incorrect.';
    }
}
?>
<!doctype html>
<html lang="fr" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>Connexion – Back-office</title>
  <link rel="icon" href="../assets/img/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Space+Grotesk:wght@400;600;700&display=swap">
  <link rel="stylesheet" href="../assets/css/admin.css">
  <script src="../assets/js/theme.js"></script>
</head>
<body class="auth">
  <main class="auth-card">
    <p class="auth-prompt">root@portfolio:~# ssh admin</p>
    <h1>Accès sécurisé</h1>
    <?php if ($info): ?><p class="alert ok"><?= e($info) ?></p><?php endif; ?>
    <?php if ($error): ?><p class="alert"><?= e($error) ?></p><?php endif; ?>
    <form method="post">
      <input type="hidden" name="csrf" value="<?= e(csrf_token()) ?>">
      <label>Identifiant<input type="text" name="username" required autocomplete="username"></label>
      <label>Mot de passe<input type="password" name="password" required autocomplete="current-password"></label>
      <button class="btn" type="submit">Se connecter</button>
    </form>
    <a class="back" href="../">← Retour au portfolio</a>
  </main>
</body>
</html>
