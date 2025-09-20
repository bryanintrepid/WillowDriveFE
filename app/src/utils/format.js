export function formatCurrency(val) {
  if (val === null || val === undefined) {
    val = 0;
  }
  return ((Math.round(val * Math.pow(10, 2)) / Math.pow(10, 2))).toLocaleString('en-US', { minimumFractionDigits: 2 });
}
