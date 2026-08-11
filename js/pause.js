// [MODULE] Player-facing pause — Escape key / HUD button, RESUME + MENU overlay.
// [MODULE] Reuses the tester's fabPauseGame/fabResumeGame, which already freeze virtual time,
// [MODULE] the phase timer, asteroids, the black-hole teleport and the combo flash with full
// [MODULE] elapsed-time accounting. `_pausedByPlayer` itself is declared in state.js.
// ── PLAYER PAUSE ──

const _pauseOverlayEl = document.getElementById('pause-overlay');
const _hudPauseBtn    = document.getElementById('hud-pause-btn');

function _openPauseOverlay() { // [2.0-pause] single entry point for both Escape and the HUD button
  if (!alive || _pausedByPlayer) return;
  if (tutorialActive || customGame) return;   // tutorial drives scripted beats; sandbox is tester-only
  if (fabPaused) return;                      // tester's FAB pause already owns the freeze
  if (appEl.style.visibility !== 'visible') return; // not on the game screen ('' before first showScreen)
  _pausedByPlayer = true;
  fabPauseGame();
  cgGameplayStop(); // [2.0-sdk] paused is not active gameplay
  if (_pauseOverlayEl) _pauseOverlayEl.classList.add('show');
  render(); // repaint so the canvas drops its own tester PAUSED text (suppressed while _pausedByPlayer)
  playUISound('click');
}

function _closePauseOverlay(toMenu) {
  if (!_pausedByPlayer) return;
  _pausedByPlayer = false;
  if (_pauseOverlayEl) _pauseOverlayEl.classList.remove('show');
  if (toMenu) {
    showMenu(); // does its own cleanup: alive=false, timers cleared, fabPaused=false, gameplayStop
  } else {
    fabResumeGame();
    cgGameplayStart(); // [2.0-sdk] back to actual play
    playUISound('click');
  }
}

// No other keydown listener exists anywhere in js/, so Escape is uncontested.
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (_pausedByPlayer) _closePauseOverlay(false);
  else                 _openPauseOverlay();
});

document.getElementById('pause-resume-btn').addEventListener('click', () => _closePauseOverlay(false));
document.getElementById('pause-menu-btn').addEventListener('click',   () => _closePauseOverlay(true));
if (_hudPauseBtn) _hudPauseBtn.addEventListener('click', _openPauseOverlay);
