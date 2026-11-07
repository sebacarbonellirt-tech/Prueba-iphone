# Contexto para seguir trabajando (Antena TV)

Este archivo resume el proyecto para retomarlo en una sesión nueva. Responde siempre en español
(el dueño escribe en español de Chile y no es técnico: explica simple, sin jerga).

## Qué es

**Antena TV** (`tv/`): una tele en vivo en la web, tipo IPTV, **gratis para todos**, con canales
abiertos (noticias, deportes, música, infantil…). Se monetiza con **Antena Plus** (paga funciones
de la app, nunca los canales) y con auspiciadores. Es una PWA instalable en iPhone.

- En línea: **https://antena-tv.vercel.app**
- Cada push a la rama `claude/exciting-pasteur-f1q3l4` se publica solo en Vercel (producción).
- El resto del repo (`index.html`, `marketing/`, `empleo/` en la raíz) son proyectos anteriores; no tocarlos
  salvo que lo pidan.

## Reglas que el dueño ya fijó

- **Nada de canales de pago pirateados** ni copias no oficiales, aunque "funcionen" o diga que es de prueba.
  La web ya las filtra (`noOficial()`, `CONFIG.canalesDePago`, `CONFIG.operadoresDePago`). Mantener eso.
- **No cobrar a nadie por poner su canal** (se quitó la página de ventas B2B). Es tele gratis.
- **Sin WhatsApp por ahora**: `CONFIG.whatsapp` vacío oculta esos botones.
- No publicar datos personales del dueño (por ejemplo su email) en el sitio.
- No gastar dinero (dominios, planes) ni borrar cosas importantes sin preguntar.
- Git: trabajar y hacer push solo a `claude/exciting-pasteur-f1q3l4` (`git push -u origin <rama>`).
  No abrir pull requests salvo que lo pidan. No poner nombres de modelos en commits.

## Archivos

| Archivo | Qué hace |
| --- | --- |
| `tv/index.html` | Toda la web (HTML + CSS + JS en un archivo). Se configura en el bloque `CONFIG` del principio. |
| `tv/api/estado.js` | Función de Vercel: prueba las señales de una lista y devuelve las caídas (caché 6 h). |
| `tv/api/guia.js` | Función de Vercel: guía de programación (IPTV-EPG.org + EPGShare01, XMLTV), caché 3 h. Descarta rellenos tipo «No Data». |
| `tv/vercel.json` | `maxDuration` 60 s para las dos funciones. |
| `tv/sw.js` | Service worker, red primero (`CACHE = "antena-tv-v3"`; subir el número si cambian archivos base). |
| `tv/herramientas/codigos.html` | Crea códigos de activación de Plus y su versión cifrada (SHA-256). |
| `tv/README.md` | Documentación completa para el dueño (mantenerla al día con cada cambio). |

## Funciones que ya existen

- Canales desde listas públicas de iptv-org: región «En español» + 21 países (`CONFIG.paises`).
- Fila **Nacionales** por país (`CONFIG.nacionales`): si la lista trae la señal oficial se ve en la app;
  si no, la tarjeta abre el sitio oficial del canal (links comprobados para CL, AR, MX, CO, PE, ES).
- Fila **Países** con banderas. Buscador global sin tildes. Favoritos, recientes, AirPlay, imagen en imagen.
- **Canales inactivos** automáticos: revisión del servidor (`api/estado`) + fallos en el teléfono (12 h).
- **Señal de respaldo**: entradas del mismo canal (mismo `tvg-id`, o mismo nombre y país) se juntan en una
  tarjeta (`c.urls`); si una señal falla o no arranca en 15 s (`STALL_MS`) pasa sola a la siguiente;
  botón «⇄ 1/2» junto a «En vivo». Un canal es inactivo solo si fallan todas sus señales.
- **Guía**: tarjetas muestran el programa actual; bajo el reproductor «Ahora / Después» con barra.
  La guía completa (hoy y mañana) es de Plus (`CONFIG.guia.soloPlus`). Hay guía real comprobada en Chile
  (TVN, Mega, CHV, La Red, TV Chile…) y Argentina (Telefe, El Trece, TN, TV Pública…). Canal 13, 13C y T13
  no tienen guía en ninguna fuente.
- **Plus** (beneficios en `CONFIG.plus.beneficios`): multipantalla de 4, sin anuncios, temas, guía completa.
  Planes sugeridos: $2.990/mes y $24.990/año. Se activa con códigos (`CONFIG.plus.codigos`, cifrados).

## Pendiente

1. **Abrir las ventas de Plus**: falta que el dueño entregue su WhatsApp o sus links de Mercado Pago
   (van en `CONFIG.whatsapp` o en `pago` de cada plan).
2. **Borrar el código de prueba** `ANT-PRUEBA-2026` (primer hash de `CONFIG.plus.codigos`) antes de vender.
3. Ideas ya propuestas y aún no hechas: compartir un canal por WhatsApp (link directo + imagen de vista previa),
   Chromecast, sección de radios en vivo, modo Smart TV (control remoto), cobro automático con Mercado Pago,
   control de códigos en servidor (límite de pantallas), página de términos y privacidad, estadísticas de
   visitas (Vercel Web Analytics gratis), dominio propio (cuesta dinero: pedir permiso).

## Cómo probar

- El contenedor local **no llega** a iptv-org, vercel.app ni a los sitios de los canales. Para revisar algo real:
  - `mcp__Vercel__web_fetch_vercel_url` sobre `https://antena-tv.vercel.app/...` (por ejemplo `/api/guia?pais=cl`);
  - o un Vercel Sandbox (`create_sandboxes_v4`, `persistent: false`, timeout corto) y luego `stop_session`.
- Vercel: equipo `team_C4VL14ctr5LBpweHYf8T0OI0` (ArmaTienda), proyecto `prj_HTZJ0CYnUswpEE45G9AeTZ6VaKN5`
  (`antena-tv`, `rootDirectory: tv`).
- Prueba local: `python3 -m http.server 8765` en la raíz del repo y abrir `http://localhost:8765/tv/` con
  Playwright (ya instalado), interceptando con `ctx.route` las listas de iptv-org, `**/tv/api/estado**` y
  `**/tv/api/guia**`. Chromium reproduce HLS nativo: para simular hls.js, en `addInitScript` define un
  `window.Hls` falso y `HTMLMediaElement.prototype.canPlayType = () => ""`.
- Las funciones de `tv/api/` exportan sus partes (`links`, `probar`, `revisar`, `gnorm`, `lista`, `leerGuia`,
  `guia`) para probarlas con `node -e`.
