/* DrivMatch Clima: precipitação março-novembro, neve dezembro-fevereiro.
  Iframe segue idioma do navegador por limitação do Ventusky. */
(() => {
  'use strict';
  const area = 'p=27.8;-87.5;4';
  const seasonLayer = month => ([12,1,2].includes(month) ? 'snow' : 'rain-3h');
  function refresh() {
    const month = Number(new Intl.DateTimeFormat('en-US', {month:'numeric', timeZone:'America/Chicago'}).format(new Date()));
    const layer = seasonLayer(month);
    const embedUrl = 'https://embed.ventusky.com/?' + area + '&l=' + layer;
    const lang = document.getElementById('language')?.value || 'pt';
    const locale = ({pt:'pt',en:'en',es:'es'})[lang] || 'pt';
    document.querySelectorAll('.weather-card iframe').forEach(frame => {
      if (frame.getAttribute('src') !== embedUrl) frame.setAttribute('src', embedUrl);
    });
    document.querySelectorAll('.weather-card .weather-open').forEach(link => {
      link.setAttribute('href', 'https://www.ventusky.com/' + locale + '/?' + area + '&l=' + layer);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refresh);
  else refresh();
  document.getElementById('language')?.addEventListener('change', refresh);
  setInterval(refresh, 60 * 60 * 1000);
})();