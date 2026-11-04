// Menú móvil y visor de videos MP4. La página se lee completa sin este archivo.
(() => {
  const btn = document.querySelector('.menu-btn');
  const nav = document.getElementById('menu');
  if (btn && nav) {
    btn.addEventListener('click', () => {
      const abierto = nav.classList.toggle('abierto');
      btn.setAttribute('aria-expanded', String(abierto));
    });
    nav.addEventListener('click', (e) => {
      if (e.target.closest('a')) {
        nav.classList.remove('abierto');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  const visor = document.querySelector('dialog.visor');
  if (visor && typeof visor.showModal === 'function') {
    const video = visor.querySelector('video');
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-video]');
      if (!b) return;
      video.src = b.dataset.video;
      video.poster = b.dataset.poster || '';
      visor.showModal();
      video.play().catch(() => {});
    });
    visor.addEventListener('close', () => {
      video.pause();
      video.removeAttribute('src');
      video.load();
    });
    visor.addEventListener('click', (e) => { if (e.target === visor) visor.close(); });
    visor.querySelector('.visor-cerrar').addEventListener('click', () => visor.close());
  }
})();

// Cookies y analítica: nada se carga hasta que la persona acepta.
(() => {
  const caja = document.getElementById('cookies');
  const cfgEl = document.getElementById('cfg-analitica');
  if (!caja || !cfgEl) return;
  let cfg = {};
  try { cfg = JSON.parse(cfgEl.textContent); } catch (e) { return; }
  const K = 'cookies-geral';
  const leer = () => { try { return localStorage.getItem(K); } catch (e) { return null; } };
  const guardar = (v) => { try { localStorage.setItem(K, v); } catch (e) {} };
  const cargar = (src) => { const s = document.createElement('script'); s.async = true; s.src = src; document.head.appendChild(s); };
  let activo = false;
  const activar = () => {
    if (activo) return; activo = true;
    window.dataLayer = window.dataLayer || [];
    if (cfg.gtm) {
      window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
      cargar('https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(cfg.gtm));
    }
    if (cfg.ga4) {
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date()); window.gtag('config', cfg.ga4);
      cargar('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(cfg.ga4));
    }
    if (cfg.meta) {
      /* eslint-disable */
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
      window.fbq('init', cfg.meta); window.fbq('track', 'PageView');
    }
    if (cfg.tiktok) {
      !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=['page','track','identify','instances','debug','on','off','once','ready','alias','group','enableCookie','disableCookie'];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.load=function(e){var n='https://analytics.tiktok.com/i18n/pixel/events.js';ttq._i=ttq._i||{};ttq._i[e]=[];ttq._t=ttq._t||{};ttq._t[e]=+new Date;var o=d.createElement('script');o.async=!0;o.src=n+'?sdkid='+e+'&lib='+t;var a=d.getElementsByTagName('script')[0];a.parentNode.insertBefore(o,a)};ttq.load(cfg.tiktok);ttq.page()}(window,document,'ttq');
    }
  };
  const decidir = (v) => { guardar(v); caja.hidden = true; if (v === 'si') activar(); else if (activo) location.reload(); };
  caja.addEventListener('click', (e) => { const b = e.target.closest('[data-cookies]'); if (b) decidir(b.dataset.cookies); });
  document.addEventListener('click', (e) => { if (e.target.closest('[data-cookies-abrir]')) caja.hidden = false; });
  const previo = leer();
  if (previo === 'si') activar(); else if (previo !== 'no') caja.hidden = false;
})();

// Carrusel de testimonios (sin JS se puede deslizar igual).
(() => {
  document.querySelectorAll('[data-carrusel]').forEach((c) => {
    const pista = c.querySelector('.carrusel-pista');
    const items = [...pista.querySelectorAll('.cita')];
    const ctl = c.querySelector('.carrusel-ctl');
    if (!items.length || !ctl) return;
    const prev = ctl.querySelector('[data-prev]'), next = ctl.querySelector('[data-next]');
    const puntos = ctl.querySelector('.puntos');
    puntos.innerHTML = items.map(() => '<i></i>').join('');
    const pts = [...puntos.children];
    const paso = () => (items[1] ? items[1].offsetLeft - items[0].offsetLeft : pista.clientWidth);
    const actual = () => Math.min(items.length - 1, Math.max(0, Math.round(pista.scrollLeft / paso())));
    const pintar = () => {
      const i = actual();
      pts.forEach((p, k) => p.classList.toggle('on', k === i));
      prev.disabled = pista.scrollLeft <= 4;
      next.disabled = pista.scrollLeft + pista.clientWidth >= pista.scrollWidth - 4;
    };
    const ir = (d) => pista.scrollBy({ left: d * paso(), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    prev.addEventListener('click', () => ir(-1));
    next.addEventListener('click', () => ir(1));
    pista.addEventListener('scroll', () => requestAnimationFrame(pintar), { passive: true });
    pista.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { e.preventDefault(); ir(1); } if (e.key === 'ArrowLeft') { e.preventDefault(); ir(-1); } });
    window.addEventListener('resize', pintar);
    ctl.hidden = false; pintar();
  });
})();
