/* DrivMatch News — Clima, official Ventusky embed; no market simulation. */
(() => {
  'use strict';
  const weatherUrl = 'https://embed.ventusky.com/?p=39.0;-97.0;4&l=rain-3h';
  function setUp() {
    document.querySelectorAll('.weather-card').forEach(card => {
      const button = card.querySelector('.weather-load');
      const map = card.querySelector('.weather-map');
      const frame = card.querySelector('iframe');
      if (!button || !map || !frame) return;
      if (card.id === 'clima-desktop' && window.matchMedia('(min-width:991px)').matches) {
        frame.src = weatherUrl; map.hidden = false; button.setAttribute('aria-expanded','true');
      }
      button.addEventListener('click', () => {
        const opening = map.hidden;
        if (opening && !frame.getAttribute('src')) frame.src = weatherUrl;
        map.hidden = !opening;
        button.setAttribute('aria-expanded', String(opening));
        button.textContent = opening ? 'Ocultar mapa' : 'Ver mapa animado';
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setUp);
  else setUp();
})();