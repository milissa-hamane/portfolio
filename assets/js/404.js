/* Page 404 : pluie de caractères (style Matrix) + message tapé */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', function () {
    // Message du terminal
    var log = document.getElementById('log');
    var path = window.location.pathname;
    var lines = [
      '$ curl -I ' + path,
      'HTTP/1.1 404 Not Found',
      '$ find / -name "' + (path.split('/').pop() || 'page') + '"',
      'find: aucun résultat',
      '$ echo "Cette page n\'existe pas ou a été déplacée."',
      'Cette page n\'existe pas ou a été déplacée.',
      '$ _'
    ];
    if (reduce) { log.textContent = lines.join('\n'); }
    else {
      var l = 0, c = 0;
      (function type() {
        if (l >= lines.length) return;
        if (c <= lines[l].length) { log.textContent = lines.slice(0, l).join('\n') + (l ? '\n' : '') + lines[l].slice(0, c++); setTimeout(type, lines[l][0] === '$' ? 28 : 6); }
        else { l++; c = 0; setTimeout(type, 260); }
      })();
    }

    // Pluie de caractères
    var cv = document.getElementById('rain');
    if (!cv || reduce) return;
    var ctx = cv.getContext('2d'), size = 16, cols, drops, color;
    var chars = '01アイウエオカキクケコ<>/{}#$%&ABCDEF';
    function readColor() { color = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#00ff9c'; }
    function resize() {
      cv.width = window.innerWidth; cv.height = window.innerHeight;
      cols = Math.ceil(cv.width / size); drops = [];
      for (var i = 0; i < cols; i++) drops.push(Math.random() * -50);
    }
    function draw() {
      var light = document.documentElement.getAttribute('data-theme') === 'light';
      ctx.fillStyle = light ? 'rgba(238,242,248,0.12)' : 'rgba(7,9,15,0.12)';
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.fillStyle = color; ctx.globalAlpha = light ? .35 : .6;
      ctx.font = size + 'px "JetBrains Mono", monospace';
      for (var i = 0; i < cols; i++) {
        ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * size, drops[i] * size);
        if (drops[i] * size > cv.height && Math.random() > .975) drops[i] = 0;
        drops[i] += .5;
      }
      ctx.globalAlpha = 1;
    }
    readColor(); resize();
    window.addEventListener('resize', resize);
    window.addEventListener('themechange', function () { readColor(); ctx.clearRect(0, 0, cv.width, cv.height); });
    setInterval(function () { if (!document.hidden) draw(); }, 50);
  });
})();
