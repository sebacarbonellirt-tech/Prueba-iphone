// Datos de diseño del juego (balance). Todo lo ajustable vive aquí para que
// un game designer pueda equilibrar sin tocar la lógica.
// Marcas, autos, pilotos y circuitos son ficticios (propiedad intelectual propia).

export const SAVE_VERSION = 1;

/** Estadísticas en puntos (0-150 aprox.). */
export const STAT_KEYS = ["vel", "acc", "ctl", "res", "efi"];
export const STAT_LABELS = {
  vel: "Velocidad",
  acc: "Aceleración",
  ctl: "Control",
  res: "Resistencia",
  efi: "Eficiencia",
};

// Clase = rendimiento (se consigue jugando). La rareza es otra cosa:
// en OVERDRIVE la rareza solo existe en ediciones cosméticas.
export const CLASSES = {
  D: { label: "Clase D", color: "#9aa4b2", costMult: 1 },
  C: { label: "Clase C", color: "#3ddc97", costMult: 2.4 },
  B: { label: "Clase B", color: "#3fa7ff", costMult: 3.6 },
};

export const CARS = {
  brisa: {
    id: "brisa",
    name: "Brisa GT",
    maker: "Halcón Motors",
    cls: "D",
    shape: "hatch",
    blurb: "Hatch deportivo de entrada. Liviano, noble y fácil de mejorar.",
    base: { vel: 38, acc: 42, ctl: 44, res: 46, efi: 50 },
    maxLevel: 10,
    defaultPaint: "#ff5a1f",
  },
  kodiak: {
    id: "kodiak",
    name: "Kodiak R",
    maker: "Ferro Automobili",
    cls: "C",
    shape: "coupe",
    blurb: "Coupé V8 de tracción trasera. Brutal en rectas, exigente en curvas.",
    base: { vel: 68, acc: 58, ctl: 48, res: 56, efi: 40 },
    maxLevel: 12,
    defaultPaint: "#2b6bff",
    unlock: { type: "event", event: "brisa-5" },
    build: { cost: 25000, minutes: 30 },
  },
  vespera: {
    id: "vespera",
    name: "Véspera S",
    maker: "Studio Alba",
    cls: "B",
    shape: "roadster",
    blurb: "Roadster de motor central. Pegado al asfalto en las curvas.",
    base: { vel: 60, acc: 64, ctl: 74, res: 44, efi: 52 },
    maxLevel: 14,
    defaultPaint: "#e8e8ea",
    unlock: { type: "event", event: "cumbre-5" },
    build: { cost: 140000, minutes: 120 },
  },
};

export const PAINTS = [
  { id: "ember", name: "Brasa", color: "#ff5a1f" },
  { id: "cobalt", name: "Cobalto", color: "#2b6bff" },
  { id: "glacier", name: "Glaciar", color: "#e8e8ea" },
  { id: "carbon", name: "Carbono", color: "#2a2f37" },
  { id: "lime", name: "Lima Ácida", color: "#a6e22e" },
  { id: "gold", name: "Oro Pacífico", color: "#f5b83d" },
  { id: "crimson", name: "Carmesí", color: "#d7263d" },
  { id: "teal", name: "Turquesa", color: "#1fc8b9" },
];

// Mejoras del vehículo: puntos que suma cada nivel.
export const PARTS = {
  motor: {
    id: "motor",
    name: "Motor",
    icon: "M",
    desc: "Más potencia: velocidad punta y aceleración.",
    per: { vel: 1.6, acc: 1.0 },
    baseCost: 80,
    growth: 1.6,
    unlockRep: 1,
  },
  neumaticos: {
    id: "neumaticos",
    name: "Neumáticos",
    icon: "N",
    desc: "Más agarre en curva y frenada.",
    per: { ctl: 1.8, res: 0.4 },
    baseCost: 70,
    growth: 1.6,
    unlockRep: 1,
  },
  transmision: {
    id: "transmision",
    name: "Transmisión",
    icon: "T",
    desc: "Cambios más rápidos: aceleración al salir de curva.",
    per: { acc: 2.0, efi: 0.4 },
    baseCost: 110,
    growth: 1.61,
    unlockRep: 2,
  },
  aero: {
    id: "aero",
    name: "Aerodinámica",
    icon: "A",
    desc: "Carga aerodinámica: control y algo de punta.",
    per: { ctl: 0.9, vel: 0.7, efi: 0.6 },
    baseCost: 160,
    growth: 1.62,
    unlockRep: 3,
  },
  suspension: {
    id: "suspension",
    name: "Suspensión",
    icon: "S",
    desc: "Estabilidad: control, menos desgaste y menos errores.",
    per: { ctl: 1.0, res: 2.0 },
    baseCost: 200,
    growth: 1.62,
    unlockRep: 4,
  },
};
export const PART_ORDER = ["motor", "neumaticos", "transmision", "aero", "suspension"];

// Edificios del garaje (motor Idle).
export const BUILDINGS = {
  taller: {
    id: "taller",
    name: "Taller de servicio",
    desc: "Clientes que pagan por servicios. Genera créditos por segundo.",
    baseCost: 40,
    growth: 1.28,
  },
  oficina: {
    id: "oficina",
    name: "Oficina del jefe",
    desc: "Amplía la caja: cuántas horas acumula el taller sin ti.",
    baseCost: 400,
    growth: 2.3,
    maxLevel: 7,
  },
};

export const ECONOMY = {
  // Ingreso del taller por segundo en nivel L: k * L * g^(L-1)
  incomeK: 0.1,
  incomeG: 1.05,
  // Horas de caja (offline) = base + nivel de oficina
  capBaseHours: 2,
  // Nivel máximo del taller según reputación
  tallerLevelsPerRep: 2,
  tallerBaseMax: 4,
  // Nivel máximo de piezas según reputación (además del tope del auto)
  partBaseMax: 2,
  partLevelsPerRep: 1,
  // Reputación: XP para pasar del nivel n al n+1
  xpBase: 80,
  xpGrowth: 1.5,
  maxRep: 20,
  // Recompensa de carrera repetida (ya ganada) respecto a la primera
  repeatMult: 0.45,
  // Desgaste persistente del auto
  conditionRegenPerMin: 0.6, // puntos de estado recuperados por minuto (gratis)
  repairCostPerPoint: 3, // créditos por punto * multiplicador de clase
  startingCredits: 150,
};

// Reglas de la simulación de carreras.
export const RACE = {
  dt: 0.05, // segundos por tick (20 ticks/s)
  maxTime: 600,
  gravity: 9.81,
  tires: {
    blando: { name: "Blando", short: "B", grip: 1.07, wear: 2.1, color: "#ff4d4d", desc: "Máximo agarre, se degrada rápido." },
    medio: { name: "Medio", short: "M", grip: 1.0, wear: 1.0, color: "#ffd23f", desc: "Equilibrado." },
    duro: { name: "Duro", short: "D", grip: 0.95, wear: 0.45, color: "#f2f2f2", desc: "Menos agarre, aguanta toda la carrera." },
  },
  maps: {
    eco: { name: "Eco", power: 0.97, wear: 0.7, nitro: 1.2, desc: "Cuida neumáticos y carga más nitro." },
    balance: { name: "Balance", power: 1.0, wear: 1.0, nitro: 1.0, desc: "Configuración neutra." },
    ataque: { name: "Ataque", power: 1.04, wear: 1.4, nitro: 0.8, desc: "Más potencia, más desgaste." },
  },
  risks: {
    conservador: { name: "Conservador", corner: 0.978, mistake: 0.3, desc: "Casi sin errores, pierde algo en curva." },
    normal: { name: "Normal", corner: 1.0, mistake: 1.0, desc: "Equilibrio entre ritmo y errores." },
    agresivo: { name: "Agresivo", corner: 1.025, mistake: 3.2, desc: "Más rápido en curva, más errores." },
  },
  nitroPlans: {
    salida: { name: "Salida", desc: "Todo el nitro al largar. Fuerte en carreras cortas." },
    rectas: { name: "Rectas", desc: "Reparte el nitro en la recta más larga de cada vuelta." },
    final: { name: "Final", desc: "Guarda el nitro para el último 20 %." },
    manual: { name: "Manual", desc: "Tú lo activas tocando el botón. Si no lo usas, sale solo al final." },
  },
  nitro: { speed: 1.09, accel: 1.45, baseSeconds: 3, perEfi: 0.04 },
  baseMistake: 0.05,
  mistakeSpeedKeep: 0.4,
  mistakeRecover: 1.2,
};

// Circuitos: tramos rectos (S) y curvas (C, radio en metros, ángulo en grados;
// positivo = izquierda). La suma de ángulos debe ser 360.
export const CIRCUITS = {
  brisa: {
    id: "brisa",
    name: "Costanera Puerto Brisa",
    region: "Costa",
    style: "Rápido · rectas largas",
    color: "#22d3ee",
    layout: [
      ["S", 650], ["C", 90, 90], ["S", 240], ["C", 40, 90], ["S", 280], ["C", 28, -50],
      ["S", 90], ["C", 32, 50], ["S", 200], ["C", 60, 90], ["S", 140], ["C", 45, 90],
    ],
    baseReward: 150,
    baseXp: 30,
    events: [
      { name: "Prueba de manejo", laps: 2, weather: "seco", temp: 22, ir: 150, rivals: 3 },
      { name: "Copa Muelle", laps: 3, weather: "seco", temp: 24, ir: 168, rivals: 4 },
      { name: "Noche de Malecón", laps: 3, weather: "seco", temp: 16, ir: 186, rivals: 4 },
      { name: "Verano Infernal", laps: 4, weather: "seco", temp: 36, ir: 204, rivals: 4 },
      { name: "Gran Final Costanera", laps: 4, weather: "seco", temp: 26, ir: 222, rivals: 5, final: true },
    ],
  },
  cumbre: {
    id: "cumbre",
    name: "Paso Cumbre Andina",
    region: "Montaña",
    style: "Técnico · curvas cerradas",
    color: "#a78bfa",
    unlockRep: 4,
    layout: [
      ["S", 220], ["C", 30, 120], ["S", 90], ["C", 22, -90], ["S", 70], ["C", 25, 150],
      ["S", 160], ["C", 18, -60], ["S", 60], ["C", 40, 100], ["S", 260], ["C", 28, 80],
      ["S", 80], ["C", 35, 60],
    ],
    baseReward: 420,
    baseXp: 60,
    events: [
      { name: "Subida de reconocimiento", laps: 3, weather: "seco", temp: 12, ir: 235, rivals: 4 },
      { name: "Horquillas del Cóndor", laps: 3, weather: "seco", temp: 9, ir: 248, rivals: 4 },
      { name: "Niebla en el Paso", laps: 4, weather: "lluvia", temp: 7, ir: 260, rivals: 4 },
      { name: "Rey de la Montaña", laps: 4, weather: "seco", temp: 14, ir: 272, rivals: 5 },
      { name: "Gran Final Cumbre", laps: 5, weather: "seco", temp: 11, ir: 285, rivals: 5, final: true },
    ],
  },
  neon: {
    id: "neon",
    name: "Distrito Neón",
    region: "Ciudad",
    style: "Urbano · mixto y nocturno",
    color: "#f472b6",
    unlockRep: 7,
    layout: [
      ["S", 480], ["C", 25, 90], ["S", 150], ["C", 20, 90], ["S", 120], ["C", 30, -90],
      ["S", 200], ["C", 22, 90], ["S", 350], ["C", 35, 90], ["S", 90], ["C", 20, 90],
    ],
    baseReward: 1300,
    baseXp: 110,
    events: [
      { name: "Luces de la Avenida", laps: 3, weather: "seco", temp: 20, ir: 292, rivals: 4 },
      { name: "Asfalto Mojado", laps: 4, weather: "lluvia", temp: 15, ir: 302, rivals: 5 },
      { name: "Circuito del Puerto Seco", laps: 4, weather: "seco", temp: 30, ir: 312, rivals: 5 },
      { name: "Tormenta Eléctrica", laps: 5, weather: "lluvia", temp: 17, ir: 322, rivals: 5 },
      { name: "Gran Final Neón", laps: 5, weather: "seco", temp: 24, ir: 332, rivals: 5, final: true },
    ],
  },
};
export const CIRCUIT_ORDER = ["brisa", "cumbre", "neon"];

// Pilotos rivales ficticios. "bias" define su estilo de auto.
export const RIVALS = [
  { name: "Vale Ríos", bias: { vel: 1.1, ctl: 0.95 }, color: "#facc15" },
  { name: "Kenji Mora", bias: { ctl: 1.12, vel: 0.92 }, color: "#a3e635" },
  { name: "Lucía Ferraz", bias: { acc: 1.12, res: 0.9 }, color: "#38bdf8" },
  { name: "Tomás Eder", bias: { res: 1.2, vel: 0.97 }, color: "#c084fc" },
  { name: "Amaru Quispe", bias: { ctl: 1.08, acc: 1.04, vel: 0.92 }, color: "#fb7185" },
  { name: "Dani Okafor", bias: { vel: 1.14, ctl: 0.9 }, color: "#34d399" },
  { name: "Sofía Brandt", bias: { efi: 1.25, acc: 0.97 }, color: "#f97316" },
  { name: "Mateo Lagos", bias: {}, color: "#e5e7eb" },
];

// Objetivos guiados: enseñan el ciclo y dan recompensas.
export const GOALS = [
  { id: "g1", text: "Cobra la caja del taller", check: "collect", target: 1, reward: { cr: 60 } },
  { id: "g2", text: "Mejora el motor a nivel 2", check: "part:motor", target: 2, reward: { cr: 80 } },
  { id: "g3", text: "Corre tu primera carrera", check: "races", target: 1, reward: { cr: 100 } },
  { id: "g4", text: "Sube el Taller de servicio a nivel 3", check: "building:taller", target: 3, reward: { cr: 150 } },
  { id: "g5", text: "Gana «Copa Muelle»", check: "win:brisa-2", target: 1, reward: { cr: 250, xp: 30 } },
  { id: "g6", text: "Alcanza reputación 3", check: "rep", target: 3, reward: { cr: 400 } },
  { id: "g7", text: "Gana una carrera usando nitro manual", check: "manualWin", target: 1, reward: { cr: 500, xp: 40 } },
  { id: "g8", text: "Gana la «Gran Final Costanera»", check: "win:brisa-5", target: 1, reward: { cr: 1200, xp: 80 } },
  { id: "g9", text: "Construye el Kodiak R", check: "owns:kodiak", target: 1, reward: { cr: 1500 } },
  { id: "g10", text: "Gana en Paso Cumbre Andina", check: "circuitWin:cumbre", target: 1, reward: { cr: 2500, xp: 120 } },
  { id: "g11", text: "Construye el Véspera S", check: "owns:vespera", target: 1, reward: { cr: 5000 } },
  { id: "g12", text: "Gana la «Gran Final Neón»", check: "win:neon-5", target: 1, reward: { cr: 20000, xp: 400 } },
];
