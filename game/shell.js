export function readStoredJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

export function writeStoredJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    return false;
  }
}

export function writeStoredValue(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    return false;
  }
}

export function removeStoredValue(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    return false;
  }
}

export function getHighScore(readLocalJson, game, aliases = []) {
  const hs = typeof readLocalJson === 'function'
    ? readLocalJson('gameHighScores', {})
    : readStoredJson('gameHighScores', {});
  const keys = [game, ...aliases];
  for (const key of keys) {
    if (Number.isFinite(hs[key])) {
      return hs[key];
    }
  }
  return 0;
}

export function setHighScore(game, val) {
  const hs = readStoredJson('gameHighScores', {});
  hs[game] = val;
  return writeStoredJson('gameHighScores', hs);
}

export function clearHighScore(game, aliases = []) {
  const hs = readStoredJson('gameHighScores', {});
  delete hs[game];
  aliases.forEach((alias) => {
    delete hs[alias];
  });
  return writeStoredJson('gameHighScores', hs);
}

export function prepareVPixelHunterSession() {}

export function createStageShell(content, variant = '') {
  const className = ['game-screen-shell', variant ? `game-screen-shell--${variant}` : '']
    .filter(Boolean)
    .join(' ');
  return `<div class="${className}">${content}</div>`;
}

export function bindStandaloneControls(controls, { onLeft, onRight, onConfirm, onBack }) {
  const leftOld = controls?.left?.onclick || null;
  const rightOld = controls?.right?.onclick || null;
  const confirmOld = controls?.confirm?.onclick || null;
  const backOld = controls?.back?.onclick || null;
  if (controls?.left) controls.left.onclick = () => onLeft && onLeft();
  if (controls?.right) controls.right.onclick = () => onRight && onRight();
  if (controls?.confirm) controls.confirm.onclick = () => onConfirm && onConfirm();
  if (controls?.back) controls.back.onclick = () => onBack && onBack();
  return () => {
    if (controls?.left) controls.left.onclick = leftOld;
    if (controls?.right) controls.right.onclick = rightOld;
    if (controls?.confirm) controls.confirm.onclick = confirmOld;
    if (controls?.back) controls.back.onclick = backOld;
  };
}
