/**
 * Formats a money value to K or M representation.
 * - Under 1000: value + 'K' (e.g. 60 -> 60K)
 * - 1000 and above: value / 1000 + 'M' (e.g. 1036 -> 1.036M)
 */
export function formatMoney(val: number): string {
  const isNegative = val < 0;
  const absVal = Math.abs(val);
  let result = '';

  if (absVal < 1000) {
    result = `${absVal}K`;
  } else {
    // Keep up to 3 decimal places without trailing zeros (e.g., 1000 -> 1M, 1500 -> 1.5M, 1036 -> 1.036M)
    result = `${Number((absVal / 1000).toFixed(3))}M`;
  }

  return isNegative ? `-${result}` : result;
}

/**
 * Formats a money value to its full number representation.
 * - Multiplies the internal value by 1000.
 * - e.g. 345 -> "345 000"
 */
export function formatMoneyFull(val: number): string {
  const fullVal = val * 1000;
  return fullVal.toLocaleString('en-US').replace(/,/g, ' ');
}
