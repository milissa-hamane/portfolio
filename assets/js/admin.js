/* =========================================================
   Back-office : éditeur du contenu du portfolio (data/portfolio.json)
   Chaque section est décrite dans SCHEMA ; le formulaire est généré
   automatiquement. Les requêtes POST envoient le jeton CSRF.
   ========================================================= */
(function () {
  'use strict';

  var CSRF = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
  var $ = function (s) { return document.querySelector(s); };

  // type : text | textarea | number | select | lines (une valeur par ligne) | csv (séparées par des virgules) | pairs (Nom | lien)
  var SCHEMA = {
    profil: { label: 'Profil & coordonnées', type: 'object', hint: 'Présentation, accroche et coordonnées affichées sur le site et le CV.', fields: [
      { k: 'nom', l: 'Nom complet' }, { k: 'titre', l: 'Titre' },
      { k: 'accroche', l: "Phrase d'accroche", t: 'textarea', wide: true },
      { k: 'roles', l: 'Rôles animés dans l\'accueil', t: 'lines', wide: true, help: 'Un rôle par ligne' },
      { k: 'presentation', l: 'Présentation (À propos)', t: 'textarea', wide: true },
      { k: 'localisation', l: 'Localisation' }, { k: 'disponibilite', l: 'Disponibilité / recherche' },
      { k: 'email', l: 'E-mail' }, { k: 'telephone', l: 'Téléphone', help: 'Laisse vide pour ne pas l\'afficher' },
      { k: 'linkedin', l: 'LinkedIn (URL)' }, { k: 'github', l: 'GitHub (URL)' }, { k: 'permis', l: 'Permis / mobilité' }
    ] },
    projets: { label: 'Projets', type: 'array', title: 'titre', hint: '4 à 5 projets conseillés. Le statut « À compléter » masque le projet du CV.', fields: [
      { k: 'titre', l: 'Titre', wide: true },
      { k: 'epreuve', l: 'Épreuve', t: 'select', o: ['E5', 'E6'] },
      { k: 'statut', l: 'Statut', t: 'select', o: ['Réalisé', 'En cours', 'À compléter'] },
      { k: 'resume', l: 'Résumé (carte)', t: 'textarea', wide: true },
      { k: 'description', l: 'Description complète (fenêtre détail)', t: 'textarea', wide: true },
      { k: 'technologies', l: 'Technologies', t: 'csv', wide: true, help: 'Séparées par des virgules' },
      { k: 'realisations', l: 'Réalisations', t: 'lines', wide: true, help: 'Une par ligne' },
      { k: 'lien_doc', l: 'Lien documentation', help: 'ex. docs/documentation-glpi.pdf' }, { k: 'lien_demo', l: 'Lien démo / GitHub' }
    ] },
    epreuves: { label: 'Épreuves E5 / E6', type: 'array', title: 'code', fields: [
      { k: 'code', l: 'Code', t: 'select', o: ['E5', 'E6'] }, { k: 'titre', l: 'Intitulé' },
      { k: 'description', l: 'Description', t: 'textarea', wide: true },
      { k: 'documents', l: 'Documents', t: 'pairs', wide: true, help: 'Une ligne par document : Nom | lien' }
    ] },
    competences: { label: 'Compétences', type: 'array', title: 'nom', fields: [
      { k: 'categorie', l: 'Catégorie' }, { k: 'nom', l: 'Compétence' }, { k: 'niveau', l: 'Niveau (0 à 100)', t: 'number' }
    ] },
    certifications: { label: 'Certifications', type: 'array', title: 'nom', fields: [
      { k: 'nom', l: 'Nom' }, { k: 'organisme', l: 'Organisme' },
      { k: 'statut', l: 'Statut', t: 'select', o: ['Obtenue', 'En préparation', 'Prévue'] },
      { k: 'date', l: 'Date' }, { k: 'lien', l: 'Lien', wide: true }
    ] },
    experiences: { label: 'Expériences', type: 'array', title: 'poste', fields: [
      { k: 'poste', l: 'Poste' }, { k: 'entreprise', l: 'Entreprise' }, { k: 'lieu', l: 'Lieu' }, { k: 'periode', l: 'Période' },
      { k: 'missions', l: 'Missions', t: 'lines', wide: true, help: 'Une par ligne' }
    ] },
    formations: { label: 'Formations', type: 'array', title: 'diplome', fields: [
      { k: 'periode', l: 'Période' }, { k: 'diplome', l: 'Diplôme' }, { k: 'etablissement', l: 'Établissement' }, { k: 'details', l: 'Détails' }
    ] },
    langues: { label: 'Langues', type: 'array', title: 'langue', fields: [{ k: 'langue', l: 'Langue' }, { k: 'niveau', l: 'Niveau' }] },
    interets: { label: "Centres d'intérêt", type: 'array', title: 'titre', fields: [{ k: 'titre', l: 'Intérêt' }, { k: 'detail', l: 'Détail' }] },
    seo: { label: 'Référencement (SEO)', type: 'object', hint: 'Pense aussi à mettre ces valeurs dans index.html (balises title, description, canonical) et sitemap.xml.', fields: [
      { k: 'title', l: 'Titre de la page (50-60 caractères)', wide: true },
      { k: 'description', l: 'Meta description (150-160 caractères)', t: 'textarea', wide: true },
      { k: 'url', l: 'Adresse du site', wide: true }
    ] }
  };

  var data = {};
  var current = 'profil';
  var dirty = false;

  /* ---------- Outils ---------- */
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
    (children || []).forEach(function (c) { if (c) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }

  function api(action, body) {
    var opts = { headers: { Accept: 'application/json' }, credentials: 'same-origin' };
    if (body !== undefined) {
      opts.method = 'POST';
      opts.headers['Content-Type'] = 'application/json';
      opts.headers['X-CSRF-Token'] = CSRF;
      opts.body = JSON.stringify(body);
    }
    return fetch('api.php?action=' + encodeURIComponent(action), opts).then(function (r) {
      if (r.status === 401) { window.location.href = 'index.php'; throw new Error('Session expirée'); }
      return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || 'Erreur ' + r.status); return j; });
    });
  }

  function setStatus(text, cls) { var s = $('#save-status'); s.textContent = text; s.className = cls || ''; }
  function markDirty() { dirty = true; setStatus('● Modifications non enregistrées', 'dirty'); }

  function toInput(t, v) {
    if (t === 'lines') return (v || []).join('\n');
    if (t === 'csv') return (v || []).join(', ');
    if (t === 'pairs') return (v || []).map(function (p) { return (p.nom || '') + ' | ' + (p.lien || ''); }).join('\n');
    return v === undefined || v === null ? '' : String(v);
  }
  function fromInput(t, v) {
    if (t === 'lines') return v.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    if (t === 'csv') return v.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    if (t === 'pairs') return v.split('\n').map(function (line) {
      var parts = line.split('|');
      return { nom: (parts[0] || '').trim(), lien: (parts.slice(1).join('|') || '').trim() };
    }).filter(function (p) { return p.nom || p.lien; });
    if (t === 'number') return Math.max(0, Math.min(100, parseInt(v, 10) || 0));
    return v;
  }

  /* ---------- Champs ---------- */
  function field(f, obj, onChange) {
    var t = f.t || 'text', input;
    if (t === 'textarea' || t === 'lines' || t === 'pairs') {
      input = el('textarea', { rows: t === 'textarea' ? 4 : 3 });
    } else if (t === 'select') {
      input = el('select', {}, f.o.map(function (o) { return el('option', { value: o, text: o }); }));
      if (obj[f.k] && f.o.indexOf(obj[f.k]) < 0) input.appendChild(el('option', { value: obj[f.k], text: obj[f.k] }));
    } else {
      input = el('input', { type: t === 'number' ? 'number' : 'text', min: t === 'number' ? 0 : null, max: t === 'number' ? 100 : null, maxlength: 5000 });
    }
    input.value = toInput(t, obj[f.k]);
    if (t === 'select' && !obj[f.k]) obj[f.k] = input.value;
    input.addEventListener('input', function () { obj[f.k] = fromInput(t, input.value); markDirty(); if (onChange) onChange(); });
    return el('label', { class: f.wide ? 'wide' : null }, [f.l, f.help ? el('small', { text: f.help }) : null, input]);
  }

  /* ---------- Sections ---------- */
  function renderObject(key, def, box) {
    data[key] = data[key] && typeof data[key] === 'object' && !Array.isArray(data[key]) ? data[key] : {};
    box.appendChild(el('div', { class: 'card' }, [el('div', { class: 'fields' }, def.fields.map(function (f) { return field(f, data[key]); }))]));
  }

  function renderArray(key, def, box) {
    if (!Array.isArray(data[key])) data[key] = [];
    var arr = data[key];
    arr.forEach(function (item, i) {
      var title = el('strong', { text: '#' + (i + 1) + ' ' + (item[def.title] || '(sans titre)') });
      var update = function () { title.textContent = '#' + (i + 1) + ' ' + (item[def.title] || '(sans titre)'); };
      var actions = el('div', { class: 'card-actions' }, [
        el('button', { class: 'btn ghost small', type: 'button', title: 'Monter', 'aria-label': 'Monter', text: '↑', disabled: i === 0 ? 'disabled' : null,
          onclick: function () { arr.splice(i - 1, 0, arr.splice(i, 1)[0]); markDirty(); show(key); } }),
        el('button', { class: 'btn ghost small', type: 'button', title: 'Descendre', 'aria-label': 'Descendre', text: '↓', disabled: i === arr.length - 1 ? 'disabled' : null,
          onclick: function () { arr.splice(i + 1, 0, arr.splice(i, 1)[0]); markDirty(); show(key); } }),
        el('button', { class: 'btn danger small', type: 'button', text: 'Supprimer',
          onclick: function () { if (confirm('Supprimer « ' + (item[def.title] || 'cet élément') + ' » ?')) { arr.splice(i, 1); markDirty(); show(key); } } })
      ]);
      box.appendChild(el('div', { class: 'card' }, [
        el('div', { class: 'card-head' }, [title, actions]),
        el('div', { class: 'fields' }, def.fields.map(function (f) { return field(f, item, update); }))
      ]));
    });
    box.appendChild(el('button', { class: 'btn ghost', type: 'button', text: '+ Ajouter',
      onclick: function () { var o = {}; def.fields.forEach(function (f) { o[f.k] = /lines|csv|pairs/.test(f.t) ? [] : ''; }); arr.push(o); markDirty(); show(key); } }));
  }

  function renderMessages(box) {
    $('#save-btn').hidden = true;
    box.appendChild(el('p', { class: 'hint', text: 'Messages reçus via le formulaire de contact du portfolio.' }));
    api('messages').then(function (msgs) {
      if (!msgs.length) { box.appendChild(el('p', { class: 'empty', text: 'Aucun message pour le moment.' })); return; }
      msgs.forEach(function (m) {
        var card = el('div', { class: 'card msg' }, [
          el('div', { class: 'card-head' }, [
            el('div', {}, [el('strong', { text: m.nom }), ' ', el('a', { href: 'mailto:' + m.email, text: m.email })]),
            el('button', { class: 'btn danger small', type: 'button', text: 'Supprimer', onclick: function () {
              if (!confirm('Supprimer ce message ?')) return;
              api('delete_message', { id: m.id }).then(function () { card.remove(); });
            } })
          ]),
          el('span', { class: 'meta', text: new Date(m.date).toLocaleString('fr-FR') }),
          el('p', { text: m.message })
        ]);
        box.appendChild(card);
      });
    }).catch(function (e) { box.appendChild(el('p', { class: 'alert', text: e.message })); });
  }

  function renderPassword(box) {
    $('#save-btn').hidden = true;
    var cur = el('input', { type: 'password', autocomplete: 'current-password', required: 'required' });
    var nw = el('input', { type: 'password', autocomplete: 'new-password', minlength: 12, required: 'required' });
    var cf = el('input', { type: 'password', autocomplete: 'new-password', minlength: 12, required: 'required' });
    var out = el('p', { role: 'status' });
    var form = el('form', { class: 'card' }, [
      el('div', { class: 'fields' }, [
        el('label', { class: 'wide' }, ['Mot de passe actuel', cur]),
        el('label', {}, ['Nouveau mot de passe', el('small', { text: '12 caractères min. : majuscule, minuscule, chiffre, caractère spécial' }), nw]),
        el('label', {}, ['Confirmer', el('small', { text: ' ' }), cf])
      ]),
      el('p', {}, [el('button', { class: 'btn', type: 'submit', text: 'Changer le mot de passe' })]), out
    ]);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      out.className = '';
      if (nw.value !== cf.value) { out.textContent = 'Les mots de passe ne correspondent pas.'; out.className = 'alert'; return; }
      api('password', { current: cur.value, new: nw.value })
        .then(function () { out.textContent = 'Mot de passe modifié ✓'; out.className = 'alert ok'; form.reset(); })
        .catch(function (err) { out.textContent = err.message; out.className = 'alert'; });
    });
    box.appendChild(form);
  }

  function show(key) {
    current = key;
    var box = $('#editor');
    var scroll = window.scrollY;
    box.textContent = '';
    $('#save-btn').hidden = false;
    document.querySelectorAll('#tabs button').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-key') === key); });
    if (key === '_messages') { $('#section-title').textContent = 'Messages'; renderMessages(box); return; }
    if (key === '_password') { $('#section-title').textContent = 'Sécurité'; renderPassword(box); return; }
    var def = SCHEMA[key];
    $('#section-title').textContent = def.label;
    if (def.hint) box.appendChild(el('p', { class: 'hint', text: def.hint }));
    (def.type === 'object' ? renderObject : renderArray)(key, def, box);
    window.scrollTo(0, scroll);
  }

  function tabs() {
    var nav = $('#tabs');
    Object.keys(SCHEMA).forEach(function (k) {
      nav.appendChild(el('button', { type: 'button', 'data-key': k, text: SCHEMA[k].label, onclick: function () { show(k); window.scrollTo(0, 0); } }));
    });
    nav.appendChild(el('hr'));
    nav.appendChild(el('button', { type: 'button', 'data-key': '_messages', text: '✉ Messages', onclick: function () { show('_messages'); } }));
    nav.appendChild(el('button', { type: 'button', 'data-key': '_password', text: '🔒 Mot de passe', onclick: function () { show('_password'); } }));
  }

  function save() {
    var btn = $('#save-btn');
    btn.disabled = true;
    setStatus('Enregistrement…');
    api('save', data)
      .then(function (res) { data = res.data; dirty = false; setStatus('✓ Enregistré à ' + new Date().toLocaleTimeString('fr-FR'), 'ok'); })
      .catch(function (e) { setStatus('✕ ' + e.message, 'err'); })
      .then(function () { btn.disabled = false; });
  }

  document.addEventListener('DOMContentLoaded', function () {
    tabs();
    $('#save-btn').addEventListener('click', save);
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); if (!$('#save-btn').hidden) save(); }
    });
    window.addEventListener('beforeunload', function (e) { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
    api('get').then(function (d) { data = d || {}; show(current); setStatus(''); })
      .catch(function (e) { setStatus('✕ ' + e.message, 'err'); });
  });
})();
