<?php
/** Tableau de bord : l'édition du contenu est faite par assets/js/admin.js via admin/api.php. */
declare(strict_types=1);
require_once __DIR__ . '/../includes/security.php';

send_security_headers();
header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store');

if (!is_logged_in()) {
    header('Location: index.php');
    exit;
}
$admin = read_json(ADMIN_FILE, []);
?>
<!doctype html>
<html lang="fr" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <meta name="csrf-token" content="<?= e(csrf_token()) ?>">
  <title>Back-office – Portfolio</title>
  <link rel="icon" href="../assets/img/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Space+Grotesk:wght@400;600;700&display=swap">
  <link rel="stylesheet" href="../assets/css/admin.css">
  <script src="../assets/js/theme.js"></script>
  <script src="../assets/js/admin.js" defer></script>
</head>
<body>
  <header class="topbar">
    <div class="brand"><span class="accent">&gt;_</span> Back-office</div>
    <div class="topbar-actions">
      <span class="who">Connectée : <?= e($admin['username'] ?? '') ?></span>
      <a class="btn ghost" href="../" target="_blank" rel="noopener">Voir le site</a>
      <button class="btn ghost icon" type="button" data-theme-toggle aria-label="Changer de thème">◐</button>
      <form method="post" action="logout.php">
        <input type="hidden" name="csrf" value="<?= e(csrf_token()) ?>">
        <button class="btn danger" type="submit">Déconnexion</button>
      </form>
    </div>
  </header>

  <div class="layout">
    <nav class="sidebar" id="tabs" aria-label="Sections"></nav>
    <main class="content">
      <div class="content-head">
        <h1 id="section-title">Chargement…</h1>
        <div class="save-zone">
          <span id="save-status" role="status"></span>
          <button class="btn" id="save-btn" type="button">Enregistrer</button>
        </div>
      </div>
      <div id="editor"></div>
    </main>
  </div>
</body>
</html>
