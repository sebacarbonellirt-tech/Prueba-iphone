# Antena: apps de TV y radio en vivo con marca propia

Un negocio que se maneja desde el iPhone: le haces a canales, radios, iglesias, colegios y
clubes **su propia app** para ver su señal en vivo, con su nombre, logo y colores.

```
tv/
  index.html     la web de venta (planes, demo en vivo, WhatsApp)  →  …/tv/
  app/           el reproductor (gratis para uso personal, o con la marca de tu cliente)  →  …/tv/app/
  icons/         iconos
```

## 1. La web de venta (`tv/index.html`)

Todo sale del bloque `CONFIG`, al principio del archivo:

| Campo | Qué poner |
| --- | --- |
| `whatsapp` | Tu número: `569` + tus 8 dígitos. **Cámbialo primero**: todos los botones llevan ahí. |
| `email` | Tu correo de contacto. |
| `planes` | Precio, qué incluye y el link de cobro (`pago`). Si `pago` queda vacío, el botón abre WhatsApp con el pedido escrito. |
| `propinas` | Aportes de quienes usan el reproductor gratis. `[]` para ocultarlas. |
| `faq` | Preguntas frecuentes. |

Lo que más vende es la sección **«Mira cómo se vería tu app»**: el cliente escribe el nombre
de su canal, elige un color, pega su link (opcional) y se le abre **su app funcionando**.
El botón «Pedir esta app» te llega por WhatsApp con el nombre, el color y la señal ya escritos.

Los links de cobro se crean desde el celular: **Mercado Pago** (link de pago) o **Flow**
(Webpay). Para el plan mensual usa la suscripción de Mercado Pago.

## 2. Entregarle la app a un cliente (10 minutos)

1. **Prueba su señal**: abre `…/tv/app/?marca=NOMBRE&color=%23COLOR&canal=LINK` en Safari.
   Si se ve, ya está casi lista. Ese mismo link sirve para mostrársela antes de cobrar.
2. **Copia la carpeta** `tv/app/` a un repositorio nuevo (o a una carpeta `clientes/nombre/`).
3. En su `index.html`, llena el `CONFIG`:
   ```js
   fija: { nombre: "Radio Sur 98.5", canal: "https://…/live.m3u8", lista: "" },
   color: "#0B7A55",
   permitirListas: false,
   ```
   Si tiene varias señales (TV, radio, eventos), usa `lista` con un `.m3u` en lugar de `canal`.
4. En su `manifest.json`, cambia `name`, `short_name` y `theme_color`. Reemplaza los iconos
   de `icons/` por su logo (512×512, 192×192 y 180×180).
5. **Publica** en Vercel (gratis) y, si quiere, conecta su dominio (`app.radiosur.cl`).
6. Mándale el link y este texto para su público: *«Abre el link en Safari → Compartir →
   Agregar a pantalla de inicio»*.

> El link con parámetros (`?marca=…`) es solo para demos: al instalarla desde la pantalla de
> inicio el iPhone abre la versión sin parámetros. Para la app definitiva usa el paso 3.

El pie de la app dice «Hecho con Antena · ¿Tienes un canal…? →» y lleva a tu web: cada app
que entregas te trae clientes. Se quita con `hechoCon: ""` (puedes cobrar extra por quitarlo).

## 3. Si el cliente todavía no transmite (plan «Transmisión completa»)

Necesita una señal **HLS en https** (`.m3u8`). El camino más simple:

1. **OBS Studio** (gratis) en el computador del cliente, con su cámara o su consola de audio.
2. Un servicio de video en vivo que entregue HLS: **Cloudflare Stream**, **Mux** o
   **Restream**. OBS envía por RTMP y el servicio te da el link `.m3u8`.
3. Ese link va en `fija.canal`.

Antes de cotizar, calcula el costo del servicio: se cobra por **minutos vistos**
(personas × minutos). Una transmisión de 2 horas con 100 personas = 12.000 minutos.
Revisa la tarifa vigente del proveedor y súmala a tu precio mensual, o haz que el cliente
abra la cuenta a su nombre y pague él directo.

## 4. Cómo conseguir los primeros clientes

1. **Busca quién ya transmite**: radios comunales, iglesias y clubes que hacen «en vivo» en
   Facebook o YouTube. Están en Google Maps y en los grupos de tu ciudad.
2. **Llega con la demo hecha**: arma el link `?marca=…&color=…` con su nombre y su color y
   mándaselo por WhatsApp: *«Te armé esto, ¿te gustaría que tu público te tuviera así?»*.
3. **El plan mensual es tu negocio**: 10 clientes × $14.990 = **$149.900 al mes** recurrentes.
   El pago único sirve para que prueben sin miedo; después ofréceles soporte mensual.
4. **Vende el día del evento**: aniversarios, finales del campeonato, Fiestas Patrias,
   Semana Santa. Ahí es cuando más gente quiere ver en vivo.
5. **Pide el logo de los auspiciadores**: los clubes y radios pueden venderle espacio en
   su app a negocios locales; eso hace que tu plan se pague solo.

Impuestos: haz inicio de actividades en sii.cl y emite boleta de honorarios o boleta
electrónica (lo mismo que en la tienda Vitrina).

## 5. El reproductor gratis (`tv/app/`)

Cualquiera puede usarlo para sus propias listas M3U: por link, archivo o texto pegado;
categorías, búsqueda sin tildes, favoritos, recientes, canal anterior/siguiente, AirPlay,
imagen en imagen y controles en la pantalla bloqueada. Todo queda en el dispositivo.
Usa HLS nativo en Safari y carga hls.js solo en navegadores que lo necesitan.

**Viene con canales abiertos:** la primera vez que se abre, carga sola la lista de canales
abiertos de Chile de [iptv-org](https://github.com/iptv-org/iptv) (señales que los propios
canales publican gratis en internet). En «Listas → Listas de ejemplo» se pueden sumar
Argentina, México, España y Noticias del mundo. Se cambia en `CONFIG.precargar` y
`CONFIG.ejemplos`. Algunas señales pueden estar caídas o bloqueadas fuera de su país.

Limitaciones del navegador:
- Una página https no puede reproducir señales `http://`.
- Algunos servidores no dejan leer su lista desde el navegador (CORS): súbela como archivo.
- RTMP y RTSP no se reproducen en el navegador.

## Lo legal (léelo antes de vender)

Antena hace apps para **señales propias o con derechos de transmisión**. No vendas listas ni
suscripciones a canales de cable, fútbol o plataformas de streaming sin licencia: en Chile
infringe la Ley 17.336 de Propiedad Intelectual, y en la práctica esas listas se caen, los
pagos se bloquean y las cuentas en redes se cierran por denuncias.

Antes de cada entrega, confirma por escrito (basta un WhatsApp) que la señal es del cliente.
Si un club transmite un partido de una liga, que tenga permiso de la liga.
