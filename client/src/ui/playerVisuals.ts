const DARK_INK = '#071a23';
const LIGHT_INK = '#ffffff';

function channelToLinear(channel: number) {
  const normalized = channel / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(color: string) {
  const hex = color.replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(hex)) return 0;
  const red = channelToLinear(parseInt(hex.slice(0, 2), 16));
  const green = channelToLinear(parseInt(hex.slice(2, 4), 16));
  const blue = channelToLinear(parseInt(hex.slice(4, 6), 16));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(first: string, second: string) {
  const lighter = Math.max(relativeLuminance(first), relativeLuminance(second));
  const darker = Math.min(relativeLuminance(first), relativeLuminance(second));
  return (lighter + 0.05) / (darker + 0.05);
}

export function getAccessiblePlayerInk(color: string) {
  return contrastRatio(color, DARK_INK) >= contrastRatio(color, LIGHT_INK)
    ? DARK_INK
    : LIGHT_INK;
}
