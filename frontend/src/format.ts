export const formatNumber = (value: number, digits = 0) =>
  value.toLocaleString("pt-BR", { maximumFractionDigits: digits, minimumFractionDigits: digits });

export const formatCompact = (value: number) => {
  if (value >= 1_000_000) return formatNumber(value / 1_000_000, 1) + " mi";
  if (value >= 1_000) return formatNumber(value / 1_000, 1) + " mil";
  return formatNumber(value);
};

export const savingsPercentage = (fast: number, slow: number) => (slow === 0 ? 0 : (1 - fast / slow) * 100);

export const formatPercentage = (value: number) => {
  const magnitude = Math.abs(value);
  const nearlyAll = magnitude >= 99 && magnitude < 100;
  const digits = nearlyAll ? (magnitude >= 99.95 ? 2 : 1) : 0;
  return formatNumber(magnitude, digits) + "%";
};

export const padTwo = (value: number) => value.toString().padStart(2, "0");
