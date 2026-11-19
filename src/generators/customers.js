const { createChildRng } = require("../rng/prng");
const { weightedChoice } = require("../rng/distributions");

// Fase 3B §5.1 / Fase 3A §08 — distribuição aprovada em D8/3B §7.
const COMPANY_SIZE_OPTIONS = ["MICRO", "SMALL", "MEDIUM", "LARGE", "ENTERPRISE"];
const COMPANY_SIZE_WEIGHTS = [20, 35, 25, 15, 5];

// PROVISÓRIO — nenhum documento (Fases 0–3B) define esta distribuição.
// Uniforme só para não travar o progresso. PRECISA de aprovação sua.
const INDUSTRY_OPTIONS = [
  "FINTECH",
  "HEALTHTECH",
  "ECOMMERCE",
  "LOGISTICS",
  "EDTECH",
  "MARKETING",
  "LEGALTECH",
  "OTHER",
];
const INDUSTRY_WEIGHTS = [1, 1, 1, 1, 1, 1, 1, 1]; // uniforme (12,5% cada)

/**
 * Gera os atributos de UM cliente que já tem seu customer_id definido.
 * Recebe a seed global (não o rng do chamador) porque cada cliente
 * precisa da sua própria sequência isolada (ver Etapa 1 — createChildRng).
 */
function generateCustomerAttributes(globalSeed, customerId) {
  const rng = createChildRng(globalSeed, customerId);

  const companySize = weightedChoice(rng, COMPANY_SIZE_OPTIONS, COMPANY_SIZE_WEIGHTS);
  const industry = weightedChoice(rng, INDUSTRY_OPTIONS, INDUSTRY_WEIGHTS);

  return {
    customer_id: customerId,
    company_size: companySize,
    industry,
  };
}

module.exports = {
  generateCustomerAttributes,
  COMPANY_SIZE_OPTIONS,
  COMPANY_SIZE_WEIGHTS,
  INDUSTRY_OPTIONS,
  INDUSTRY_WEIGHTS,
};
