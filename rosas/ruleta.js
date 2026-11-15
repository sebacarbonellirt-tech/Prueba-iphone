/* ==========================================================
   Ruleta romántica de citas — "Nuestra próxima aventura"
   Componente autónomo: crea su propio DOM y expone window.Ruleta
   ========================================================== */
(() => {
  'use strict';

  // ---------- Datos ----------
  const ACTIVITIES = [
    { e: '❤️', n: 'Cena romántica', l: ['CENA', 'ROMÁNTICA'], d: 'Una cena especial a la luz de las velas.' },
    { e: '🌅', n: 'Picnic al atardecer', l: ['PICNIC AL', 'ATARDECER'], d: 'Organizar un picnic juntos mientras vemos el atardecer.' },
    { e: '🍿', n: 'Noche de películas', l: ['NOCHE DE', 'PELÍCULAS'], d: 'Elegir una película, preparar comida y disfrutar juntos.' },
    { e: '🎁', n: 'Cita sorpresa', l: ['CITA', 'SORPRESA'], d: 'Una cita organizada completamente por mí.' },
    { e: '🍓', n: 'Cocinar juntos', l: ['COCINAR', 'JUNTOS'], d: 'Preparar una receta nueva entre los dos.' },
    { e: '✈️', n: 'Escapada de un día', l: ['ESCAPADA', 'DE UN DÍA'], d: 'Ir a conocer algún lugar nuevo.' },
    { e: '🌙', n: 'Mirar las estrellas', l: ['MIRAR LAS', 'ESTRELLAS'], d: 'Buscar un lugar tranquilo y disfrutar de la noche.' },
    { e: '💗', n: 'Recrear nuestra primera cita', l: ['RECREAR', 'PRIMERA CITA'], d: 'Volver a vivir nuestra primera cita de una manera especial.' },
    { e: '🎮', n: 'Noche de videojuegos', l: ['NOCHE DE', 'VIDEOJUEGOS'], d: 'Jugar juntos y divertirnos.' },
    { e: '🥰', n: 'Masajes y abrazos', l: ['MASAJES Y', 'ABRAZOS'], d: 'Una noche de relajación, cariño y abrazos.' },
    { e: '🍽️', n: 'Restaurante al azar', l: ['RESTAURANTE', 'AL AZAR'], d: 'Elegir un restaurante sin saber previamente cuál será.' },
    { e: '🎳', n: 'Día de bowling', l: ['DÍA DE', 'BOWLING'], d: 'Una tarde de bolos, risas y muchas chuzas juntos.' },
  ];
  const N = ACTIVITIES.length;           // 12
  const SEG = 360 / N;                    // 30° por casilla
  const COLORS = ['#7b1e3a', '#f7d3da', '#c9677f', '#fff3ea', '#93294a', '#f2c2cc',
                  '#d47f93', '#fdebe6', '#6d1832', '#f9dbe1', '#be5a74', '#fbe7e4'];
  const isDark = i => i % 2 === 0;
  const MESSAGES = [
    'A veces los mejores recuerdos nacen de los planes inesperados.',
    'No importa el lugar, lo bonito es compartirlo contigo.',
    'Tengo ganas de seguir creando momentos contigo.',
    'Una nueva aventura nos espera.',
    'Nuestro próximo recuerdo está a un giro de distancia.',
  ];

  // ---------- Utilidades ----------
  // Aleatoriedad real del navegador (crypto) con rechazo para evitar sesgo
  function randInt(n) {
    if (window.crypto && crypto.getRandomValues) {
      const buf = new Uint32Array(1), limit = Math.floor(0x100000000 / n) * n;
      do { crypto.getRandomValues(buf); } while (buf[0] >= limit);
      return buf[0] % n;
    }
    return Math.floor(Math.random() * n);
  }
  const randFloat = () => randInt(1e9) / 1e9;
  const mod = (a, n) => ((a % n) + n) % n;
  // Casilla que queda bajo el puntero superior cuando la ruleta está girada `deg` grados (horario)
  const segmentAt = deg => mod(Math.round(-deg / SEG), N);
  const fmtDate = iso => {
    try {
      return new Date(iso).toLocaleString('es-CL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) { return iso; }
  };
  const $ = (sel, root = document) => root.querySelector(sel);
  const el = (tag, cls, html) => { const x = document.createElement(tag); if (cls) x.className = cls; if (html != null) x.innerHTML = html; return x; };

  // ---------- Estado persistente (localStorage) ----------
  const KEY = 'jardinKarin.ruleta.v1';
  const defaults = () => ({ history: [], cycle: [], last: null, sound: true, angle: 0 });
  let state = defaults();
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw);
        state = Object.assign(defaults(), s);
        state.history = Array.isArray(s.history) ? s.history.filter(h => h && h.a >= 0 && h.a < N) : [];
        state.cycle = Array.isArray(s.cycle) ? s.cycle.filter(i => i >= 0 && i < N) : [];
        if (!(state.last >= 0 && state.last < N)) state.last = null;
        if (!isFinite(state.angle)) state.angle = 0;
      }
    } catch (e) { state = defaults(); }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* modo privado: seguimos en memoria */ }
  }

  // ---------- Selección sin repeticiones inmediatas ----------
  function choose() {
    const all = ACTIVITIES.map((_, i) => i);
    const pendingAccepted = new Set(state.history.filter(h => h.accepted && h.status === 'pendiente').map(h => h.a));
    const used = new Set(state.cycle);
    let pool = all.filter(i => !used.has(i) && !pendingAccepted.has(i) && i !== state.last);
    let cycleReset = false;
    if (!pool.length) {                                 // ciclo agotado: se reinicia
      cycleReset = used.size > 0;
      state.cycle = [];
      pool = all.filter(i => !pendingAccepted.has(i) && i !== state.last);
    }
    if (!pool.length) pool = all.filter(i => i !== state.last);  // todas pendientes: solo evitar la última
    if (!pool.length) pool = all;                                // nunca sin opciones
    return { index: pool[randInt(pool.length)], cycleReset, poolSize: pool.length };
  }

  // ---------- Sonido (Web Audio, sin archivos) ----------
  let actx = null, lastTick = 0;
  function audio() {
    if (!state.sound) return null;
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      return actx;
    } catch (e) { return null; }
  }
  function tone(freq, start, dur, vol, type = 'sine') {
    const a = audio(); if (!a) return;
    const t = a.currentTime + start, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.05);
  }
  const sfx = {
    tick() { const now = performance.now(); if (now - lastTick < 45) return; lastTick = now; tone(1900, 0, 0.05, 0.035, 'triangle'); },
    start() { tone(523, 0, .25, .05); tone(659, .08, .25, .05); },
    win() { [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(f, i * 0.11, 0.9, 0.07)); tone(2093, .6, 1.2, .03); },
    accept() { [659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.09, 0.7, 0.06)); },
    soft() { tone(880, 0, .18, .03); },
  };

  // ---------- Construcción del DOM ----------
  let overlay, disc, stage, pointer, spinBtn, statusEl, msgEl, listEl, counterEl, modal, card, toastEl, soundBtn, launch;
  const svgNS = 'http://www.w3.org/2000/svg';

  function wheelSVG() {
    const R = 180, polar = (r, deg) => {
      const t = deg * Math.PI / 180;
      return [+(r * Math.sin(t)).toFixed(3), +(-r * Math.cos(t)).toFixed(3)];
    };
    let segs = '', labels = '', seps = '', bulbs = '';
    ACTIVITIES.forEach((act, i) => {
      const a0 = i * SEG - SEG / 2, a1 = i * SEG + SEG / 2;
      const [x0, y0] = polar(R, a0), [x1, y1] = polar(R, a1);
      segs += `<path class="rl-seg" data-index="${i}" d="M0,0 L${x0},${y0} A${R},${R} 0 0 1 ${x1},${y1} Z" fill="url(#rlg${i})"/>`;
      const txt = isDark(i) ? '#fff4ec' : '#6d1832';
      const flip = i * SEG > 180;              // lado izquierdo: girar el texto para que no quede al revés
      labels += `<g transform="rotate(${i * SEG})" pointer-events="none">
        <text x="0" y="-157" font-size="21" text-anchor="middle" dominant-baseline="central">${act.e}</text>
        <g transform="translate(0,-92) rotate(${flip ? 90 : -90})">
          <text class="rl-label" fill="${txt}" font-size="9.6" text-anchor="middle">
            <tspan x="0" y="-2.5">${act.l[0]}</tspan><tspan x="0" y="9.5">${act.l[1]}</tspan>
          </text>
        </g>
      </g>`;
      const [sx0, sy0] = polar(36, a0), [sx1, sy1] = polar(R, a0);
      seps += `<line x1="${sx0}" y1="${sy0}" x2="${sx1}" y2="${sy1}"/>`;
    });
    for (let b = 0; b < 24; b++) {
      const [bx, by] = polar(191, b * 15);
      bulbs += `<circle class="rl-bulb${b % 2 ? ' alt' : ''}" cx="${bx}" cy="${by}" r="3.3"/>`;
    }
    let grads = '';
    COLORS.forEach((c, i) => {
      grads += `<radialGradient id="rlg${i}" cx="0" cy="0" r="180" gradientUnits="userSpaceOnUse">
        <stop offset="0.2" stop-color="${c}" stop-opacity="${isDark(i) ? 0.92 : 1}"/><stop offset="1" stop-color="${c}"/></radialGradient>`;
    });
    return `<svg viewBox="-205 -205 410 410" role="img" aria-label="Ruleta con 12 citas">
      <defs>
        <linearGradient id="rlGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#f6dd94"/><stop offset=".5" stop-color="#c99a3e"/><stop offset="1" stop-color="#f3d68a"/>
        </linearGradient>
        ${grads}
      </defs>
      <circle r="200" fill="#4a0d20"/>
      <circle r="200" fill="none" stroke="url(#rlGold)" stroke-width="3"/>
      <g fill="#ffe7a8">${bulbs}</g>
      <circle r="183" fill="none" stroke="url(#rlGold)" stroke-width="6"/>
      <g>${segs}</g>
      <g stroke="url(#rlGold)" stroke-width="1.8" stroke-linecap="round">${seps}</g>
      <circle r="180" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="1"/>
      ${labels}
      <g fill="#f8c9d4" opacity=".55" pointer-events="none">
        ${[45, 135, 225, 315].map(a => { const [x, y] = polar(62, a + 15); return `<path transform="translate(${x} ${y}) scale(.32)" d="M0 8 C-12 -2 -10 -14 0 -8 C10 -14 12 -2 0 8Z"/>`; }).join('')}
      </g>
    </svg>`;
  }

  const POINTER_SVG = `<svg viewBox="0 0 60 80" aria-hidden="true">
    <defs><linearGradient id="rlPg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6dd94"/><stop offset="1" stop-color="#b8862b"/></linearGradient></defs>
    <path d="M30 78 L9 30 A22 22 0 1 1 51 30 Z" fill="url(#rlPg)" stroke="#7a5418" stroke-width="2"/>
    <circle cx="30" cy="24" r="15" fill="#7b1e3a"/>
    <path d="M30 32 C20 25 21 16 30 21 C39 16 40 25 30 32Z" fill="#ff8fab"/>
  </svg>`;
  const HUB_HEART = `<svg viewBox="-12 -12 24 22" aria-hidden="true"><path d="M0 8 C-14 -2 -10 -14 0 -6 C10 -14 14 -2 0 8Z" fill="#b3123e" stroke="#7a0f2c" stroke-width=".8"/>
    <path d="M-6 -6 q-3 1 -3 4" stroke="#fff" stroke-opacity=".6" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>`;

  function build() {
    // Botón de entrada
    launch = el('button', 'rl-launch', '🎡 Nuestra próxima aventura');
    launch.type = 'button';
    launch.addEventListener('click', open);
    stopBubble(launch);
    document.body.appendChild(launch);

    overlay = el('section', 'rl-overlay');
    overlay.setAttribute('aria-label', 'Nuestra próxima aventura');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
      <div class="rl-wrap">
        <div class="rl-top">
          <button type="button" class="rl-icon-btn" data-act="close" aria-label="Volver a la carta">←</button>
          <button type="button" class="rl-icon-btn" data-act="sound" aria-label="Sonido"></button>
        </div>
        <header class="rl-head">
          <div class="rl-kicker">El jardín de Karin</div>
          <h1 class="rl-title">Nuestra próxima aventura</h1>
          <p class="rl-msg" aria-live="polite"></p>
        </header>
        <div class="rl-stage">
          <div class="rl-glow"></div>
          <div class="rl-disc">${wheelSVG()}</div>
          <div class="rl-hub">${HUB_HEART}</div>
          <div class="rl-pointer">${POINTER_SVG}</div>
        </div>
        <div class="rl-actions">
          <button type="button" class="rl-btn" data-act="spin">Girar nuestra ruleta</button>
          <div class="rl-status" role="status" aria-live="polite"></div>
        </div>
        <section class="rl-history" aria-labelledby="rlHistTitle">
          <h2 id="rlHistTitle">Nuestro historial de aventuras ❤️</h2>
          <p class="rl-counter"></p>
          <ul class="rl-list"></ul>
        </section>
      </div>`;
    document.body.appendChild(overlay);
    stopBubble(overlay);

    modal = el('div', 'rl-modal');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = '<div class="rl-card"></div>';
    document.body.appendChild(modal);
    stopBubble(modal);
    card = $('.rl-card', modal);

    toastEl = el('div', 'rl-toast');
    toastEl.setAttribute('role', 'status');
    document.body.appendChild(toastEl);

    disc = $('.rl-disc', overlay);
    stage = $('.rl-stage', overlay);
    pointer = $('.rl-pointer', overlay);
    spinBtn = $('[data-act="spin"]', overlay);
    statusEl = $('.rl-status', overlay);
    msgEl = $('.rl-msg', overlay);
    listEl = $('.rl-list', overlay);
    counterEl = $('.rl-counter', overlay);
    soundBtn = $('[data-act="sound"]', overlay);

    overlay.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'close') close();
      else if (b.dataset.act === 'sound') toggleSound();
      else if (b.dataset.act === 'spin') spin();
    });
    listEl.addEventListener('click', e => {
      const b = e.target.closest('button[data-status]'); if (!b) return;
      setStatus(b.closest('[data-id]').dataset.id, b.dataset.status);
    });
    card.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'accept') accept();
      else if (b.dataset.act === 'again') again();
      else if (b.dataset.act === 'history') { closeModal(); setTimeout(() => $('.rl-history', overlay).scrollIntoView({ behavior: 'smooth', block: 'start' }), 350); }
    });
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      if (modal.classList.contains('open')) { if (current && !current.accepted) again(false); else closeModal(); }
      else if (overlay.classList.contains('open') && !animating) close();
    });

    setRotation(state.angle);
    renderSound();
    renderHistory();
    setMessage(MESSAGES[randInt(MESSAGES.length)], true);
  }

  // Evita que los toques dentro de la ruleta disparen la explosión de rosas del fondo
  function stopBubble(node) {
    ['pointerdown', 'touchstart', 'mousedown'].forEach(t => node.addEventListener(t, e => e.stopPropagation()));
  }

  // ---------- Mensajes / avisos ----------
  let msgIdx = -1;
  function setMessage(text, instant) {
    if (instant) { msgEl.textContent = text; return; }
    msgEl.classList.add('fade');
    setTimeout(() => { msgEl.textContent = text; msgEl.classList.remove('fade'); }, 450);
  }
  function nextMessage() {
    let i; do { i = randInt(MESSAGES.length); } while (i === msgIdx && MESSAGES.length > 1);
    msgIdx = i; setMessage(MESSAGES[i]);
  }
  let toastTimer;
  function toast(text, ms = 3200) {
    toastEl.textContent = text; toastEl.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms);
  }

  // ---------- Sonido ----------
  function renderSound() {
    soundBtn.textContent = state.sound ? '🔊' : '🔇';
    soundBtn.setAttribute('aria-pressed', String(state.sound));
    soundBtn.setAttribute('aria-label', state.sound ? 'Desactivar sonidos' : 'Activar sonidos');
  }
  function toggleSound() {
    state.sound = !state.sound; save(); renderSound();
    if (state.sound) sfx.soft();
    toast(state.sound ? 'Sonidos activados 🔊' : 'Sonidos desactivados 🔇', 1600);
  }

  // ---------- Giro ----------
  let spinning = false, animating = false, current = null, angle = 0;
  function setRotation(deg) { angle = deg; disc.style.transform = `rotate(${deg}deg)`; }

  // Perfil de velocidad: acelera rápido, luego frena progresivamente hasta detenerse.
  const U0 = 0.1, A1 = U0 / 2, A2 = (1 - U0) / 3, AT = A1 + A2;
  function progress(u) {
    if (u <= 0) return 0;
    if (u >= 1) return 1;
    if (u < U0) return (u * u / (2 * U0)) / AT;
    const w = (1 - u) / (1 - U0);
    return (A1 + A2 * (1 - w * w * w)) / AT;
  }

  function spin() {
    if (spinning) return;              // nunca dos giros a la vez
    spinning = true; animating = true;
    audio();                           // desbloquea el audio en iOS con el gesto del usuario
    const pick = choose();
    const k = pick.index;
    if (pick.cycleReset) toast('¡Vivimos todas las aventuras del ciclo! La ruleta vuelve a empezar 🌹', 4200);

    // Ángulo final: la casilla k queda bajo el puntero (con un pequeño desfase dentro de la casilla)
    const offset = (randFloat() - 0.5) * SEG * 0.6;               // ±9°, siempre dentro de la casilla
    const startA = angle;
    const delta = mod(-k * SEG + offset - startA, 360);
    const turns = 6 + randInt(3);                                   // 6 a 8 vueltas completas
    const finalA = startA + turns * 360 + delta;
    const duration = window.__RULETA_TEST_MS || (5200 + randInt(1600)); // 5,2 a 6,8 s

    spinBtn.disabled = true;
    spinBtn.textContent = 'Girando…';
    stage.classList.add('spinning');
    statusEl.innerHTML = '<span class="dot">♥</span> La ruleta está girando… <span class="dot">♥</span>';
    $('.rl-seg.win', overlay)?.classList.remove('win');
    nextMessage();
    sfx.start();

    let lastSeg = segmentAt(startA);
    const t0 = performance.now();
    function frame(now) {
      const u = Math.min(1, (now - t0) / duration);
      const a = startA + (finalA - startA) * progress(u);
      setRotation(a);
      const s = segmentAt(a);
      if (s !== lastSeg) {
        lastSeg = s; sfx.tick();
        pointer.classList.remove('tick'); void pointer.offsetWidth; pointer.classList.add('tick');
      }
      if (u < 1) requestAnimationFrame(frame);
      else finish(k, finalA);
    }
    requestAnimationFrame(frame);
  }

  function finish(k, finalA) {
    animating = false;
    setRotation(finalA);
    const shown = segmentAt(finalA);
    if (shown !== k) console.error('Ruleta: desajuste puntero/resultado', { k, shown });
    const result = shown;                       // lo que se ve es lo que vale
    state.angle = mod(finalA, 360);
    setRotation(state.angle);                   // misma posición visual, número pequeño
    state.last = result;
    if (!state.cycle.includes(result)) state.cycle.push(result);
    current = { id: Date.now().toString(36) + randInt(1e6).toString(36), a: result, date: new Date().toISOString(), status: 'pendiente', accepted: false };
    state.history.unshift(current);
    save();
    renderHistory();

    stage.classList.remove('spinning');
    spinBtn.textContent = 'Girar nuestra ruleta';   // sigue deshabilitado hasta cerrar la tarjeta
    $(`.rl-seg[data-index="${result}"]`, overlay).classList.add('win');
    statusEl.textContent = `¡Salió ${ACTIVITIES[result].e} ${ACTIVITIES[result].n}!`;
    sfx.win();
    if (navigator.vibrate) navigator.vibrate([20, 40, 20]);
    heartRain();
    setTimeout(() => showResult(current), 700);
  }

  // ---------- Tarjeta de resultado ----------
  function showResult(entry) {
    const act = ACTIVITIES[entry.a];
    card.innerHTML = `
      <div class="rl-card-kicker">¡Nuestra próxima aventura será…!</div>
      <div class="rl-card-emoji" aria-hidden="true">${act.e}</div>
      <div class="rl-card-name" id="rlCardName">${act.n}</div>
      <p class="rl-card-desc">${act.d}</p>
      <div class="rl-card-div">♥ ♥ ♥</div>
      <div class="rl-card-btns">
        <button type="button" class="rl-btn" data-act="accept">❤️ ¡Acepto la misión!</button>
        <button type="button" class="rl-btn light small" data-act="again">🔄 Girar nuevamente</button>
      </div>`;
    modal.setAttribute('aria-labelledby', 'rlCardName');
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('open');
    setTimeout(() => $('[data-act="accept"]', card)?.focus({ preventScroll: true }), 500);
  }
  function accept() {
    if (!current) return;
    const entry = state.history.find(h => h.id === current.id);
    if (entry) { entry.accepted = true; entry.acceptedAt = new Date().toISOString(); current = entry; }
    save(); renderHistory(); sfx.accept(); heartRain(18);
    const btns = $('.rl-card-btns', card);
    btns.innerHTML = `
      <div class="rl-accepted">¡Tenemos una nueva aventura pendiente! Ahora solo queda elegir cuándo vivirla. ❤️
        <small>Guardada como pendiente · creada el ${fmtDate(current.date)}</small></div>
      <button type="button" class="rl-btn small" data-act="history">💌 Ver nuestro historial</button>
      <button type="button" class="rl-btn light small" data-act="again">🔄 Girar nuevamente</button>`;
  }
  function again(autoSpin = true) {
    if (animating) return;
    closeModal();
    current = null;
    statusEl.textContent = '';
    spinning = false;
    resetSpinButton();
    if (autoSpin) setTimeout(spin, 450);
  }
  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    spinning = false;
    resetSpinButton();
  }
  function resetSpinButton() {
    spinBtn.disabled = false;
    spinBtn.textContent = 'Girar nuestra ruleta';
  }

  // ---------- Historial ----------
  function renderHistory() {
    const h = state.history;
    const done = h.filter(x => x.status === 'realizada').length;
    counterEl.textContent = h.length
      ? `${h.length} ${h.length === 1 ? 'aventura' : 'aventuras'} · ${done} ${done === 1 ? 'realizada' : 'realizadas'} · ${h.length - done} ${h.length - done === 1 ? 'pendiente' : 'pendientes'}`
      : '';
    if (!h.length) {
      listEl.innerHTML = '<li class="rl-empty">Todavía no giramos la ruleta… ¡nuestra primera aventura nos espera! 🌹</li>';
      return;
    }
    listEl.innerHTML = h.map(x => {
      const act = ACTIVITIES[x.a], isDone = x.status === 'realizada';
      return `<li class="rl-item${isDone ? ' done' : ''}" data-id="${x.id}">
        ${isDone ? '<span class="rl-mark" aria-label="Realizada">♥</span>' : ''}
        <div class="rl-item-emoji" aria-hidden="true">${act.e}</div>
        <div class="rl-item-name">${act.n}</div>
        <div class="rl-item-meta">Salió el ${fmtDate(x.date)}${x.accepted ? '<span class="rl-chip">💌 Misión aceptada</span>' : ''}</div>
        <div class="rl-state" role="group" aria-label="Estado de ${act.n}">
          <button type="button" data-status="pendiente" aria-pressed="${!isDone}">Pendiente</button>
          <button type="button" class="is-done" data-status="realizada" aria-pressed="${isDone}">Realizada ♥</button>
        </div>
      </li>`;
    }).join('');
  }
  function setStatus(id, status) {
    const entry = state.history.find(h => h.id === id);
    if (!entry || entry.status === status) return;
    entry.status = status;
    if (status === 'realizada') entry.doneAt = new Date().toISOString(); else delete entry.doneAt;
    save(); renderHistory();
    if (status === 'realizada') { sfx.accept(); toast(`¡Otro recuerdo juntos! ${ACTIVITIES[entry.a].e} ♥`, 2400); }
  }

  // ---------- Lluvia de corazones ----------
  function heartRain(count = 34) {
    const layer = el('div', 'rl-hearts');
    const glyphs = ['❤', '💗', '💕', '♥', '💖', '🌸'];
    const colors = ['#ff4d6d', '#ff8fab', '#ffd1dc', '#e0214f', '#f6dd94'];
    for (let i = 0; i < count; i++) {
      const s = el('span', 'rl-heart', glyphs[randInt(glyphs.length)]);
      s.style.left = (randFloat() * 100) + 'vw';
      s.style.fontSize = (14 + randFloat() * 20) + 'px';
      s.style.color = colors[randInt(colors.length)];
      s.style.setProperty('--d', (2.4 + randFloat() * 1.8) + 's');
      s.style.setProperty('--delay', (randFloat() * 0.9) + 's');
      s.style.setProperty('--dx', ((randFloat() - 0.5) * 140) + 'px');
      s.style.setProperty('--r', ((randFloat() - 0.5) * 540) + 'deg');
      layer.appendChild(s);
    }
    document.body.appendChild(layer);
    setTimeout(() => layer.remove(), 5000);
  }

  // ---------- Abrir / cerrar ----------
  let lastFocus = null;
  function open() {
    lastFocus = document.activeElement;
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    overlay.scrollTop = 0;
    setTimeout(() => spinBtn.focus({ preventScroll: true }), 400);
  }
  function close() {
    if (animating || modal.classList.contains('open')) return;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  function showLauncher() { launch.classList.add('show'); }

  // ---------- Inicio ----------
  function init() {
    load();
    build();
    window.Ruleta = {
      open, close, showLauncher,
      // Solo lectura, para pruebas automáticas
      _debug: { ACTIVITIES, segmentAt, choose, get state() { return state; }, get angle() { return angle; }, get spinning() { return spinning; }, get animating() { return animating; } },
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
