/* CV HTML : rempli automatiquement depuis les mêmes données JSON que le portfolio. */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  function list(a) { return Array.isArray(a) ? a : []; }
  function el(tag, cls, text, children) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    (children || []).forEach(function (c) { if (c) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  function item(title, when, sub, bullets) {
    return el('div', 'item', null, [
      el('div', 'item-head', null, [el('strong', null, title), when ? el('span', null, when) : null]),
      sub ? el('div', 'sub', sub) : null,
      bullets && bullets.length ? el('ul', null, null, bullets.map(function (b) { return el('li', null, b); })) : null
    ]);
  }

  function render(d) {
    var p = d.profil || {};
    $('#cv-nom').textContent = p.nom || '';
    $('#cv-titre').textContent = p.titre || '';
    $('#initials').textContent = (p.nom || 'MH').split(/\s+/).map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
    $('#cv-profil').textContent = p.presentation || '';
    document.title = 'CV – ' + (p.nom || '') + ' | BTS SIO SISR';

    var c = $('#cv-contact');
    [['TÉL', p.telephone], ['MAIL', p.email], ['LOC', p.localisation], ['IN', p.linkedin], ['GIT', p.github], ['CAR', p.permis]]
      .forEach(function (x) { if (x[1]) c.appendChild(el('li', null, null, [el('b', null, x[0]), x[1]])); });

    var groups = {};
    list(d.competences).forEach(function (s) { (groups[s.categorie || 'Autres'] = groups[s.categorie || 'Autres'] || []).push(s.nom); });
    Object.keys(groups).forEach(function (g) {
      $('#cv-skills').appendChild(el('div', 'skill-group', null, [el('strong', null, g), el('p', null, groups[g].join(', '))]));
    });

    list(d.langues).forEach(function (l) { $('#cv-langues').appendChild(el('li', null, l.langue + ' : ' + l.niveau)); });
    list(d.interets).forEach(function (i) { $('#cv-interets').appendChild(el('li', null, i.titre + (i.detail ? ' – ' + i.detail : ''))); });

    list(d.formations).forEach(function (f) { $('#cv-formations').appendChild(item(f.diplome, f.periode, [f.etablissement, f.details].filter(Boolean).join(' · '))); });
    // Sur le CV, seuls les projets terminés apparaissent
    list(d.projets).filter(function (pr) { return !/compl/i.test(pr.statut || ''); }).forEach(function (pr) {
      $('#cv-projets').appendChild(item(pr.titre, pr.epreuve, pr.resume, null));
    });
    list(d.experiences).forEach(function (x) { $('#cv-experiences').appendChild(item(x.poste + ' – ' + x.entreprise, x.periode, x.lieu, list(x.missions))); });
    list(d.certifications).forEach(function (ce) { $('#cv-certs').appendChild(el('li', null, ce.nom + ' (' + ce.organisme + ') – ' + (ce.statut || ''))); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    $('#print').addEventListener('click', function () { window.print(); });
    fetch('api/data.php')
      .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
      .catch(function () { return fetch('data/portfolio.json').then(function (r) { return r.json(); }); })
      .then(render)
      .catch(function () { $('#cv-profil').textContent = 'Impossible de charger les données du CV.'; });
  });
})();
