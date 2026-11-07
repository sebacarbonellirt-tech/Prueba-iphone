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
| Portada | Filas por categoría (Noticias, Deportes, Música, Infantil…), «Seguir viendo» y «Tus favoritos». |
| Región | En español (por defecto), Chile, Argentina, México, Colombia, Perú, España o Estados Unidos. |
| Buscador | Busca en todos los canales, sin importar tildes. |
| Reproductor | Canal anterior/siguiente, favoritos, pantalla completa, AirPlay e imagen en imagen. |
| Tarjetas | Bandera del país, categoría y avisos «Solo en su país» o «No 24/7». |
| Mis listas | Quien tenga su propia lista M3U puede sumarla (link, archivo o texto). |
| Sin conexión | Si no carga la región, muestra videos de prueba y un aviso. |
| Filtro | Se ocultan solos los canales para adultos. |
| Canales inactivos | Los que no responden salen de sus categorías y quedan en una sección propia al final (y en el filtro «Inactivos»). Cuando vuelven, regresan solos. |

Los canales salen de [iptv-org](https://github.com/iptv-org/iptv), un índice público de
señales que sus propios dueños publican gratis en internet. Muchas se caen o cambian:
la lista se descarga de nuevo cada vez que se abre la tele, y si un canal falla, el
botón «Siguiente canal» salta al próximo.

## Canales inactivos (automático)

Dos revisiones trabajan juntas:

1. **En el servidor** (`api/estado.js`, una función de Vercel): prueba todas las señales de la
   región y devuelve las que no responden (error, página caída, o más de 6 segundos sin
   contestar). Vercel guarda el resultado 6 horas, así que la revisión corre pocas veces al
   día y es igual para todos los visitantes. Las señales que niegan el acceso (403, típico de
   las que solo se ven en su país) **no** se marcan como caídas, porque el servidor está en
   EE. UU. y podrían funcionar en Chile.
2. **En cada teléfono**: si un canal falla al reproducirlo, pasa de inmediato a «Canales
   inactivos» en ese teléfono durante 12 horas. Si luego funciona, se quita solo.

Los botones «Siguiente» y «Ver un canal ahora» se saltan los inactivos. Los inactivos se pueden
tocar igual para probarlos. Para cambiar los tiempos: `TIEMPO_POR_SENAL` y `s-maxage` en
`api/estado.js`, y `DEAD_MS` en `index.html`.

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

Anunciado como «Pronto»: guía de programación. Agrega o quita beneficios en `CONFIG.plus.beneficios`.

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
| `regiones`, `regionInicial` | Qué listas se ofrecen y cuál se ve al entrar. |
| `categorias` | Orden de las filas en la portada. |
| `ocultar` | Nombres o links de señales a retirar. |
| `auspiciadores` | Banners publicitarios. |
| `plus` | Nombre, planes, precios, links de pago, beneficios y códigos. |

Para sumar canales propios o de canales que te escriban, crea un archivo `tv/canales.m3u`
y agrégalo como región (`{ id: "mios", nombre: "Destacados", url: "canales.m3u" }`), o
súmalo desde «Mis listas».

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
- **Retiros**: si el dueño de una señal te pide sacarla (el pie de página tiene tu email),
  agrégala a `CONFIG.ocultar` en menos de 48 horas.
- **No agregues** listas de canales de pago (cable, fútbol, plataformas de streaming) ni
  señales de terceros que no sean públicas: eso infringe la Ley 17.336 en Chile y es lo que
  hace que estos sitios terminen cerrados.
- Haz inicio de actividades en sii.cl y emite boleta por las suscripciones.
