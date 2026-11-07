# Antena TV: tele gratis en la web

Una tele en vivo en el navegador, tipo IPTV, que se instala como app en el iPhone:
canales abiertos de noticias, deportes, música, infantil, películas, cultura y más,
**gratis para todos**. Se gana dinero con auspiciadores y con **Antena Plus**, que paga
**funciones de la app**, nunca los canales.

```
tv/
  index.html               la tele (todo se edita en el bloque CONFIG)
  herramientas/codigos.html crea códigos de activación de Plus
  manifest.json, sw.js     app instalable y apertura rápida
  icons/                   iconos
  app/                     redirige a la tele (link antiguo)
```

## Qué ve la gente

| Parte | Detalle |
| --- | --- |
| Portada | Un saludo corto con «Ver un canal ahora», el buscador y **«¿Qué quieres ver?»**: un botón grande con dibujo y color por categoría. Debajo, «TV abierta», «Seguir viendo», «Tus favoritos» y una fila por categoría. |
| Categorías | Nueve, claras: Noticias, Deportes, Películas, Series, Música, Infantil, Entretención, Cultura y Religión (más «Más canales» para los que no traen categoría). Las de iptv-org se juntan en estas (por ejemplo Clima y Congreso van en Noticias; Cocina y Viajes en Entretención). Nombre, dibujo, color y orden se editan en `CONFIG.categorias`. Al tocar una se ven todos sus canales, con botones arriba para pasar a otra. |
| TV abierta | Primera fila: los canales de señal abierta de Chile (`paisPrincipal`). Si la lista trae su señal oficial, se ve en la app; si no, la tarjeta abre su transmisión en vivo en el sitio oficial. Hay links oficiales comprobados para Chile, Argentina, México, Colombia, Perú y España (los de España suelen verse solo desde España). Se editan en `CONFIG.nacionales`. |
| Buscador | Busca en todos los canales y radios, sin importar tildes. |
| Radios | Categoría «📻 Radios» con radios chilenas en vivo (Bío-Bío, Cooperativa, ADN, Los 40…). Mientras suena se ve el logo de la radio. Ver «Radios». |
| Compartir | El botón ⇪ junto a la estrella manda el canal por WhatsApp (o lo que elijas). Ver «Compartir un canal». |
| Reproductor | Canal anterior/siguiente, favoritos, **compartir**, pantalla completa, AirPlay e imagen en imagen. Debajo, lo que dan **ahora** (con barra de avance) y **después**. |
| Señal de respaldo | Si un canal viene más de una vez en la lista, se muestra una sola tarjeta y las otras señales quedan de respaldo: si una falla o no arranca en 15 segundos, pasa sola a la siguiente. El botón «⇄ 1/2» junto a «En vivo» cambia de señal a mano. |
| Guía | Al tocar «Guía ›» se abre la programación del canal. «Ahora» y «Después» son gratis; la guía completa de hoy y mañana es de Plus (`CONFIG.guia.soloPlus`). |
| Tarjetas | El programa que están dando (si hay guía); si no, «En vivo» («En vivo a ciertas horas» si no transmite todo el día). |
| Mis listas | Quien tenga su propia lista M3U puede sumarla (link, archivo o texto). |
| Sin conexión | Si no cargan los canales, muestra videos de prueba y un aviso. |
| Filtros | Se ocultan solos los canales para adultos y las copias no oficiales de canales de pago (ver «Lo legal»). |
| Canales inactivos | Los que no responden salen de sus categorías y quedan en una sección propia al final (y en el filtro «Inactivos»). Cuando vuelven, regresan solos. |

Los canales salen de [iptv-org](https://github.com/iptv-org/iptv), un índice público de
señales que sus propios dueños publican gratis en internet. Muchas se caen o cambian:
la lista se descarga de nuevo cada vez que se abre la tele, y si un canal falla, el
botón «Siguiente canal» salta al próximo.

## Señales de respaldo

Las listas suelen traer el mismo canal varias veces (por ejemplo en 720p y 480p, o desde otro
servidor). Se juntan en una tarjeta cuando tienen el mismo `tvg-id`, o el mismo nombre y país.
Al reproducir se prueban en orden: primero las que no han fallado y las https. Un canal solo
pasa a «Canales inactivos» cuando **todas** sus señales fallan. El tiempo de espera antes de
cambiar de señal es `STALL_MS` en `index.html`.

## Compartir un canal

Cada canal y cada radio tiene su link, por ejemplo `https://antena-tv.vercel.app/c/tvn-cl` o
`…/c/radio-biobio-chile`. Al pegarlo en WhatsApp se ve una vista previa con el nombre y el logo
del canal (o la imagen general `og.png` si no tiene logo). Al tocarlo, la tele se abre en ese
canal (en iPhone hay que tocar ▶ una vez, porque Safari no deja empezar con sonido solo).
Lo arma `api/canal.js`; `vercel.json` manda los links `/c/…` ahí. En el iPhone el botón abre el
menú de compartir del teléfono; en un computador copia el link.

## Radios

`api/radios.js` (función de Vercel) saca las radios de Chile del directorio público y gratuito
[Radio Browser](https://www.radio-browser.info), donde cada radio publica su propia señal. Deja solo
las que se escuchan en iPhone (MP3/AAC por https), junta las repetidas, prueba que respondan y pone
primero las más conocidas (lista `CONOCIDAS` en ese archivo). Vercel guarda la respuesta 12 horas.
El país se cambia en `CONFIG.radios.pais` (vacío = sin radios).

## Estadísticas de visitas

La página trae el script de **Vercel Web Analytics** (gratis, sin cookies). Muestra cuánta gente
entra, desde qué país, con qué teléfono y de dónde llegó. Para verlas: vercel.com → proyecto
`antena-tv` → pestaña **Analytics** (la primera vez hay que tocar «Enable»; en el plan gratis no
cuesta nada). Contar qué canal mira cada uno («eventos») es del plan pagado de Vercel, así que no
se usa.

## Guía de programación

`api/guia.js` (función de Vercel) junta dos guías públicas y gratuitas en formato XMLTV,
[IPTV-EPG.org](https://iptv-epg.org) y [EPGShare01](https://epgshare01.online), y devuelve
solo los canales que también están en la lista del país, desde 2 horas atrás hasta 36 horas
adelante. Los canales se reconocen por su `tvg-id` o por su nombre. Vercel guarda la respuesta
3 horas, así que las guías se descargan pocas veces al día. La web pide la guía del país que
estás viendo (en «En español», la de Chile) y la del país de cada canal que reproduces.

No todos los canales tienen guía: aparece solo en los que alguna de las dos fuentes cubre.
Los horarios se muestran en la hora del teléfono.

## Canales inactivos (automático)

Tres revisiones trabajan juntas, y ninguna espera a que alguien toque el canal:

1. **En cada teléfono, apenas se abre la tele**: en segundo plano, el teléfono prueba las señales
   de la lista. Empieza por lo que está a la vista (TV abierta, «Seguir viendo», favoritos y las
   primeras tarjetas de cada fila) y sigue con el resto. Los canales que no responden pasan solos
   a «Canales inactivos» en pocos segundos y en su lugar aparecen otros que sí funcionan. Prueba
   desde el país de quien mira y solo descarga el comienzo de cada señal (unos pocos kB).
   - Una señal que respondió no se vuelve a probar durante 1 hora (`OK_MS`); una caída se vuelve
     a probar después de 1 hora (`RECHECK_MS`) y, si volvió, regresa sola a su categoría.
   - Si fallan muchas seguidas, primero confirma que hay internet: si se cortó, no marca nada.
   - Si la persona está deslizando la pantalla, espera a que termine para mover las tarjetas.
   - En iPhone, algunas señales no dejan que otra página las lea, pero el iPhone las reproduce
     igual: en esas solo se confirma que su servidor contesta. En Android y computadores no se
     pueden reproducir, así que ahí se marcan como inactivas.
2. **En el servidor** (`api/estado.js`, una función de Vercel): prueba todas las señales de la
   lista y devuelve las que no responden (error, página caída, o más de 6 segundos sin
   contestar). Vercel guarda el resultado 6 horas, así que la revisión corre pocas veces al
   día y es igual para todos los visitantes. Las señales que niegan el acceso (403, típico de
   las que solo se ven en su país) **no** se marcan como caídas, porque el servidor está en
   EE. UU. y podrían funcionar en Chile (la revisión del teléfono sí las prueba).
3. **Al reproducir**: si un canal falla al verlo, pasa de inmediato a «Canales inactivos» en ese
   teléfono durante 12 horas. Si luego funciona, se quita solo.

Los botones «Siguiente» y «Ver un canal ahora» se saltan los inactivos. Los inactivos se pueden
tocar igual para probarlos. Para cambiar los tiempos: `PROBE_MS`, `PROBE_AT_ONCE`, `OK_MS`,
`RECHECK_MS` y `DEAD_MS` en `index.html`; `TIEMPO_POR_SENAL` y `s-maxage` en `api/estado.js`.

## Cómo se gana dinero

### 1. Antena Plus (suscripción)

| Plan | Precio sugerido |
| --- | --- |
| Mensual | $2.990 al mes |
| Anual | $24.990 al año (2 meses gratis) |

Beneficios incluidos hoy:
- **Multipantalla**: hasta 4 canales a la vez, con el audio del recuadro elegido.
  Es el gancho principal para deportes y noticias.
- **Sin anuncios**: se ocultan los banners.
- **Temas de color**: claro, oscuro o automático.
- **Guía completa**: toda la programación de hoy y mañana (ahora y después se ve gratis).

Agrega o quita beneficios en `CONFIG.plus.beneficios`.

**Cómo funciona el cobro (sin servidor):**
1. La persona toca «Suscribirme». Si pusiste tu link de Mercado Pago en `pago`, paga ahí;
   si no, se abre WhatsApp con el plan escrito.
2. Tú abres `tv/herramientas/codigos.html` en el iPhone, creas un código y se lo envías.
3. La persona lo escribe en «Activa tu código» y Plus queda activo en su dispositivo.

Para crear códigos: en `herramientas/codigos.html` toca «Crear códigos», guarda la lista
en Notas y pega el bloque cifrado dentro de `CONFIG.plus.codigos`. Los códigos se guardan
cifrados (SHA-256), así que nadie puede leerlos en el repositorio.

> **Borra el código de prueba** `ANT-PRUEBA-2026` (el primero de la lista) antes de vender.

**Limitación honesta:** como todo corre en el navegador, alguien con conocimientos podría
activar Plus a mano, y un código sirve en varios dispositivos. Para empezar y validar si la
gente paga, alcanza. Cuando tengas suscriptores, el siguiente paso es un login real con
cobro recurrente (por ejemplo Supabase + Mercado Pago suscripciones, o Lemon Squeezy con
licencias), que vence solo si dejan de pagar.

### 2. Auspiciadores locales

En `CONFIG.auspiciadores` pon banners de negocios (imagen, link y texto). Se muestran entre
las filas a quienes no tienen Plus. Mientras no haya auspiciadores, ese espacio promociona Plus.
Véndelos por mes a negocios de tu ciudad: *«tu banner frente a X personas al mes»*. Para tener
ese número, agrega Plausible o Google Analytics (los botones de Plus ya envían el evento `click_plus`).

> Google AdSense suele rechazar sitios que muestran señales de terceros. Los auspiciadores
> directos pagan mejor y no dependen de esa aprobación.

### 3. Canales que quieren aparecer

El pie dice «¿Tienes un canal o una radio? Súmalo gratis». Los canales pequeños te escriben
por WhatsApp, los agregas en una lista propia (ver abajo) y ganas contenido exclusivo que
atrae público. Más adelante puedes ofrecerles un lugar destacado.

## Personalizar (`CONFIG` en `tv/index.html`)

| Campo | Para qué |
| --- | --- |
| `whatsapp`, `email` | Tu contacto. **Cámbialos primero**: ventas de Plus y pedidos de retiro llegan ahí. |
| `regiones` | De dónde salen los canales (hoy, todos los canales en español de iptv-org). |
| `paisPrincipal`, `nacionales` | De qué país es la fila «TV abierta» y qué canales lleva (hay listos para cl, ar, mx, co, pe y es). |
| `categorias` | Nombre, dibujo (`icono`), color y orden de las categorías. |
| `radios` | País de las radios (`pais: "cl"`; vacío = sin radios). |
| `ocultar` | Nombres o links de señales a retirar. |
| `auspiciadores` | Banners publicitarios. |
| `plus` | Nombre, planes, precios, links de pago, beneficios y códigos. |

Para sumar canales propios o de canales que te escriban, agrégalos desde «Mis listas» (botón
al final de la página): aparecen junto a los demás, en su categoría.

## Publicada

**https://antena-tv.vercel.app** (proyecto `antena-tv` en el equipo ArmaTienda de Vercel,
carpeta raíz `tv/`, rama `claude/exciting-pasteur-f1q3l4`).

En el iPhone: Safari → Compartir → «Agregar a pantalla de inicio».

**Se publica sola:** el proyecto está vinculado al repositorio. Cada cambio que se sube a la
rama `claude/exciting-pasteur-f1q3l4` (por ejemplo, editar el `CONFIG` desde github.com en
el iPhone) queda en línea en menos de un minuto.

## Lo legal

- Antena **no aloja ni vende canales**: enlaza señales que sus dueños transmiten gratis y
  públicamente, a partir del índice iptv-org. Plus cobra por funciones de la app.
- **Filtro automático de señales no oficiales**: las listas públicas a veces traen copias de
  canales de pago retransmitidas sin permiso (Disney, ESPN, Cinecanal, MTV…). La tele las
  oculta **aunque funcionen**: por nombre (`CONFIG.canalesDePago`), por venir de una dirección
  IP suelta o de una ruta típica de retransmisión, o por salir de servidores de operadores de
  TV de pago (`CONFIG.operadoresDePago`). No se aplica a las listas propias que agregue cada
  persona. Si ves que se coló otra, agrega su nombre a `canalesDePago`.
- **Retiros**: si el dueño de una señal te pide sacarla (el pie de página tiene tu email),
  agrégala a `CONFIG.ocultar` en menos de 48 horas.
- **No agregues** listas de canales de pago (cable, fútbol, plataformas de streaming) ni
  señales de terceros que no sean públicas: eso infringe la Ley 17.336 en Chile y es lo que
  hace que estos sitios terminen cerrados.
- Haz inicio de actividades en sii.cl y emite boleta por las suscripciones.
