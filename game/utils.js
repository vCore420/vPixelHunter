export function wrapIndex(value, length) {
  return ((value % length) + length) % length;
}

export function colorWithAlpha(hex, alpha) {
  const safeHex = (hex || '#000000').replace('#', '');
  const normalized = safeHex.length === 3
    ? safeHex.split('').map(char => char + char).join('')
    : safeHex.padEnd(6, '0').slice(0, 6);
  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${Math.max(0, Math.min(1, alpha))})`;
}

export function blendHex(hexA, hexB, weight = 0.5) {
  const blend = Math.max(0, Math.min(1, weight));
  const normalize = (value) => {
    const safe = (value || '#000000').replace('#', '');
    return (safe.length === 3
      ? safe.split('').map(char => char + char).join('')
      : safe.padEnd(6, '0').slice(0, 6)
    ).toLowerCase();
  };
  const left = normalize(hexA);
  const right = normalize(hexB);
  const channels = [0, 2, 4].map(offset => {
    const a = parseInt(left.slice(offset, offset + 2), 16);
    const b = parseInt(right.slice(offset, offset + 2), 16);
    return Math.round(a + (b - a) * blend).toString(16).padStart(2, '0');
  });
  return `#${channels.join('')}`;
}