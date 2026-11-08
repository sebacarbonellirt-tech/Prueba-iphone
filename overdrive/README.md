# OVERDRIVE · prototipo MVP

Juego móvil de autos deportivos: **garaje Idle + carreras automáticas con estrategia**.
Diseño completo en [`docs/DISENO.md`](docs/DISENO.md).

## Qué se puede jugar hoy

Una sesión completa: entras, cobras la caja del taller, mejoras el auto, eliges estrategia, corres
(con nitro manual opcional), recibes recompensas y desbloqueas el siguiente evento, una pieza nueva o un auto.

- 3 autos (Brisa GT, Kodiak R, Véspera S), 5 piezas, 2 edificios, 8 pinturas.
- 3 circuitos × 5 eventos, con clima, temperatura y rivales fijos por evento.
- 4 decisiones de estrategia + nitro manual de 2 cargas.
- El Ingeniero: análisis de la carrera y consejos concretos.
- Progreso offline (hasta 2 h, ampliable), 12 objetivos guiados, guardado automático y respaldo.

## Cómo jugarlo

### En el iPhone (sin instalar nada)
Si GitHub Pages está activo en este repositorio (como para la tienda de la raíz), después de llevar esta
rama a `main` el juego queda en:

```
https://sebacarbonellirt-tech.github.io/Prueba-iphone/overdrive/
```

Ábrelo en Safari → Compartir → **Agregar a pantalla de inicio**: se abre a pantalla completa como una app.

### En un computador
Requiere Node.js 18 o superior. No hay dependencias que instalar.

```bash
cd overdrive
npm start          # abre http://localhost:5173
```

(Sirve cualquier servidor estático; el juego no funciona abriendo el `index.html` con doble clic porque
usa módulos de JavaScript.)

## Pruebas y herramientas de balance

```bash
npm test           # 16 pruebas del núcleo: determinismo, repetición, economía, progresión
npm run balance    # bot que juega 7 días (5 visitas/día) e imprime cuándo gana cada evento
npm run strategy   # compara 81 configuraciones en cada evento (tarda ~2 min)
```

Ejemplos:

```bash
node tools/progression-bot.mjs 14 3 5   # 14 días, 3 visitas/día de 5 minutos (jugador casual)
node tools/risk-probe.mjs neon 1        # efecto del riesgo en "Asfalto Mojado"
```

## Estructura

```
overdrive/
├── index.html, styles.css, manifest.json, sw.js, icons/
├── src/
│   ├── core/              ← reglas del juego, sin interfaz (el futuro servidor usará esto mismo)
│   │   ├── data.js        ← TODO el balance: autos, piezas, circuitos, eventos, economía, objetivos
│   │   ├── stats.js       ← estadísticas, IR y conversión a física
│   │   ├── race.js        ← simulación determinista de carreras
│   │   ├── state.js       ← estado del jugador y acciones (cobrar, mejorar, correr, construir…)
│   │   └── rng.js         ← aleatoriedad con semilla
│   ├── ui/                ← pantallas, arte vectorial, utilidades de interfaz
│   ├── storage.js         ← guardado local con migración
│   └── main.js            ← arranque, navegación y bucle Idle
├── tests/                 ← pruebas (node --test)
├── tools/                 ← bot de progresión, sondas de estrategia, servidor local
└── docs/DISENO.md         ← documento de diseño
```

**Para equilibrar el juego** se edita solo `src/core/data.js` y se verifica con `npm run balance` y `npm test`.

## Depuración

En la consola del navegador, `__overdrive.state` es la partida actual. Ejemplo para probar contenido avanzado:

```js
__overdrive.state.credits = 1e6; __overdrive.state.rep = 8; __overdrive.save(); __overdrive.refresh();
```

## Limitaciones conocidas del prototipo

- Sin sonido todavía.
- El arte es vectorial generado por código: define la identidad, pero no es arte final.
- El guardado vive en el navegador: en Safari, si no se agrega a la pantalla de inicio, puede borrarse tras
  semanas sin uso. Usa «Perfil → Copiar respaldo».
- No hay servidor: nada es competitivo ni verificable todavía (es la etapa 3 del plan).
