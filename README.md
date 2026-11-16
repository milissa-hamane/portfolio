# Portfolio BTS SIO SISR – Milissa Hamane

Thème **Cyber / DarkOps**, mode sombre / clair, animations JavaScript, back-office sécurisé et stockage des données en JSON.

## 1. Arborescence

```
portfolio-milissa/
├── index.html            Page principale (présentation, compétences, projets, E5/E6, parcours, certifications, contact)
├── cv.html               CV en HTML (bouton « Imprimer / PDF »)
├── 404.html              Page d'erreur 404 personnalisée
├── .htaccess             Page 404, en-têtes de sécurité, cache
├── robots.txt            Règles pour les moteurs de recherche
├── sitemap.xml           Plan du site (SEO)
├── assets/
│   ├── css/  style.css · cv.css · 404.css · admin.css
│   ├── js/   theme.js · main.js · cv.js · 404.js · admin.js
│   └── img/  favicon.svg
├── api/
│   ├── data.php          Lecture publique des données (JSON)
│   └── contact.php       Réception du formulaire de contact
├── admin/                Back-office
│   ├── setup.php         Création du compte (une seule fois)
│   ├── index.php         Connexion
│   ├── dashboard.php     Tableau de bord
│   ├── api.php           Enregistrement, messages, mot de passe
│   └── logout.php        Déconnexion
├── includes/             Configuration et sécurité (accès web bloqué)
├── data/                 portfolio.json, messages, compte admin (accès web bloqué)
└── docs/                 Tes PDF (documentation GLPI, tableau E5, dossier E6)
```

## 2. Tester sur ton ordinateur

Avec PHP installé (ou XAMPP / WAMP / Laragon) :

```bash
cd portfolio-milissa
php -S localhost:8000
```

Ouvre ensuite http://localhost:8000

> Le serveur intégré de PHP ne lit pas le `.htaccess` : la page 404 et la protection des dossiers `data/` et `includes/`
> fonctionnent seulement sur un vrai serveur Apache (hébergeur, XAMPP…).

## 3. Mise en ligne (étapes)

1. Ouvre `includes/config.php` et remplace `SETUP_KEY` par une phrase secrète (12 caractères minimum).
2. Envoie tout le dossier sur ton hébergement (Apache + PHP 8), à la racine du site.
3. Donne les droits d'écriture au dossier `data/` (chmod 750 ou 755 selon l'hébergeur).
4. Va sur `https://ton-site/admin/setup.php`, entre la clé et crée ton identifiant + mot de passe.
   Ensuite la page `setup.php` se bloque toute seule.
5. Connecte-toi sur `https://ton-site/admin/` et modifie ton contenu.
6. Remplace `https://milissa.hamane.mds-nantes.fr/` par ta vraie adresse dans `index.html`, `cv.html`, `robots.txt` et `sitemap.xml`.
7. Active le HTTPS dans `.htaccess` (lignes à décommenter) dès que ton certificat SSL fonctionne.

Si le site est dans un sous-dossier (ex. `/portfolio/`), modifie la ligne `ErrorDocument` du `.htaccess`
et les chemins qui commencent par `/` dans `404.html`.

## 4. Sécurité du back-office

| Mesure | Où |
|---|---|
| Mot de passe haché (Argon2id / bcrypt), jamais stocké en clair | `admin/setup.php`, `admin/api.php` |
| Jeton CSRF sur tous les formulaires et requêtes POST | `includes/security.php` |
| Blocage 15 min après 5 échecs de connexion | `includes/config.php` |
| Session protégée (HttpOnly, SameSite=Strict, Secure en HTTPS), ID régénéré à la connexion | `start_secure_session()` |
| Déconnexion automatique après 30 min d'inactivité | `SESSION_TIMEOUT` |
| Dossiers `data/` et `includes/` inaccessibles depuis le web | `.htaccess` |
| Données nettoyées avant enregistrement (longueur, caractères, liens) | `sanitize_value()` |
| Affichage sans `innerHTML` (aucune injection XSS) | `main.js`, `admin.js` |
| En-têtes CSP, X-Frame-Options, nosniff | `.htaccess`, `send_security_headers()` |
| Back-office non indexé (noindex) et exclu de `robots.txt` | `admin/.htaccess` |
| Anti-spam du formulaire : champ piège + 3 messages / 10 min max | `api/contact.php` |
| Sauvegarde automatique des 10 dernières versions | `data/backups/` |

## 5. Référencement naturel (SEO)

- Balises `title`, `meta description`, `canonical`, Open Graph
- Données structurées schema.org (`Person`)
- HTML sémantique (`header`, `main`, `section`, `article`, un seul `h1`), langue `fr`
- `sitemap.xml` + `robots.txt`
- Site rapide : pas de framework, compression et cache dans `.htaccess`
- Accessibilité : lien d'évitement, contrastes, navigation clavier, `prefers-reduced-motion`

À faire après la mise en ligne : déclarer le site dans **Google Search Console** et envoyer le `sitemap.xml`.

## 6. Animations

Écran de démarrage façon terminal · réseau de particules qui réagit à la souris · texte tapé · effet glitch sur le nom ·
terminal animé · apparition des blocs au défilement · compteurs · barres de compétences · cartes 3D · pluie de caractères sur la page 404.
Toutes les animations se coupent si l'utilisateur a activé « réduire les animations » sur son appareil.
