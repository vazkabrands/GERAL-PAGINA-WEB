// Genera el sitio estático (carpeta dist/) a partir de src/data/*.json.
// Uso: node build.mjs      (sin dependencias; solo necesita Node 18 o superior)
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { marked } from 'marked';
import YAML from 'yaml';

const SITE = 'https://geralzuluaga.com';
const leer = (n) => JSON.parse(readFileSync(`src/data/${n}.json`, 'utf8'));
const S = leer('sitio'), P = { ...leer('inicio'), ...leer('nichos'), ...leer('marcas') }, SV = leer('servicios'), C = leer('comunidad');
const hoy = new Date().toISOString().slice(0, 10);

/* ---------- Analítica y verificación ---------- */
const AN = existsSync('src/data/analitica.json') ? JSON.parse(readFileSync('src/data/analitica.json', 'utf8')) : {};
const idOk = (v, re) => { const t = String(v || '').trim(); return re.test(t) ? t : ''; };
const ANID = {
  ga4: idOk(AN.ga4_id, /^G-[A-Z0-9]{4,14}$/),
  gtm: idOk(AN.gtm_id, /^GTM-[A-Z0-9]{4,10}$/),
  meta: idOk(AN.meta_pixel_id, /^\d{8,20}$/),
  tiktok: idOk(AN.tiktok_pixel_id, /^[A-Z0-9]{8,30}$/),
};
const tokenMeta = (v) => { const t = String(v || '').trim(); return /^[\w-]{10,100}$/.test(t) ? t : ''; };
const GV = tokenMeta(AN.google_verificacion), BV = tokenMeta(AN.bing_verificacion);
const hayRastreo = Object.values(ANID).some(Boolean);
const avisos = [];

/* ---------- utilidades ---------- */
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const urlSegura = (u) => (/^https?:\/\//i.test(u || '') ? u : '');
const existeArchivo = (p) => {
  if (!p) return false;
  if (/^https?:\/\//i.test(p)) return true;
  const ok = existsSync(join('public', p.replace(/^\//, '')));
  if (!ok) avisos.push(`Falta el archivo ${p}`);
  return ok;
};
const lista = (a) => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} y ${a.at(-1)}`);
const minus1 = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const wa = (msg) => `https://wa.me/${S.whatsapp}?text=${encodeURIComponent(msg)}`;
const igUrl = `https://www.instagram.com/${S.instagram}`;
const ttUrl = `https://www.tiktok.com/@${S.tiktok}`;
const REDES_EXTRA = [['facebook', 'Facebook', 'fb'], ['youtube', 'YouTube', 'yt'], ['linkedin', 'LinkedIn', 'li'], ['pinterest', 'Pinterest', 'pt'], ['threads', 'Threads', 'th']]
  .map(([k, n, i]) => ({ nombre: n, icono: i, url: urlSegura(S[k]) })).filter((r) => r.url);
const TODAS_REDES = [{ nombre: 'Instagram', icono: 'ig', url: igUrl }, { nombre: 'TikTok', icono: 'tt', url: ttUrl }, ...REDES_EXTRA];
const ic = (n) => `<svg class="ic" aria-hidden="true" focusable="false"><use href="#ico-${n}"/></svg>`;
const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
const PLAT = { instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube' };

const serviciosOn = SV.activa !== false;
const comunidadOn = C.activa !== false;
const nichos = P.nichos
  .map((n) => ({ ...n, videos: (n.videos || []).filter((v) => v.visible !== false) }))
  .filter((n) => n.videos.length);
const marcas = P.marcas || [];

/* ---------- Blog: cada archivo de src/blog/*.md es un artículo ---------- */
const B = leer('blog');
const fechaLarga = (d) => new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeZone: 'UTC' }).format(d);
const iso = (d) => d.toISOString().slice(0, 10);
function leerPosts() {
  if (!existsSync('src/blog')) return [];
  return readdirSync('src/blog')
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const raw = readFileSync(`src/blog/${f}`, 'utf8');
      const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
      const fm = m ? YAML.parse(m[1]) || {} : {};
      const body = m ? m[2] : raw;
      const fecha = new Date(String(fm.fecha || hoy).slice(0, 10));
      return {
        slug: f.replace(/\.md$/, ''),
        titulo: fm.titulo || f.replace(/\.md$/, ''),
        fecha: isNaN(fecha) ? new Date(hoy) : fecha,
        resumen: fm.resumen || '',
        imagen: fm.imagen || '',
        publicado: fm.publicado === true,
        body,
        palabras: body.split(/\s+/).filter(Boolean).length,
      };
    })
    .filter((p) => p.publicado || process.env.VER_BORRADORES === '1')
    .sort((a, b) => b.fecha - a.fecha);
}
const posts = leerPosts();
const blogOn = B.activa !== false;

/* ---------- Asesorías, diagnósticos y ebooks ---------- */
const O = leer('ofertas');
const ofertas = (O.ofertas || []).filter((o) => o.visible !== false || process.env.VER_BORRADORES === '1');
const ofertasOn = O.activa !== false && ofertas.length > 0;
const TIPOS = [
  ['asesoria', 'Asesorías'],
  ['diagnostico', 'Diagnósticos'],
  ['ebook', 'Ebooks y guías'],
  ['otro', 'Otros recursos'],
];

/* ---------- piezas comunes ---------- */
const SIMBOLOS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
<symbol id="estrellas" viewBox="0 0 120 90"><g fill="currentColor"><polygon points="86,6 90,18 103,18 93,26 97,38 86,31 75,38 79,26 69,18 82,18"/><polygon points="98,42 101,50 110,50 103,56 106,64 98,59 90,64 93,56 86,50 95,50"/><polygon points="52,26 56,38 69,38 59,46 63,58 52,51 41,58 45,46 35,38 48,38"/><polygon points="38,52 41,60 50,60 43,66 46,74 38,69 30,74 33,66 26,60 35,60"/><polygon points="76,60 80,72 93,72 83,80 87,90 76,84 65,90 69,80 59,72 72,72"/></g></symbol>
<symbol id="ico-ig" viewBox="0 0 48 48"><rect x="5" y="5" width="38" height="38" rx="11" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="24" cy="24" r="9" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="35" cy="13" r="2.6" fill="currentColor"/></symbol>
<symbol id="ico-wa" viewBox="0 0 48 48"><path d="M24 5C13.500 5 5 13.400 5 23.800c0 3.600 1 7 2.900 9.900L5.500 43l9.600-2.500a19 19 0 0 0 8.900 2.200C34.500 42.700 43 34.300 43 23.900 43 13.400 34.500 5 24 5z" fill="none" stroke="currentColor" stroke-width="3.600" stroke-linejoin="round"/><path d="M17.500 15.500c-1 .9-1.700 2.200-1.300 4.200.5 2.700 2.700 5.800 5.500 8 2.400 1.900 5 3 7 2.800 1.500-.2 2.900-1.200 3.300-2.300.2-.6.200-1.100 0-1.300l-3.300-1.800c-.5-.2-1 0-1.300.4l-1 1.300c-.3.300-.6.300-1 .2-1.700-.7-4-2.900-5-4.800-.2-.4-.2-.8.100-1.100l1-1.200c.3-.4.300-.8.100-1.200l-1.500-3.200c-.3-.6-1.200-.7-1.600-.3z" fill="currentColor"/></symbol>
<symbol id="ico-tt" viewBox="0 0 48 48"><path d="M27 6v25.500a6.500 6.500 0 1 1-6.500-6.500" fill="none" stroke="currentColor" stroke-width="4.500" stroke-linecap="round" stroke-linejoin="round"/><path d="M27 6c.6 5 3.800 8.600 9 9.200" fill="none" stroke="currentColor" stroke-width="4.500" stroke-linecap="round"/></symbol>
<symbol id="ico-mail" viewBox="0 0 48 48"><rect x="5" y="10" width="38" height="28" rx="4" fill="none" stroke="currentColor" stroke-width="3.500"/><path d="M6 13l18 14L42 13" fill="none" stroke="currentColor" stroke-width="3.500" stroke-linejoin="round"/></symbol>
<symbol id="ico-fb" viewBox="0 0 48 48"><path d="M27 43V26h6l1-7h-7v-4c0-2 .8-3.400 3.500-3.400H34V5.300C33.300 5.200 31.300 5 29 5c-5 0-8 3-8 8.300V19h-6v7h6v17z" fill="currentColor"/></symbol>
<symbol id="ico-yt" viewBox="0 0 48 48"><rect x="4" y="10" width="40" height="28" rx="9" fill="none" stroke="currentColor" stroke-width="3.600"/><path d="M20 17v14l12-7z" fill="currentColor"/></symbol>
<symbol id="ico-li" viewBox="0 0 48 48"><rect x="6" y="6" width="36" height="36" rx="6" fill="none" stroke="currentColor" stroke-width="3.600"/><path d="M15 21v13M15 14.500v.5M22 34V21m0 6c0-3.500 2-6 5.500-6S33 23 33 27v7" fill="none" stroke="currentColor" stroke-width="3.600" stroke-linecap="round"/></symbol>
<symbol id="ico-pt" viewBox="0 0 48 48"><circle cx="24" cy="24" r="18" fill="none" stroke="currentColor" stroke-width="3.600"/><path d="M22 15c-5 1-7 6-5 10 1.500 2.500 5 2.500 6-.5l1.500-6M24 22l-3 15" fill="none" stroke="currentColor" stroke-width="3.200" stroke-linecap="round"/></symbol>
<symbol id="ico-th" viewBox="0 0 48 48"><path d="M33 22c-1-6-5-9-10-9-6 0-10 4-10 11s4 11 10 11c5 0 8-3 8-6s-3-5-7-5-5 2-5 3.500 1.500 3 3.500 3c4 0 6-3 6-9z" fill="none" stroke="currentColor" stroke-width="3.400" stroke-linecap="round"/></symbol>
<symbol id="ico-pin" viewBox="0 0 24 24"><path d="M12 22s7-6.200 7-12a7 7 0 1 0-14 0c0 5.800 7 12 7 12z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="10" r="2.600" fill="none" stroke="currentColor" stroke-width="2"/></symbol>
<symbol id="ico-play" viewBox="0 0 24 24"><path d="M6 3.500v17l15-8.500z" fill="currentColor"/></symbol>
<symbol id="onda" viewBox="0 0 1440 46" preserveAspectRatio="none"><path d="M0 0v26c60 12 120 14 190 6s140-22 220-20 150 24 240 24 170-20 250-22 160 14 240 14 150-14 210-10 120 10 170 4 90-10 120-6V46H0z"/></symbol>
</defs></svg>`;

const onda = (cls) => `<svg class="onda ${cls}" viewBox="0 0 1440 46" preserveAspectRatio="none" aria-hidden="true"><use href="#onda"/></svg>`;
const estrellas = (cls = '') => `<svg class="estrellas ${cls}" viewBox="0 0 120 90" aria-hidden="true"><use href="#estrellas"/></svg>`;
const vacio = `<span class="vacio" aria-hidden="true">GZ</span>`;
const redes = () => `<ul class="redes">
<li><a href="${igUrl}" target="_blank" rel="me noopener" aria-label="Instagram de ${esc(S.nombre)}">${ic('ig')}</a></li>
<li><a href="${ttUrl}" target="_blank" rel="me noopener" aria-label="TikTok de ${esc(S.nombre)}">${ic('tt')}</a></li>
<li><a href="${wa(S.mensaje_whatsapp)}" target="_blank" rel="noopener" aria-label="WhatsApp de ${esc(S.nombre)}">${ic('wa')}</a></li></ul>`;

function layout({ ruta, titulo, desc, cuerpo, ld, og, actual, visor = false }) {
  const canon = `${SITE}${ruta}`;
  const imgOg = og && existeArchivo(og) ? (og.startsWith('http') ? og : SITE + og) : '';
  const nav = [
    ['Inicio', '/'], ['Sobre mí', '/sobre-mi/'], ['Portafolio', '/portafolio/'],
    ...(serviciosOn ? [['Servicios', '/servicios/']] : []),
    ...(ofertasOn ? [['Asesorías', '/asesorias/']] : []),
    ...(comunidadOn ? [['Comunidad', '/comunidad/']] : []),
    ...(blogOn ? [['Blog', '/blog/']] : []),
    ['Contacto', '/#contacto'],
  ];
  return `<!doctype html>
<html lang="es-CO">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canon}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="author" content="${esc(S.nombre)}">
${GV ? `<meta name="google-site-verification" content="${GV}">\n` : ''}${BV ? `<meta name="msvalidate.01" content="${BV}">\n` : ''}
<meta property="og:type" content="website">
<meta property="og:locale" content="es_CO">
<meta property="og:site_name" content="${esc(S.nombre)}">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canon}">
${imgOg ? `<meta property="og:image" content="${imgOg}">\n<meta name="twitter:card" content="summary_large_image">` : '<meta name="twitter:card" content="summary">'}
<link rel="preload" href="/fonts/instrument-serif-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/bricolage-grotesque-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
${blogOn ? `<link rel="alternate" type="application/rss+xml" title="Blog de ${esc(S.nombre)}" href="/feed.xml">\n` : ''}<link rel="stylesheet" href="/styles.css">
<script type="application/ld+json">${json(ld)}</script>
</head>
<body>
${SIMBOLOS}
<a class="skip" href="#principal">Saltar al contenido</a>
<div class="barra-redes"><div class="barra-in"><ul aria-label="Mis redes sociales">${TODAS_REDES.map((r) => `<li><a href="${esc(r.url)}" target="_blank" rel="me noopener" aria-label="${esc(r.nombre)} de ${esc(S.nombre)}">${ic(r.icono)}</a></li>`).join('')}</ul><span>${esc(S.ubicacion)}</span></div></div>
<header class="top"><div class="top-in">
<a class="logo-nombre" href="/">${esc(S.nombre)}<small>Creadora UGC · Community manager</small></a>
<button class="menu-btn" type="button" aria-expanded="false" aria-controls="menu">Menú</button>
<nav class="nav" id="menu" aria-label="Principal">
<ul>${nav.map(([t, u]) => `<li><a href="${u}"${u === actual ? ' aria-current="page"' : ''}>${esc(t)}</a></li>`).join('')}</ul>
<a class="btn btn-oro" href="${wa(S.mensaje_whatsapp)}" target="_blank" rel="noopener">${esc(S.boton_header)}</a>
</nav>
</div></header>
<main id="principal">
${cuerpo}
</main>
<section class="contacto" id="contacto" aria-labelledby="t-contacto"><div class="wrap">
<div class="contacto-grid">
<div>
<h2 class="titulo-sec" id="t-contacto">${esc(S.contacto_titulo)}</h2>
<p class="lead-c">${esc(S.contacto_texto)}</p>
<div class="hero-cta"><a class="btn btn-oro" href="${wa(S.mensaje_whatsapp)}" target="_blank" rel="noopener">${ic('wa')} Escríbeme por WhatsApp</a></div>
</div>
<ul class="contacto-datos">
<li><a href="${wa(S.mensaje_whatsapp)}" target="_blank" rel="noopener">${ic('wa')}${esc(S.whatsapp_visible)}</a></li>
<li><a href="mailto:${esc(S.email)}">${ic('mail')}${esc(S.email)}</a></li>
<li><a href="${igUrl}" target="_blank" rel="me noopener">${ic('ig')}@${esc(S.instagram)}</a></li>
<li><a href="${ttUrl}" target="_blank" rel="me noopener">${ic('tt')}@${esc(S.tiktok)}</a></li>
${REDES_EXTRA.map((r) => `<li><a href="${esc(r.url)}" target="_blank" rel="me noopener">${ic(r.icono)}${esc(r.nombre)}</a></li>`).join('')}
</ul>
</div>
<p class="lema">${esc(S.lema)}</p>
</div></section>
<footer class="pie"><div class="wrap">
<p>© ${hoy.slice(0, 4)} ${esc(S.nombre)}. ${esc(S.ubicacion)}.</p>
<ul>${nav.map(([t, u]) => `<li><a href="${u}">${esc(t)}</a></li>`).join('')}<li><a href="/privacidad/">Privacidad</a></li>${hayRastreo ? '<li><button type="button" class="link-btn" data-cookies-abrir>Cookies</button></li>' : ''}</ul>
</div></footer>
<a class="fab" href="${wa(S.mensaje_whatsapp)}" target="_blank" rel="noopener" aria-label="Escríbeme por WhatsApp">${ic('wa')}</a>
${visor ? `<dialog class="visor" aria-label="Reproductor de video"><button class="visor-cerrar" type="button">Cerrar</button><video controls playsinline></video></dialog>` : ''}
${hayRastreo ? `<div class="cookies" id="cookies" role="dialog" aria-label="Cookies" hidden><p>${esc(AN.aviso_texto)} <a href="/privacidad/">Más información</a></p><div><button type="button" class="btn btn-linea" data-cookies="no">Rechazar</button><button type="button" class="btn btn-cafe" data-cookies="si">Aceptar</button></div></div>\n<script type="application/json" id="cfg-analitica">${json(ANID)}</script>\n` : ''}<script src="/app.js" defer></script>
</body>
</html>
`;
}

/* ---------- datos estructurados ---------- */
const persona = () => ({
  '@type': 'Person',
  '@id': `${SITE}/#persona`,
  name: S.nombre,
  alternateName: [S.apodo, `@${S.instagram}`].filter(Boolean),
  jobTitle: ['Creadora de contenido UGC', 'Community manager', 'Creadora de contenido lifestyle'],
  homeLocation: { '@type': 'City', name: S.ciudad },
  description: P.seo_descripcion,
  url: `${SITE}/`,
  ...(P.hero.foto && existeArchivo(P.hero.foto) ? { image: SITE + P.hero.foto } : {}),
  email: `mailto:${S.email}`,
  telephone: `+${S.whatsapp}`,
  address: { '@type': 'PostalAddress', addressLocality: S.ciudad, addressRegion: S.region, addressCountry: 'CO' },
  knowsAbout: [...nichos.map((n) => n.titulo), 'Contenido UGC', 'Community management', 'Redes sociales', 'Marketing digital'],
  sameAs: TODAS_REDES.map((r) => r.url),
});

function preguntas() {
  const q = [];
  q.push([`¿Quién es ${S.nombre}?`, `${S.nombre} es ${minus1(P.hero.rol)}. ${P.hero.promesa}`]);
  if (nichos.length) q.push(['¿Qué tipo de contenido UGC crea?', `Crea contenido UGC para marcas de todos los nichos. Algunos de sus trabajos son de ${lista(nichos.map((n) => n.titulo.toLowerCase()))}.`]);
  q.push([`¿Hay una community manager o creadora UGC en ${S.ciudad}?`, `Sí. ${S.nombre} trabaja desde ${S.ciudad}, ${S.region}, y colabora con marcas de toda Colombia.`]);
  if (marcas.length) q.push(['¿Con qué marcas ha trabajado?', `Ha colaborado con ${lista(marcas.map((m) => m.nombre))}.`]);
  if (serviciosOn) q.push(['¿Ofrece servicios de marketing y redes?', `Sí. ${SV.intro}`]);
  if (ofertasOn) q.push(['¿Ofrece asesorías, diagnósticos o ebooks?', `Sí. ${O.intro}`]);
  if (comunidadOn) q.push(['¿Qué es la comunidad de mujeres?', C.intro]);
  q.push(['¿Cómo contactarla para una colaboración?', `Por WhatsApp al ${S.whatsapp_visible}, por correo a ${S.email}, o por Instagram y TikTok en @${S.instagram} y @${S.tiktok}.`]);
  for (const e of P.faq_extra || []) if (e.pregunta && e.respuesta) q.push([e.pregunta, e.respuesta]);
  return q;
}

/* ---------- Blog ---------- */
function tarjetaPost(p) {
  const img = existeArchivo(p.imagen) ? `<img src="${esc(p.imagen)}" alt="" loading="lazy" decoding="async">` : vacio;
  return `<li class="post-card"><a class="post-link" href="/blog/${esc(p.slug)}/"><div class="post-img">${img}</div><div class="post-txt"><time datetime="${iso(p.fecha)}">${fechaLarga(p.fecha)}</time><h3>${esc(p.titulo)}</h3>${p.resumen ? `<p>${esc(p.resumen)}</p>` : ''}</div></a></li>`;
}

function paginaBlog() {
  const cuerpo = `
<section class="pag-hero"><div class="wrap">
<h1>${esc(B.titular)}</h1>
<p class="lead">${esc(B.intro)}</p>
</div></section>
<section class="seccion" style="padding-top:24px" aria-label="Artículos"><div class="wrap">
${posts.length ? `<ul class="posts">${posts.map(tarjetaPost).join('')}</ul>` : `<p class="lead">${esc(B.vacio || 'Muy pronto publicaré aquí mis primeros artículos.')}</p>`}
</div></section>`;
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Blog', '@id': `${SITE}/blog/#blog`, url: `${SITE}/blog/`, name: B.seo_titulo, description: B.seo_descripcion, inLanguage: 'es-CO', author: { '@id': `${SITE}/#persona` }, blogPost: posts.map((p) => ({ '@type': 'BlogPosting', headline: p.titulo, url: `${SITE}/blog/${p.slug}/`, datePublished: iso(p.fecha) })) },
      persona(),
    ],
  };
  return layout({ ruta: '/blog/', titulo: B.seo_titulo, desc: B.seo_descripcion, cuerpo, ld, og: S.foto_og || P.hero.foto, actual: '/blog/' });
}

function paginaPost(p) {
  const html = marked.parse(p.body).replace(/<img /g, '<img loading="lazy" decoding="async" ');
  const url = `${SITE}/blog/${p.slug}/`;
  const desc = (p.resumen || p.body.replace(/[#*_>`\[\]()-]/g, ' ').replace(/\s+/g, ' ').trim()).slice(0, 155);
  const minutos = Math.max(1, Math.round(p.palabras / 200));
  const imgOk = existeArchivo(p.imagen);
  const cuerpo = `
<article class="post">
<header class="pag-hero post-cab"><div class="wrap-post">
<p class="post-meta"><a href="/blog/">Blog</a></p>
<h1>${esc(p.titulo)}</h1>
<p class="post-meta"><time datetime="${iso(p.fecha)}">${fechaLarga(p.fecha)}</time> · ${minutos} min de lectura · por ${esc(S.nombre)}</p>
</div></header>
${imgOk ? `<div class="wrap-post"><img class="post-portada" src="${esc(p.imagen)}" alt="${esc(p.titulo)}" width="1200" height="675" fetchpriority="high"></div>` : ''}
<div class="wrap-post prose">${html}</div>
</article>
<section class="banda" aria-labelledby="t-cta-post"><div class="wrap">
<h2 class="titulo-sec" id="t-cta-post">${esc(B.cta_titulo)}</h2>
<p>${esc(B.cta_texto)}</p>
<a class="btn btn-cafe" href="${wa(B.mensaje_whatsapp)}" target="_blank" rel="noopener">${ic('wa')} ${esc(B.cta_boton)}</a>
</div></section>`;
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BlogPosting', '@id': `${url}#articulo`, mainEntityOfPage: url, headline: p.titulo, description: desc, inLanguage: 'es-CO', datePublished: iso(p.fecha), dateModified: iso(p.fecha), author: { '@id': `${SITE}/#persona` }, publisher: { '@id': `${SITE}/#persona` }, ...(imgOk ? { image: p.imagen.startsWith('http') ? p.imagen : SITE + p.imagen } : {}) },
      persona(),
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE}/` }, { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog/` }, { '@type': 'ListItem', position: 3, name: p.titulo, item: url }] },
    ],
  };
  return layout({ ruta: `/blog/${p.slug}/`, titulo: `${p.titulo} | ${S.nombre}`, desc, cuerpo, ld, og: p.imagen || S.foto_og || P.hero.foto, actual: '/blog/' });
}

/* ---------- Inicio (portafolio) ---------- */
function tarjetaVideo(v) {
  const mp4 = existeArchivo(v.archivo_mp4) ? v.archivo_mp4 : '';
  const enlace = urlSegura(v.enlace);
  const plat = PLAT[v.plataforma] || '';
  const miniatura = existeArchivo(v.miniatura)
    ? `<img src="${esc(v.miniatura)}" alt="Miniatura del video ${esc(v.titulo)}" loading="lazy" decoding="async">`
    : vacio;
  const interior = `<div class="thumb">${miniatura}${mp4 || enlace ? `<span class="play">${ic('play')}</span>` : ''}</div>`;
  let envuelto = interior;
  if (mp4) envuelto = `<button type="button" class="thumb-link" data-video="${esc(mp4)}" data-poster="${esc(existeArchivo(v.miniatura) ? v.miniatura : '')}" aria-label="Reproducir video: ${esc(v.titulo)}">${interior}</button>`;
  else if (enlace) envuelto = `<a class="thumb-link" href="${esc(enlace)}" target="_blank" rel="noopener" aria-label="Ver video: ${esc(v.titulo)}${plat ? ` en ${plat}` : ''} (se abre en otra pestaña)">${interior}</a>`;
  return `<li class="video"><figure>${envuelto}<figcaption><strong>${esc(v.titulo)}</strong>${v.marca ? `<small>${esc(v.marca)}</small>` : ''}</figcaption></figure></li>`;
}

const seccionNichos = (todos = true) => nichos.map((n) => `<article class="nicho" id="${esc(n.id)}" aria-labelledby="t-${esc(n.id)}">
<header class="nicho-cab"><h3 id="t-${esc(n.id)}">${esc(n.titulo)}</h3>${n.descripcion ? `<p>${esc(n.descripcion)}</p>` : ''}</header>
<ul class="videos">${n.videos.slice(0, todos ? 99 : 4).map(tarjetaVideo).join('')}</ul>
</article>`).join('\n');

const seccionMarcas = () => marcas.length ? `<section class="marcas" id="marcas" aria-labelledby="t-marcas"><div class="wrap">
<h2 class="titulo-sec" id="t-marcas">${esc(P.marcas_titulo)}</h2>
<ul class="logos">${marcas.map((m) => `<li><div class="logo">${existeArchivo(m.logo) ? `<img src="${esc(m.logo)}" alt="Logo de ${esc(m.nombre)}" loading="lazy">` : `<b aria-hidden="true">${esc(m.nombre.charAt(0))}</b>`}</div><span>${esc(m.nombre)}</span></li>`).join('')}</ul>
</div></section>` : '';

const seccionTestimonios = () => (P.testimonios || []).length ? `<section class="testimonios" id="testimonios" aria-labelledby="t-testi"><div class="wrap">
<h2 class="titulo-sec" id="t-testi">${esc(P.testimonios_titulo)}</h2>
<ul class="citas">${P.testimonios.map((t) => `<li class="cita"><blockquote><p>${esc(t.texto)}</p></blockquote>${t.autor ? `<cite>${esc(t.autor)}</cite>` : ''}${existeArchivo(t.captura) ? `<img src="${esc(t.captura)}" alt="Captura del mensaje de ${esc(t.autor || 'una marca')}" loading="lazy">` : ''}</li>`).join('')}</ul>
</div></section>` : '';

const bloqueSobre = (completo) => {
  const sm = P.sobre_mi;
  const foto = existeArchivo(sm.foto) ? `<img src="${esc(sm.foto)}" alt="${esc(S.nombre)} sonriendo" width="760" height="950" loading="lazy">` : vacio;
  return `<div class="wrap sobre">
<div class="sobre-foto">${foto}</div>
<div class="sobre-txt">
<h2 class="titulo-sec" id="t-sobre">${esc(completo ? sm.titulo : (sm.titulo_corto || sm.titulo))}</h2>
${completo ? (sm.parrafos || []).map((p) => `<p>${esc(p)}</p>`).join('') : `<p>${esc(P.sobre_mi_resumen || (sm.parrafos || [])[0] || '')}</p>`}
${completo ? `<ul class="rasgos">${(sm.rasgos || []).map((r) => `<li>${esc(r)}</li>`).join('')}</ul>` : '<p><a class="enlace-flecha" href="/sobre-mi/">Conóceme mejor</a></p>'}
</div></div>`;
};

function paginaInicio() {
  const h = P.hero;
  const fotoHero = existeArchivo(h.foto) ? `<img src="${esc(h.foto)}" alt="${esc(S.nombre)}, creadora de contenido UGC en ${esc(S.ciudad)}" width="840" height="1050" fetchpriority="high">` : vacio;
  const cifras = (P.cifras || []).filter((c) => c.numero);
  const cuerpo = `
<section class="hero" aria-label="Presentación">
<div class="hero-txt">
<p class="hero-ubic">${ic('pin')} ${esc(S.ubicacion)}</p>
<h1><span>${esc(h.titular_linea1)}</span><span>${esc(h.titular_linea2)}</span></h1>
<p class="hero-rol">${esc(h.rol)}</p>
<p class="hero-promesa">${esc(h.promesa)}</p>
<div class="hero-cta">
<a class="btn btn-cafe" href="${wa(S.mensaje_whatsapp)}" target="_blank" rel="noopener">${ic('wa')} ${esc(h.boton_principal)}</a>
<a class="btn btn-linea" href="/portafolio/">${esc(h.boton_secundario)}</a>
</div>
</div>
<div class="hero-foto"><div class="marco">${fotoHero}</div></div>
</section>

${cifras.length ? `<section class="cifras-banda" aria-label="Cifras"><ul class="wrap cifras-lista">${cifras.map((c) => `<li><strong>${esc(c.numero)}</strong><span>${esc(c.texto)}</span></li>`).join('')}</ul></section>` : ''}

<section class="seccion" id="sobre-mi" aria-labelledby="t-sobre">${bloqueSobre(false)}</section>

${serviciosOn ? `<section class="seccion seccion-arena" aria-labelledby="t-serv-home"><div class="wrap">
<div class="sec-cab"><h2 class="titulo-sec" id="t-serv-home">${esc(P.servicios_home_titulo || 'Servicios')}</h2></div>
<ul class="tarjetas">${SV.servicios.map((s) => `<li><h3>${esc(s.titulo)}</h3><p>${esc(s.descripcion)}</p></li>`).join('')}</ul>
<p style="margin-top:30px"><a class="btn btn-cafe" href="/servicios/">Ver servicios</a></p>
</div></section>` : ''}

<section class="seccion" id="contenido" aria-labelledby="t-contenido"><div class="wrap">
<div class="sec-cab"><h2 class="titulo-sec" id="t-contenido">${esc(P.portafolio_home_titulo || 'Portafolio')}</h2><p>${esc(P.portafolio_home_intro || '')}</p></div>
${seccionNichos(false)}
<p style="margin-top:36px"><a class="btn btn-linea" href="/portafolio/">Ver el portafolio completo</a></p>
</div></section>

${seccionMarcas()}
${seccionTestimonios()}

${blogOn && posts.length ? `<section class="seccion" aria-labelledby="t-blog-home"><div class="wrap">
<div class="sec-cab"><h2 class="titulo-sec" id="t-blog-home">${esc(B.home_titulo)}</h2></div>
<ul class="posts">${posts.slice(0, 3).map(tarjetaPost).join('')}</ul>
<p style="margin-top:28px"><a class="btn btn-linea" href="/blog/">Ver todos los artículos</a></p>
</div></section>` : ''}

${ofertasOn || comunidadOn ? `<section class="seccion seccion-arena" aria-labelledby="t-mas"><div class="wrap">
<div class="sec-cab"><h2 class="titulo-sec" id="t-mas">Más formas de trabajar conmigo</h2></div>
<div class="puertas">
${ofertasOn ? `<article class="puerta puerta-cafe"><h3>${esc(O.titular)}</h3><p>${esc(O.intro)}</p><a class="btn btn-oro" href="/asesorias/">Ver asesorías</a></article>` : ''}
${comunidadOn ? `<article class="puerta puerta-oro"><h3>${esc(C.titular)}</h3><p>${esc(C.intro)}</p><a class="btn btn-cafe" href="/comunidad/">Conocer la comunidad</a></article>` : ''}
</div></div></section>` : ''}

<section class="seccion" id="preguntas" aria-labelledby="t-faq"><div class="wrap faq">
<h2 class="titulo-sec" id="t-faq" style="margin-bottom:20px">Preguntas frecuentes</h2>
${preguntas().map(([a, b]) => `<details><summary>${esc(a)}</summary><p>${esc(b)}</p></details>`).join('\n')}
</div></section>`;

  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'ProfilePage', '@id': `${SITE}/#pagina`, url: `${SITE}/`, name: P.seo_titulo, inLanguage: 'es-CO', dateModified: hoy, mainEntity: { '@id': `${SITE}/#persona` } },
      persona(),
      { '@type': 'FAQPage', mainEntity: preguntas().map(([a, b]) => ({ '@type': 'Question', name: a, acceptedAnswer: { '@type': 'Answer', text: b } })) },
    ],
  };
  return layout({ ruta: '/', titulo: P.seo_titulo, desc: P.seo_descripcion, cuerpo, ld, og: S.foto_og || P.hero.foto, actual: '/', visor: true });
}

function paginaPortafolio() {
  const titulo = `Portafolio UGC en Medellín | ${S.nombre}`;
  const desc = 'Portafolio de contenido UGC: videos para marcas de cuidado capilar, viajes, gastronomía y belleza, con las marcas con las que he trabajado.';
  const cuerpo = `
<section class="pag-hero"><div class="wrap"><h1>Portafolio</h1><p class="lead">${esc(P.contenido_intro)}</p>
<ul class="chips" aria-label="Nichos de contenido">${nichos.map((n) => `<li><a class="chip" href="#${esc(n.id)}">${esc(n.boton || n.titulo)}</a></li>`).join('')}</ul></div></section>
<section class="seccion" style="padding-top:12px"><div class="wrap">${seccionNichos(true)}</div></section>
${seccionMarcas()}
${seccionTestimonios()}`;
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'CollectionPage', url: `${SITE}/portafolio/`, name: titulo, description: desc, inLanguage: 'es-CO', dateModified: hoy, about: { '@id': `${SITE}/#persona` } },
    persona(),
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE}/` }, { '@type': 'ListItem', position: 2, name: 'Portafolio', item: `${SITE}/portafolio/` }] },
  ] };
  return layout({ ruta: '/portafolio/', titulo, desc, cuerpo, ld, og: S.foto_og || P.hero.foto, actual: '/portafolio/', visor: true });
}

function paginaSobreMi() {
  const titulo = `Sobre mí | ${S.nombre}, creadora UGC y community manager en ${S.ciudad}`;
  const desc = `Conoce a ${S.nombre}: creadora de contenido UGC, community manager y lifestyle en ${S.ciudad}, Colombia.`;
  const cuerpo = `
<section class="pag-hero"><div class="wrap"><h1>${esc(S.nombre)}</h1><p class="lead">${esc(P.hero.rol)}</p></div></section>
<section class="seccion" style="padding-top:20px" aria-labelledby="t-sobre">${bloqueSobre(true)}</section>
<section class="banda"><div class="wrap"><h2 class="titulo-sec">¿Trabajamos juntas?</h2><p>${esc(S.contacto_texto)}</p><a class="btn btn-cafe" href="${wa(S.mensaje_whatsapp)}" target="_blank" rel="noopener">${ic('wa')} Escríbeme por WhatsApp</a></div></section>`;
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'AboutPage', url: `${SITE}/sobre-mi/`, name: titulo, description: desc, inLanguage: 'es-CO', dateModified: hoy, mainEntity: { '@id': `${SITE}/#persona` } },
    persona(),
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE}/` }, { '@type': 'ListItem', position: 2, name: 'Sobre mí', item: `${SITE}/sobre-mi/` }] },
  ] };
  return layout({ ruta: '/sobre-mi/', titulo, desc, cuerpo, ld, og: S.foto_og || P.hero.foto, actual: '/sobre-mi/' });
}

function paginaServicios() {
  const cuerpo = `
<section class="pag-hero"><div class="wrap">
<h1>${esc(SV.titular)}</h1>
<p class="lead">${esc(SV.intro)}</p>
<div class="hero-cta"><a class="btn btn-cafe" href="${wa(SV.mensaje_whatsapp)}" target="_blank" rel="noopener">${ic('wa')} ${esc(SV.boton)}</a></div>
</div></section>
<section class="seccion" style="padding-top:24px" aria-label="Servicios"><div class="wrap">
<ul class="serv">${SV.servicios.map((s) => `<li><h2>${esc(s.titulo)}</h2><div><p>${esc(s.descripcion)}</p>${(s.incluye || []).length ? `<ul>${s.incluye.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : ''}</div></li>`).join('')}</ul>
${SV.agencia_nombre ? `<p class="agencia">Estos servicios los ofrezco con ${urlSegura(SV.agencia_url) ? `<a href="${esc(SV.agencia_url)}" target="_blank" rel="noopener">${esc(SV.agencia_nombre)}</a>` : esc(SV.agencia_nombre)}, mi agencia de marketing digital.</p>` : ''}
</div></section>
<section class="banda" aria-labelledby="t-cta"><div class="wrap">
<h2 class="titulo-sec" id="t-cta">${esc(SV.cta_titulo)}</h2>
<p>${esc(SV.cta_texto)}</p>
<a class="btn btn-cafe" href="${wa(SV.mensaje_whatsapp)}" target="_blank" rel="noopener">${ic('wa')} ${esc(SV.boton)}</a>
</div></section>`;
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', url: `${SITE}/servicios/`, name: SV.seo_titulo, inLanguage: 'es-CO', dateModified: hoy, about: { '@id': `${SITE}/#persona` } },
      persona(),
      { '@type': 'OfferCatalog', name: SV.titular, itemListElement: SV.servicios.map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.titulo, description: s.descripcion, provider: { '@id': `${SITE}/#persona` }, areaServed: 'CO' } })) },
    ],
  };
  return layout({ ruta: '/servicios/', titulo: SV.seo_titulo, desc: SV.seo_descripcion, cuerpo, ld, og: S.foto_og || P.hero.foto, actual: '/servicios/' });
}

/* ---------- Asesorías, diagnósticos y ebooks ---------- */
function filaOferta(o) {
  const enlace = urlSegura(o.enlace);
  const href = enlace || wa(`Hola Geral, me interesa: ${o.nombre}.`);
  const img = existeArchivo(o.imagen) ? `<img class="oferta-img" src="${esc(o.imagen)}" alt="Portada de ${esc(o.nombre)}" loading="lazy" decoding="async">` : '';
  return `<li><h3>${esc(o.nombre)}</h3><div>${img}${o.para_quien ? `<p class="oferta-para"><strong>Para quién:</strong> ${esc(o.para_quien)}</p>` : ''}<p>${esc(o.descripcion)}</p>${(o.incluye || []).length ? `<ul>${o.incluye.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : ''}<div class="oferta-pie">${o.precio ? `<p class="precio">${esc(o.precio)}</p>` : ''}<a class="btn btn-cafe" href="${esc(href)}" target="_blank" rel="noopener">${esc(o.boton || 'Quiero saber más')}</a></div></div></li>`;
}

function paginaOfertas() {
  const grupos = TIPOS.map(([t, titulo]) => [titulo, ofertas.filter((o) => (o.tipo || 'otro') === t)]).filter(([, l]) => l.length);
  const cuerpo = `
<section class="pag-hero"><div class="wrap">
<h1>${esc(O.titular)}</h1>
<p class="lead">${esc(O.intro)}</p>
</div></section>
${grupos.map(([titulo, l]) => `<section class="seccion" style="padding:36px 0 24px" aria-label="${esc(titulo)}"><div class="wrap">
<h2 class="titulo-sec" style="font-size:clamp(2.2rem,5vw,3.2rem)">${esc(titulo)}</h2>
<ul class="serv">${l.map(filaOferta).join('')}</ul>
</div></section>`).join('\n')}
<section class="banda" aria-labelledby="t-cta-of"><div class="wrap">
<h2 class="titulo-sec" id="t-cta-of">${esc(O.cta_titulo)}</h2>
<p>${esc(O.cta_texto)}</p>
<a class="btn btn-cafe" href="${wa(O.mensaje_whatsapp)}" target="_blank" rel="noopener">${ic('wa')} ${esc(O.cta_boton)}</a>
</div></section>`;
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', url: `${SITE}/asesorias/`, name: O.seo_titulo, description: O.seo_descripcion, inLanguage: 'es-CO', dateModified: hoy, about: { '@id': `${SITE}/#persona` } },
      persona(),
      { '@type': 'OfferCatalog', name: O.titular, itemListElement: ofertas.map((o) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: o.nombre, description: o.descripcion, provider: { '@id': `${SITE}/#persona` }, areaServed: 'CO' } })) },
    ],
  };
  return layout({ ruta: '/asesorias/', titulo: O.seo_titulo, desc: O.seo_descripcion, cuerpo, ld, og: S.foto_og || P.hero.foto, actual: '/asesorias/' });
}

/* ---------- Comunidad ---------- */
function paginaComunidad() {
  const unir = (g) => {
    const url = urlSegura(g.enlace);
    if (url) return `<a class="btn btn-cafe" href="${esc(url)}" target="_blank" rel="noopener">${esc(g.boton || 'Unirme al grupo')}</a>`;
    if (g.boton) return `<a class="btn btn-cafe" href="${wa(`Hola Geral, quiero unirme al grupo ${g.nombre}.`)}" target="_blank" rel="noopener">${esc(g.boton)}</a>`;
    return '';
  };
  const canalUrl = urlSegura(C.canal_enlace);
  const cifras = [[C.comunidad_cifra, C.comunidad_cifra_texto], [C.canal_cifra, C.canal_cifra_texto]].filter(([n]) => n);
  const cuerpo = `
<section class="pag-hero"><div class="wrap">
<h1>${esc(C.titular)}</h1>
<p class="lead">${esc(C.intro)}</p>
${cifras.length ? `<ul class="cifras">${cifras.map(([n, t]) => `<li><strong>${esc(n)}</strong><span>${esc(t)}</span></li>`).join('')}</ul>` : ''}
${urlSegura(C.comunidad_enlace) ? `<p class="nota-com">${esc(C.comunidad_nota)}</p>` : ''}
<div class="hero-cta">${urlSegura(C.comunidad_enlace) ? `<a class="btn btn-cafe" href="${esc(urlSegura(C.comunidad_enlace))}" target="_blank" rel="noopener">${ic('wa')} ${esc(C.comunidad_boton || 'Unirme a la comunidad')}</a>` : ''}<a class="btn btn-linea" href="#grupos">Ver los grupos</a>${canalUrl ? `<a class="btn btn-linea" href="#canal">${esc(C.canal_titulo)}</a>` : ''}</div>
</div></section>
<section class="seccion" id="grupos" aria-labelledby="t-grupos" style="padding-top:24px"><div class="wrap">
<h2 class="titulo-sec" id="t-grupos" style="font-size:clamp(2.2rem,5vw,3.2rem)">${esc(C.grupos_titulo)}</h2>
<ul class="serv">${(C.grupos || []).map((g) => `<li><h3>${esc(g.nombre)}${g.etiqueta ? `<span class="etiqueta">${esc(g.etiqueta)}</span>` : ''}</h3><div><p>${esc(g.descripcion)}</p>${unir(g) ? `<div class="oferta-pie">${unir(g)}</div>` : ''}</div></li>`).join('')}</ul>
</div></section>
${canalUrl ? `<section class="banda" id="canal" aria-labelledby="t-canal"><div class="wrap">
<h2 class="titulo-sec" id="t-canal">${esc(C.canal_titulo)}</h2>
<p>${esc(C.canal_descripcion)}</p>
<a class="btn btn-cafe" href="${esc(canalUrl)}" target="_blank" rel="noopener">${ic('wa')} ${esc(C.canal_boton)}</a>
</div></section>` : ''}`;
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', url: `${SITE}/comunidad/`, name: C.seo_titulo, description: C.seo_descripcion, inLanguage: 'es-CO', dateModified: hoy, about: { '@id': `${SITE}/#persona` } },
      persona(),
    ],
  };
  return layout({ ruta: '/comunidad/', titulo: C.seo_titulo, desc: C.seo_descripcion, cuerpo, ld, og: S.foto_og || P.hero.foto, actual: '/comunidad/' });
}

/* ---------- Otros archivos ---------- */
function llmsTxt() {
  const L = [];
  L.push(`# ${S.nombre} (${S.apodo})`, '', `> ${P.hero.rol}. ${P.hero.promesa}`, '');
  L.push('## Páginas', '', `- [Portafolio UGC](${SITE}/): sobre mí, contenido por nicho, marcas, testimonios y contacto.`);
  if (serviciosOn) L.push(`- [Servicios de marketing y redes](${SITE}/servicios/): ${SV.intro}`);
  if (ofertasOn) L.push(`- [Asesorías, diagnósticos y recursos](${SITE}/asesorias/): ${O.intro}`);
  if (comunidadOn) L.push(`- [Comunidad de creadoras](${SITE}/comunidad/): ${C.intro}`);
  if (blogOn) L.push(`- [Blog](${SITE}/blog/): ${B.intro}`);
  L.push('', '## Nichos de contenido', '');
  for (const n of nichos) L.push(`- ${n.titulo}: ${n.videos.map((v) => v.titulo).join(', ')}.`);
  if (marcas.length) L.push('', '## Marcas con las que ha colaborado', '', lista(marcas.map((m) => m.nombre)) + '.');
  if (serviciosOn) L.push('', '## Servicios', '', ...SV.servicios.map((s) => `- ${s.titulo}: ${s.descripcion}`));
  if (comunidadOn) L.push('', '## Comunidad de mujeres', '', ...(C.grupos || []).map((g) => `- ${g.nombre}: ${g.descripcion}`), `- ${C.canal_titulo}: ${C.canal_descripcion}`);
  if (ofertasOn) L.push('', '## Asesorías, diagnósticos y recursos', '', ...ofertas.map((o) => `- ${o.nombre}: ${o.descripcion}`));
  if (blogOn) L.push('', '## Artículos del blog', '', ...posts.map((p) => `- [${p.titulo}](${SITE}/blog/${p.slug}/): ${p.resumen}`));
  L.push('', '## Contacto', '', `- WhatsApp: ${S.whatsapp_visible}`, `- Correo: ${S.email}`, ...TODAS_REDES.map((r) => `- ${r.nombre}: ${r.url}`), `- Ubicación: ${S.ubicacion}`, '');
  return L.join('\n');
}

function sitemap(rutas) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rutas.map(([r, f]) => `  <url><loc>${SITE}${r}</loc><lastmod>${f || hoy}</lastmod></url>`).join('\n')}\n</urlset>\n`;
}

function feedRss() {
  const x = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel>\n<title>${x(B.seo_titulo)}</title>\n<link>${SITE}/blog/</link>\n<description>${x(B.seo_descripcion)}</description>\n<language>es-co</language>\n${posts.map((p) => `<item><title>${x(p.titulo)}</title><link>${SITE}/blog/${p.slug}/</link><guid>${SITE}/blog/${p.slug}/</guid><pubDate>${p.fecha.toUTCString()}</pubDate><description>${x(p.resumen)}</description></item>`).join('\n')}\n</channel></rss>\n`;
}

/* ---------- Privacidad ---------- */
function paginaPrivacidad() {
  const usa = [ANID.ga4 && 'Google Analytics (estadísticas de visitas)', ANID.gtm && 'Google Tag Manager', ANID.meta && 'Meta Pixel (Facebook e Instagram)', ANID.tiktok && 'TikTok Pixel'].filter(Boolean);
  const correo = AN.responsable_correo || S.email;
  const cuerpo = `
<section class="pag-hero"><div class="wrap"><h1>${esc(AN.privacidad_titulo || 'Política de privacidad y cookies')}</h1><p class="lead">Última actualización: ${hoy}.</p></div></section>
<section class="seccion" style="padding-top:0"><div class="wrap wrap-post prose">
<h2>Quién es responsable</h2>
<p>${esc(S.nombre)}, ${esc(S.ubicacion)}. Contacto: <a href="mailto:${esc(correo)}">${esc(correo)}</a>.</p>
<h2>Qué datos se tratan</h2>
<p>Este sitio no tiene formularios ni cuentas. Cuando me escribes por WhatsApp o por correo, uso tus datos (nombre, número o correo y tu mensaje) solo para responderte y gestionar la colaboración o el servicio que pidas.</p>
<h2>Cookies y herramientas de medición</h2>
${usa.length ? `<p>Con tu autorización, este sitio usa: ${usa.map(esc).join(', ')}. Sirven para saber cuántas personas visitan el sitio, qué páginas ven y cómo llegan, y para medir anuncios. No se cargan hasta que aceptas y puedes cambiar tu decisión en cualquier momento desde el enlace «Cookies» del pie de página.</p>` : '<p>Por ahora este sitio no usa cookies de medición ni de publicidad.</p>'}
<h2>Tus derechos</h2>
<p>Puedes conocer, actualizar, rectificar o pedir la supresión de tus datos, y revocar tu autorización, escribiendo a <a href="mailto:${esc(correo)}">${esc(correo)}</a>, conforme a la Ley 1581 de 2012 de Colombia.</p>
<h2>Enlaces a terceros</h2>
<p>El sitio enlaza a WhatsApp, Instagram y TikTok, que tienen sus propias políticas de privacidad.</p>
${AN.privacidad_extra ? AN.privacidad_extra.split(/\n{2,}/).map((t) => `<p>${esc(t)}</p>`).join('') : ''}
</div></section>`;
  const ld = { '@context': 'https://schema.org', '@type': 'WebPage', name: AN.privacidad_titulo || 'Política de privacidad', url: `${SITE}/privacidad/` };
  return layout({ ruta: '/privacidad/', titulo: `${AN.privacidad_titulo || 'Política de privacidad'} | ${S.nombre}`, desc: 'Cómo se tratan los datos y las cookies en este sitio.', cuerpo, ld, actual: '/privacidad/' });
}

/* ---------- Escribir dist/ ---------- */
rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });
if (existsSync('public')) cpSync('public', 'dist', { recursive: true });
const out = (ruta, txt) => { const f = join('dist', ruta); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, txt); };

const rutas = [['/'], ['/sobre-mi/'], ['/portafolio/']];
out('index.html', paginaInicio());
out('sobre-mi/index.html', paginaSobreMi());
out('portafolio/index.html', paginaPortafolio());
if (serviciosOn) { out('servicios/index.html', paginaServicios()); rutas.push(['/servicios/']); }
if (ofertasOn) { out('asesorias/index.html', paginaOfertas()); rutas.push(['/asesorias/']); }
if (comunidadOn) { out('comunidad/index.html', paginaComunidad()); rutas.push(['/comunidad/']); }
if (blogOn) {
  out('blog/index.html', paginaBlog()); rutas.push(posts.length ? ['/blog/', iso(posts[0].fecha)] : ['/blog/']);
  for (const p of posts) { out(`blog/${p.slug}/index.html`, paginaPost(p)); rutas.push([`/blog/${p.slug}/`, iso(p.fecha)]); }
  out('feed.xml', feedRss());
}
out('privacidad/index.html', paginaPrivacidad().replace('content="index, follow, max-image-preview:large"', 'content="noindex, follow"'));
out('styles.css', readFileSync('src/styles.css'));
out('app.js', readFileSync('src/app.js'));
out('llms.txt', llmsTxt());
out('sitemap.xml', sitemap(rutas));
out('.nojekyll', '');

// El enlace anterior (/portafoliougc) sigue funcionando y lleva a la portada.
out('portafoliougc/index.html', `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(P.seo_titulo)}</title><link rel="canonical" href="${SITE}/"><meta http-equiv="refresh" content="0; url=/"><meta name="robots" content="noindex"></head><body><p>El portafolio ahora está en <a href="/">geralzuluaga.com</a>.</p></body></html>`);

// Página 404
out('404.html', layout({
  ruta: '/404.html', titulo: `Página no encontrada | ${S.nombre}`, desc: 'Esta página no existe.', actual: '',
  cuerpo: `<section class="pag-hero"><div class="wrap"><h1>Esta página no existe</h1><p class="lead">Puede que el enlace haya cambiado. Vuelve al inicio para ver el portafolio.</p><div class="hero-cta"><a class="btn btn-cafe" href="/">Ir al inicio</a></div></div></section>`,
  ld: { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Página no encontrada' },
}).replace('content="index, follow, max-image-preview:large"', 'content="noindex"'));

console.log(`Sitio generado en dist/ con ${rutas.length + 2} páginas.`);
if (avisos.length) {
  const unicos = [...new Set(avisos)];
  console.log(`\nAvisos: ${unicos.length} archivos referenciados todavía no existen (se mostrarán como espacios vacíos):`);
  unicos.forEach((a) => console.log(' - ' + a));
}
