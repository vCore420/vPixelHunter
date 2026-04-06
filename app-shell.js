import { startVPixelHunterGame } from './game/index.js';
import { clearHighScore, writeStoredValue, removeStoredValue } from './game/shell.js';
import { playerSprites, defaultPlayerSpriteId } from './game/data.js';

const appRoot = document.getElementById('standaloneApp');
const viewRoot = document.getElementById('standaloneView');
const fullscreenToggle = document.getElementById('fullscreenToggle');
const restartGameBtn = document.getElementById('restartGameBtn');
const clearHighScoreBtn = document.getElementById('clearHighScoreBtn');
const touchControlsToggle = document.getElementById('touchControlsToggle');
const touchControlsPanel = document.getElementById('touchControlsPanel');

const state = {
  inGame: false,
  fullscreen: false,
  selectedPlayerSpriteId: defaultPlayerSpriteId,
  touchControlsVisible: false
};

const LEGACY_STORAGE_PREFIX = ['monster', 'Tamer'].join('');
const PLAYER_SPRITE_KEY = 'vPixelHunterPlayerSprite';
const LEGACY_PLAYER_SPRITE_KEY = `${LEGACY_STORAGE_PREFIX}PlayerSprite`;
const TOUCH_CONTROLS_KEY = 'vPixelHunterTouchControls';
const LEGACY_TOUCH_CONTROLS_KEY = `${LEGACY_STORAGE_PREFIX}TouchControls`;
const RUN_SAVE_KEY = 'vPixelHunterRunSave';
const LEGACY_RUN_SAVE_KEY = `${LEGACY_STORAGE_PREFIX}RunSave`;
const HIGH_SCORE_RESET_EVENT = 'vPixelHunter:high-score-reset';
const GAME_KEY = 'vPixelHunter';
const LEGACY_GAME_KEY = LEGACY_STORAGE_PREFIX;
const DIRECTIONAL_REPEAT_MS = 150;

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }
  if (window.location.protocol !== 'http:' && window.location.protocol !== 'https:') {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch((error) => {
      console.warn('vPixelHunter service worker registration failed.', error);
    });
  }, { once: true });
}

function createVirtualControl() {
  return {
    onclick: null,
    click() {
      if (typeof this.onclick === 'function') {
        this.onclick();
      }
    }
  };
}

const controls = {
  left: createVirtualControl(),
  right: createVirtualControl(),
  confirm: createVirtualControl(),
  back: createVirtualControl()
};

let onScroll = null;
let lastDirectionalInputAt = 0;
const heldDirectionState = new Map();

function runDirectionalAction(key) {
  if (key === 'ArrowLeft') {
    controls.left.click();
    return;
  }
  if (key === 'ArrowRight') {
    controls.right.click();
    return;
  }
  if (key === 'ArrowUp') {
    if (typeof onScroll === 'function') onScroll(-1);
    return;
  }
  if (key === 'ArrowDown') {
    if (typeof onScroll === 'function') onScroll(1);
  }
}

function stopHeldDirection(key) {
  const heldState = heldDirectionState.get(key);
  if (heldState?.timeoutId) {
    clearTimeout(heldState.timeoutId);
  }
  heldDirectionState.delete(key);
}

function stopAllHeldDirections() {
  Array.from(heldDirectionState.keys()).forEach(stopHeldDirection);
}

function scheduleHeldDirection(key) {
  const heldState = heldDirectionState.get(key);
  if (!heldState?.active) return;

  const elapsed = performance.now() - lastDirectionalInputAt;
  const delay = Math.max(0, DIRECTIONAL_REPEAT_MS - elapsed);
  heldState.timeoutId = window.setTimeout(() => {
    const nextHeldState = heldDirectionState.get(key);
    if (!nextHeldState?.active || !state.inGame) return;
    runDirectionalAction(key);
    lastDirectionalInputAt = performance.now();
    scheduleHeldDirection(key);
  }, delay || DIRECTIONAL_REPEAT_MS);
}

function startHeldDirection(key) {
  if (heldDirectionState.has(key)) return;
  heldDirectionState.set(key, { active: true, timeoutId: null });

  const elapsed = performance.now() - lastDirectionalInputAt;
  if (elapsed >= DIRECTIONAL_REPEAT_MS) {
    runDirectionalAction(key);
    lastDirectionalInputAt = performance.now();
  }

  scheduleHeldDirection(key);
}

function readLocalJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

function readStoredPlayerSpriteId() {
  try {
    const storedValue = localStorage.getItem(PLAYER_SPRITE_KEY)
      || localStorage.getItem(LEGACY_PLAYER_SPRITE_KEY);
    return storedValue && playerSprites[storedValue] ? storedValue : defaultPlayerSpriteId;
  } catch (error) {
    return defaultPlayerSpriteId;
  }
}

function readStoredTouchControlsPreference() {
  try {
    return localStorage.getItem(TOUCH_CONTROLS_KEY) === '1'
      || localStorage.getItem(LEGACY_TOUCH_CONTROLS_KEY) === '1';
  } catch (error) {
    return false;
  }
}

function writeStoredPlayerSpriteId(spriteId) {
  writeStoredValue(PLAYER_SPRITE_KEY, spriteId);
}

function setTouchControlsVisible(nextValue) {
  state.touchControlsVisible = Boolean(nextValue);
  if (touchControlsToggle) {
    touchControlsToggle.checked = state.touchControlsVisible;
  }
  if (touchControlsPanel) {
    touchControlsPanel.dataset.visible = state.touchControlsVisible ? 'true' : 'false';
    touchControlsPanel.setAttribute('aria-hidden', state.touchControlsVisible ? 'false' : 'true');
  }
}

function persistTouchControlsPreference(nextValue) {
  if (nextValue) {
    writeStoredValue(TOUCH_CONTROLS_KEY, '1');
    return;
  }
  removeStoredValue(TOUCH_CONTROLS_KEY);
}

function renderScreen(content) {
  viewRoot.innerHTML = content;
}

function setScrollHandler(nextHandler) {
  onScroll = nextHandler;
}

function setInGame(nextValue) {
  state.inGame = nextValue;
  appRoot.dataset.mode = nextValue ? 'game' : 'home';
  if (!nextValue) {
    stopAllHeldDirections();
  }
}

function syncPlayerSpriteSelect() {
  const select = document.getElementById('playerSpriteSelect');
  if (!select) return;
  if (!select.options.length) {
    Object.entries(playerSprites).forEach(([spriteId, config]) => {
      const option = document.createElement('option');
      option.value = spriteId;
      option.textContent = config.label;
      select.appendChild(option);
    });
    select.addEventListener('change', () => {
      state.selectedPlayerSpriteId = select.value in playerSprites ? select.value : defaultPlayerSpriteId;
      writeStoredPlayerSpriteId(state.selectedPlayerSpriteId);
    });
  }
  select.value = state.selectedPlayerSpriteId;
}

async function setFullscreen(enabled) {
  state.fullscreen = enabled;
  appRoot.classList.toggle('fullscreen-mode', enabled);
  if (fullscreenToggle) {
    fullscreenToggle.checked = enabled;
  }

  if (enabled) {
    if (document.fullscreenElement !== appRoot && appRoot.requestFullscreen) {
      try {
        await appRoot.requestFullscreen();
      } catch (error) {
        // Ignore Fullscreen API failures and keep CSS-based expanded mode.
      }
    }
    return;
  }

  if (document.fullscreenElement && document.exitFullscreen) {
    try {
      await document.exitFullscreen();
    } catch (error) {
      // Ignore exit failures.
    }
  }
}

function launchVPixelHunter(openFullscreen) {
  setInGame(true);
  syncPlayerSpriteSelect();
  startVPixelHunterGame({
    renderScreen,
    readLocalJson,
    goBack,
    controls,
    setScrollHandler,
    getSelectedPlayerSpriteId: () => state.selectedPlayerSpriteId
  });
  if (openFullscreen) {
    setFullscreen(true);
  }
}

function goBack() {
  launchVPixelHunter(false);
}

function releaseTouchButton(button) {
  button.dataset.pressed = 'false';
  const action = button.dataset.touchControl;
  if (action === 'ArrowLeft' || action === 'ArrowRight' || action === 'ArrowUp' || action === 'ArrowDown') {
    stopHeldDirection(action);
  }
}

function handleTouchButtonPress(button) {
  if (!state.inGame) return;

  const action = button.dataset.touchControl;
  button.dataset.pressed = 'true';

  if (action === 'confirm') {
    controls.confirm.click();
    return;
  }
  if (action === 'back') {
    controls.back.click();
    return;
  }
  startHeldDirection(action);
}

function bindTouchControls() {
  document.querySelectorAll('[data-touch-control]').forEach((button) => {
    const endPress = () => releaseTouchButton(button);

    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      if (!button.hasPointerCapture(event.pointerId)) {
        button.setPointerCapture(event.pointerId);
      }
      handleTouchButtonPress(button);
    });

    button.addEventListener('pointerup', endPress);
    button.addEventListener('pointercancel', endPress);
    button.addEventListener('pointerleave', () => {
      if (button.dataset.touchControl === 'confirm' || button.dataset.touchControl === 'back') {
        button.dataset.pressed = 'false';
      }
    });
    button.addEventListener('lostpointercapture', endPress);
    button.addEventListener('contextmenu', (event) => {
      event.preventDefault();
    });
  });
}

document.addEventListener('keydown', (event) => {
  if (!state.inGame) return;

  const key = event.key;
  const lower = key.toLowerCase();

  if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowDown') {
    event.preventDefault();
    startHeldDirection(key);
    return;
  }
  if (key === 'Enter' || key === ' ') {
    event.preventDefault();
    controls.confirm.click();
    return;
  }
  if (lower === 'x' || key === 'Backspace') {
    event.preventDefault();
    controls.back.click();
    return;
  }
});

document.addEventListener('keyup', (event) => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    stopHeldDirection(event.key);
  }
});

window.addEventListener('blur', () => {
  stopAllHeldDirections();
  document.querySelectorAll('[data-touch-control][data-pressed="true"]').forEach((button) => {
    button.dataset.pressed = 'false';
  });
});

touchControlsToggle?.addEventListener('change', () => {
  setTouchControlsVisible(touchControlsToggle.checked);
  persistTouchControlsPreference(state.touchControlsVisible);
});

fullscreenToggle?.addEventListener('change', () => {
  setFullscreen(fullscreenToggle.checked);
});

restartGameBtn?.addEventListener('click', () => {
  if (!window.confirm('Restart the current run? Your current progress will be lost.')) {
    return;
  }
  removeStoredValue(RUN_SAVE_KEY);
  removeStoredValue(LEGACY_RUN_SAVE_KEY);
  window.location.reload();
});

clearHighScoreBtn?.addEventListener('click', () => {
  if (!window.confirm('Reset the saved high score?')) {
    return;
  }
  clearHighScore(GAME_KEY, [LEGACY_GAME_KEY]);
  const highScoreEl = document.getElementById('mtHigh');
  if (highScoreEl) {
    highScoreEl.textContent = '0';
  }
  window.dispatchEvent(new CustomEvent(HIGH_SCORE_RESET_EVENT, { detail: { gameKey: GAME_KEY } }));
});

document.addEventListener('fullscreenchange', () => {
  const enabled = document.fullscreenElement === appRoot;
  state.fullscreen = enabled || appRoot.classList.contains('fullscreen-mode');
  if (fullscreenToggle) {
    fullscreenToggle.checked = enabled || appRoot.classList.contains('fullscreen-mode');
  }
  if (!enabled && appRoot.classList.contains('fullscreen-mode')) {
    appRoot.classList.remove('fullscreen-mode');
    state.fullscreen = false;
    if (fullscreenToggle) {
      fullscreenToggle.checked = false;
    }
  }
});

state.selectedPlayerSpriteId = readStoredPlayerSpriteId();
state.touchControlsVisible = readStoredTouchControlsPreference();
syncPlayerSpriteSelect();
setTouchControlsVisible(state.touchControlsVisible);
bindTouchControls();
registerServiceWorker();
launchVPixelHunter(false);