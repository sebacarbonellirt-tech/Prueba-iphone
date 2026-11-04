# LaPega: cursos para conseguir trabajo en Chile

Tienda de cursos sin videos de cámara: todo es PDF, plantillas y audio. Se edita
desde el iPhone en el bloque `CONFIG` de `empleo/index.html`.

## Qué vende

| Curso | Precio |
| --- | --- |
| Kit completo: de postular a firmar contrato (los 3 cursos + 2 módulos extra) | $24.990 (antes $32.970) |
| CV chileno que pasa los filtros | $9.990 |
| LinkedIn y portales: que te llamen | $9.990 |
| Entrevista y pretensión de renta | $12.990 |

El Kit es el producto estrella: aparece primero y en la barra de compra fija.
Se nota que conviene porque cuesta menos que los tres cursos sueltos.

## El gancho gratis: calculadora de sueldo líquido

En Chile mucha gente busca «calcular sueldo líquido» y «cuánto pedir de pretensión de renta».
La calculadora atrae esas visitas y las lleva directo al curso de entrevista.

- **Bruto → líquido:** descuenta AFP (10% + comisión), salud 7%, seguro de cesantía
  0,6% (solo contrato indefinido) e impuesto único según la tabla del SII.
- **¿Cuánto pedir?:** pones el líquido que quieres y te dice el bruto que debes pedir.

**Actualiza cada mes** en `CONFIG.calc`:
- `utm` y `uf`: valores del mes en sii.cl.
- `afp`: comisiones vigentes en spensiones.cl.
- `topeAfpSaludUF` y `topeCesantiaUF`: cambian cada año (spensiones.cl).

Los valores que trae son aproximados. La página avisa que es una estimación.

## Qué tienes que crear tú

Los cursos en sí. Sin mostrar tu cara:
1. **PDF:** escríbelos en Google Docs o Canva desde el celular y expórtalos.
2. **Audio:** grábalos con la app Notas de voz del iPhone.
3. **Plantillas de CV:** en Canva (comparte el link de «usar como plantilla») y en Word.

Súbelos a **Hotmart** (entrega el curso sola y cobra en pesos) y pega el link de cada uno
en el campo `pago`.

## Antes de publicar

- Cambia el WhatsApp de prueba (`56900000000`) por el tuyo.
- Los testimonios dicen «Ejemplo». Reemplázalos por opiniones reales o bórralos.
- La pregunta frecuente «¿Me garantiza trabajo?» responde que no. Déjala así:
  prometer un trabajo seguro puede considerarse publicidad engañosa (Ley del Consumidor, Sernac).

## Publicidad en Instagram y Facebook

La tienda ya trae el **Pixel de Meta**. Pega tu ID en `CONFIG.metaPixel` y quedará activo.
- Solo se activa si el visitante acepta las cookies (aviso abajo en la pantalla). Así
  cumples con la nueva Ley de Protección de Datos Personales (Ley 21.719), que rige desde diciembre de 2026.
- Envía a Meta estos eventos: `PageView`, `UsoCalculadora` (para retargeting), `Lead`
  (email del checklist) e `InitiateCheckout` (clic en comprar).
- La compra (`Purchase`) la informa Hotmart: pega el mismo Pixel en tu producto de Hotmart.
- Si el link del anuncio trae `utm_campaign`, la tienda la pasa a Hotmart como `src`.
  Así ves en Hotmart qué anuncio generó cada venta.

Anuncios, guiones de video y plan de campañas: `marketing/anuncios-lapega.md`.

## Cómo conseguir alumnos sin mostrar tu cara

- **Carruseles en Instagram y TikTok:** «5 errores de CV que te descartan», «Bruto vs. líquido».
- **Videos de pantalla:** grabas la calculadora calculando un sueldo real y lo explicas con voz en off.
- **Grupos de Facebook y LinkedIn** de empleo en Chile: comparte la calculadora gratis.
- **Temporadas fuertes:** marzo (vuelta de vacaciones) y fin de año (contratos de temporada).

## Publicar

Si ya publicaste la tienda principal en GitHub Pages o Vercel, esta queda en
`.../empleo/`. También puedes crear un proyecto aparte en Vercel con la carpeta
`empleo` como raíz y un dominio propio (por ejemplo `lapega.cl` en nic.cl).
