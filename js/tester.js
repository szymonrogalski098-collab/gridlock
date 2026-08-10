// [MODULE] Developer-only tester mode: PIN gate, FAB menu and every debug action.
// [MODULE] Split out of cube_master.js - lines moved verbatim, no logic changed.
// [MODULE] Load order matters: see the script tags at the bottom of index.html.
// ── TESTER MODE ──
// PIN verified via SHA-256 (Web Crypto API) — PIN never stored in code
const _ph = '269ab13c93ed7ad03880ad739c160e9e202bcd6ef066b6240546479ed0d38afd'; // [1.9.2] updated PIN
async function _vp(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('') === _ph;
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
