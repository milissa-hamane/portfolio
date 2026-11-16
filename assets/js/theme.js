/* Thème sombre / clair : chargé dans le <head> pour éviter le flash au chargement. */
(function () {
  'use strict';
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem('theme'); } catch (e) { /* stockage indisponible */ }
  var theme = saved || (window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  root.setAttribute('data-theme', theme);

  function setTheme(t) {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('theme', t); } catch (e) { /* ignore */ }
    document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(t === 'light'));
      b.setAttribute('title', t === 'light' ? 'Passer en mode sombre' : 'Passer en mode clair');
    });
    window.dispatchEvent(new CustomEvent('themechange', { detail: t }));
  }

  document.addEventListener('DOMContentLoaded', function () {
    setTheme(root.getAttribute('data-theme'));
    document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
      b.addEventListener('click', function () {
        root.classList.add('theme-anim');
        setTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
        setTimeout(function () { root.classList.remove('theme-anim'); }, 500);
      });
    });
  });
})();
