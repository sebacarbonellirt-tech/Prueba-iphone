# OVERDRIVE — Documento de diseño (v0.1)

> Juego móvil de autos deportivos: garaje Idle + carreras automáticas con estrategia + competencia justa.
> Este documento acompaña al prototipo jugable de `overdrive/`. Lo que dice “probado” se verificó con
> el código y las herramientas de `tools/`; lo que dice “propuesta” está aún por validar.

---

## 0. Resumen ejecutivo

**Qué es:** el jugador es dueño de un taller de alto rendimiento. El taller genera dinero aunque el
jugador no esté (Idle). Ese dinero se invierte en autos y piezas. Los autos compiten en carreras que
se corren solas, pero que se **ganan o se pierden en las decisiones previas** (neumáticos, mapa de
potencia, plan de nitro, riesgo) y en **un único toque durante la carrera** (nitro manual).

**Frase de identidad:** *“Construye tu garaje. Domina la pista.”*

**Regla de oro del negocio:** se paga por **estilo y comodidad**, nunca por **ventaja competitiva**.
Las competencias con ranking usan autos normalizados; los torneos con premio, autos idénticos.

**Estado:** prototipo MVP jugable (navegador, móvil), 3 autos, 3 circuitos, 15 eventos, economía
calibrada con un bot, 16 pruebas automáticas.

---

## 1. Evaluación honesta del potencial

### Fortalezas
| Fortaleza | Por qué importa |
| --- | --- |
| Tema con demanda permanente | Autos y personalización atraen a un público amplio en LatAm y fuera de ella. |
| Idle + estrategia | La mayoría de los Idle de autos son “sube números y mira”. Aquí la carrera es un **puzle corto de decisiones** con consecuencias visibles. |
| Competencia justa como identidad | “Aquí no gana el que paga” es un mensaje de marketing creíble si el diseño lo garantiza (autos normalizados, copa monomarca). |
| Simulación determinista | Permite validar cada carrera en un servidor (anti-trampas) y reproducir carreras (fantasmas, repeticiones, *highlights*). Ya está construida. |
| Producción 2D viable | No exige 3D ni física compleja: un equipo pequeño puede sostener contenido. |

### Riesgos (ordenados por gravedad)
1. **Saturación del género.** Existen varios Idle de autos. Sin una diferencia que se sienta en los primeros
   5 minutos, la adquisición de usuarios será cara. *Mitigación:* la estrategia previa y el nitro manual
   deben aparecer en la primera carrera (ya ocurre en el prototipo).
2. **Arte.** En juegos de autos el jugador compra con los ojos. El arte vectorial actual sirve para validar
   la diversión, no para lanzar. Presupuesto de arte = prioridad antes del lanzamiento.
3. **Monetización sin pay-to-win rinde menos por usuario.** Los Idle viven de anuncios con recompensa y de
   compras de comodidad. Hay que compensar con volumen, pase de temporada y cosméticos deseables.
4. **Premios en dinero real.** Complejidad legal por país, políticas de tiendas, fraude e impuestos.
   Es una fase futura, no un pilar del lanzamiento (ver §8).
5. **El “solucionador” de estrategia.** Como la simulación es determinista y el código corre en el cliente,
   un jugador técnico puede calcular la configuración óptima. *Mitigación:* información oculta y variable en
   competitivo, intentos limitados y el toque de nitro en vivo (ver §9).
6. **Nombre.** “Overdrive” es una palabra muy usada (apps, juegos, marcas). Antes de invertir en marca:
   búsqueda de marca en INAPI (Chile), USPTO, EUIPO y en las tiendas. Alternativas si choca:
   *OVERDRIVE: Garage Kings*, *Redline Garage*, *Pit Boss*, *Nitro Barrio*.
7. **Licencias de marcas reales.** Usar Ferrari, Porsche, etc. requiere licencias caras. **Decisión:** marcas
   ficticias propias (Halcón Motors, Ferro Automobili, Studio Alba…). Es más barato y construye IP propia.

### Veredicto
Potencial **medio-alto como negocio de nicho escalable**, condicionado a dos cosas que el prototipo
permite medir ya: (a) que la carrera estratégica sea divertida más de 20 veces, y (b) que el ciclo Idle
genere 3+ visitas diarias. Si esas métricas no aparecen en las pruebas con usuarios, no hay que
construir multijugador ni torneos: hay que iterar el núcleo.

---

## 2. Cómo se juega (descripción concreta)

1. **Abres el juego.** Pantalla de inicio con tu auto. Al entrar: *“Mientras no estabas, tu taller ganó 718 CR”*.
2. **Garaje.** Ves tu auto, su Índice de Rendimiento (IR), su estado mecánico y la **Caja del taller**, que se
   llena sola hasta un tope (2 h al inicio). Tocas **Cobrar**.
3. **Taller.** Gastas en piezas (Motor, Neumáticos, Transmisión, Aerodinámica, Suspensión) o en edificios
   (Taller de servicio = ingreso/s; Oficina = horas de caja).
4. **Carreras.** Eliges un evento. La **Lectura de pista** te dice: % de curvas, temperatura, lluvia, distancia;
   ves a tus rivales, su IR y qué neumático llevan.
5. **Estrategia.** Eliges neumático (Blando/Medio/Duro), mapa (Eco/Balance/Ataque), plan de nitro
   (Salida/Rectas/Final/Manual) y riesgo (Conservador/Normal/Agresivo).
6. **Carrera (40–60 s a velocidad x1).** Vista cenital del circuito, posiciones en vivo, velocidad, nitro y
   desgaste. Si elegiste nitro **Manual**, tienes 2 cargas para tocar en el momento justo.
7. **Resultado.** Posición, créditos, reputación, desgaste del auto y el **Ingeniero**: dónde perdiste tiempo
   frente al ganador y qué cambiar (“Gastaste 1,8 s de nitro en curvas”, “Neumáticos al 9 %: prueba Duros”).
8. **Progresión.** Un podio desbloquea el siguiente evento; ganar la final del circuito entrega el **plano de
   un auto nuevo**, que se construye con créditos y tiempo real.

---

## 3. Ciclo principal

```
             ┌────────────── visitas cortas (3–6 al día) ──────────────┐
             ▼                                                         │
   COBRAR CAJA ──► INVERTIR (piezas / taller / autos) ──► CORRER (decidir + nitro)
             ▲                                                         │
             │                    ┌─ créditos ─┐                       ▼
             └──── la caja se ◄───┤            ├◄── RESULTADO + INGENIERO (aprender)
                   llena sola     └─ reputación (desbloquea topes) ─┘
```

**Bucles por escala de tiempo**
| Escala | Qué hace el jugador | Qué lo trae de vuelta |
| --- | --- | --- |
| 30 s | Una carrera: decidir, mirar, ajustar | Querer ganar con la configuración correcta |
| 5–10 min | Sesión: cobrar, mejorar, 4–8 carreras | Objetivo guiado del garaje |
| Horas | La caja se llena; el auto se repara solo; construcción en curso | “Caja llena”, “Kodiak R listo” |
| Días | Circuitos nuevos, autos nuevos, topes de reputación | Desbloqueo del siguiente circuito |
| Semanas (fase 2) | Temporada, liga, pase | Ranking, recompensas de temporada |

**Por qué no es un Idle “sin decisiones”:**
- La caja tiene tope: no hay ganancia infinita por ausencia.
- El nivel máximo del taller y de las piezas depende de la **reputación**, que solo se gana corriendo.
- Las carreras difíciles **no se ganan solo con IR**: se ganan leyendo la pista.

---

## 4. Mecánicas diferenciadoras

1. **Lectura de pista + scouting de rivales.** Antes de correr ves el neumático y el IR de cada rival. Es
   información accionable: si todos van con blandos a 36 °C, el duro te puede dar la victoria.
2. **Nitro manual de 2 cargas (intervención única).** Es el único momento “de habilidad” durante la
   carrera. El mejor uso es al salir de una curva lenta hacia una recta larga; usarlo en curva se desperdicia
   y aumenta los errores. Queda registrado como entrada y se puede re-simular (probado).
3. **Desgaste con doble capa.** Neumáticos se gastan *dentro* de la carrera (estrategia); el auto pierde
   *estado* entre carreras (hasta −8 % de rendimiento) y se recupera solo con el tiempo o pagando. Crea un
   motivo suave para volver sin “energía” que bloquee jugar.
4. **El Ingeniero (telemetría explicada).** Descompone la diferencia con el ganador en rectas vs curvas,
   errores, nitro desperdiciado y estado de neumáticos, y lo convierte en consejos. Es lo que hace que la
   carrera sea “fácil de entender, difícil de dominar”.
5. **Clase ≠ rareza.** La **clase** (D, C, B, A, S) define rendimiento y se consigue jugando. La **rareza**
   solo existe en ediciones cosméticas (Serie, Especial, Limitada, Prototipo, Ícono). Nadie compra velocidad.
6. **Autos por planos, no por cajas.** Los autos se ganan en finales de circuito, temporadas y misiones;
   se construyen con créditos + tiempo. Sin cajas de botín pagadas con autos dentro.
7. **Rebufo.** Ir detrás de otro auto en recta da +2,5 % de punta: crea adelantamientos visibles.

### Recomendación: tipo de carrera
| Opción | Pros | Contras | Veredicto |
| --- | --- | --- | --- |
| Totalmente automática | Simple, perfecta para Idle | Sin habilidad, aburre, sin identidad competitiva | ❌ |
| Automática + decisiones previas | Profundidad, validable en servidor, ideal para asincronía | Puede sentirse pasiva al mirar | ✅ base |
| Híbrida (1 intervención puntual) | Tensión al mirar, expresión de habilidad, sigue siendo móvil y de una mano | Hay que limitarla para no volverse arcade | ✅ **recomendada** |

**Decisión:** *automática con decisiones estratégicas + una intervención puntual (nitro manual)*. El nitro
manual es opcional (los planes automáticos funcionan bien), así no castiga a quien solo quiere estrategia.
En competitivo, la entrada queda firmada con el *tick* exacto y el servidor la re-simula.

---

## 5. Colección de vehículos

**Estadísticas:** Velocidad (punta), Aceleración, Control (agarre en curva y frenada), Resistencia (menos
desgaste y errores), Eficiencia (duración del nitro). **Potencial de mejora** = nivel máximo de piezas del auto.
El rendimiento por circuito emerge de la física: un auto de mucha punta brilla en Costanera; uno de control,
en Cumbre Andina.

**Clases (rendimiento, se ganan jugando):**
| Clase | IR de fábrica aprox. | Ejemplo MVP | Obtención |
| --- | --- | --- | --- |
| D | 150 | Brisa GT (hatch) | Inicial |
| C | 200 | Kodiak R (coupé V8) | Plano: final de Costanera |
| B | 230 | Véspera S (roadster) | Plano: final de Cumbre Andina |
| A / S | 270 / 320 | (fase 2) | Temporadas, eventos, liga |

**Ediciones cosméticas (rareza):** Serie → Especial → Limitada → Prototipo → Ícono. Cambian pintura,
vinilos, llantas, sonido, luces y animación de entrada al garaje. **Mismo rendimiento** que el modelo base.

**Cómo consigue autos el jugador gratuito:** finales de circuito (planos), pase gratuito de temporada (un auto
de clase nueva por temporada en el carril gratis), liga (recompensa por división), misiones semanales
(fragmentos de plano con progreso visible, sin azar).

---

## 6. Progresión y temporadas

### Progresión permanente (nunca se reinicia)
- Garaje, autos, piezas, cosméticos, reputación y récords.
- **Reputación** (nivel de cuenta) desbloquea: piezas nuevas (Transmisión en 2, Aero en 3, Suspensión en 4),
  circuitos (Cumbre en 4, Neón en 7) y **topes** de nivel de taller y piezas. Es el “regulador” que impide que
  el Idle se dispare sin jugar.

### Temporadas (propuesta, fase 2)
**Duración recomendada: 6 semanas.** 4 semanas agota el pase demasiado rápido para quien juega poco; 8–10
semanas vuelve rancio el ranking. 6 semanas permite un evento de mitad de temporada.

Cada temporada:
| Elemento | Contenido |
| --- | --- |
| Temática | Ej.: T1 “Costa a Cordillera”, T2 “Noches de Neón”, T3 “Rally del Desierto” |
| Contenido nuevo | 1 circuito, 1–2 autos, 1 regla especial (p. ej. lluvia dinámica) |
| Misiones diarias | 3 (≈5 min en total). Ej.: “Gana usando duros”, “Cobra la caja 2 veces” |
| Misiones semanales | 5–7, más largas. Ej.: “Podio en 3 circuitos distintos” |
| Pase de temporada | 50 niveles, carril gratis y premium (ver §7) |
| Liga | Divisiones Bronce → Leyenda, por clase de auto |
| Eventos especiales | Fin de semana: Copa Monomarca, Contrarreloj, Lluvia extrema |
| Cosméticos exclusivos | Vinilo y título de temporada (no vuelven a la venta) |

**Al terminar:** el rating de liga se comprime (*soft reset*: 60 % del rating vuelve hacia la media), se entregan
recompensas por división y todo lo demás se conserva. Nadie “pierde” su esfuerzo: pierde solo su posición
relativa en una tabla nueva.

### Economía (probado en el MVP)
| Moneda | Fuente | Sumideros | Notas |
| --- | --- | --- | --- |
| Créditos (CR) | Caja del taller, carreras, objetivos | Piezas, edificios, construcción de autos, reparación | Blanda |
| Reputación (XP) | Carreras, objetivos | — (es nivel) | Gating |
| Fichas de temporada (fase 2) | Misiones, pase | Recompensas de temporada | Caducan con la temporada |
| Gemas (fase 2, premium) | Compra, pase, logros | **Solo cosméticos y comodidad en PvE** | Nunca piezas ni autos competitivos |

**Fórmulas (en `src/core/data.js`):**
- Ingreso del taller: `0,1 · L · 1,05^(L−1)` CR/s. Costo: `40 · 1,28^(L−1)`. El tiempo de recuperación de
  cada nivel crece siempre (prueba automática): no hay inflación descontrolada.
- Piezas: `base · multClase · ~1,6^(nivel−1)`. Tope = `min(máx. del auto, 2 + reputación)`.
- Recompensa de carrera: `base_circuito · 1,38^evento · %posición`; **1ª victoria x2**, repetidas x0,45 (evita
  “farmear” el mismo evento).
- Caja: tope = ingreso × (2 h + nivel de Oficina).

**Ritmo medido con el bot** (`npm run balance`, jugador muy activo: 5 visitas/día × 8 min):
| Momento | Hito |
| --- | --- |
| Sesión 1 | Gana 2 eventos (Prueba de manejo, Copa Muelle) |
| Día 1 | Final de Costanera → plano del Kodiak R → lo construye |
| Día 2 | Cumbre Andina completa |
| Día 3–4 | Final de Neón (fin del contenido del MVP) |

Con un bot “casual” (3 visitas/día × 5 min) el resultado es casi igual: final de Neón en ~3 días. **Lectura
honesta:** la caja offline aporta la mayor parte de los créditos, así que jugar más no acelera tanto como
debería. Para un prototipo de prueba está bien (los testers ven todo el contenido en una semana), pero
antes del lanzamiento hay que: (a) subir el peso de las carreras frente a la caja (o bajar el ingreso del
taller en niveles altos), (b) encarecer la construcción de autos de clase alta y (c) tener contenido para
6–8 semanas antes de la primera temporada. Las palancas están todas en `data.js` y se miden con el bot.

---

## 7. Monetización

**Principio:** el dinero compra estilo, expresión y comodidad en la capa Idle/PvE. **Nunca** compra
ventaja en liga ni torneos (que usan autos normalizados o idénticos).

| Fuente | Qué ofrece | Recomendación | Precio de referencia |
| --- | --- | --- | --- |
| Pase premium | Carril premium de 50 niveles: pinturas, vinilos, llantas, humo, efectos de nitro, emotes de podio, decoración del garaje, títulos, marco de perfil | ✅ Pilar | USD 4,99 (≈ CLP 4.990) por temporada |
| Tienda cosmética | Ediciones de autos, packs de vinilos, garajes temáticos | ✅ Pilar | USD 0,99–9,99 |
| Anuncios con recompensa | x2 caja offline, −30 min de construcción, reparación gratis | ✅ Máx. 5/día, siempre opcionales | eCPM LatAm bajo: complemento |
| Paquete de bienvenida | Edición cosmética del auto inicial + gemas + 7 días de Club | ✅ Una vez, primeras 72 h | USD 1,99 |
| Suscripción “Club OVERDRIVE” | +2 h de caja, cola de construcción extra, cosmético mensual, sin anuncios | ⚠️ Solo cuando haya volumen; solo PvE | USD 3,99/mes |
| Ofertas de temporada | Bundles cosméticos temáticos | ✅ Moderadas | Variable |
| Anuncios intersticiales | — | ❌ Nunca: rompen la sesión corta | — |
| Cajas de botín pagadas con autos | — | ❌ Prohibidas por diseño (y por regulación en algunos países) | — |

**Comodidad ≠ ventaja competitiva:** acelerar una construcción o tener más caja te ayuda en la campaña PvE.
En liga tu auto se recorta al tope de su clase; en torneos con premio todos usan el mismo auto. Por eso la
comodidad pagada no altera ningún ranking.

**Métricas objetivo antes de escalar:** D1 ≥ 35 %, D7 ≥ 12 %, D30 ≥ 4 %, ≥ 3 sesiones/día, conversión a pagador
2–4 %, ARPDAU USD 0,05–0,12 (Idle LatAm con anuncios con recompensa).

---

## 8. Competencias gratuitas y premios reales (fase futura)

### 8.1 Competencias gratuitas (fase 2, sin dinero)
| Formato | Frecuencia | Auto | Recompensa |
| --- | --- | --- | --- |
| **Liga por clase** (asíncrona contra fantasmas) | Continua por temporada | Propio, recortado al IR tope de la clase | Divisiones, cosméticos, planos |
| **Copa Monomarca** | Semanal (fin de semana) | Idéntico para todos, misma configuración base | Títulos, fichas |
| **Contrarreloj** | Semanal | Idéntico | Ranking regional |
| **Campeonato mensual** | Mensual | Idéntico; clasificación por puntos de las copas | Cosmético exclusivo |
| **Equipos (Escuderías)** | Por temporada (fase 3) | Normalizado | Recompensas de equipo |

“Fantasma” = la configuración y entradas registradas de otro jugador; la carrera se re-simula con la misma
semilla. No requiere tiempo real ni servidores de juego costosos.

### 8.2 Premios en dinero real: cómo podría funcionar
**Modelo propuesto:** *concurso promocional gratuito basado en habilidad*.
- **Entrada siempre gratuita.** Sin compras requeridas ni “mejores probabilidades” por pagar. Nada comprado
  dentro del juego afecta el formato (autos idénticos).
- **Financiamiento:** patrocinadores (marcas de neumáticos, lubricantes, retail, bancos, telcos) + un % fijo de
  los ingresos netos del mes anterior. El monto se fija y publica **antes** de abrir el torneo.
- **Formato:** clasificatoria asíncrona (2–3 intentos máximo, mejor tiempo) → final en vivo para los mejores
  (carrera simultánea, nitro manual en tiempo real, transmisión opcional).
- **Desempate:** (1) mejor tiempo al milésimo, (2) menor cantidad de intentos usados, (3) envío más temprano.
- **Bases legales** completas dentro del app: organizador, fechas, países, edad, mecánica, premios, impuestos,
  forma de pago, datos personales, causales de descalificación; con la mención de que Apple/Google no son
  patrocinadores.

### 8.3 Riesgos y controles
| Riesgo | Control |
| --- | --- |
| Trampas / clientes modificados | El servidor emite la semilla y re-simula cada carrera con las entradas firmadas; si no coincide, se descarta. |
| Bots / solucionadores | Condiciones y rivales se revelan al iniciar el intento; intentos limitados; final en vivo; análisis de precisión inhumana en el *timing* del nitro. |
| Cuentas múltiples | Atestación de dispositivo (Play Integrity, App Attest), verificación por teléfono para clasificar, KYC obligatorio para cobrar (documento + selfie mediante proveedor), 1 premio por persona/RUT. |
| Manipulación de resultados / colusión | Formatos sin interacción entre jugadores en clasificatoria; auditoría de finales; registros inmutables. |
| Fraude en el pago | Pago solo a cuenta a nombre del ganador verificado; retención hasta revisar; límites por país. |
| Menores | Torneos con premio solo 18+ con verificación; menores pueden jugar copas sin premio monetario. |
| Datos personales | Minimización, consentimiento explícito, cifrado, retención limitada, contrato con el proveedor KYC. |

### 8.4 Marco legal y de tiendas (orientativo, **no es asesoría legal**)
- **Chile.** Un concurso gratuito de habilidad, sin apuesta, no es un “juego de azar” regulado por la Ley
  19.995 de casinos. Aun así aplica la Ley 19.496 del Consumidor (las promociones deben informar bases,
  plazos y condiciones; SERNAC fiscaliza). Es práctica habitual protocolizar las bases ante notario. Los
  premios tributan; definir con un contador si corresponde retención. Datos personales: Ley 19.628 y su
  reforma (Ley 21.719, con entrada en vigencia prevista para diciembre de 2026 y una nueva Agencia de
  Protección de Datos): diseñar desde ya con consentimiento y derechos ARCO+.
- **Apple App Store** (Directrices 5.3): los concursos deben ser patrocinados por el desarrollador, con reglas
  oficiales dentro del app que aclaren que Apple no es patrocinador; no se puede usar compra dentro de la app
  para comprar crédito usado en juegos con dinero real.
- **Google Play:** los torneos de pago con premios en efectivo se tratan como “real-money games” y requieren
  aprobación y licencias por país. Los concursos gratuitos con premio tienen menor riesgo, pero hay que revisar
  la política vigente al momento de lanzar.
- **Otros mercados:** Brasil exige autorización previa para promociones comerciales con premios (Ley
  5.768/1971; hay excepciones para concursos culturales sin compra); México regula sorteos y algunos
  concursos vía SEGOB; Argentina tiene regulación provincial; en EE. UU. las reglas varían por estado (algunos
  exigen registro y garantía para promociones grandes). **Lanzamiento por país, nunca global.**
- **Recomendación de secuencia:** (1) torneos sin dinero con premios cosméticos; (2) piloto en Chile con premio
  de patrocinador, bases revisadas por abogado, 18+, KYC; (3) expansión país por país con revisión legal local.

---

## 9. Competencia justa: separación por capas

| Capa | Qué cuenta | ¿Pagar ayuda? | Emparejamiento |
| --- | --- | --- | --- |
| 1. Idle / campaña PvE | Progreso, colección, IR | Sí, solo comodidad (tiempo) | — |
| 2. Carreras casuales | Estrategia + IR | No (sin ranking) | Libre |
| 3. Liga por clase | Estrategia + auto **recortado al tope de clase** | No | Rating Glicko-2 por clase |
| 4. Copa Monomarca / Contrarreloj | Solo estrategia y nitro | No (auto idéntico) | Por rating; división “Novato” < 30 días |
| 5. Torneos con premio (futuro) | Solo estrategia y nitro | No (auto idéntico, entrada gratis) | Clasificatoria abierta + final |

**Reducir la ventaja del veterano frente al nuevo:**
- **Normalización por clase:** en liga, las estadísticas de cualquier auto se escalan para no superar el IR tope
  de su clase. Un auto D al máximo y uno recién mejorado compiten muy parejo.
- **Configuraciones competitivas:** en Monomarca todos parten del mismo auto y piezas; solo eligen estrategia.
- **Límites de mejoras:** topes por clase en liga; sin piezas compradas.
- **Clasificación por habilidad:** rating por clase y por formato; *soft reset* por temporada.
- **Información oculta y variable:** en torneos, clima/temperatura pueden variar dentro de un rango anunciado;
  premia leer la pista, no memorizar.
- **Lo que sí da la experiencia:** conocimiento (eso es legítimo y deseable).

---

## 10. Identidad

**Concepto:** “cultura de taller premium”. Asfalto de noche, luces de garaje, fibra de carbono, telemetría.
Nada de espacio, planetas ni neón cyberpunk recargado: el neón aparece solo en el circuito urbano.

**Logotipo (implementado en `src/ui/art.js`):** “OVER” en blanco + “DRIVE” en degradado brasa, tipografía
condensada itálica (inclinación = velocidad), subrayado que se “corta” en tres tramos como un
cuentarrevoluciones que entra en zona roja. Ícono de app: arco de tacómetro con aguja en zona alta.

**Paleta**
| Rol | Color | Uso |
| --- | --- | --- |
| Carbono | `#07090C` | Fondo |
| Asfalto | `#11161D` / `#171D26` | Paneles |
| Brasa (marca) | `#FF5A1F` | Acción principal, jugador, marca |
| Cian telemetría | `#22D3EE` | Datos, IR, nitro |
| Oro podio | `#F5B83D` | Premios, caja, victorias |
| Verde pista | `#3DDC97` | Estado OK, mejoras |
| Rojo pianos | `#FF4D4D` | Alertas, desgaste |

**Tipografía:** Barlow Condensed (títulos, números grandes, itálica) + Inter (texto e interfaz).

**Principios de interfaz**
- Una mano, pulgar abajo: acciones principales en la mitad inferior; barra de pestañas fija.
- Números grandes y en itálica para lo que importa (IR, posición, caja).
- Cada toque responde: animación, vibración (Android), contador animado.
- Nada de formularios ni listas planas: tarjetas con jerarquía y color por significado.

**Pantallas**
| Pantalla | Estado | Contenido |
| --- | --- | --- |
| Inicio | ✅ MVP | Logo, auto, “Arrancar motor”, resumen offline |
| Garaje (principal) | ✅ MVP | Auto en bahía iluminada, IR, estado, caja, objetivo, botón “Correr” |
| Taller | ✅ MVP | Estadísticas, piezas con niveles, edificios, colección de autos |
| Personalización | ✅ básica (pintura) | Fase 2: vinilos por capas, llantas, altura, luces, humo, matrícula, vista 360° |
| Carreras | ✅ MVP | Circuitos con trazado, eventos, dificultad, premio |
| Pre-carrera | ✅ MVP | Lectura de pista, parrilla con scouting, estrategia |
| Carrera | ✅ MVP | Circuito en vivo, posiciones, HUD, nitro manual, x2, saltar |
| Resultados | ✅ MVP | Podio, recompensas, desbloqueos, ingeniero, clasificación |
| Eventos | 🔜 fase 2 | Calendario semanal: Monomarca, Contrarreloj, especiales, con cuenta regresiva |
| Clasificación | 🔜 fase 2 | Divisiones, tu posición ± vecinos, filtro país/amigos, repetición de fantasmas |
| Pase de temporada | 🔜 fase 2 | Riel horizontal de 50 niveles, carril gratis y premium, vista previa 3D del cosmético |

---

## 11. Arquitectura técnica recomendada

### Evaluación de tecnologías (1 = malo, 5 = excelente)
| Criterio | Unity | Godot | Flutter + Flame | React Native | PWA pura | **TS web + Capacitor** |
| --- | --- | --- | --- | --- | --- | --- |
| Facilidad de desarrollo | 3 | 4 | 3 | 3 | 5 | 5 |
| Rendimiento móvil | 5 | 4 | 4 | 3 | 3 | 4 |
| Gráficos 2D | 5 | 4 | 4 | 2 | 4 | 4 |
| Gráficos 3D | 5 | 3 | 1 | 1 | 3 | 3 |
| Carreras (este diseño) | 5 | 4 | 4 | 3 | 4 | 4 |
| Sistemas Idle / UI | 3 | 3 | 5 | 4 | 5 | 5 |
| Multijugador futuro | 4 | 3 | 3 | 3 | 4 | **5** (misma simulación en servidor Node) |
| Monetización (IAP, anuncios) | 5 | 3 | 4 | 4 | 1 | 4 (RevenueCat, AdMob) |
| Publicación Android | 5 | 4 | 5 | 5 | 2 | 5 |
| Publicación iOS | 5 | 4 | 5 | 5 | 2 | 4 (requiere Mac o build en la nube) |
| Costos | 3 | 5 | 5 | 5 | 5 | 5 |
| Trabajar con Claude | 2 (editor visual, escenas binarias) | 3 | 4 | 4 | 5 | **5** |

### Recomendación
**TypeScript de punta a punta:** núcleo de juego determinista compartido (cliente y servidor), cliente web
renderizado en Canvas/WebGL (PixiJS cuando haga falta más arte), empaquetado para tiendas con **Capacitor**,
y backend en Node.

**Por qué no Unity:** es la mejor opción para 3D y carreras con física, pero OVERDRIVE es un juego 2D de interfaz
y simulación. Unity obligaría a duplicar la simulación en el servidor (o usar C# en el servidor), requiere el editor
en un computador para casi todo, y es la opción donde Claude puede ayudar menos de forma directa. Si en el
futuro se quieren repeticiones 3D cinematográficas, se puede añadir Three.js/Babylon.js **solo para la vista**
sin tocar la simulación (la vista ya está separada del núcleo).

**Por qué no quedarse en PWA:** sirve para validar (por eso el prototipo es web), pero en iOS el almacenamiento
del sitio puede borrarse si no se instala, las notificaciones solo funcionan instalado en la pantalla de inicio,
no hay compras de App Store ni SDK de anuncios nativos, y no hay presencia en tiendas. Capacitor resuelve esto
reutilizando el 100 % del código.

### Arquitectura
```
overdrive/
  src/core/        ← REGLAS (puro, sin DOM): datos de balance, estadísticas, simulación, economía.
                     Se ejecutará igual en el servidor para validar.
  src/ui/          ← PRESENTACIÓN: pantallas, arte, canvas de carrera. Solo lee el estado y llama acciones.
  src/storage.js   ← ADAPTADOR de plataforma (hoy localStorage; mañana nube/Capacitor Preferences).
  tests/           ← Pruebas del núcleo (node --test).
  tools/           ← Bot de progresión, sonda de estrategia, servidor local.
```

**Evolución por fases**
| Fase | Cliente | Servidor | Datos |
| --- | --- | --- | --- |
| MVP (hoy) | JS módulos ES sin compilación | — | localStorage |
| Alpha | TypeScript + Vite + Capacitor | Autenticación + guardado en nube (Supabase o Node/Fastify + Postgres) | Postgres |
| Competitivo | + fantasmas, ranking | Validación de carreras (misma simulación), ligas, emisión de semillas; evaluar Nakama (servidor de juegos open-source con runtime TypeScript, rankings y torneos incluidos) | Postgres + Redis |
| Monetización | RevenueCat (IAP), AdMob (recompensa) | Recibos validados en servidor, configuración remota del balance | — |
| Premios | KYC vía proveedor, pagos | Servicio de torneos auditado | Registros inmutables |

**Decisiones de diseño técnico ya aplicadas**
- Simulación de paso fijo (20 ticks/s) y RNG con semilla → reproducible (probado).
- Entradas del jugador registradas por *tick* → validables en servidor (probado).
- Acciones del juego como funciones puras sobre un estado serializable → el servidor puede ejecutar las mismas.
- Guardado versionado con migración.
- Balance en un único archivo de datos (`data.js`) → preparado para configuración remota.

---

## 12. Plan de desarrollo por etapas

| Etapa | Duración estimada* | Entregable | Criterio para avanzar |
| --- | --- | --- | --- |
| **0. Prototipo** | ✅ hecho | MVP web jugable (este repositorio) | Se puede jugar una sesión completa |
| **1. Validación del núcleo** | 2–4 semanas | Sonido, animaciones, tutorial, eventos de analítica, migración a TypeScript; pruebas con 20–50 jugadores | Más de 50 % juega 3+ días; jugadores cambian de estrategia; usan nitro manual |
| **2. Alpha móvil** | 6–8 semanas | Capacitor (Android pruebas internas, iOS TestFlight), cuenta + guardado en nube, notificaciones (“caja llena”), 6 autos, 5 circuitos, personalización con vinilos | D1 ≥ 35 %, D7 ≥ 12 % en alpha cerrada |
| **3. Competitivo** | 6–8 semanas | Backend, validación de carreras, liga por fantasmas, Copa Monomarca, rankings | Sin trampas detectadas en beta; participación semanal > 30 % de activos |
| **4. Temporadas y monetización** | 4–6 semanas | Pase, tienda cosmética, anuncios con recompensa, paquete de bienvenida; *soft launch* en 2–3 países LatAm | Métricas de §7 |
| **5. Lanzamiento** | — | Lanzamiento LatAm + inglés | — |
| **6. Torneos con premio** | Tras revisión legal | Piloto en Chile con patrocinador | Aprobación legal y de tiendas |

\*Estimaciones para 1–2 personas trabajando con Claude; el arte profesional va en paralelo.

---

## 13. Alcance exacto del MVP (lo que contiene este prototipo)

| # | Requisito | Implementación |
| --- | --- | --- |
| 1 | Pantalla de inicio | Logo animado, auto, “Arrancar motor”, versión |
| 2 | Garaje | Bahía iluminada, auto con pintura, IR, clase, estado mecánico y reparación |
| 3 | Vehículo inicial | Brisa GT (clase D) + 2 autos desbloqueables por planos (Kodiak R, Véspera S) |
| 4 | Sistema Idle básico | Taller de servicio (CR/s) + Oficina (horas de caja); progreso offline con tope |
| 5 | Recolección de ingresos | Caja con barra, tiempo de llenado, “Cobrar”, resumen al volver |
| 6 | Mejoras del vehículo | 5 piezas con niveles, desbloqueo por reputación, topes por auto y reputación |
| 7 | Carreras automáticas | 3 circuitos × 5 eventos; simulación determinista con 4 decisiones + nitro manual |
| 8 | Resultados | Podio, tiempos, clasificación, telemetría y consejos del Ingeniero |
| 9 | Recompensas | Créditos, XP, 1ª victoria x2, planos de autos, eventos desbloqueados, objetivos guiados (12) |
| 10 | Progresión básica | Reputación con desbloqueos, eventos encadenados por podio, circuitos por reputación |
| 11 | Interfaz atractiva | Sistema visual propio, pensado para móvil, animaciones, vibración |
| 12 | Guardado | Automático (cada 5 s y al salir), versionado, respaldo exportable |

**Fuera del MVP a propósito:** multijugador, servidor, cuentas, pagos, anuncios, temporadas, pase, sonido.

**Qué medir en las primeras pruebas con jugadores**
1. ¿Cuántas carreras juega antes de cerrar? ¿Vuelve al día siguiente?
2. ¿Cambia la configuración entre intentos? (si nadie la cambia, la estrategia no se entiende)
3. ¿Usa el nitro manual? ¿Gana más con él?
4. ¿Lee al Ingeniero? ¿Sigue sus consejos?
5. ¿En qué evento se estanca y abandona?
