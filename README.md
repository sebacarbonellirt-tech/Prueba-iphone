# Vitrina: tu tienda digital para vender desde el iPhone

Una tienda web lista para cobrar, pensada para manejarse **100 % desde el iPhone**.
Vendes productos digitales (guías, plantillas, cursos) y recibes propinas,
sin pagar suscripciones ni comisiones de plataforma de tienda.

## Qué incluye

| Parte | Para qué sirve |
| --- | --- |
| Productos con botón de compra | Cada botón lleva a tu link de cobro. Si no tienes link, abre WhatsApp con el pedido escrito. |
| Barra de compra fija | Cuando el cliente baja por la página, el producto estrella queda siempre a un toque. |
| Oferta con cuenta regresiva | Banner amarillo con fecha límite real. Se oculta solo al vencer. |
| Regalo a cambio del email | Junta una lista de clientes a la que luego le vendes (vía Formspree, gratis). |
| "Invítame un café" | Propinas de 3, 5 y 10 para tu público que no compra todavía. |
| Opiniones y preguntas frecuentes | Quitan dudas y suben la conversión. |
| WhatsApp flotante | Para cerrar ventas por chat. |
| App instalable (PWA) | Desde Safari: Compartir → «Agregar a pantalla de inicio». Funciona sin conexión. |
| Modo claro y oscuro | Sigue el ajuste del iPhone. |

## 1. Personalízala (5 minutos, desde el iPhone)

Todo el contenido está en **un solo bloque** al principio de `index.html`, llamado `CONFIG`.

1. Abre este repositorio en Safari (github.com) o en la app de GitHub.
2. Entra a `index.html` y toca el lápiz ✏️.
3. Cambia marca, textos, precios, WhatsApp y redes dentro de `CONFIG`.
4. Toca **Commit changes**. La web se actualiza sola en un minuto.

Los testimonios de ejemplo están marcados como «Ejemplo». **Reemplázalos por opiniones
reales o bórralos** (pon `testimonios: []`). Lo mismo con los números de «prueba».

## 2. Conecta los cobros

En cada producto, pega tu link de pago en el campo `pago`. Opciones que se crean desde el móvil:

| Plataforma | Mejor para | Entrega el archivo sola |
| --- | --- | --- |
| **Mercado Pago** (Link de pago) | Latinoamérica, pagos en moneda local | No: envíalo tú por email o WhatsApp |
| **Hotmart** | Cursos e infoproductos en LATAM | Sí |
| **Lemon Squeezy** / **Gumroad** | Productos digitales en USD, impuestos incluidos | Sí |
| **Stripe** (Payment Links) | Tarjeta y Apple Pay en todo el mundo | No |
| **PayPal.me** | Propinas rápidas | No |

Recomendación: usa **Hotmart, Lemon Squeezy o Gumroad** para los productos (entregan el archivo
automáticamente) y **Mercado Pago o PayPal** para las propinas.

## 3. Publícala gratis

**Opción A: GitHub Pages**
Repositorio → Settings → Pages → Branch: `main` / carpeta `/root` → Save.
Tu tienda queda en `https://TU-USUARIO.github.io/Prueba-iphone/`.

**Opción B: Vercel**
vercel.com → Add New Project → importa este repositorio → Deploy. Te da HTTPS y puedes
conectar un dominio propio (`tumarca.com`).

## 4. Captura de emails (opcional, gratis)

1. Crea una cuenta en formspree.io y un formulario nuevo.
2. Copia su URL (`https://formspree.io/f/xxxx`) en `CONFIG.regalo.formulario`.
3. Cada email que te dejen te llega al correo. Envíales el regalo y luego tus ofertas.

## Cómo ganar dinero con ella

1. **Escalera de precios.** Regalo gratis → producto barato (9) → producto medio (15).
   La mayoría compra primero lo barato; los que confían suben al siguiente.
2. **Tráfico.** Pon el link en la bio de Instagram y TikTok. Cada video termina con
   «link en mi perfil». Graba con el iPhone sin mostrar tu cara
   (voz en off, manos o grabación de pantalla) usando los mismos guiones que vendes.
3. **Urgencia real.** Usa la cuenta regresiva solo con ofertas que de verdad terminan.
4. **La lista de emails es tuya.** Las redes cambian; tu lista no. Escríbele cada semana.
5. **Mide.** Los botones de compra ya envían el evento `click_comprar` si agregas
   Plausible o Google Analytics.

## Archivos

```
index.html            la tienda (edita el bloque CONFIG)
manifest.json         datos de la app instalable
sw.js                 caché para abrir rápido y sin conexión
icons/                iconos de la app (SVG y PNG)
```
