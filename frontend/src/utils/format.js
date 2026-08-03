/**
 * Format a number using the Indian Numbering System (lakh/crore grouping).
 * Examples: 2400000 → 24,00,000 | 125000 → 1,25,000 | 5930000 → 59,30,000
 *
 * Handles:
 * - Negative values (prefix with minus sign)
 * - Decimal values (preserves up to 2 decimal places)
 * - Zero and null/undefined values
 * - String inputs (coerced to Number)
 */
export function formatIndianNumber(value, { decimals = 0, maxDecimals = 2 } = {}) {
  if (value === null || value === undefined || value === "") return "0";
  const num = Number(value);
  if (isNaN(num)) return String(value);

  const isNegative = num < 0;
  const absNum = Math.abs(num);

  // Split integer and decimal parts
  const [intPart, decPart] = absNum.toString().split(".");

  // Format integer part with Indian grouping
  let formattedInt;
  if (intPart.length <= 3) {
    formattedInt = intPart;
  } else {
    const last3 = intPart.slice(-3);
    const rest = intPart.slice(0, -3);
    // Group the rest in pairs (lakh, crore, etc.)
    const restFormatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    formattedInt = restFormatted + "," + last3;
  }

  // Handle decimals
  let formattedDec = "";
  if (decimals > 0 && decPart && decPart.length > 0) {
    formattedDec = "." + decPart.slice(0, decimals).padEnd(decimals, "0");
  } else if (maxDecimals > 0 && decPart && decPart.length > 0) {
    // Show up to maxDecimals but only if there's a fractional part
    const realDecimals = Math.min(decPart.length, maxDecimals);
    formattedDec = "." + decPart.slice(0, realDecimals);
  }

  return (isNegative ? "-" : "") + formattedInt + formattedDec;
}

/**
 * Format a number as Indian Rupees with ₹ symbol.
 * Examples: ₹24,00,000 | ₹1,25,000 | ₹59,30,000
 */
export function formatINR(value, options = {}) {
  const { decimals = 0, maxDecimals = 2 } = options;
  const formatted = formatIndianNumber(value, { decimals, maxDecimals });
  const num = Number(value || 0);
  const negative = num < 0;
  return `${negative ? "-" : ""}₹${formatIndianNumber(Math.abs(num), { decimals, maxDecimals })}`;
}

/**
 * Format a number as abbreviated Indian Rupees (Lakh/Crore style).
 * Examples: 2400000 → ₹24L | 59300000 → ₹5.93Cr | 125000 → ₹1.25L
 */
export function formatINRShort(value, { decimals = 1 } = {}) {
  const num = Number(value || 0);
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  let result;
  if (absNum >= 10000000) {
    result = `₹${(absNum / 10000000).toFixed(decimals)}Cr`;
  } else if (absNum >= 100000) {
    result = `₹${(absNum / 100000).toFixed(decimals)}L`;
  } else if (absNum >= 1000) {
    result = `₹${formatIndianNumber(absNum)}`;
  } else {
    result = `₹${formatIndianNumber(absNum)}`;
  }

  return (isNegative ? "-" : "") + result;
}

/**
 * Format a number for chart axis labels (compact lakh/crore).
 * Examples: 2400000 → 24L | 59300000 → 5.93Cr
 */
export function formatChartAxis(value) {
  const num = Number(value || 0);
  if (num >= 10000000) return `${(num / 10000000).toFixed(num >= 100000000 ? 0 : 2)}Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(0)}L`;
  return formatIndianNumber(num);
}