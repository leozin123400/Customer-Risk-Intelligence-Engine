/** Formato único de customer_id (Fase 3B §5.1): CUS-######. */
function formatCustomerId(n) {
  return `CUS-${String(n).padStart(6, "0")}`;
}

module.exports = { formatCustomerId };
