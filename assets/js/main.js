/* =========================================================
   Portfolio – script principal
   - charge les données JSON (api/data.php)
   - affiche les sections
   - animations : démarrage terminal, réseau de particules,
     texte tapé, glitch, apparition au défilement, compteurs,
     inclinaison 3D des cartes, barre de progression
   ========================================================= */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  var DATA = null;

  /* ---------- Outils ---------- */

  // Crée un élément en toute sécurité (textContent : aucune injection HTML possible)
  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k.indexOf('on') === 0) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    });
    (children || []).forEach(function (c) {
      if (c === null || c === undefined || c === '') return;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return n;
  }

  // N'accepte que les liens http(s), mailto, tel ou relatifs
  function safeUrl(u) {
    if (!u) return null;
    u = String(u).trim();
    if (/^(https?:\/\/|mailto:|tel:)[^\s<>"']+$/i.test(u)) return u;
    if (/^[\w\-./#?=&%]+$/.test(u) && u.indexOf('//') !== 0) return u;
    return null;
  }

  function list(arr) { return Array.isArray(arr) ? arr : []; }
  function pad(n) { return String(n).padStart(2, '0'); }
  function store(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }

  /* ---------- 1. Écran de démarrage ---------- */
  function boot() {
    var screen = $('#boot');
    if (!screen) return Promise.resolve();
    if (reduceMotion || store('booted')) { screen.remove(); return Promise.resolve(); }
    store('booted', '1');
    var lines = [
      '[  OK  ] Initialisation du noyau portfolio…',
      '[  OK  ] Montage de /home/milissa',
      '[  OK  ] Démarrage du service réseau',
      '[  OK  ] Chargement du pare-feu',
      '[  OK  ] Connexion sécurisée établie',
      '',
      'Bienvenue. Accès autorisé ▌'
    ];
    var log = $('#boot-log');
    return new Promise(function (resolve) {
      var i = 0;
      (function next() {
        if (i < lines.length) { log.textContent += lines[i++] + '\n'; setTimeout(next, 130); return; }
        setTimeout(function () {
          screen.classList.add('hidden');
          setTimeout(function () { screen.remove(); }, 600);
          resolve();
        }, 350);
      })();
    });
  }

  /* ---------- 2. Fond : réseau de particules ---------- */
  function particles() {
    var canvas = $('#bg');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var w, h, dpr, pts = [], color = '0,255,156', mouse = { x: -9999, y: -9999 };

    function readColor() {
      var hex = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
      var m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
      if (m) color = [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)].join(',');
    }
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.min(90, Math.floor((w * h) / 16000));
      pts = [];
      for (var i = 0; i < count; i++) {
        pts.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, r: Math.random() * 1.6 + .6 });
      }
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      var light = document.documentElement.getAttribute('data-theme') === 'light';
      var base = light ? .35 : .55;
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        if (!reduceMotion) {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > w) p.vx *= -1;
          if (p.y < 0 || p.y > h) p.vy *= -1;
          // la souris attire légèrement les points
          var dxm = mouse.x - p.x, dym = mouse.y - p.y, dm = Math.sqrt(dxm * dxm + dym * dym);
          if (dm < 160) { p.x += dxm * .006; p.y += dym * .006; }
        }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + color + ',' + base + ')'; ctx.fill();
        for (var j = i + 1; j < pts.length; j++) {
          var q = pts[j], dx = p.x - q.x, dy = p.y - q.y, d = dx * dx + dy * dy;
          if (d < 17000) {
            ctx.strokeStyle = 'rgba(' + color + ',' + (base * .45 * (1 - d / 17000)) + ')';
            ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
        if (dm < 160) {
          ctx.strokeStyle = 'rgba(' + color + ',' + (base * (1 - dm / 160)) + ')';
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
    }
    function loop() { if (!document.hidden) draw(); if (!reduceMotion) requestAnimationFrame(loop); }

    readColor(); resize(); loop();
    window.addEventListener('resize', function () { resize(); if (reduceMotion) draw(); });
    window.addEventListener('themechange', function () { readColor(); if (reduceMotion) draw(); });
    window.addEventListener('mousemove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener('mouseout', function () { mouse.x = mouse.y = -9999; });
  }

  /* ---------- 3. Texte tapé (rôles) ---------- */
  function typeRoles(roles) {
    var target = $('#typed');
    roles = list(roles).filter(Boolean);
    if (!target || !roles.length) return;
    if (reduceMotion) { target.textContent = roles[0]; return; }
    var r = 0, c = 0, deleting = false;
    (function tick() {
      var word = roles[r];
      target.textContent = word.slice(0, c);
      if (!deleting && c < word.length) { c++; setTimeout(tick, 55); }
      else if (!deleting) { deleting = true; setTimeout(tick, 1800); }
      else if (c > 0) { c--; setTimeout(tick, 25); }
      else { deleting = false; r = (r + 1) % roles.length; setTimeout(tick, 300); }
    })();
  }

  /* ---------- 4. Terminal de l'accueil ---------- */
  function terminal(d) {
    var box = $('#terminal');
    if (!box) return;
    var p = d.profil || {};
    var techs = [];
    list(d.projets).forEach(function (pr) { list(pr.technologies).forEach(function (t) { if (techs.indexOf(t) < 0) techs.push(t); }); });
    var script = [
      ['cmd', '$ cat profil.txt'],
      ['kv', 'nom', p.nom], ['kv', 'formation', p.titre], ['kv', 'lieu', p.localisation], ['kv', 'statut', p.disponibilite],
      ['cmd', '$ ls ~/projets | wc -l'], ['out', String(list(d.projets).length)],
      ['cmd', '$ echo $STACK'], ['out', techs.slice(0, 8).join(' · ')],
      ['cmd', '$ systemctl status motivation'], ['ok', '● active (running) – 100 %']
    ];
    box.textContent = '';
    var i = 0;
    function line(item) {
      var span;
      if (item[0] === 'cmd') span = el('span', { class: 't-cmd', text: item[1] });
      else if (item[0] === 'kv') span = el('span', {}, [el('span', { class: 't-key', text: (item[1] + '        ').slice(0, 11) }), ': ' + (item[2] || '-')]);
      else if (item[0] === 'ok') span = el('span', { class: 't-ok', text: item[1] });
      else span = el('span', { text: item[1] });
      box.appendChild(span); box.appendChild(document.createTextNode('\n'));
    }
    if (reduceMotion) { script.forEach(line); return; }
    (function next() { if (i < script.length) { line(script[i++]); setTimeout(next, script[i - 1][0] === 'cmd' ? 380 : 120); } })();
  }

  /* ---------- 5. Rendu des sections ---------- */
  function bindText(d) {
    $$('[data-bind]').forEach(function (n) {
      var path = n.getAttribute('data-bind').split('.');
      var v = path.reduce(function (o, k) { return o && o[k]; }, d);
      if (typeof v === 'string' && v) {
        n.textContent = v;
        if (n.classList.contains('glitch')) n.setAttribute('data-text', v);
      }
    });
  }

  function renderAbout(p) {
    var box = $('#about-cards'); if (!box) return;
    [['LOC', 'Localisation', p.localisation], ['EDU', 'Formation', p.titre], ['JOB', 'Recherche', p.disponibilite], ['CAR', 'Mobilité', p.permis]]
      .forEach(function (it) {
        if (!it[2]) return;
        box.appendChild(el('li', { class: 'reveal' }, [el('span', { class: 'ic', text: it[0] }), el('div', {}, [el('small', { text: it[1] }), it[2]])]));
      });
  }

  function renderSkills(skills) {
    var box = $('#skills'); if (!box) return;
    var groups = {};
    list(skills).forEach(function (s) { var c = s.categorie || 'Autres'; (groups[c] = groups[c] || []).push(s); });
    Object.keys(groups).forEach(function (cat) {
      var card = el('div', { class: 'panel skill-cat reveal' }, [el('h3', { text: '// ' + cat })]);
      groups[cat].forEach(function (s) {
        // un mot à la place d'un pourcentage
        var lvl = parseInt(s.niveau, 10) || 0;
        var mot = lvl >= 70 ? "À l'aise" : lvl >= 55 ? 'En pratique' : 'En apprentissage';
        card.appendChild(el('div', { class: 'skill' }, [
          el('div', { class: 'skill-head' }, [el('span', { text: s.nom }), el('span', { class: 'skill-word', text: mot })])
        ]));
      });
      box.appendChild(card);
    });
  }

  function renderLangs(d) {
    var l = $('#langues'), i = $('#interets');
    list(d.langues).forEach(function (x) { l.appendChild(el('li', {}, [el('b', { text: x.langue }), ' · ' + (x.niveau || '')])); });
    list(d.interets).forEach(function (x) { i.appendChild(el('li', {}, [el('b', { text: x.titre }), x.detail ? ' – ' + x.detail : ''])); });
  }

  function statusBadge(s) {
    if (!s) return null;
    return el('span', { class: 'badge badge-status' + (/compl|cours/i.test(s) ? ' todo' : ''), text: s });
  }

  function renderProjects(projets) {
    var box = $('#projects'), filters = $('#filters');
    if (!box) return;
    projets = list(projets);
    ['Tous', 'E5', 'E6'].forEach(function (f, idx) {
      filters.appendChild(el('button', {
        class: 'filter' + (idx === 0 ? ' active' : ''), type: 'button', 'data-filter': f, 'aria-pressed': String(idx === 0),
        text: f === 'Tous' ? 'Tous (' + projets.length + ')' : f + ' (' + projets.filter(function (p) { return p.epreuve === f; }).length + ')',
        onclick: function () {
          $$('.filter').forEach(function (b) { b.classList.toggle('active', b === this); b.setAttribute('aria-pressed', String(b === this)); }, this);
          $$('.project').forEach(function (c) { c.classList.toggle('hide', f !== 'Tous' && c.getAttribute('data-epreuve') !== f); });
        }
      }));
    });
    projets.forEach(function (p, i) {
      var card = el('article', { class: 'project reveal', 'data-epreuve': p.epreuve || '' }, [
        el('div', { class: 'project-top' }, [
          el('span', { class: 'project-id', text: '0x' + pad(i + 1) }),
          el('div', { class: 'badges' }, [statusBadge(p.statut), p.epreuve ? el('span', { class: 'badge badge-' + p.epreuve, text: p.epreuve }) : null])
        ]),
        el('h3', { text: p.titre }),
        el('p', { text: p.resume }),
        el('ul', { class: 'tags', 'aria-label': 'Technologies' }, list(p.technologies).map(function (t) { return el('li', { text: t }); })),
        el('button', { class: 'btn btn-ghost', type: 'button', text: 'Détails >', onclick: function () { openProject(p, i); } })
      ]);
      if (finePointer && !reduceMotion) tilt(card);
      box.appendChild(card);
    });
  }

  function openProject(p, i) {
    var modal = $('#modal'), c = $('#modal-content');
    c.textContent = '';
    c.appendChild(el('p', { class: 'mono accent', text: '0x' + pad(i + 1) + (p.epreuve ? ' · Épreuve ' + p.epreuve : '') + (p.statut ? ' · ' + p.statut : '') }));
    c.appendChild(el('h2', { id: 'modal-title', text: p.titre }));
    c.appendChild(el('p', { text: p.description && !/à compléter|ta réalisation/i.test(p.description) ? p.description : p.resume }));
    if (list(p.realisations).length) {
      c.appendChild(el('h4', { text: 'Réalisations' }));
      c.appendChild(el('ul', { class: 'list' }, p.realisations.map(function (r) { return el('li', { text: r }); })));
    }
    if (list(p.technologies).length) {
      c.appendChild(el('h4', { text: 'Technologies' }));
      c.appendChild(el('ul', { class: 'tags' }, p.technologies.map(function (t) { return el('li', { text: t }); })));
    }
    var links = el('div', { class: 'links' });
    var doc = safeUrl(p.lien_doc), demo = safeUrl(p.lien_demo);
    if (doc) links.appendChild(el('a', { class: 'btn btn-primary', href: doc, target: '_blank', rel: 'noopener', text: 'Documentation' }));
    if (demo) links.appendChild(el('a', { class: 'btn btn-ghost', href: demo, target: '_blank', rel: 'noopener', text: 'Démo / lien' }));
    if (links.children.length) c.appendChild(links);
    if (typeof modal.showModal === 'function') modal.showModal(); else modal.setAttribute('open', '');
  }

  function renderExams(d) {
    var box = $('#exams'); if (!box) return;
    list(d.epreuves).forEach(function (ex) {
      var linked = list(d.projets).filter(function (p) { return p.epreuve === ex.code; });
      var card = el('article', { class: 'panel exam reveal' }, [
        el('span', { class: 'exam-code', 'aria-hidden': 'true', text: ex.code }),
        el('span', { class: 'label', text: 'Épreuve ' + ex.code }),
        el('h3', { text: ex.titre }),
        el('p', { text: ex.description })
      ]);
      if (linked.length) {
        card.appendChild(el('h4', { text: 'Projets présentés' }));
        card.appendChild(el('ul', {}, linked.map(function (p) {
          return el('li', {}, [el('a', { href: '#projets', text: p.titre, onclick: function () { var b = $('.filter[data-filter="' + ex.code + '"]'); if (b) b.click(); } })]);
        })));
      }
      var docs = list(ex.documents).filter(function (x) { return safeUrl(x.lien); });
      if (docs.length) {
        card.appendChild(el('h4', { text: 'Documents' }));
        card.appendChild(el('ul', {}, docs.map(function (x) { return el('li', {}, [el('a', { href: safeUrl(x.lien), target: '_blank', rel: 'noopener', text: x.nom || x.lien })]); })));
      }
      box.appendChild(card);
    });
  }

  function renderTimeline(d) {
    var exp = $('#experiences'), form = $('#formations');
    list(d.experiences).forEach(function (x) {
      exp.appendChild(el('li', { class: 'reveal' }, [el('div', { class: 'panel' }, [
        el('span', { class: 'when', text: x.periode }),
        el('h4', { text: x.poste }),
        el('p', { class: 'where', text: [x.entreprise, x.lieu].filter(Boolean).join(' · ') }),
        el('ul', {}, list(x.missions).map(function (m) { return el('li', { text: m }); }))
      ])]));
    });
    list(d.formations).forEach(function (x) {
      form.appendChild(el('li', { class: 'reveal' }, [el('div', { class: 'panel' }, [
        el('span', { class: 'when', text: x.periode }),
        el('h4', { text: x.diplome }),
        el('p', { class: 'where', text: [x.etablissement, x.details].filter(Boolean).join(' · ') })
      ])]));
    });
  }

  function renderCerts(certs) {
    var box = $('#certs'); if (!box) return;
    list(certs).forEach(function (c) {
      var cls = /obten/i.test(c.statut) ? 'ok' : /cours|pr[ée]para/i.test(c.statut) ? 'wip' : 'plan';
      var url = safeUrl(c.lien);
      box.appendChild(el('article', { class: 'panel cert reveal' }, [
        el('span', { class: 'badge ' + cls, text: c.statut || 'Prévue' }),
        el('h3', { text: c.nom }),
        el('p', { text: [c.organisme, c.date].filter(Boolean).join(' · ') }),
        url ? el('a', { href: url, target: '_blank', rel: 'noopener', class: 'mono', text: 'En savoir plus →' }) : null
      ]));
    });
  }

  function renderCoords(p) {
    var box = $('#coords'); if (!box) return;
    var items = [
      ['MAIL', p.email, p.email ? 'mailto:' + p.email : null],
      ['TÉL', p.telephone, p.telephone ? 'tel:' + p.telephone.replace(/\s+/g, '') : null],
      ['LOC', p.localisation, null],
      ['IN', p.linkedin ? 'LinkedIn' : '', safeUrl(p.linkedin)],
      ['GIT', p.github ? 'GitHub' : '', safeUrl(p.github)],
      ['CAR', p.permis, null]
    ];
    items.forEach(function (it) {
      if (!it[1]) return;
      box.appendChild(el('li', {}, [el('span', { class: 'ic', text: it[0] }), it[2] ? el('a', { href: it[2], target: /^http/.test(it[2]) ? '_blank' : null, rel: 'noopener', text: it[1] }) : it[1]]));
    });
  }

  /* ---------- 6. Interactions ---------- */
  function tilt(card) {
    card.addEventListener('mousemove', function (e) {
      var r = card.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      card.style.transform = 'perspective(800px) rotateX(' + (-y * 6) + 'deg) rotateY(' + (x * 8) + 'deg) translateY(-4px)';
    });
    card.addEventListener('mouseleave', function () { card.style.transform = ''; });
  }

  function reveal() {
    var items = $$('.reveal:not(.visible)');
    if (!('IntersectionObserver' in window) || reduceMotion) { items.forEach(function (n) { n.classList.add('visible'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); }
      });
    }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (n, i) { n.style.transitionDelay = (i % 4) * 70 + 'ms'; io.observe(n); });
  }

  function counters(d) {
    var values = { projets: list(d.projets).length, competences: list(d.competences).length };
    $$('.counter').forEach(function (n) {
      var target = parseInt(n.getAttribute('data-value'), 10) || values[n.getAttribute('data-count')] || 0;
      if (reduceMotion) { n.textContent = target; return; }
      var start = null;
      function step(ts) {
        if (!start) start = ts;
        var k = Math.min(1, (ts - start) / 1400);
        n.textContent = Math.round(target * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  function glitchLoop() {
    var g = $('.glitch');
    if (!g || reduceMotion) return;
    setInterval(function () {
      g.classList.add('glitching');
      setTimeout(function () { g.classList.remove('glitching'); }, 380);
    }, 3800);
  }

  function header() {
    var head = $('#header'), bar = $('#scroll-progress');
    function onScroll() {
      head.classList.toggle('scrolled', window.scrollY > 20);
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0) + ')';
    }
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

    // menu mobile
    var burger = $('#burger'), menu = $('#menu');
    burger.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
    });
    $$('#menu a').forEach(function (a) { a.addEventListener('click', function () { menu.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }); });

    // lien actif selon la section visible
    if ('IntersectionObserver' in window) {
      var links = $$('#menu a[href^="#"]');
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id); });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      $$('main section[id]').forEach(function (s) { io.observe(s); });
    }
  }

  function modal() {
    var m = $('#modal');
    $('#modal-close').addEventListener('click', function () { m.close(); });
    m.addEventListener('click', function (e) { if (e.target === m) m.close(); });
  }

  function contactForm() {
    var form = $('#contact-form'), status = $('#form-status');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.className = 'form-status';
      if (!form.checkValidity()) { status.textContent = '> Vérifiez les champs du formulaire.'; status.classList.add('err'); return; }
      var btn = form.querySelector('button'); btn.disabled = true;
      status.textContent = '> Envoi en cours…';
      var payload = {
        nom: form.nom.value, email: form.email.value, message: form.message.value, website: form.website.value
      };
      fetch('api/contact.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (!res.ok) throw new Error(res.j.error || 'Erreur');
          status.textContent = '> Message envoyé. Merci, je vous réponds rapidement.';
          status.classList.add('ok'); form.reset();
        })
        .catch(function (err) { status.textContent = '> ' + (err.message || 'Envoi impossible.'); status.classList.add('err'); })
        .then(function () { btn.disabled = false; });
    });
  }

  /* ---------- 7. Chargement des données ---------- */
  function loadData() {
    return fetch('api/data.php', { headers: { Accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      // Repli pour un aperçu sans PHP (en ligne, data/ est protégé)
      .catch(function () { return fetch('data/portfolio.json').then(function (r) { return r.json(); }); });
  }

  function render(d) {
    DATA = d;
    var p = d.profil || {};
    bindText(d);
    renderAbout(p);
    renderSkills(d.competences);
    renderLangs(d);
    renderProjects(d.projets);
    renderExams(d);
    renderTimeline(d);
    renderCerts(d.certifications);
    renderCoords(p);
    reveal();
    counters(d);
    terminal(d);
    typeRoles(p.roles && p.roles.length ? p.roles : [p.titre]);
  }

  document.addEventListener('DOMContentLoaded', function () {
    $('#year').textContent = new Date().getFullYear();
    particles();
    header();
    modal();
    contactForm();
    glitchLoop();
    Promise.all([loadData(), boot()])
      .then(function (res) { render(res[0]); })
      .catch(function () {
        var t = $('#terminal');
        if (t) t.textContent = '$ cat profil.txt\nErreur : impossible de charger les données.';
        reveal();
      });
  });
})();
