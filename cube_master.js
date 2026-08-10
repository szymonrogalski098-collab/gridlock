// ═══════════════════════════════════════════════
// GRIDLOCK — Game Logic // [2.0-s5a]
// ═══════════════════════════════════════════════






let shopActiveTab  = 'cube'; // [1.9]


// ── TESTER MODE ──
// PIN verified via SHA-256 (Web Crypto API) — PIN never stored in code
const _ph = '269ab13c93ed7ad03880ad739c160e9e202bcd6ef066b6240546479ed0d38afd'; // [1.9.2] updated PIN
async function _vp(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('') === _ph;
}

function _voidItemName(item) { // [2.0-s5c]
  if (item.cat === 'skin')  return VOID_SKIN_NAMES[item.id] || item.id;
  if (item.cat === 'board') return (VOID_BOARD_SKIN_LIST.find(b=>b.id===item.id)||{}).name || item.id;
  return (VOID_LASER_COLOR_LIST.find(l=>l.id===item.id)||{}).name || item.id;
}









function triggerBossRound() { // [1.11] FAB helper — triggers boss for current round range
  if (!alive) return;
  clearTimeout(phaseTimer);
  if (currentWorld === 2) { // [2.0-s4b][2.0-s4e] trigger the matching W2 boss (every 20)
    const n = Math.max(1, Math.ceil(round / 20)), idx = (n - 1) % 3, cycle = Math.floor((n - 1) / 3);
    startW2Boss(idx, Math.min(1 + 0.1 * cycle, 2));
    return;
  }
  const tier = round < 40 ? 1 : round < 60 ? 2 : 3; // [2.0-s4e]
  startBossRound(tier);
}







// ══════════════════════════════════════════════════
// START / RESTART
// ══════════════════════════════════════════════════

// ══════════════════════════════════════════════════
// TRYB TESTERA
// ══════════════════════════════════════════════════
let pinBuffer = '';

function updatePinDisplay() {
  const shown = pinBuffer.padEnd(9,'_').split('').map((c,i)=>i<pinBuffer.length?'●':'_').join(' '); // [1.9.2]
  document.getElementById('pin-display').textContent = shown;
}

async function submitPin() {
  const ok = await _vp(pinBuffer);
  if (ok) {
    testerUnlocked = true;
    showMenu(); enableTesterMode(); // [1.10.1]
  } else {
    document.getElementById('pin-error').textContent='INVALID CODE'; // [1.9]
    pinBuffer='';
    updatePinDisplay();
    setTimeout(()=>document.getElementById('pin-error').textContent='', 1500);
  }
}

function _updToggle(id, val) {
  const b = document.getElementById(id);
  if (!b) return;
  b.textContent = val ? 'ON' : 'OFF';
  b.className = 'tester-toggle' + (val ? ' on' : '');
}

function _tFeedback(id, msg) {
  const b = document.getElementById(id);
  if (!b) return;
  const orig = b.textContent;
  b.textContent = msg;
  setTimeout(()=> b.textContent = orig, 1500);
}

// ══════════════════════════════════════════════════
// BACKGROUND — ANIMATED PARTICLES
// ══════════════════════════════════════════════════
(function initBgParticles(){
  const cv = document.getElementById('bg-canvas');
  if (!cv) return;
  const ctx2 = cv.getContext('2d');
  let W, H, pts = [];
  function resize(){ W=cv.width=innerWidth; H=cv.height=innerHeight; }
  resize(); window.addEventListener('resize', resize);

  // Generate particles
  const N2 = Math.min(40, Math.floor(innerWidth*innerHeight/18000));
  for (let i=0;i<N2;i++) pts.push({
    x: Math.random()*innerWidth, y: Math.random()*innerHeight,
    vx:(Math.random()-.5)*.18, vy:(Math.random()-.5)*.18,
    r: .6+Math.random()*1.2, a: Math.random(),
    hue: Math.random()<.6 ? 190 : Math.random()<.5 ? 280 : 60
  });

  let bgFrame;
  function draw(){
    ctx2.clearRect(0,0,W,H);
    for(const p of pts){
      p.x += p.vx; p.y += p.vy;
      p.a += .008;
      if(p.x<0) p.x=W; if(p.x>W) p.x=0;
      if(p.y<0) p.y=H; if(p.y>H) p.y=0;
      const alpha = (.3+.25*Math.sin(p.a))*.7;
      ctx2.beginPath();
      ctx2.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx2.fillStyle = currentWorld === 2 ? `hsla(265,70%,85%,${alpha})` : `hsla(${p.hue},100%,70%,${alpha})`; // [2.0-s1] cosmic tint
      ctx2.fill();
    }
    bgFrame = requestAnimationFrame(draw);
  }
  draw();
})();

// ══════════════════════════════════════════════════
// MENU COINS COUNTER
// ══════════════════════════════════════════════════
let displayedCoins = -1;

function updateMenuCoins(animate=false){
  if (!menuCoinsEl) return;
  const _wal = curWallet(); // [2.0-s1]
  menuCoinsEl.textContent = `${curIcon()} ${_wal}`;
  if (animate && displayedCoins !== _wal) {
    menuCoinsEl.classList.remove('bump');
    requestAnimationFrame(()=> menuCoinsEl.classList.add('bump'));
    setTimeout(()=> menuCoinsEl.classList.remove('bump'), 350);
  }
  displayedCoins = _wal;
}

// Coin float effect
function spawnMenuCoinFloat(amount, x, y){
  const el = document.createElement('div');
  el.className = 'float-coin';
  el.textContent = `+${amount} 🪙`;
  el.style.cssText = `left:${x}px;top:${y}px;color:#ffd700;font-size:16px;font-weight:bold;font-family:monospace;`;
  document.body.appendChild(el);
  setTimeout(()=> el.remove(), 950);
}


// Wire click sounds to menu buttons
document.querySelectorAll('.menu-btn,.pin-btn,.mission-claim-btn,.tester-toggle').forEach(b=>{
  b.addEventListener('click', ()=> playUISound('click'));
});

// ── FPS COUNTER ──
function fpsLoop(ts) {
  fpsFrames++;
  if (ts - fpsLast >= 1000) {
    fpsCurrent = fpsFrames; fpsFrames = 0; fpsLast = ts;
    if (hudFpsEl) hudFpsEl.textContent = fpsCurrent + ' FPS';
  }
  if (tFps && alive) requestAnimationFrame(fpsLoop);
  else if (hudFpsEl) hudFpsEl.textContent = '';
}
function setFps(on) {
  tFps = on;
  if (hudFpsEl) hudFpsEl.style.display = on ? 'block' : 'none';
  if (on && alive) { fpsFrames=0; fpsLast=performance.now(); requestAnimationFrame(fpsLoop); }
}

// ── CENTRALIZED SCREEN MANAGEMENT ──
// Instead of manually showing/hiding each screen — one function
function showScreen(id) { // [1.9.3] fade-in on target screen
  SCREENS.forEach(s => {
    const el = s==='app' ? appEl : document.getElementById(s);
    if (!el) return;
    if (s === id) {
      el.style.transition = 'opacity .15s ease';
      el.style.visibility = 'visible';
      el.style.pointerEvents = 'auto';
      el.style.opacity = '0';
      requestAnimationFrame(() => { el.style.opacity = '1'; });
    } else {
      el.style.visibility = 'hidden';
      el.style.pointerEvents = 'none';
      el.style.opacity = '0';
    }
  });
}

function showModes() { // [1.10]
  showScreen('screen-modes');
  _renderModeCards();
  clearInterval(_modesCountdownInterval);
  _modesCountdownInterval = setInterval(_updateModeCountdowns, 1000);
}
function _renderModeCards() { // [1.10]
  ['timeattack','hardcore','daily'].forEach(id => {
    const card = document.getElementById('mode-card-' + id);
    const status = card.querySelector('.mode-card-status');
    const blocked = _isModeBlocked(id);
    card.classList.toggle('blocked', blocked);
    if (blocked) {
      status.textContent = `⏳ ${_fmtCountdown(_msUntilMidnight())}`;
      card.onclick = null;
    } else {
      status.textContent = '';
      card.onclick = () => startModeGame(id);
    }
  });
}
function _updateModeCountdowns() { // [1.10]
  ['hardcore','daily'].forEach(id => {
    if (!_isModeBlocked(id)) return;
    const card = document.getElementById('mode-card-' + id);
    const status = card.querySelector('.mode-card-status');
    if (status) status.textContent = `⏳ ${_fmtCountdown(_msUntilMidnight())}`;
  });
}
function startModeGame(mode) { // [1.10]
  clearInterval(_modesCountdownInterval);
  gameMode = mode;
  startGame(false);
}

function showMenu() {
  clearInterval(_modesCountdownInterval); // [1.10]
  gameMode = null; // [1.10]
  showScreen('screen-start');
  deathOverlay.classList.remove('show');
  clearTimeout(phaseTimer);
  alive = false;
  fabPaused = false; // [1.10.2]
  customGame = false; // [2.0-s3.1] leave the sandbox on returning to menu
  tutorialActive = false; // [2.0-s4h] defensive: never linger into the menu
  asteroids = []; clearTimeout(asteroidTimer); asteroidTimer = null; _resetBlackHole(); // [2.0-s2]
  // [2.0-w1fix] no snapshot restore here — tester progress survives every trip to the menu; only exitTesterMode() rolls back
  // refresh bottom bar
  const barTester = document.getElementById('bar-tester');
  if (barTester) barTester.classList.toggle('active', testerUnlocked);
  // [2.0-s1] world-switch button — hidden until VOID KING defeated
  const wsBtn = document.getElementById('btn-world-switch');
  if (wsBtn) {
    wsBtn.style.display = world2Unlocked ? '' : 'none';
    wsBtn.textContent = currentWorld === 2 ? '⚡ RETURN TO GRID' : '✦ ENTER THE VOID';
  }
  applyWorldTheme(); // [2.0-s1] reflect current world's theme on the menu
  updateMenuCoins();
  playUISound('tab');
  if (missionState) {
    const wt = missionState.weekType;
    const barM = document.getElementById('bar-missions');
    if (barM) barM.className = `menu-bar-btn${wt==='luckiest'?' luckiest':wt==='lucky'?' lucky':''}`;
  }
}

function fmtStat(n) { // [1.10.2] compact number formatter
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}
let statsView = 1; // [2.0-s3] which world's stats are shown (1 or 2)
function showStats() {
  const tabs = document.getElementById('stats-tabs'); // [2.0-s3] hide W2 tab until unlocked (no spoilers)
  if (tabs) tabs.style.display = world2Unlocked ? '' : 'none';
  statsView = world2Unlocked ? currentWorld : 1; // default to current world once unlocked
  showScreen('screen-stats');
  renderStats();
}
function renderStats() { // [2.0-s3] fill the stat screen from the selected world's set
  const w2 = statsView === 2;
  const scr = document.getElementById('screen-stats');
  if (scr) scr.classList.toggle('stats-w2', w2);
  document.getElementById('stats-tab-w1').classList.toggle('active', !w2);
  document.getElementById('stats-tab-w2').classList.toggle('active',  w2);
  // wallet + dynamic labels
  document.getElementById('st-coins').textContent     = w2 ? `${crystals} ✦` : `${coins} 🪙`;
  document.getElementById('st-lasers-lbl').textContent      = w2 ? 'FLARES DODGED' : 'LASERS DODGED';
  document.getElementById('st-coins-total-lbl').textContent = w2 ? 'CRYSTALS EARNED' : 'COINS EARNED';
  // values
  document.getElementById('st-best-time').textContent  = `${w2 ? w2BestTime : bestTime}s`;
  document.getElementById('st-best-round').textContent = `${w2 ? w2BestRound : bestRound}`;
  document.getElementById('st-games').textContent      = `${w2 ? w2Games : gamesPlayed}`;
  document.getElementById('st-skins').textContent      = `${owned.length+boardsOwned.length+lasersOwned.length}/${SKINS.length+BOARD_SKIN_LIST.length+LASER_COLOR_LIST.length}`; // global cosmetics
  document.getElementById('st-lasers').textContent      = fmtStat(w2 ? w2StatLasers : statLasers);
  document.getElementById('st-time').textContent        = formatTimePlayed(w2 ? w2TimePlayed : statTimePlayed);
  document.getElementById('st-coins-total').textContent = fmtStat(w2 ? w2CrystalsTotal : statCoinsTotal);
  const _bc = w2 ? w2BestCombo : statBestCombo;
  document.getElementById('st-best-combo').textContent  = _bc > 0 ? `x${fmtStat(_bc)}` : '—';
}
function formatTimePlayed(s) { // [1.9.2]
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function showPin() {
  showScreen('screen-pin');
  pinBuffer='';
  updatePinDisplay();
  document.getElementById('pin-error').textContent='';
}

function enableTesterMode() { // [1.10.1]
  _saveTesterSnap(); // [2.0-w1fix] baseline taken on entry, not on every startGame() — tester progress now persists until EXIT
  testerActive = true; // [1.10.2-fix] in-memory only, no localStorage
  showFab();
}
// [2.0-w1fix] the only place that rolls the tester's changes back — leaving to the menu no longer does
function exitTesterMode() {
  _restoreTesterSnap();
  testerActive = false;
  testerUnlocked = false;
  _fabOpen = false;
  fabPaused = false;
  document.getElementById('tester-fab-menu')?.classList.add('fab-hidden');
  hideFab();
  applyBoardSkin(); // the restore rewrote boardSkinId / boardSkinIdW2
  showMenu();
}
function showFab() { // [1.10.1]
  const el = document.getElementById('tester-fab');
  if (el) el.style.display = '';
}
function hideFab() { // [1.10.1]
  const el = document.getElementById('tester-fab');
  if (el) el.style.display = 'none';
}

function fabPauseGame() { // [1.10.2]
  if (!alive || fabPaused) return;
  fabPaused = true;
  _pauseStart = Date.now(); // [2.0-s2] freeze time-based asteroids/teleport
  if (blackHoleAnimating) { _bhRemaining = Math.max(0, _bhFiresAt - Date.now()); clearTimeout(_bhTimer); _bhTimer = null; } // [2.0-s2]
  _freezeVirtTime(); // [1.10.2-fix] freeze virtual time at pause moment so pause duration is excluded
  clearTimeout(phaseTimer);
  _phaseRemainingMs = Math.max(0, _phaseFiresAt - Date.now());
  const cf = document.getElementById('combo-flash'); // [1.10.2] pause combo flash timers
  if (cf) {
    clearTimeout(cf._t1); clearTimeout(cf._t2);
    cf._t1Remaining = (cf._t1FiresAt > 0) ? Math.max(0, cf._t1FiresAt - Date.now()) : 0;
    cf._t2Remaining = (cf._t2FiresAt > 0) ? Math.max(0, cf._t2FiresAt - Date.now()) : 0;
  }
  startAnim(); // keep loop running to draw pause overlay
}
function fabResumeGame() { // [1.10.2]
  if (!fabPaused) return;
  fabPaused = false;
  const _pd = Date.now() - _pauseStart; // [2.0-s2] pause duration
  for (const a of asteroids) { a.born += _pd; a.warnUntil += _pd; } // shift so they don't jump
  if (blackHoleAnimating && blackHole) { // [2.0-s2] resume frozen teleport
    blackHole.born += _pd;
    _bhFiresAt = Date.now() + _bhRemaining;
    _bhTimer = setTimeout(_bhFinish, _bhRemaining);
  }
  _virtBase = Date.now(); // [1.10.2-fix] exclude pause duration from virtual time
  if (blackHoleReadyAt > 0) blackHoleReadyAt += _pd; // [2.0-s4g] exclude pause from BH cooldown countdown
  if (alive && _phaseFn) {
    phaseTimer = setTimeout(_phaseFn, _phaseRemainingMs);
  }
  const cf = document.getElementById('combo-flash'); // [1.10.2] resume combo flash timers
  if (cf) {
    if (cf._t1Remaining > 0) cf._t1 = setTimeout(() => { cf.style.opacity = '0'; cf._t1FiresAt = 0; }, cf._t1Remaining);
    if (cf._t2Remaining > 0) cf._t2 = setTimeout(() => { cf.style.display = 'none'; cf._t2FiresAt = 0; }, cf._t2Remaining);
    cf._t1Remaining = 0; cf._t2Remaining = 0;
  }
}

let _fabOpen = false;         // [1.10.2] tracks FAB open state independently of DOM/speed
let _fabFeedbackTimer = null; // [1.10.2]
function showFabFeedback(msg) { // [1.10.2]
  const el = document.getElementById('fab-feedback');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  clearTimeout(_fabFeedbackTimer);
  _fabFeedbackTimer = setTimeout(() => { el.style.display = 'none'; }, 1500);
}

// ── FAB MENU ──────────────────────────────────────────────────────────────────
function renderFabMenu() { // [1.10.1]
  const menu = document.getElementById('tester-fab-menu');
  if (!menu) return;
  let html = '';
  if (customGame) { // [2.0-s3.2] sandbox: only the live hazard toggles + exit
    html += `<div class="fab-section">🧪 Custom Game</div>`;
    html += fabToggle('Lasers / Flares', customCfg.lasers,    'fab-cg-lasers');
    html += fabToggle('Asteroids',       customCfg.asteroids, 'fab-cg-asteroids');
    html += fabToggle('Blocks',          customCfg.blocks,    'fab-cg-blocks');
    html += fabToggle('Black Hole',      customCfg.blackhole, 'fab-cg-blackhole');
    html += fabToggle('FPS counter',     tFps,                'fab-fps');
    html += `<button class="fab-action" onclick="showMenu()">← Exit sandbox</button>`;
    html += _fabExitTesterBtn(); // [2.0-w1fix]
    menu.innerHTML = html;
    attachFabToggles();
    return;
  }
  if (alive) {
    html += `<div class="fab-section">⚡ Game</div>`;
    html += fabToggle('Noclip', tNoclip, 'fab-noclip');
    html += fabToggle('Slow mode (25%)', tSlow, 'fab-slow');
    html += fabToggle('Freeze lasers', tFreeze, 'fab-freeze');
    html += fabToggle('Infinite dashes', tDashInf, 'fab-infdash');
    html += fabToggle('♾ Unlimited Black Holes', tInfBlackHole, 'fab-infbh'); // [2.0-s4d]
    html += fabToggle('FPS counter', tFps, 'fab-fps');
    html += `<div class="fab-section">🎮 Actions</div>`;
    html += `<button class="fab-action" onclick="triggerDeath()">💀 Trigger death</button>`;
    html += `<button class="fab-action" onclick="nextRound()">⏭ Next round</button>`;
    html += `<button class="fab-action" onclick="triggerBossRound()">👾 Trigger boss round</button>`; // [1.11]
    html += `<button class="fab-action" onclick="testerSwitchWorld()">🌌 Switch World (W1↔W2)</button>`; // [2.0-s4c]
    html += `<button class="fab-action" onclick="activateGridlockMode()">⚡ Trigger GRIDLOCK</button>`; // [1.12]
    html += `<div class="fab-input-row">
      <input class="fab-input" id="fab-round-input" type="number" min="1" max="999" value="1" style="width:60px">
      <button class="fab-action" onclick="skipToRound()">⏩ Skip to round</button>
    </div>`;
    html += `<div class="fab-input-row">
      <input class="fab-input" id="fab-combo-input" type="number" min="0" max="99" value="5" style="width:60px">
      <button class="fab-action" onclick="setComboFab()">🔥 Set combo</button>
    </div>`;
    html += `<div class="fab-input-row">
      <input class="fab-input" id="fab-coins-ingame-input" type="number" min="0" value="100" style="width:60px">
      <button class="fab-action" onclick="addCoinsFab()">${currentWorld===2?'✦ Add crystals':'🪙 Add coins'}</button>
    </div>`;
    html += `<div class="fab-section">⚡ Speed multiplier</div>`;
    html += `<div style="display:flex;align-items:center;gap:6px;">
      <input type="range" id="fab-speed-slider" min="0.01" max="10" step="0.01" value="${tSpeedMult}" style="flex:1;accent-color:#0cf;">
      <span id="fab-speed-label" style="color:#0cf;font-size:12px;min-width:38px;text-align:right">${tSpeedMult.toFixed(2)}x</span>
    </div>`;
    html += `<div class="fab-input-row">
      <input class="fab-input" id="fab-speed-input" type="number" min="0.01" max="10" step="0.01" value="${tSpeedMult}">
      <button class="fab-action" onclick="setSpeedFab()">SET</button>
    </div>`;
    html += `<div class="fab-section">🎲 Round Modifiers</div>`; // [2.0-s3.1]
    html += `<button class="fab-action" onclick="triggerRoundMod('double_coins')">🪙 Double Coins</button>`;
    html += `<button class="fab-action" onclick="triggerRoundMod('extra_dash')">⚡ Extra Dash</button>`;
    html += `<button class="fab-action" onclick="triggerRoundMod('combo_boost')">🔥 Combo Boost</button>`;
    html += `<button class="fab-action" onclick="triggerRoundMod('fast_lasers')">💨 Fast Obstacles</button>`;
    html += `<button class="fab-action" onclick="triggerRoundMod('grid_glitch')">📺 Grid Glitch</button>`;
  }
  if (!alive) { // [1.12] hide non-game sections during gameplay
    html += `<div class="fab-section">📋 Missions</div>`;
    html += `<button class="fab-action" onclick="setMissionWeek(0)">📅 Normal day</button>`;   // [2.0-s4]
    html += `<button class="fab-action" onclick="setMissionWeek(1)">⭐ Lucky day</button>`;     // [2.0-s4]
    html += `<button class="fab-action" onclick="setMissionWeek(2)">🌟 Luckiest day</button>`;  // [2.0-s4]
    html += `<button class="fab-action" onclick="completeMissions()">✅ Complete all</button>`;
    html += `<button class="fab-action" onclick="newRandomMissions()">🔀 New random</button>`;
    html += `<div class="fab-section">🎨 Skins</div>`;
    html += `<button class="fab-action" onclick="unlockPrestigeSkins()">🏆 Unlock prestige</button>`;
    html += `<button class="fab-action" onclick="unlockAllSkins()">🎁 Unlock all skins</button>`;
    html += `<button class="fab-action" onclick="resetAllSkins()">🗑 Reset all skins</button>`; // [1.10.2]
    html += `<button class="fab-action" onclick="cycleVoidSkins()">🌌 Cycle Void skins</button>`;   // [5a-debug]
    html += `<button class="fab-action" onclick="cycleVoidBoards()">🪐 Cycle Void boards</button>`; // [5a-debug]
    html += `<button class="fab-action" onclick="cycleVoidLasers()">☄ Cycle Void lasers</button>`;  // [5a-debug]
    html += `<div class="fab-section">💾 Data</div>`;
    html += `<div class="fab-input-row">
      <input class="fab-input" id="fab-coins-input" type="number" min="0" value="1000">
      <button class="fab-action" onclick="setCoinsFab()">${currentWorld===2?'SET crystals':'SET coins'}</button>
    </div>`;
    html += `<div class="fab-section">🔄 Modes</div>`;
    html += `<button class="fab-action" onclick="resetDailyMode()">📅 Reset Daily</button>`;
    html += `<button class="fab-action" onclick="resetHardcoreMode()">💀 Reset Hardcore</button>`;
    html += `<div class="fab-section">🧪 Custom Game</div>`; // [2.0-s3.1] sandbox — empty board + chosen hazards
    html += fabToggle('Lasers / Flares', customCfg.lasers,   'fab-cg-lasers');
    html += fabToggle('Asteroids',       customCfg.asteroids,'fab-cg-asteroids');
    html += fabToggle('Blocks',          customCfg.blocks,   'fab-cg-blocks');
    html += fabToggle('Black Hole',      customCfg.blackhole,'fab-cg-blackhole');
    html += `<button class="fab-action" onclick="startCustomGame()">▶ Start Custom Game</button>`;
  } // [1.12] end !alive block
  html += _fabExitTesterBtn(); // [2.0-w1fix] always reachable, alive or not
  menu.innerHTML = html;
  attachFabToggles();
}

// [2.0-w1fix] the one way out of tester mode — restores the pre-tester snapshot
function _fabExitTesterBtn() {
  return `<div class="fab-section">🚪 Tester</div>`
       + `<button class="fab-action" onclick="exitTesterMode()">🚪 EXIT TESTER</button>`;
}

function fabToggle(label, state, id) { // [1.10.1]
  return `<div class="fab-toggle">
    <span>${label}</span>
    <button class="fab-toggle-btn ${state?'on':''}" id="${id}">${state?'ON':'OFF'}</button>
  </div>`;
}

function attachFabToggles() { // [1.10.1]
  const toggles = {
    'fab-noclip':  () => { tNoclip  = !tNoclip;  },
    'fab-slow':    () => { tSlow    = !tSlow;    },
    'fab-freeze':  () => { tFreeze  = !tFreeze;  },
    'fab-infdash': () => { tDashInf = !tDashInf; },
    'fab-infbh':   () => { tInfBlackHole = !tInfBlackHole; updateBlackHoleHud(); }, // [2.0-s4d]
    'fab-fps':     () => { setFps(!tFps);        },
    'fab-cg-lasers':    () => { customCfg.lasers    = !customCfg.lasers;    _customApplyToggles(); }, // [2.0-s3.1][2.0-s3.2]
    'fab-cg-asteroids': () => { customCfg.asteroids = !customCfg.asteroids; _customApplyToggles(); }, // [2.0-s3.1][2.0-s3.2]
    'fab-cg-blocks':    () => { customCfg.blocks    = !customCfg.blocks;    _customApplyToggles(); }, // [2.0-s3.1][2.0-s3.2]
    'fab-cg-blackhole': () => { customCfg.blackhole = !customCfg.blackhole; _customApplyToggles(); }, // [2.0-s3.1][2.0-s3.2]
  };
  Object.entries(toggles).forEach(([id, fn]) => {
    const btn = document.getElementById(id);
    if (btn) btn.onclick = () => { fn(); renderFabMenu(); };
  });
  // [1.10.2] Speed slider sync
  const slider = document.getElementById('fab-speed-slider');
  const label  = document.getElementById('fab-speed-label');
  const input  = document.getElementById('fab-speed-input');
  if (slider) {
    slider.oninput = () => {
      tSpeedMult = parseFloat(slider.value);
      if (label) label.textContent = tSpeedMult.toFixed(2) + 'x';
      if (input) input.value = tSpeedMult.toFixed(2);
    };
  }
}

function triggerDeath() { if (alive) die('laser'); } // [1.10.1]
function nextRound() { // [1.10.1]
  if (alive) {
    const wasPaused = fabPaused;
    fabPaused = false; // temporarily lift so startRound() schedules normally
    if (bossRound) _cleanupBoss(); // [2.0-s3] a tester round-skip during a boss must not strand rain timers
    clearTimeout(phaseTimer); lasers=[]; blocks=[]; startRound();
    if (wasPaused) { // [1.10.2] re-apply pause after new round is set up
      clearTimeout(phaseTimer);
      _phaseRemainingMs = Math.max(0, _phaseFiresAt - Date.now());
      fabPaused = true;
      startAnim();
    }
  }
}
function skipToRound() { // [1.10.1]
  const val = parseInt(document.getElementById('fab-round-input')?.value) || 1;
  round = Math.max(1, val) - 1;
  nextRound();
  showFabFeedback('⏩ Skipped!'); // [1.10.2]
}
function setComboFab() { // [1.10.1]
  const val = parseInt(document.getElementById('fab-combo-input')?.value) || 0;
  comboCount = Math.max(0, val);
  renderFabMenu();
  showFabFeedback('🔥 Combo set!'); // [1.10.2]
}
function _syncTesterSnapCurrency() { // [2.0-s5c] keep deliberately-added debug currency past tester snapshot restore
  if (!_testerSnap) return;
  _testerSnap['cm_coins']    = String(coins);
  _testerSnap['cm_crystals'] = String(crystals);
}
function addCoinsFab() { // [1.10.1][2.0-s5c] world-aware: crystals in W2, coins in W1
  const val = parseInt(document.getElementById('fab-coins-ingame-input')?.value) || 0;
  if (currentWorld === 2) crystals += val; else coins += val;
  save(); _syncTesterSnapCurrency(); renderFabMenu();
  showFabFeedback(currentWorld===2 ? '✦ Crystals added!' : '🪙 Coins added!'); // [1.10.2]
}
function setCoinsFab() { // [1.10.1][2.0-s5c] world-aware
  const val = parseInt(document.getElementById('fab-coins-input')?.value);
  if (!isNaN(val) && val >= 0) {
    if (currentWorld === 2) crystals = val; else coins = val;
    save(); _syncTesterSnapCurrency(); updateMenuCoins();
    showFabFeedback(currentWorld===2 ? '✦ Crystals set!' : '🪙 Coins set!'); // [1.10.2]
  }
}
function setSpeedFab() { // [1.10.2]
  const val = parseFloat(document.getElementById('fab-speed-input')?.value);
  if (!isNaN(val)) {
    tSpeedMult = Math.max(0.01, Math.min(10, val));
    const slider = document.getElementById('fab-speed-slider');
    const label  = document.getElementById('fab-speed-label');
    if (slider) slider.value = tSpeedMult;
    if (label)  label.textContent = tSpeedMult.toFixed(2) + 'x';
    showFabFeedback(`⚡ Speed: ${tSpeedMult.toFixed(2)}x`);
  }
}
function setMissionWeek(type) { // [1.10.1]
  tSetWeek(['normal','lucky','luckiest'][type] || 'normal');
  showFabFeedback('📅 Week set!'); // [1.10.2]
}
function startCustomGame() { // [2.0-s3.1] tester sandbox: empty board + chosen hazards (no record impact)
  gameMode = null; hardMode = false;
  startGame(false, false, true);
  showFabFeedback('🧪 Custom game');
}
function completeMissions()   { tCompleteAllMissions(); showFabFeedback('✅ Missions completed!'); } // [1.10.1] [1.10.2]
function newRandomMissions()  { tResetMissions();        showFabFeedback('🔀 New missions!'); }      // [1.10.1] [1.10.2]
function unlockPrestigeSkins(){ tUnlockPrestige();       showFabFeedback('🏆 Prestige unlocked!'); } // [1.10.1] [1.10.2]
function unlockAllSkins()     { tUnlockAll();            showFabFeedback('🎁 All skins unlocked!'); }// [1.10.1] [1.10.2]
function resetDailyMode() { // [1.10.1]
  localStorage.removeItem('cm_daily_date');
  localStorage.removeItem('cm_daily_score');
  showFabFeedback('📅 Daily reset!'); // [1.10.2]
}
function resetHardcoreMode() { // [1.10.1]
  localStorage.removeItem('cm_hardcore_date');
  showFabFeedback('💀 Hardcore reset!'); // [1.10.2]
}
function resetAllSkins() { // [1.10.2]
  localStorage.removeItem('cm_owned');
  localStorage.removeItem('cm_skin');
  localStorage.removeItem('cm_boards_owned');
  localStorage.removeItem('cm_board');
  localStorage.removeItem('cm_board_w2');
  localStorage.removeItem('cm_lasers_owned');
  localStorage.removeItem('cm_laser');
  localStorage.removeItem('cm_laser_w2');
  localStorage.removeItem('cm_world2_skins_owned');
  localStorage.removeItem('cm_world2_boards_owned');
  localStorage.removeItem('cm_world2_lasers_owned');
  localStorage.removeItem('cm_world2_box_date');
  localStorage.removeItem('cm_world2_box_bought');
  localStorage.removeItem('cm_world2_box_bought_date');
  owned = ['default']; skinId = 'default'; // [1.10.2] sync in-memory
  boardsOwned = ['classic']; boardSkinId = 'classic';
  boardSkinIdW2 = 'eventhorizon';
  lasersOwned = ['red']; laserColorId = 'red';
  laserColorIdW2 = 'plasma';
  voidSkinsOwned = []; voidBoardsOwned = []; voidLasersOwned = []; // [2.0-s5b]
  box_lastFreeDate = ''; box_boughtToday = 0; box_boughtDate = ''; // [2.0-s5b]
  applyBoardSkin(); renderShop();
  showFabFeedback('🗑 Skins reset!');
}

// [5a-debug] Preview the new Void cosmetics (no save — 5b/5c add ownership). Equip in memory; if a game
// is running it re-renders live, otherwise the selection carries into the next started game.
const _VOID_SKINS_5A  = ['singularityheart','supernova','pulsarskin','cosmicdust','comet','aurora','meteor','stardust','orbit','lunar'];
const _VOID_BOARDS_5A = ['eventhorizon','starfield','nebula','deepspace','asteroidbelt'];
const _VOID_LASERS_5A = ['plasma','ion','cosmicblue'];
let _voidSkinIdx = 0, _voidBoardIdx = 0, _voidLaserIdx = 0;
function cycleVoidSkins() { // [5a-debug]
  skinId = _VOID_SKINS_5A[_voidSkinIdx++ % _VOID_SKINS_5A.length];
  invalidateSkinCache();
  if (alive) render();
  showFabFeedback('🌌 ' + skinId);
}
function cycleVoidBoards() { // [5a-debug][2.0-s5a-r9]
  boardSkinIdW2 = _VOID_BOARDS_5A[_voidBoardIdx++ % _VOID_BOARDS_5A.length];
  applyBoardSkin();
  startAnim(); // force at least one canvas repaint so the effect previews even outside a live round
  if (alive) render();
  showFabFeedback('🪐 ' + boardSkinIdW2);
}
function cycleVoidLasers() { // [5a-debug][2.0-s5a-r8]
  laserColorIdW2 = _VOID_LASERS_5A[_voidLaserIdx++ % _VOID_LASERS_5A.length];
  if (alive) render();
  showFabFeedback('☄ ' + laserColorIdW2);
}
// ─────────────────────────────────────────────────────────────────────────────

// ══════════════════════════════════════════════════
// VOID SHOP — LOOT BOX ENGINE [2.0-s5b]
// State/RNG/ownership only — no UI. 5c calls openFreeBox()/buyBox() and renders the result.
// ══════════════════════════════════════════════════
function _boxCheckReset() {
  const today = _todayStr();
  if (box_boughtDate !== today) {
    box_boughtToday = 0; box_boughtDate = today;
    localStorage.setItem('cm_world2_box_bought_date', today);
    localStorage.setItem('cm_world2_box_bought', '0');
  }
}
function canOpenFreeBox() { _boxCheckReset(); return box_lastFreeDate !== _todayStr(); }
function canBuyBox()      { _boxCheckReset(); return box_boughtToday < 2; }

function _rollTier() {
  const total = Object.values(VOID_TIER_CONFIG).reduce((s,t)=>s+t.weight,0);
  let r = Math.random() * total;
  for (const [tier,cfg] of Object.entries(VOID_TIER_CONFIG)) {
    if ((r -= cfg.weight) < 0) return tier;
  }
  return 'common';
}
function _rollItem(tier) {
  const pool = VOID_LOOT_TABLE.filter(i => i.tier === tier);
  return pool[Math.floor(Math.random() * pool.length)];
}
function _isOwned(item) {
  if (item.cat === 'skin')  return voidSkinsOwned.includes(item.id);
  if (item.cat === 'board') return voidBoardsOwned.includes(item.id);
  return voidLasersOwned.includes(item.id);
}
function _grantItem(item) {
  if (item.cat === 'skin')  { voidSkinsOwned.push(item.id);  localStorage.setItem('cm_world2_skins_owned',  JSON.stringify(voidSkinsOwned)); }
  if (item.cat === 'board') { voidBoardsOwned.push(item.id); localStorage.setItem('cm_world2_boards_owned', JSON.stringify(voidBoardsOwned)); }
  if (item.cat === 'laser') { voidLasersOwned.push(item.id); localStorage.setItem('cm_world2_lasers_owned', JSON.stringify(voidLasersOwned)); }
}
function openFreeBox() {
  if (!canOpenFreeBox()) return null;
  box_lastFreeDate = _todayStr();
  localStorage.setItem('cm_world2_box_date', box_lastFreeDate);
  return _resolveBoxOpen();
}
function buyBox() {
  _boxCheckReset();
  if (!canBuyBox()) return null;
  const BOX_COST = 100; // placeholder, balance later
  if (crystals < BOX_COST) return { error: 'insufficient_funds', need: BOX_COST, have: crystals };
  crystals -= BOX_COST; save();
  box_boughtToday++; localStorage.setItem('cm_world2_box_bought', String(box_boughtToday));
  return _resolveBoxOpen();
}
function _resolveBoxOpen() {
  const tier = _rollTier();
  const item = _rollItem(tier);
  const wasDuplicate = _isOwned(item);
  let refund = 0;
  if (wasDuplicate) {
    refund = Math.max(1, Math.floor(VOID_TIER_CONFIG[tier].price * 0.10));
    crystals += refund; save();
  } else {
    _grantItem(item);
  }
  return { item, tier, wasDuplicate, refund };
}
// ─────────────────────────────────────────────────────────────────────────────

// ══════════════════════════════════════════════════
// VOID SHOP — UI: loot box opener + CS2-style tier reveal + collection [2.0-s5c]
// Visualizes the engine result only; never rolls loot itself.
// ══════════════════════════════════════════════════
const VOID_BOX_COST = 100;        // mirrors buyBox() internal cost
const _VOID_REEL_LEN = 50;        // reel tile count
const _VOID_REEL_WIN = 45;        // index of the tile that holds the real result tier
const _VOID_TILE_W   = 66;        // 60px tile + 6px gap (must match CSS)
let _voidCountdownTimer = null;
let _voidReelBusy = false;

function openVoidShop() {
  SCREENS.forEach(s=>{
    const el = s==='app' ? appEl : document.getElementById(s);
    if (el) { el.style.visibility='hidden'; el.style.pointerEvents='none'; }
  });
  voidShopEl.classList.add('open');
  playShopOpen();
  renderVoidOpener();
  renderVoidCollection();
  clearInterval(_voidCountdownTimer);
  _voidCountdownTimer = setInterval(_updateVoidCountdown, 1000);
}
function closeVoidShop() {
  voidShopEl.classList.remove('open');
  clearInterval(_voidCountdownTimer); _voidCountdownTimer = null;
  showMenu();
}

function renderVoidOpener() {
  voidBalEl.textContent = `✦ ${crystals}`;
  const freeAvail  = canOpenFreeBox();
  const boughtLeft = Math.max(0, 2 - box_boughtToday);
  const canBuy     = canBuyBox();
  const affordBuy  = crystals >= VOID_BOX_COST;
  voidOpenerEl.innerHTML = '';

  // Free box row
  const freeRow = document.createElement('div'); freeRow.className = 'void-open-row';
  const fInfo = document.createElement('div'); fInfo.className = 'void-open-info';
  const fTitle = document.createElement('div'); fTitle.className = 'void-open-title'; fTitle.textContent = 'FREE BOX';
  const fSub = document.createElement('div'); fSub.className = 'void-open-sub'; fSub.id = 'void-free-sub';
  fSub.textContent = freeAvail ? 'Available now — 1 per day' : `Next in ⏳ ${_fmtCountdown(_msUntilMidnight())}`;
  fInfo.append(fTitle, fSub);
  const fBtn = document.createElement('button'); fBtn.className = 'void-open-btn'; fBtn.id = 'void-free-btn';
  fBtn.textContent = 'OPEN FREE BOX'; fBtn.disabled = !freeAvail || _voidReelBusy;
  fBtn.addEventListener('click', ()=>handleVoidOpen('free'));
  freeRow.append(fInfo, fBtn);

  // Buy box row
  const buyRow = document.createElement('div'); buyRow.className = 'void-open-row';
  const bInfo = document.createElement('div'); bInfo.className = 'void-open-info';
  const bTitle = document.createElement('div'); bTitle.className = 'void-open-title'; bTitle.textContent = 'BUY BOX';
  const bSub = document.createElement('div'); bSub.className = 'void-open-sub'; bSub.id = 'void-buy-sub';
  bSub.textContent = !canBuy ? 'Daily limit reached (2/2)' : !affordBuy ? `Not enough ✦ (need ${VOID_BOX_COST})` : `${boughtLeft} / 2 left today`;
  bInfo.append(bTitle, bSub);
  const bBtn = document.createElement('button'); bBtn.className = 'void-open-btn'; bBtn.id = 'void-buy-btn';
  bBtn.textContent = `BUY BOX (${VOID_BOX_COST}✦)`; bBtn.disabled = !canBuy || !affordBuy || _voidReelBusy;
  bBtn.addEventListener('click', ()=>handleVoidOpen('buy'));
  buyRow.append(bInfo, bBtn);

  voidOpenerEl.append(freeRow, buyRow);
}

function _updateVoidCountdown() { // per-second refresh of countdown + free-button state
  const fSub = document.getElementById('void-free-sub');
  const fBtn = document.getElementById('void-free-btn');
  if (!fSub || !fBtn) return;
  const freeAvail = canOpenFreeBox();
  fBtn.disabled = !freeAvail || _voidReelBusy;
  fSub.textContent = freeAvail ? 'Available now — 1 per day' : `Next in ⏳ ${_fmtCountdown(_msUntilMidnight())}`;
}

function handleVoidOpen(kind) {
  if (_voidReelBusy) return;
  const result = kind === 'free' ? openFreeBox() : buyBox();
  if (!result) { renderVoidOpener(); return; } // gated / unavailable
  if (result.error === 'insufficient_funds') {
    const bSub = document.getElementById('void-buy-sub');
    if (bSub) bSub.textContent = `Not enough ✦ (need ${result.need})`;
    return;
  }
  renderVoidOpener(); // wallet/counters already mutated by the engine
  startTierReel(result);
}

function _reelRollTierVisual() { // cosmetic-only weighted tier pick — must NOT touch engine state
  const total = Object.values(VOID_TIER_CONFIG).reduce((s,t)=>s+t.weight,0);
  let r = Math.random() * total;
  for (const [tier,cfg] of Object.entries(VOID_TIER_CONFIG)) {
    if ((r -= cfg.weight) < 0) return tier;
  }
  return 'common';
}
function _voidTileEl(tier) {
  const t = document.createElement('div'); t.className = 'void-reel-tile';
  const col = VOID_TIER_COLORS[tier];
  if (col.rainbow) t.classList.add('void-reel-tile--rainbow');
  else t.style.background = `linear-gradient(135deg, ${col.c1}, ${col.c2})`;
  const lbl = document.createElement('span'); // [2.0-s5c] show rarity name on the tile
  lbl.className = 'void-reel-label'; lbl.textContent = col.label;
  t.appendChild(lbl);
  return t;
}
function startTierReel(result) {
  _voidReelBusy = true;
  voidReelVp.style.display = '';
  voidRevealCard.classList.remove('show'); voidRevealCard.innerHTML = '';
  voidRevealOk.classList.remove('show');
  voidRevealEl.classList.add('open');

  // build tiles (visuals only); force the winning index to the engine's tier
  voidReelStrip.innerHTML = '';
  const tiles = [];
  for (let i=0;i<_VOID_REEL_LEN;i++) {
    const tier = i === _VOID_REEL_WIN ? result.tier : _reelRollTierVisual();
    const el = _voidTileEl(tier);
    tiles.push(el); voidReelStrip.appendChild(el);
  }
  // reset, then animate on next frame
  voidReelStrip.style.transition = 'none';
  voidReelStrip.style.transform = 'translateX(0px)';
  const vpW = voidReelVp.clientWidth;
  const tileCenter = 6 /*strip padding*/ + _VOID_REEL_WIN * _VOID_TILE_W + 30 /*half tile*/;
  const jitter = (Math.random()*40 - 20); // ±20px inside the tile — avoids always dead-center
  const finalX = tileCenter - vpW/2 + jitter;

  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    voidReelStrip.style.transition = 'transform 3.6s cubic-bezier(.12,.7,.16,1)';
    voidReelStrip.style.transform = `translateX(${-finalX}px)`;
  }));

  const onEnd = (e)=>{
    if (e.propertyName !== 'transform') return;
    voidReelStrip.removeEventListener('transitionend', onEnd);
    tiles[_VOID_REEL_WIN].classList.add('void-reel-win');
    setTimeout(()=>revealItem(result), 550);
  };
  voidReelStrip.addEventListener('transitionend', onEnd);
}

function revealItem(result) {
  const { item, tier, wasDuplicate, refund } = result;
  const col = VOID_TIER_COLORS[tier];
  voidReelVp.style.display = 'none';
  voidRevealCard.innerHTML = '';
  voidRevealCard.style.borderColor = col.glow;
  voidRevealCard.style.boxShadow = `0 0 26px ${col.glow}66`;

  const tierEl = document.createElement('div');
  tierEl.className = 'void-reveal-tier'; tierEl.textContent = col.label; tierEl.style.color = col.glow;

  const cv = document.createElement('canvas');
  cv.width = cv.height = 96; cv.className = 'void-reveal-preview';
  if (item.cat === 'skin')       drawSkin(cv.getContext('2d'), item.id, 0, 0, 96, skinAnimT);
  else if (item.cat === 'board') drawBoardPreview(cv, item.id);
  else                           drawLaserPreview(cv, item.id);
  if (wasDuplicate) cv.classList.add('void-dup-grey');

  const nameEl = document.createElement('div');
  nameEl.className = 'void-reveal-name'; nameEl.textContent = _voidItemName(item);
  if (wasDuplicate) nameEl.classList.add('void-dup-grey');

  voidRevealCard.append(tierEl, cv, nameEl);
  if (wasDuplicate) {
    const dup = document.createElement('div');
    dup.className = 'void-reveal-dup'; dup.textContent = `DUPLICATE  +${refund}✦`;
    voidRevealCard.appendChild(dup);
  }
  voidRevealCard.classList.add('show');
  voidRevealOk.classList.add('show');
}

function closeVoidReveal() {
  voidRevealEl.classList.remove('open');
  voidRevealCard.classList.remove('show');
  voidRevealOk.classList.remove('show');
  voidReelVp.style.display = '';
  _voidReelBusy = false;
  renderVoidOpener();
  renderVoidCollection();
}

function renderVoidCollection() {
  voidCollEl.innerHTML = '';
  const cats = [['skin','SKINS'],['board','BOARDS'],['laser','LASERS']];
  for (const [cat, label] of cats) {
    const header = document.createElement('div');
    header.className = 'shop-section-header'; header.textContent = `— ${label} —`;
    voidCollEl.appendChild(header);

    const items = VOID_LOOT_TABLE.filter(i=>i.cat===cat)
      .sort((a,b)=>VOID_TIER_ORDER.indexOf(a.tier)-VOID_TIER_ORDER.indexOf(b.tier));
    for (const item of items) {
      const owned  = _isOwned(item);
      const active = owned && ( // [2.0-s5c] never show a locked/unowned item as active
                     (cat==='skin'  && skinId===item.id)
                  || (cat==='board' && boardSkinIdW2===item.id)
                  || (cat==='laser' && laserColorIdW2===item.id));
      const col = VOID_TIER_COLORS[item.tier];

      const card = document.createElement('div');
      card.className = 'skin-card' + (active?' active':owned?' owned':'');
      if (!owned) card.style.opacity = '.5';
      else if (!active) card.style.borderColor = col.glow;

      const cv = document.createElement('canvas');
      cv.width = cv.height = 38; cv.className = 'skin-preview';
      if (owned) {
        if (cat==='skin')       drawSkin(cv.getContext('2d'), item.id, 0, 0, 38, skinAnimT);
        else if (cat==='board') drawBoardPreview(cv, item.id);
        else                    drawLaserPreview(cv, item.id);
      } else {
        _shopDrawLockTile(cv); // [2.0-deemoji] was an inlined copy of the same tile + a canvas lock glyph
      }

      const nm = document.createElement('div'); nm.className='skin-name'; nm.textContent = owned ? _voidItemName(item) : '???'; // [2.0-s5c] hide unearned item names
      const pr = document.createElement('div'); pr.className='skin-price'+(owned?' owned':'');
      if (active)     pr.textContent='✓ Active';
      else if (owned) pr.textContent='Equip';
      else { pr.textContent=col.label; pr.style.color=col.glow; pr.style.fontSize='9px'; }

      card.append(cv,nm,pr);
      if (!owned) card.appendChild(_shopLockOverlay()); // [2.0-deemoji] padlock over the blank tile
      if (owned) card.addEventListener('click', ()=>equipVoidItem(item));
      voidCollEl.appendChild(card);
    }
  }
}

function equipVoidItem(item) { // no crystal cost — already owned via loot box
  if (!_isOwned(item)) return;
  if (item.cat === 'skin')       { skinId = item.id; invalidateSkinCache(); localStorage.setItem('cm_skin', item.id); save(); }
  else if (item.cat === 'board') { boardSkinIdW2 = item.id; localStorage.setItem('cm_board_w2', item.id); applyBoardSkin(); }
  else                           { laserColorIdW2 = item.id; localStorage.setItem('cm_laser_w2', item.id); }
  playSkinSelect();
  renderVoidCollection();
}
// ─────────────────────────────────────────────────────────────────────────────

function startGame(hard = false, fromTester = false, custom = false, tutorial = false) {
  hardMode = hard;
  customGame = custom; // [2.0-s3.1] only true via startCustomGame()
  tutorialActive = tutorial; // [2.0-s4h] set on every entry → real games always clear it
  // [1.10.1] testerActive is persistent — don't override; save snap if active
  if (testerActive) {
    // [2.0-w1fix] snapshot moved to enableTesterMode() — re-taking it here overwrote the baseline every game
    SKINS.forEach(s=>{ if(!owned.includes(s.id)) owned.push(s.id); });
    // no save() — tester unlocks stay in memory only
  }
  showScreen('app');
  deathOverlay.classList.remove('show');
  clearTimeout(phaseTimer);
  cube={x:8,y:8};
  round = 0; // [1.10.1] always 0; use Skip to round in FAB for custom start
  fabPaused = false; // [1.10.2]
  _cleanupBoss(); // [1.11] reset boss state on new game
  _endGridlockMode(false); gridlockActive=false; gridlockRoundsLeft=0; // [1.12]
  _resetRoundMods(); // [2.0-s3]
  clearInterval(_glitchTimer); _glitchTimer=null;
  if (hudGridlock) hudGridlock.style.display='none';
  alive=true; lasers=[]; blocks=[]; dashesLeft=2;
  particles=[]; trails=[]; invalidateSkinCache();
  asteroids=[]; clearTimeout(asteroidTimer); asteroidTimer=null; // [2.0-s2]
  blackHoleCooldown=0; blackHoleReadyAt=0; _resetBlackHole(); // [2.0-s2][2.0-s4g]
  if (_asteroidsEnabled() && !tutorialActive) scheduleAsteroid(); // [2.0-s2][2.0-s3.1][2.0-s4h] no asteroids in tutorial
  sessionCoinsEarned = 0;
  sessionCrystalsEarned = 0; // [2.0-s1]
  // [1.10] Mode-specific init
  if (gameMode === 'daily') {
    localStorage.setItem('cm_daily_date', _todayStr());
    _dailyRng = _seededRng(_dateSeed());
  } else {
    _dailyRng = null;
  }
  if (gameMode === 'timeattack') {
    timeAttackEndTime = Date.now() + 60000;
    if (hudTimerEl) { hudTimerEl.style.display = ''; hudTimerVal.textContent = '60s'; } // [2.0-deemoji]
  } else {
    if (hudTimerEl) hudTimerEl.style.display = 'none';
  }
  const titleEl = document.getElementById('death-title');
  if (titleEl) titleEl.textContent = 'GAME OVER';
  comboCount = 0; bestComboThisSession = 0; // [1.9.2]
  startTime=Date.now(); _virtAccum=0; _virtBase=startTime; _appliedSpeedMult=tSpeedMult; // [1.10.2-fix]
  buildBoard(); render();
  if (tutorialActive) _tutorialStart(); else if (customGame) _customStart(); else startRound(); // [2.0-s3.2][2.0-s4h] tutorial vs sandbox vs normal
  if (!tutorialActive) mTrackGameStart(); // [2.0-s4h] tutorial isn't a tracked game
  if (testerActive && tFps) { fpsFrames=0; fpsLast=performance.now(); requestAnimationFrame(fpsLoop); }
}

// ══════════════════════════════════════════════════
// SKLEP
// ══════════════════════════════════════════════════
let shopFromMenu = false;
function openShop(fromMenu=false){
  shopFromMenu = fromMenu;
  clearTimeout(phaseTimer);
  // ukryj wszystkie ekrany — sklep nakrywa wszystko przez z-index:60
  SCREENS.forEach(s=>{
    const el = s==='app' ? appEl : document.getElementById(s);
    if (el) { el.style.visibility='hidden'; el.style.pointerEvents='none'; }
  });
  shopEl.classList.add('open');
  playShopOpen(); // [1.9.2]
  renderShop();
}
function closeShop(){
  shopEl.classList.remove('open');
  if (shopFromMenu) showMenu();
  else if (alive) { showScreen('app'); startRound(); }
  else showMenu();
}
let _shopUnlockFx = null; // [2.0-w1fix] {kind:'skin'|'board'|'laser', id} — one-shot baton, consumed by the next renderShop()

function renderShop(){ // [1.9] tab-aware
  shopBal.textContent=`🪙 ${coins}`;
  // sync tab buttons
  const tabCube = document.getElementById('shop-tab-cube');
  const tabBL   = document.getElementById('shop-tab-bl');
  if (tabCube) tabCube.classList.toggle('active', shopActiveTab==='cube');
  if (tabBL)   tabBL.classList.toggle('active', shopActiveTab==='bl');

  if (shopActiveTab === 'cube') {
    shopGrid.style.display = '';
    if (shopGridBL) shopGridBL.style.display = 'none';
    renderShopCubeTab();
  } else {
    shopGrid.style.display = 'none';
    if (shopGridBL) { shopGridBL.style.display = ''; renderShopBLTab(); }
  }
  _shopUnlockFx = null; // [2.0-w1fix] one-shot — never carries over into a later render
}

// ── SHOP LOCK / UNLOCK VISUALS ── [2.0-w1fix]
// Every locked item now wears the same SVG padlock overlay; what separates the two kinds is what
// sits *under* it. Ordinary unowned items show their real preview, greyed. Prestige items show a
// blank tile and a gold padlock — no preview at all, because you can't buy your way to them.
function _shopDrawLockTile(cv) { // [2.0-w1fix] blank prestige tile — [2.0-deemoji] the lock is now a DOM overlay
  const c2 = cv.getContext('2d');
  c2.fillStyle = '#0a0a18'; c2.fillRect(0, 0, cv.width, cv.height);
}

function _shopLockOverlay() { // [2.0-w1fix] thin outline padlock, same line-art style as the mode-card icons
  const el = document.createElement('div');
  el.className = 'shop-lock-overlay';
  el.innerHTML = `<svg viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="2"/>`
               + `<path d="M8.2 10.5V7.8a3.8 3.8 0 0 1 7.6 0v2.7"/><circle cx="12" cy="15.5" r="1.3"/></svg>`;
  return el;
}

function _shopMarkLocked(card) { // [2.0-w1fix] affordable-or-not, it just isn't owned yet
  card.classList.add('shop-locked');
  card.appendChild(_shopLockOverlay());
}

function _shopMarkLockedPrestige(card) { // [2.0-deemoji] gold padlock over the blank tile
  const lock = _shopLockOverlay();
  lock.classList.add('prestige');
  card.appendChild(lock);
}

function _shopPlayUnlockFx(card, kind, id) { // [2.0-w1fix] lock falls away, then the preview glows
  if (!_shopUnlockFx || _shopUnlockFx.kind !== kind || _shopUnlockFx.id !== id) return;
  _shopUnlockFx = null;
  const lock = _shopLockOverlay();
  lock.classList.add('shop-unlock-anim');
  card.appendChild(lock);
  card.classList.add('shop-glow-reveal');
  setTimeout(() => lock.remove(), 420);
  setTimeout(() => card.classList.remove('shop-glow-reveal'), 2500);
}

function _shopDeny(cardEl) { // [2.0-w1fix] can't afford it: sound + shake, no text — the balance line stays a balance line
  playError();
  if (!cardEl) return;
  cardEl.classList.remove('shake-deny'); void cardEl.offsetWidth; cardEl.classList.add('shake-deny');
  setTimeout(() => cardEl.classList.remove('shake-deny'), 340);
}

function renderShopCubeTab() { // [1.9] extracted from old renderShop
  shopGrid.innerHTML='';
  const cats = ['Patterns','Effects','Shapes','Prestige'];
  for (const cat of cats) {
    const header = document.createElement('div');
    header.style.cssText='grid-column:1/-1;font-size:11px;letter-spacing:2px;margin-top:8px;';
    header.style.color = cat==='Prestige' ? '#ffd700' : '#0cf';
    header.textContent = `— ${cat.toUpperCase()} —`;
    if (cat==='Prestige') {
      const sub = document.createElement('div');
      sub.style.cssText='grid-column:1/-1;font-size:9px;color:#664;margin-top:-4px;letter-spacing:1px;';
      sub.textContent = 'Unlock by beating round records — not purchasable'; // [1.9]
      shopGrid.appendChild(header);
      shopGrid.appendChild(sub);
    } else {
      shopGrid.appendChild(header);
    }

    for (const s of SKINS.filter(x=>x.cat===cat)) {
      const isOwned=owned.includes(s.id), isActive=skinId===s.id;
      const isPrestige=!!s.unlock;
      const isLocked=isPrestige && !isOwned;

      const card=document.createElement('div');
      card.className='skin-card'+(isActive?' active':isOwned?' owned':'');
      if (isLocked) card.style.opacity='.5';

      const cv=document.createElement('canvas');
      cv.width=cv.height=38; cv.className='skin-preview';
      if (!isLocked) {
        drawSkin(cv.getContext('2d'),s.id,0,0,38,skinAnimT);
        if (isActive) cv.style.boxShadow=`0 0 10px ${skinColor()}`;
      } else {
        _shopDrawLockTile(cv); // [2.0-w1fix]
      }

      const nm=document.createElement('div'); nm.className='skin-name'; nm.textContent=s.name;

      const pr=document.createElement('div');
      pr.className='skin-price'+(isOwned||isActive?' owned':'');
      if (isActive)        pr.textContent='✓ Active'; // [1.9]
      else if (isOwned)    pr.textContent='Equip'; // [1.9]
      else if (isLocked)   pr.textContent=`${s.unlockDesc}`;
      else                 pr.textContent=`${s.price} 🪙`;

      if (isLocked) pr.style.cssText='font-size:9px;color:#664;text-align:center;line-height:1.3;';

      card.append(cv,nm,pr);
      if (isLocked) _shopMarkLockedPrestige(card); // [2.0-deemoji] gold padlock over the blank tile
      else { // [2.0-w1fix] ordinary items: greyed preview + thin lock instead of the prestige tile
        if (!isOwned) _shopMarkLocked(card);
        card.addEventListener('click',()=>buySkin(s.id, card));
        _shopPlayUnlockFx(card, 'skin', s.id);
      }
      shopGrid.appendChild(card);
    }
  }
}

function renderShopBLTab() { // [1.9] board skins + laser colors tab
  shopGridBL.innerHTML='';

  // [1.9.1] bug #8: No Grid toggle row (full-width, above board skins)
  const gridToggleRow = document.createElement('div');
  gridToggleRow.style.cssText = 'grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,.03);border:1.5px solid rgba(255,255,255,.08);border-radius:10px;padding:10px 14px;cursor:pointer;margin-bottom:4px;';
  const gridLabel = document.createElement('span');
  gridLabel.style.cssText = 'font-size:11px;letter-spacing:2px;color:#88aacc;';
  gridLabel.textContent = 'BOARD GRID LINES';
  const gridStatus = document.createElement('span');
  gridStatus.style.cssText = `font-size:11px;font-weight:bold;letter-spacing:1px;color:${showBoardGrid?'#0cf':'#446'};`;
  gridStatus.textContent = showBoardGrid ? '● ON' : '○ OFF';
  gridToggleRow.append(gridLabel, gridStatus);
  gridToggleRow.addEventListener('click', toggleNoGrid);
  shopGridBL.appendChild(gridToggleRow);

  const isVoid = currentWorld === 2; // [2.0-s5b]

  // ── SECTION A: BOARD SKINS ── [2.0-w1fix] rendered in both worlds again;
  // World 1 buys with coins, World 2 still only drops from the loot box.
  const bHeader = document.createElement('div');
  bHeader.className = 'shop-section-header';
  bHeader.textContent = '— BOARD SKINS —';
  shopGridBL.appendChild(bHeader);

  for (const def of (isVoid ? VOID_BOARD_SKIN_LIST : BOARD_SKIN_LIST)) {
    const isOwned    = isVoid ? voidBoardsOwned.includes(def.id) : boardsOwned.includes(def.id); // [2.0-s5b]
    const isActive   = (isVoid ? boardSkinIdW2 : boardSkinId) === def.id;
    const isPrestige = !!def.unlock;            // [2.0-w1fix] Prestige Gold — record unlock, not purchasable
    const isLocked   = isPrestige && !isOwned;

    const card = document.createElement('div');
    card.className = 'skin-card' + (isActive?' active':isOwned?' owned':'');
    if (isLocked || (isVoid && !isOwned)) card.style.opacity = '.5';

    const cv = document.createElement('canvas');
    cv.width = cv.height = 38; cv.className = 'skin-preview';
    if (isLocked) _shopDrawLockTile(cv); // [2.0-w1fix]
    else {
      drawBoardPreview(cv, def.id);
      if (isActive) cv.style.boxShadow = `0 0 10px ${BOARD_SKINS[def.id].grid}`;
    }

    const nm = document.createElement('div'); nm.className = 'skin-name'; nm.textContent = def.name;
    const pr = document.createElement('div');
    pr.className = 'skin-price' + (isOwned||isActive?' owned':'');
    if (isActive)           pr.textContent = '✓ Active';
    else if (isOwned)       pr.textContent = 'Equip';
    else if (isVoid)        pr.textContent = 'Loot box'; // [2.0-s5b] only obtainable via loot box
    else if (isLocked)    { pr.textContent = def.unlockDesc; pr.style.cssText='font-size:9px;color:#664;text-align:center;line-height:1.3;'; } // [2.0-w1fix]
    else if (def.price===0) pr.textContent = 'Free';
    else                    pr.textContent = `${def.price} 🪙`;

    card.append(cv,nm,pr);
    if (isVoid) {
      if (!isOwned) card.appendChild(_shopLockOverlay()); // [2.0-deemoji] padlock replaces the lock glyph in the price text
      card.addEventListener('click', ()=>buyBoardSkinW2(def.id));
    }
    else if (isLocked) _shopMarkLockedPrestige(card); // [2.0-deemoji] Prestige Gold
    else { // [2.0-w1fix] World 1 board skins are buyable again
      if (!isOwned) _shopMarkLocked(card);
      card.addEventListener('click', ()=>buyBoardSkin(def.id, card));
      _shopPlayUnlockFx(card, 'board', def.id);
    }
    shopGridBL.appendChild(card);
  }

  // ── SECTION B: LASER COLORS ──
  const lHeader = document.createElement('div');
  lHeader.className = 'shop-section-header';
  lHeader.textContent = '— LASER COLORS —';
  shopGridBL.appendChild(lHeader);

  const laserList      = isVoid ? VOID_LASER_COLOR_LIST : LASER_COLOR_LIST; // [2.0-s5a-r8]
  const laserOwnedList = isVoid ? voidLasersOwned : lasersOwned; // [2.0-s5b]
  const laserActiveId  = isVoid ? laserColorIdW2 : laserColorId;
  const buyLaserFn     = isVoid ? buyLaserColorW2 : buyLaserColor;

  for (const def of laserList) {
    const isOwned  = laserOwnedList.includes(def.id);
    const isActive = laserActiveId === def.id;

    const card = document.createElement('div');
    card.className = 'skin-card' + (isActive?' active':isOwned?' owned':'');
    if (isVoid && !isOwned) card.style.opacity = '.5';

    const cv = document.createElement('canvas');
    cv.width = cv.height = 38; cv.className = 'skin-preview';
    drawLaserPreview(cv, def.id);
    if (isActive) cv.style.boxShadow = `0 0 10px ${LASER_COLORS[def.id].fire}`;

    const nm = document.createElement('div'); nm.className = 'skin-name'; nm.textContent = def.name;
    const pr = document.createElement('div');
    pr.className = 'skin-price' + (isOwned||isActive?' owned':'');
    if (isActive)       pr.textContent = '✓ Active';
    else if (isOwned)   pr.textContent = 'Equip';
    else if (isVoid)    pr.textContent = 'Loot box'; // [2.0-s5b] only obtainable via loot box
    else if (def.price===0) pr.textContent = 'Free';
    else                pr.textContent = `${def.price} 🪙`;

    card.append(cv,nm,pr);
    if (!isVoid && !isOwned)     _shopMarkLocked(card); // [2.0-w1fix] W1 lasers get the same locked treatment
    else if (isVoid && !isOwned) card.appendChild(_shopLockOverlay()); // [2.0-deemoji] padlock replaces the lock glyph in the price text
    card.addEventListener('click', ()=>buyLaserFn(def.id, card));
    if (!isVoid) _shopPlayUnlockFx(card, 'laser', def.id); // [2.0-w1fix]
    shopGridBL.appendChild(card);
  }
}
function buySkin(id, cardEl){
  const s=SKINS.find(x=>x.id===id); if(!s||skinId===id) return;
  if (owned.includes(id)){skinId=id; invalidateSkinCache(); save(); playSkinSelect(); renderShop(); return;} // [1.9.2]
  if (coins<s.price){ _shopDeny(cardEl); return; } // [2.0-w1fix] sound + shake, no text
  coins-=s.price; owned.push(id); skinId=id; invalidateSkinCache(); save(); playSkinSelect(); // [1.9.2]
  _shopUnlockFx={kind:'skin',id}; renderShop(); // [2.0-w1fix]
  shopBal.classList.remove('purchase-flash'); void shopBal.offsetWidth; shopBal.classList.add('purchase-flash'); // [1.9.3]
}

// [2.0-w1fix] World 1 board skins — bought with coins (mirrors buyLaserColor); W2 boards stay loot-box-only
function buyBoardSkin(id, cardEl) {
  const def = BOARD_SKIN_LIST.find(b=>b.id===id);
  if (!def) return;
  if (def.unlock && !boardsOwned.includes(id)) return; // Prestige Gold: earned by beating round records
  if (boardsOwned.includes(id)) {
    if (boardSkinId === id) return;
    boardSkinId = id; localStorage.setItem('cm_board', id);
    applyBoardSkin(); playSkinSelect(); renderShop(); return;
  }
  if (def.price > 0 && coins < def.price) { _shopDeny(cardEl); return; }
  if (def.price > 0) coins -= def.price;
  boardsOwned.push(id); localStorage.setItem('cm_boards_owned', JSON.stringify(boardsOwned));
  boardSkinId = id; localStorage.setItem('cm_board', id);
  applyBoardSkin(); save(); playSkinSelect();
  _shopUnlockFx={kind:'board',id}; renderShop();
  shopBal.classList.remove('purchase-flash'); void shopBal.offsetWidth; shopBal.classList.add('purchase-flash');
}

function buyBoardSkinW2(id) { // [2.0-s5a-r9][2.0-s5b] equip-only — ownership comes from the loot box
  const def = VOID_BOARD_SKIN_LIST.find(b=>b.id===id);
  if (!def || !voidBoardsOwned.includes(id)) return; // not owned: no-op, must come from a loot box
  boardSkinIdW2 = id; localStorage.setItem('cm_board_w2', id);
  applyBoardSkin(); playSkinSelect(); renderShop();
}

function buyLaserColor(id, cardEl) { // [1.9]
  const def = LASER_COLOR_LIST.find(c=>c.id===id);
  if (!def) return;
  if (lasersOwned.includes(id)) {
    laserColorId = id; localStorage.setItem('cm_laser', id);
    playSkinSelect(); renderShop(); return; // [1.9.2]
  }
  if (def.price > 0 && coins < def.price) { _shopDeny(cardEl); return; } // [2.0-w1fix] sound + shake, no text
  if (def.price > 0) { coins -= def.price; save(); }
  lasersOwned.push(id); localStorage.setItem('cm_lasers_owned', JSON.stringify(lasersOwned));
  laserColorId = id; localStorage.setItem('cm_laser', id);
  playSkinSelect(); // [1.9.2]
  _shopUnlockFx={kind:'laser',id}; renderShop(); // [2.0-w1fix]
  shopBal.classList.remove('purchase-flash'); void shopBal.offsetWidth; shopBal.classList.add('purchase-flash'); // [1.9.3]
}

function buyLaserColorW2(id) { // [2.0-s5a-r8][2.0-s5b] equip-only — ownership comes from the loot box
  const def = VOID_LASER_COLOR_LIST.find(c=>c.id===id);
  if (!def || !voidLasersOwned.includes(id)) return; // not owned: no-op, must come from a loot box
  laserColorIdW2 = id; localStorage.setItem('cm_laser_w2', id);
  playSkinSelect(); renderShop();
}

function toggleNoGrid() { // [1.9.1]
  showBoardGrid = !showBoardGrid;
  localStorage.setItem('cm_nogrid', showBoardGrid ? '0' : '1');
  renderShop();
}

// ══════════════════════════════════════════════════
// MISSION SYSTEM
// ══════════════════════════════════════════════════


// Mission state (loaded from localStorage)
let missionState = null;

// Current session tracking (resets on game start)
let sessionStats = { lasers_dodged:0, coins_earned:0, rounds_played:0,
                     time_survived:0, rounds_no_hit:0, score_points:0 };
let consecutiveRoundsNoHit = 0;  // consecutive rounds without a hit this session
let sessionCoinsStart = 0;       // coins at session start

function mLoad() {
  try {
    const raw = localStorage.getItem('cm_missions');
    if (raw) missionState = JSON.parse(raw);
  } catch(e) { missionState = null; }
  mCheckReset();
}

function mSave() {
  localStorage.setItem('cm_missions', JSON.stringify(missionState));
}

function mCheckReset() {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000; // [2.0-s4] daily reset (was 7-day WEEK)

  if (!missionState || now >= missionState.resetAt) {
    // Generate a new day's missions
    const roll = Math.random();
    let weekType = 'normal';
    if (roll < 0.01)       weekType = 'luckiest';
    else if (roll < 0.16)  weekType = 'lucky';   // 1% already used, so 15% of remaining ≈ 0.16

    // Pick 3 unique missions
    const pool = [...MISSION_POOL];
    const chosen = [];
    while (chosen.length < 3 && pool.length > 0) {
      const i = Math.floor(Math.random() * pool.length);
      chosen.push({ ...pool[i], progress:0, claimed:false });
      pool.splice(i, 1);
    }

    missionState = {
      weekType,
      resetAt: (missionState?.resetAt || now) + DAY,  // [2.0-s4] exactly +1 day from last reset
      missions: chosen,
      bonusClaimed: false,
    };
    // If first time / long gap, resetAt = now + DAY
    if (!missionState.resetAt || missionState.resetAt < now) {
      missionState.resetAt = now + DAY;
    }
    mSave();
  }

  // Aktualizuj streak dzienny
  mCheckDailyStreak();
}

function mCheckDailyStreak() {
  const today = new Date().toDateString();
  const last  = localStorage.getItem('cm_last_day');
  if (last !== today) {
    localStorage.setItem('cm_last_day', today);
    if (last) {
      // Check if yesterday
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const streak = parseInt(localStorage.getItem('cm_streak') || '0');
      localStorage.setItem('cm_streak', last === yesterday ? streak + 1 : 1);
    } else {
      localStorage.setItem('cm_streak', '1');
    }
  }
}

function mRewardBase() {
  if (missionState.weekType === 'luckiest') return 150;
  if (missionState.weekType === 'lucky')    return 100;
  return 50;
}

function mProgressAdd(type, amount) {
  if (!missionState) return;
  let changed = false;
  for (const m of missionState.missions) {
    if (m.type === type && !m.claimed) {
      const before = m.progress;
      m.progress = Math.min(m.target, m.progress + amount);
      if (m.progress !== before) changed = true;
    }
  }
  // [2.0-s4] streak_days mission removed (daily reset) — special-case dropped
  if (changed) mSave();
}

function mIsDone(m) {
  return m.progress >= m.target;
}

function mAllDone() {
  return missionState.missions.every(m => mIsDone(m));
}

function mClaimMission(idx) {
  const m = missionState.missions[idx];
  if (!m || m.claimed || !mIsDone(m)) return;
  m.claimed = true;
  const reward = mRewardBase();
  coins += reward; save(); updateMenuCoins(true);
  statCoinsTotal += reward; localStorage.setItem('cm_stat_coins_total', statCoinsTotal); // [1.9.2]
  mSave();
  renderMissions();
  playUISound('reward');
  // float efekt w centrum ekranu
  spawnMenuCoinFloat(reward, innerWidth/2-30, innerHeight/2-80);
}

function mClaimBonus() {
  if (!mAllDone() || missionState.bonusClaimed) return;
  missionState.bonusClaimed = true;
  const bonus = mRewardBase();
  coins += bonus; save(); updateMenuCoins(true);
  statCoinsTotal += bonus; localStorage.setItem('cm_stat_coins_total', statCoinsTotal); // [1.9.2]
  mSave();
  renderMissions();
  playUISound('reward');
  // 3 floaty
  for(let i=0;i<3;i++) setTimeout(()=> spawnMenuCoinFloat(bonus, innerWidth/2-30+i*20, innerHeight/2-60-i*20), i*120);
}

// Countdown timer
let missionsTimerInterval = null;

function mTimerStr() {
  const left = Math.max(0, missionState.resetAt - Date.now());
  const d = Math.floor(left / 86400000);
  const h = Math.floor((left % 86400000) / 3600000);
  const m2 = Math.floor((left % 3600000) / 60000);
  const s2 = Math.floor((left % 60000) / 1000);
  if (d > 0) return `Reset in ${d}d ${h}h ${m2}m`; // [1.9]
  return `Reset in ${h}h ${m2}m ${s2}s`; // [1.9]
}

function showMissions() {
  showScreen('screen-missions');
  mCheckReset();
  renderMissions();
  // countdown
  if (missionsTimerInterval) clearInterval(missionsTimerInterval);
  missionsTimerInterval = setInterval(()=>{
    if (missionState) {
      document.getElementById('missions-timer').textContent = mTimerStr();
      // check reset
      if (Date.now() >= missionState.resetAt) {
        mCheckReset(); renderMissions();
      }
    }
  }, 1000);
}

function hideMissions() {
  if (missionsTimerInterval) { clearInterval(missionsTimerInterval); missionsTimerInterval=null; }
  showMenu();
}

function renderMissions() {
  if (!missionState) return;
  const wt = missionState.weekType;

  // Badge and style
  const badge = document.getElementById('missions-week-badge');
  const barM  = document.getElementById('bar-missions');
  badge.className = wt === 'luckiest' ? 'luckiest' : wt === 'lucky' ? 'lucky' : '';
  if (barM) barM.className = `menu-bar-btn${wt==='luckiest'?' luckiest':wt==='lucky'?' lucky':''}`;
  if (wt==='luckiest')     badge.textContent = 'Luckiest Day';   // [2.0-deemoji] // [2.0-s4] daily
  else if (wt==='lucky')   badge.textContent = 'Lucky Day';      // [2.0-deemoji] // [2.0-s4] daily
  else                     badge.textContent = 'Normal Day'; // [2.0-s4] daily

  document.getElementById('missions-timer').textContent = mTimerStr();

  // Missions
  const list = document.getElementById('missions-list');
  list.innerHTML = '';
  const base = mRewardBase();

  missionState.missions.forEach((m, idx) => {
    const done    = mIsDone(m);
    const pct     = Math.min(100, Math.round(m.progress / m.target * 100));
    const card    = document.createElement('div');
    card.className = `mission-card${m.claimed?' claimed':done?' done':''}`;

    card.innerHTML = `
      <div class="mission-top">
        <div class="mission-name">${m.name}</div>
        <div class="mission-reward">+${base} 🪙</div>
      </div>
      <div class="mission-progress-wrap">
        <div class="mission-progress-bar" style="width:${pct}%"></div>
      </div>
      <div class="mission-progress-text">
        <span>${m.progress} / ${m.target}</span>
        <span>${pct}%</span>
      </div>
      ${done && !m.claimed ? `<button class="mission-claim-btn" data-idx="${idx}">CLAIM ${base} 🪙</button>` : ''}
      ${m.claimed ? `<div style="text-align:center;font-size:11px;color:#446;margin-top:6px;">✓ Claimed</div>` : ''}
    `;
    list.appendChild(card);
  });

  // Bonus
  const allDone   = missionState.missions.every(m => mIsDone(m));
  const bonusCard = document.getElementById('missions-bonus-card');
  const bonusBtn  = document.getElementById('missions-bonus-btn');
  const bonusDesc = document.getElementById('missions-bonus-desc');

  bonusCard.className = `${missionState.bonusClaimed?'claimed':allDone?'ready':''}`;
  bonusDesc.textContent = missionState.bonusClaimed // [1.9]
    ? '✓ Bonus claimed'
    : allDone
    ? `All missions complete! Reward: +${base} 🪙`
    : `Complete all 3 missions to unlock bonus +${base} 🪙`;
  bonusBtn.disabled = !allDone || missionState.bonusClaimed;
  bonusBtn.textContent = missionState.bonusClaimed ? '✓ CLAIMED' : `CLAIM BONUS +${base} 🪙`; // [1.9]

  // Event listeners for claim buttons
  list.querySelectorAll('.mission-claim-btn').forEach(btn => {
    btn.addEventListener('click', ()=> mClaimMission(parseInt(btn.dataset.idx)));
  });
}

// Load missions on startup
mLoad();

// ── IN-GAME MISSION TRACKING ──
// Called from appropriate places in game

function mTrackGameStart() {
  sessionCoinsStart = coins;
  sessionStats = { lasers_dodged:0, coins_earned:0, rounds_played:0,
                   time_survived:0, rounds_no_hit:0, score_points:0 };
  consecutiveRoundsNoHit = 0;
  mCheckDailyStreak(); // [2.0-s4] streak counter still tracked; no streak mission remains
}

function mTrackRoundSurvived(hitThisRound) {
  sessionStats.rounds_played++;
  mProgressAdd('rounds_played', 1);
  mProgressAdd('score_points', 1);
  if (!hitThisRound) {
    consecutiveRoundsNoHit++;
    mProgressAdd('rounds_no_hit', 1);
  } else {
    consecutiveRoundsNoHit = 0;
  }
}

function mTrackLaserDodged() {
  mProgressAdd('lasers_dodged', 1);
}

function mTrackCoins(earned) {
  mProgressAdd('coins_earned', earned);
}

function mTrackTime(seconds) {
  mProgressAdd('time_survived', seconds);
}

// ── TESTER: MISSION FUNCTIONS ──
function tSetWeek(type) {
  if (!missionState) return;
  missionState.weekType = type;
  mSave();
  renderMissions();
  const barM = document.getElementById('bar-missions');
  if (barM) barM.className = `menu-bar-btn${type==='luckiest'?' luckiest':type==='lucky'?' lucky':''}`;
}

function tCompleteAllMissions() {
  if (!missionState) return;
  missionState.missions.forEach(m => { m.progress = m.target; });
  mSave();
  renderMissions();
}

function tResetMissions() {
  if (!missionState) return;
  const weekType = missionState.weekType;
  const pool = [...MISSION_POOL];
  const chosen = [];
  while (chosen.length < 3 && pool.length > 0) {
    const i = Math.floor(Math.random() * pool.length);
    chosen.push({ ...pool[i], progress:0, claimed:false });
    pool.splice(i,1);
  }
  missionState.missions = chosen;
  missionState.bonusClaimed = false;
  mSave();
  renderMissions();
}

function tUnlockPrestige() {
  const prestigeIds = SKINS.filter(s=>s.unlock).map(s=>s.id);
  prestigeIds.forEach(id=>{ if(!owned.includes(id)) owned.push(id); });
  BOARD_SKIN_LIST.filter(b=>b.unlock).forEach(b=>{ if(!boardsOwned.includes(b.id)) boardsOwned.push(b.id); }); // [1.9]
  localStorage.setItem('cm_boards_owned', JSON.stringify(boardsOwned)); // [1.9]
  save();
}

function tUnlockAll() {
  SKINS.forEach(s=>{ if(!owned.includes(s.id)) owned.push(s.id); });
  BOARD_SKIN_LIST.forEach(b=>{ if(!boardsOwned.includes(b.id)) boardsOwned.push(b.id); }); // [1.9.1]
  LASER_COLOR_LIST.forEach(c=>{ if(!lasersOwned.includes(c.id)) lasersOwned.push(c.id); }); // [1.9.1]
  localStorage.setItem('cm_boards_owned', JSON.stringify(boardsOwned)); // [1.9.1]
  localStorage.setItem('cm_lasers_owned', JSON.stringify(lasersOwned)); // [1.9.1]
  save();
}

// ══════════════════════════════════════════════════
// [2.0-s4h] TUTORIAL — guided live run on the real engine (learn-by-doing)
// ══════════════════════════════════════════════════

function _tutCoach(text) { // [2.0-s4h] one-line coachmark bubble
  if (_tutCoachEl) { _tutCoachEl.textContent = text; _tutCoachEl.style.display = 'block'; }
}
function _tutHideUI() { // [2.0-s4h] hide coachmark + skip
  if (_tutCoachEl) _tutCoachEl.style.display = 'none';
  if (_tutSkipEl)  _tutSkipEl.style.display  = 'none';
}

function _tutorialStart() { // [2.0-s4h] entry from startGame when tutorialActive — drives the scripted beats
  clearTimeout(phaseTimer);
  lasers = []; blocks = [];
  tutBeat = 0;
  _tutLaserRow = -1; _tutBlock = null; _tutAwaiting = null; // [2.0-s4h-r1]
  if (_tutSkipEl) _tutSkipEl.style.display = 'block';
  _tutBeat1();
}

function _tutBeat1() { // [2.0-s4h] BEAT 1 — dash within range (render() already glows the range)
  tutBeat = 0;
  lasers = []; blocks = [];
  _tutCoach('Tap a glowing cell to move');
  render();
}

function _tutOnDash() { // [2.0-s4h-r1] advance scripted beat on every player dash
  if (tutBeat === 0) {
    tutBeat = 1; _tutCoach('Nice!');
    phaseTimer = _schedulePhase(_tutBeat2, 600);
  } else if (tutBeat === 1 && _tutAwaiting === 'escape') {
    if (cube.y !== _tutLaserRow) { _tutAwaiting = null; _tutFireLaser(); }
    else _tutCoach('Away from the red line!');
  } else if (tutBeat === 2 && _tutAwaiting === 'dodge') {
    if (cube.x !== _tutBlock.x || cube.y !== _tutBlock.y) { _tutAwaiting = null; _tutLandBlock(); }
    else _tutCoach('Not there — tap somewhere else!');
  }
}

function _tutBeat2() { // [2.0-s4h-r1] BEAT 2 — spawn charging laser; fire only after player dashes off the row
  if (!alive || !tutorialActive) return;
  tutBeat = 1;
  _tutLaserRow = cube.y;
  lasers = [{ type:'row', idx:_tutLaserRow, state:'charge' }];
  blocks = [];
  _tutAwaiting = 'escape';
  _tutCoach('Dash off the red line!');
  if (currentWorld === 2) { _flareChargeStart = Date.now(); _flareChargeDur = CHARGE_START*2; playSolarFlareCharge(); }
  else playSound('laser_charge');
  render();
  // No _schedulePhase — fire is triggered by _tutOnDash when cube.y !== _tutLaserRow
}

function _tutFireLaser() { // [2.0-s4h-r1] player escaped the row — fire the laser then advance
  if (!alive || !tutorialActive) return;
  for (const L of lasers) L.state = 'fire';
  if (currentWorld === 2) { _flareFireStart = Date.now(); _flareFireDur = FIRE_MS; playSolarFlareRelease(); }
  else playSound('laser_fire');
  render();
  phaseTimer = _schedulePhase(() => {
    if (!alive || !tutorialActive) return;
    lasers = []; render();
    tutBeat = 2;
    phaseTimer = _schedulePhase(_tutBeat3, 500);
  }, FIRE_MS);
}

function _tutBeat3() { // [2.0-s4h-r1] BEAT 3 — spawn block on adjacent cell; land only after player dashes away
  if (!alive || !tutorialActive) return;
  tutBeat = 2; lasers = [];
  const bx = cube.x + 1 <= N - 1 ? cube.x + 1 : cube.x - 1;
  _tutBlock = { x: bx, y: cube.y };
  blocks = [{ x: _tutBlock.x, y: _tutBlock.y, state: 'charge' }];
  _tutAwaiting = 'dodge';
  _tutCoach("Tap away — don't land on purple!");
  render();
  // No _schedulePhase — land is triggered by _tutOnDash when cube !== _tutBlock
}

function _tutLandBlock() { // [2.0-s4h-r1] player cleared the block cell — land it then finish
  if (!alive || !tutorialActive) return;
  for (const b of blocks) { b.state = 'land'; spawnBlockImpact(b.x, b.y); }
  render();
  phaseTimer = _schedulePhase(() => {
    if (!alive || !tutorialActive) return;
    blocks = []; render();
    _tutFinish();
  }, 600);
}

function _tutFinish() { // [2.0-s4h] reward (preserved from old tutFinish) + cleanup → menu
  clearTimeout(phaseTimer);
  lasers = []; blocks = [];
  _tutLaserRow = -1; _tutBlock = null; _tutAwaiting = null; // [2.0-s4h-r1]
  tutorialActive = false;
  _tutCoach("You're ready!");
  localStorage.setItem('cm_tutorial_done','1');
  if (localStorage.getItem('cm_tutorial_rewarded') !== '1') { // [1.9.1] one-time reward
    coins += 100; save();
    statCoinsTotal += 100; localStorage.setItem('cm_stat_coins_total', statCoinsTotal); // [1.9.2]
    localStorage.setItem('cm_tutorial_rewarded','1');
    playSound('coin');
    setTimeout(() => { _tutHideUI(); showMenu(); }, 1800);
  } else {
    _tutHideUI(); showMenu();
  }
}

function _tutSkip() { // [2.0-s4h] corner skip → finish immediately, no reward
  clearTimeout(phaseTimer);
  lasers = []; blocks = [];
  _tutLaserRow = -1; _tutBlock = null; _tutAwaiting = null; // [2.0-s4h-r1]
  tutorialActive = false;
  localStorage.setItem('cm_tutorial_done','1');
  _tutHideUI();
  showMenu();
}

function startTutorial() { // [2.0-s4h] guided live run on the real engine
  gameMode = null;
  startGame(false, false, false, true); // tutorial=true → _tutorialStart() drives the scripted beats
  playUISound('tab');
}

// ── FLOATING TESTER PANEL ──
function _updateFloatBtns() {
  const set = (id, val, label) => {
    const b = document.getElementById(id);
    if (!b) return;
    b.textContent = label + (val ? ': ON' : ': OFF');
    b.classList.toggle('on', val);
  };
  set('tf-noclip',  tNoclip,  '💀 Noclip');
  set('tf-dashinf', tDashInf, '⚡ ∞ Dashes'); // [1.9]
  set('tf-slow',    tSlow,    '🐢 Slow');
  set('tf-freeze',  tFreeze,  '❄️ Freeze');
}

// [2.0-s4] Dash fires to the cell first pressed, ignoring cursor movement before release.
window.addEventListener('pointerup', () => {
  if (_dashPressX < 0) return;
  const px = _dashPressX, py = _dashPressY;
  _dashPressX = _dashPressY = -1;
  tryDash(px, py);
});
window.addEventListener('pointercancel', () => { _dashPressX = _dashPressY = -1; });

// ── WSZYSTKIE EVENTY MENU ──
document.getElementById('bar-missions').addEventListener('click',  showMissions);
document.getElementById('bar-shop').addEventListener('click',      ()=>{ if (currentWorld === 2) { openVoidShop(); } else { showScreen('screen-start'); openShop(true); } }); // [2.0-s5c] W2 → Void Shop
document.getElementById('bar-stats').addEventListener('click',     showStats);
document.getElementById('bar-tester').addEventListener('click',    showPin); // [1.10.1] always PIN
document.getElementById('bar-reset').addEventListener('click', ()=>{
  resetDialog.style.visibility='visible'; resetDialog.style.pointerEvents='auto';
});
document.getElementById('missions-close').addEventListener('click', hideMissions);
document.getElementById('missions-bonus-btn').addEventListener('click', mClaimBonus);
document.getElementById('btn-tutorial').addEventListener('click', startTutorial);
document.getElementById('btn-modes').addEventListener('click', showModes); // [1.10]
document.getElementById('btn-modes-back').addEventListener('click', () => { clearInterval(_modesCountdownInterval); showMenu(); }); // [1.10]
document.getElementById('btn-start').addEventListener('click',    ()=>beginGame(false)); // [2.0-s2]
document.getElementById('btn-hard').addEventListener('click',     ()=>beginGame(true));  // [2.0-s2]
// [2.0-s1] World system wiring
document.getElementById('btn-world-switch').addEventListener('click', () => {
  currentWorld = currentWorld === 2 ? 1 : 2;
  localStorage.setItem('cm_current_world', String(currentWorld));
  applyWorldTheme();
  // [2.0-s4d] first time entering the Void → play Cubek 2.0 right away, then return to the (now W2) menu
  if (currentWorld === 2 && localStorage.getItem('cm_cubek2_done') !== 'true') {
    showCubek2(() => showMenu());
    return;
  }
  showMenu(); // refresh button label + currency icon
});
document.getElementById('wc-world1').addEventListener('click', () => { // Continue in World 1
  playUISound('tab'); showScreen('app'); startRound(); // round 100 → 101, theme unchanged
});
document.getElementById('wc-world2').addEventListener('click', () => { // Enter the Void
  playUISound('tab');
  currentWorld = 2; localStorage.setItem('cm_current_world', '2');
  applyWorldTheme();
  if (localStorage.getItem('cm_cubek2_done') === 'true') startGame(false);
  else showCubek2(() => startGame(false)); // [2.0-s4d] entering the Void fresh is always Normal
});
document.getElementById('cubek2-next').addEventListener('click', cubek2Next);
document.getElementById('stats-close').addEventListener('click',    showMenu);
document.getElementById('stats-tab-w1').addEventListener('click', ()=>{ statsView=1; playUISound('tab'); renderStats(); }); // [2.0-s3]
document.getElementById('stats-tab-w2').addEventListener('click', ()=>{ statsView=2; playUISound('tab'); renderStats(); }); // [2.0-s3]
document.getElementById('btn-retry').addEventListener('click',      ()=>startGame(hardMode)); // [1.10.1]
document.getElementById('btn-to-menu').addEventListener('click',    showMenu);
document.getElementById('pin-back').addEventListener('click',       ()=>showMenu());
document.getElementById('pin-ok').addEventListener('click',         submitPin);
document.getElementById('pin-del').addEventListener('click',        ()=>{ pinBuffer=pinBuffer.slice(0,-1); updatePinDisplay(); });
document.querySelectorAll('.pin-btn[data-v]').forEach(b=>{
  b.addEventListener('click',()=>{ if(pinBuffer.length<9){ pinBuffer+=b.dataset.v; updatePinDisplay(); } }); // [1.9.2]
});
// [1.10.1] FAB open/close — state tracked via _fabOpen boolean, independent of tSpeedMult [1.10.2]
function _toggleFab() { // [1.10.2]
  const menu = document.getElementById('tester-fab-menu');
  if (!menu) return;
  _fabOpen = !_fabOpen;
  if (_fabOpen) {
    renderFabMenu();
    menu.classList.remove('fab-hidden');
    fabPauseGame();
  } else {
    menu.classList.add('fab-hidden');
    fabResumeGame();
  }
}
document.getElementById('tester-fab-btn').addEventListener('click', _toggleFab);
// [2.0-s4h] Tutorial — single corner skip button
document.getElementById('tut-skip').addEventListener('click', ()=>{ playSound('click'); _tutSkip(); });
document.getElementById('reset-cancel').addEventListener('click', ()=>{
  resetDialog.style.visibility='hidden';
  resetDialog.style.pointerEvents='none';
});
document.getElementById('reset-confirm').addEventListener('click', ()=>{
  localStorage.clear(); location.reload();
});
shopClose.addEventListener('click', closeShop);
// [2.0-s5c] Void Shop close / reveal continue
document.getElementById('void-shop-close').addEventListener('click', closeVoidShop);
voidRevealOk.addEventListener('click', closeVoidReveal);
// [1.9] Shop tab switching
document.getElementById('shop-tab-cube').addEventListener('click', ()=>{ shopActiveTab='cube'; renderShop(); });
document.getElementById('shop-tab-bl').addEventListener('click',   ()=>{ shopActiveTab='bl';   renderShop(); });
window.addEventListener('resize', ()=>{ if(alive&&appEl.style.visibility!=='hidden'){ invalidateSkinCache(); buildBoard(); render(); } });
// inicjalizacja
applyWorldTheme(); // [2.0-s1] reflect remembered world preference on load
if (!localStorage.getItem('cm_tutorial_done')) {
  startTutorial(); // [1.10.2] auto-start tutorial on first launch
} else {
  showMenu();
}
