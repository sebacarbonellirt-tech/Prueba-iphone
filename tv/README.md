# Antena: reproductor IPTV para iPhone

App web instalable (PWA) para ver canales en vivo desde listas **M3U / M3U8**.
Funciona en Safari del iPhone (que reproduce HLS de forma nativa) y en cualquier navegador
de computador (usa hls.js, que se carga solo cuando hace falta).

## Qué hace

| Función | Detalle |
| --- | --- |
| Cargar listas | Por link, subiendo un archivo `.m3u` (desde Archivos / iCloud) o pegando el texto. También acepta el link directo de un solo canal `.m3u8`. |
| Varias listas | Se juntan en un solo catálogo; los canales repetidos se muestran una vez. Puedes ocultar o borrar cada lista. |
| Categorías | Usa `group-title` de la lista para crear filtros (Noticias, Deportes…). |
| Búsqueda | Sin importar tildes ni mayúsculas («nunoa» encuentra «Ñuñoa»). |
| Favoritos y Recientes | Toca la estrella. Se guardan en el iPhone. |
| Reproductor | Canal anterior / siguiente, pantalla completa, AirPlay al televisor e imagen en imagen. Controles en la pantalla bloqueada. |
| Logos | Usa `tvg-logo`; si no hay, muestra las iniciales del canal. |
| Al día | Las listas agregadas por link se vuelven a descargar cada vez que abres la app. |
| Privado | Todo queda en el dispositivo (localStorage). No hay servidor ni cuentas. |

## Probarla

1. Publica el repositorio (GitHub Pages o Vercel, igual que la tienda principal).
2. Abre `https://TU-USUARIO.github.io/Prueba-iphone/tv/` en Safari.
3. Toca **Probar la demostración**: carga videos de prueba públicos de Apple y Mux.
4. Compartir → «Agregar a pantalla de inicio» para tenerla como app.

## Personalizar

Al principio de `index.html` está el bloque `CONFIG`:

- `marca`: el nombre que se muestra.
- `ejemplos`: listas que aparecen para agregar con un toque. Cada una puede tener `url`
  (link a un `.m3u`) o `texto` (la lista escrita ahí mismo).
- `porPagina`: cuántos canales se dibujan antes del botón «Mostrar más».

Colores en las variables `--accent`, `--bg`, etc., dentro de `<style>`.

## Formato de lista que entiende

```
#EXTM3U
#EXTINF:-1 tvg-logo="https://…/logo.png" group-title="Noticias",Nombre del canal
https://servidor.com/canal/index.m3u8
```

## Limitaciones del navegador (importante)

- **http:// vs https://**: una página publicada en https no puede reproducir señales `http://`.
  Pide a tu proveedor los links en `https://`.
- **CORS**: algunos servidores no dejan que un navegador lea su lista. Si el link no carga,
  descarga el `.m3u` y súbelo como archivo, o pega su contenido.
- **RTMP / RTSP** no se pueden reproducir en un navegador.
- En iPhone el audio se corta al salir de la app (salvo en imagen en imagen o AirPlay).

## Lo legal

Antena es **solo un reproductor**, como VLC: no trae ni vende canales. Úsala con listas que
tengas derecho a ver: tus propias transmisiones, señales que los canales publican gratis
por internet, o un proveedor que tenga los derechos.

**No la uses para revender listas de canales de pago** (TV cable, fútbol, plataformas de
streaming) sin licencia: en Chile eso infringe la Ley 17.336 de Propiedad Intelectual y la
Ley 20.750, y en la práctica esas listas se caen, los pagos se bloquean y las cuentas en
redes se cierran por denuncias de los dueños de los derechos.

Si quieres ganar dinero con esto de forma legal:
- Vende la app como **reproductor** (personalizada con tu marca) a canales locales,
  radios con video, iglesias, colegios o municipios que transmiten en vivo.
- Arma tu **propio canal** (por ejemplo con OBS + un servidor HLS como Cloudflare Stream,
  Mux o un VPS con nginx-rtmp) y usa Antena como su app.
- Ofrece el servicio de **montarle la transmisión** a negocios y eventos.
