# Guía: tu sitio en geralzuluaga.com

Este proyecto es tu sitio completo: portafolio (inicio), servicios, asesorías, comunidad y blog. Los textos, videos y fotos se cambian desde un panel; no hay que tocar código.

## Cómo funciona (en corto)

1. Tu sitio vive en un repositorio de GitHub (una carpeta en la nube con historial de cambios).
2. Cada vez que guardas un cambio en el panel, el sitio se actualiza solo en 1 o 2 minutos.
3. El hosting es gratis (GitHub Pages) y tu dominio sigue en GoDaddy.
4. Gasta cero créditos: el panel y la publicación no usan Lovable ni IA.

## Paso 1. Crear tu cuenta y el repositorio de GitHub

1. Entra a github.com y crea una cuenta (o inicia sesión).
2. Arriba a la derecha, "+" y "New repository".
3. Nombre: `sitio-geraldinne` (o el que prefieras). Elige **Public** (necesario para el hosting gratis).
4. No marques "Add a README". Pulsa "Create repository".
5. Pásame el nombre completo, por ejemplo `tuusuario/sitio-geraldinne`. Con eso yo subo el proyecto.

## Paso 2. Activar la publicación

En tu repositorio: Settings, Pages, y en "Source" elige **GitHub Actions**. Listo.

## Paso 3. Pasar tu dominio de Canva a este sitio

1. En Canva, despublica tu sitio web. Así el dominio queda libre.
2. En GoDaddy, entra a tu dominio y abre "DNS".
3. Borra solo los registros que apuntan a Canva en `@` y en `www`. **No toques** los registros MX (correo), TXT, ni el de `hub` (tu app).
4. Agrega 4 registros tipo **A** con nombre `@` apuntando a: `185.199.108.153`, `185.199.109.153`, `185.199.110.153` y `185.199.111.153`.
5. Agrega un registro **CNAME** con nombre `www` apuntando a `tuusuario.github.io`.
6. En GitHub: Settings, Pages, "Custom domain": escribe `geralzuluaga.com` y guarda. Cuando aparezca, marca "Enforce HTTPS" (puede tardar un rato).

Antes de hacerlo lo revisamos juntas, porque GoDaddy cambia a veces su pantalla de DNS.

Tu enlace viejo `geralzuluaga.com/portafoliougc` seguirá funcionando: lleva a la portada.

## Paso 4. Activar el panel (`geralzuluaga.com/admin`)

1. En GitHub, tu foto de perfil, Settings, Developer settings, Personal access tokens, **Fine-grained tokens**, "Generate new token".
2. Repository access: "Only select repositories" y elige tu repositorio. Permissions: Repository, **Contents: Read and write**.
3. Copia el token (solo se muestra una vez) y guárdalo en tu gestor de contraseñas.
4. Entra a `geralzuluaga.com/admin`, elige iniciar sesión con token y pégalo.

## Qué cambias desde el panel

| Quiero… | Voy a… |
|---|---|
| Cambiar un video viejo por uno nuevo | Portafolio, "Videos por nicho". Edita o agrega el video con su enlace y su miniatura. Apaga "Mostrar en la página" para ocultar sin borrar. |
| Agregar una marca o un testimonio | Portafolio, "Marcas y testimonios" |
| Cambiar mi foto o mis textos | Portafolio, "Textos de la portada y Sobre mí" |
| Escribir un artículo | Blog (artículos), "Nuevo". Apaga "Publicar" para dejarlo en borrador. |
| Activar una asesoría, diagnóstico o ebook | Servicios y comunidad, "Asesorías, diagnósticos y ebooks". Cada oferta nace oculta: la enciendes cuando esté lista. |
| Cambiar mi WhatsApp, correo o redes | Datos generales |

Consejos para las fotos: miniaturas de videos en vertical (9:16) y de menos de 300 KB; logos de marcas cuadrados o con fondo transparente. Los videos MP4 propios, solo cortos y de menos de 25 MB; para los demás usa el enlace de Instagram o TikTok.

## Google, analítica y píxeles (sin tocar código)

En el panel: **Datos generales, "Google, analítica y privacidad"**. Pega solo los códigos, cada uno en su casilla:

| Herramienta | Qué pegas |
|---|---|
| Search Console (verificación por etiqueta) | El valor de `content` de la etiqueta. Si verificas por DNS en GoDaddy no hace falta |
| Bing Webmaster | Su código de verificación |
| Google Analytics 4 | ID de medición `G-XXXXXXXXXX` |
| Google Tag Manager | ID `GTM-XXXXXXX` (si lo usas, pon GA4 dentro de GTM y deja vacía la casilla de GA4) |
| Meta Pixel | ID numérico |
| TikTok Pixel | ID del píxel |

Las herramientas de medición solo se cargan cuando la visitante pulsa "Aceptar" en el aviso de cookies; si rechaza, no se carga nada. El aviso aparece solo cuando hay al menos un ID. La página `/privacidad/` se genera sola (es una plantilla general, no asesoría legal; conviene que la revise una persona abogada).

## Cómo lograr que Google y las IAs te encuentren

Nadie puede garantizar posiciones, pero estos pasos son los que más ayudan:

1. **Google Search Console** (search.google.com/search-console): agrega `geralzuluaga.com` como "Dominio". Te pedirá un registro TXT en GoDaddy. Luego, en "Sitemaps", envía `sitemap.xml`, y en "Inspección de URL" pide indexar la portada, servicios, comunidad y cada artículo nuevo.
2. **Bing Webmaster Tools**: importa tu sitio desde Search Console. Bing alimenta a varios asistentes de IA.
3. **Pon tu web en todas tus redes**: en la biografía de Instagram y TikTok, en tu perfil de WhatsApp Business y donde tengas presencia. Que tu nombre y la frase "creadora UGC y community manager en Medellín" sean iguales en todos lados.
4. **Perfil de Empresa de Google** (opcional): sirve para búsquedas como "community manager Medellín". Pide verificación.
5. **Publica con constancia**: un artículo al mes en el blog, bien titulado, ayuda más que casi cualquier otra cosa. Y pide a tus clientes que te mencionen o enlacen.
6. **Revisa a las 2 a 4 semanas** en Search Console qué páginas ya están indexadas.

Tu sitio ya incluye lo técnico: títulos y descripciones con "community manager", "UGC" y "Medellín", datos estructurados, `sitemap.xml`, `robots.txt` abierto a los rastreadores de IA, `llms.txt` y feed del blog.
