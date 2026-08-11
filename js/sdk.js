// [MODULE] CrazyGames SDK v3 — init, loading/gameplay lifecycle, ad helpers.
// [MODULE] Everything here is optional: the game must behave identically with no SDK at all
// [MODULE] (opened from disk, or hosted on GitHub Pages). Nothing in this file may throw.
// ── CRAZYGAMES SDK ──

let _cgSdk   = null;
let _cgReady = false;

// [2.0-sdk] Mirrors what we last told CrazyGames, so every call site can be written as a plain
// cgGameplayStart()/cgGameplayStop() and stay idempotent. showMenu() in particular fires on cold
// boot and from stats/PIN/modes/shop-close, where no gameplay was ever running — without this
// latch it would emit a stream of gameplayStop with no matching start.
let _cgGameplayActive = false;

// [2.0-sdk] loadingStop is requested by main.js's bootstrap tail, which runs synchronously at the
// end of page load — while init() is still awaiting. So the request is recorded and flushed once
// the SDK is actually ready; the latch keeps it to exactly one call.
let _cgLoadingStopWanted = false;
let _cgLoadingStopDone   = false;

(async function initCrazyGamesSdk() {
  if (!window.CrazyGames || !window.CrazyGames.SDK) {
    console.log('[CrazyGames SDK] not present — running standalone');
    return; // opened from disk, or the CDN is unreachable. Game runs untouched.
  }
  _cgSdk = window.CrazyGames.SDK;

  try {
    await _cgSdk.init();
    // The environment gate is the important part. On any domain that isn't CrazyGames or
    // localhost the SDK loads fine and window.CrazyGames.SDK exists, but the environment is
    // 'disabled' and EVERY method call throws. A presence check alone would leave the game
    // throwing on every lifecycle event on GitHub Pages.
    const env = typeof _cgSdk.getEnvironment === 'function' ? _cgSdk.getEnvironment() : _cgSdk.environment;
    if (env !== 'local' && env !== 'crazygames') {
      console.log('[CrazyGames SDK] environment "' + env + '" — SDK calls disabled, running standalone');
      _cgSdk = null;
      return;
    }
    _cgReady = true;
    console.log('[CrazyGames SDK] initialized (environment: ' + env + ')');
    // loadingStart must come AFTER init. Calling it earlier — which is what you'd want, to catch
    // the whole load — makes the SDK log "CrazySDK is not initialized yet" to the console on every
    // single boot. Verified in the browser. A red error at startup is exactly what a submission
    // reviewer looks for, and the measurement is near-worthless here anyway: every script in this
    // game loads synchronously, so the real work is already done by the time init() resolves.
    try { _cgSdk.game.loadingStart(); } catch (e) {}
    _cgFlushLoadingStop(); // the bootstrap tail almost certainly already asked for this
  } catch (e) {
    console.warn('[CrazyGames SDK] init failed — running standalone', e);
    _cgReady = false;
    _cgSdk   = null;
  }
})();

function _cgFlushLoadingStop() {
  if (_cgLoadingStopDone || !_cgLoadingStopWanted || !_cgReady || !_cgSdk) return;
  _cgLoadingStopDone = true;
  try { _cgSdk.game.loadingStop(); } catch (e) {}
}

function cgLoadingStop() { // [2.0-sdk] game is interactive
  _cgLoadingStopWanted = true;
  _cgFlushLoadingStop();
}

function cgGameplayStart() { // [2.0-sdk] player is actually playing
  if (!_cgReady || !_cgSdk || _cgGameplayActive) return;
  _cgGameplayActive = true;
  try { _cgSdk.game.gameplayStart(); } catch (e) {}
}

function cgGameplayStop() { // [2.0-sdk] menu, pause, death, world choice — anything that isn't play
  if (!_cgReady || !_cgSdk || !_cgGameplayActive) return;
  _cgGameplayActive = false;
  try { _cgSdk.game.gameplayStop(); } catch (e) {}
}

// [2.0-sdk] Tab hidden / phone locked. fabPaused is already true during a player pause (pause.js
// routes through fabPauseGame), so that check alone would do — _pausedByPlayer is kept alongside it
// because the two mean different things and a future change to either shouldn't silently couple them.
document.addEventListener('visibilitychange', () => {
  if (!alive || fabPaused || _pausedByPlayer) return;
  if (document.hidden) cgGameplayStop();
  else                 cgGameplayStart();
});

// ── ADS — built, deliberately NOT called ──────────────────────────────────────
// Ads are off under Basic Launch regardless of integration, and the roadmap defers them to
// post-launch. These exist so switching to Full Launch is a one-line change at the call site
// rather than a second integration pass. Reuses the tester's pause machinery, which already
// freezes every game timer with full elapsed-time accounting.
// Note fabPauseGame() early-returns when !alive — an ad shown from the menu simply doesn't pause
// anything, which is correct, since nothing is running.

function cgShowMidgameAd(onDone) {
  if (!_cgReady || !_cgSdk) { onDone(); return; } // no SDK: carry on as if the ad finished
  try {
    _cgSdk.ad.requestAd('midgame', {
      adStarted:  () => { fabPauseGame(); _cgMuteAudio(true); },
      adFinished: () => { _cgMuteAudio(false); fabResumeGame(); onDone(); },
      adError:    (e) => { console.warn('[CrazyGames] midgame ad error', e); _cgMuteAudio(false); fabResumeGame(); onDone(); },
    });
  } catch (e) { console.warn('[CrazyGames] midgame ad threw', e); _cgMuteAudio(false); fabResumeGame(); onDone(); }
}

function cgShowRewardedAd(onReward, onDeclineOrFail) {
  if (!_cgReady || !_cgSdk) { onDeclineOrFail(); return; } // no SDK: no ad watched, so no reward
  try {
    _cgSdk.ad.requestAd('rewarded', {
      adStarted:  () => { fabPauseGame(); _cgMuteAudio(true); },
      adFinished: () => { _cgMuteAudio(false); fabResumeGame(); onReward(); },
      adError:    (e) => { console.warn('[CrazyGames] rewarded ad error', e); _cgMuteAudio(false); fabResumeGame(); onDeclineOrFail(); },
    });
  } catch (e) { console.warn('[CrazyGames] rewarded ad threw', e); _cgMuteAudio(false); fabResumeGame(); onDeclineOrFail(); }
}
