const { createChildRng } = require("../rng/prng");
const { quotaLargestRemainder } = require("../rng/quota");
const { seededShuffle } = require("../rng/shuffle");
const { formatCustomerId } = require("./ids");

// Fase 3B §7 / §31: proporções iniciais dos perfis (em %).
const PROFILE_OPTIONS = [
  "HEALTHY_STABLE",
  "HEALTHY_GROWING",
  "HEALTHY_LOW_USAGE",
  "DETERIORATING",
  "HIGH_RISK",
  "CRITICAL",
  "VOLATILE",
  "FINANCIAL_RISK",
  "RECOVERY",
];
const PROFILE_WEIGHTS = [35, 15, 10, 15, 8, 5, 5, 4, 3];


/**
 * Gera a atribuição perfil -> cliente para `total` clientes.
 *
 * Ordem (D7):
 *  1. cotas exatas por perfil (maior resto)
 *  2. lista em blocos (como geração natural)
 *  3. embaralhamento determinístico com a seed do dataset
 *  4. SÓ DEPOIS, atribuição de customer_id em ordem
 *
 * Assim o ID nunca depende da posição de geração.
 */
function generateScenarioAssignments(globalSeed, total) {
  const contagens = quotaLargestRemainder(total, PROFILE_WEIGHTS);

  const emBlocos = [];
  PROFILE_OPTIONS.forEach((perfil, i) => {
    for (let k = 0; k < contagens[i]; k++) emBlocos.push(perfil);
  });

  const rng = createChildRng(globalSeed, "truth.customer_scenarios");
  const embaralhado = seededShuffle(emBlocos, rng);

  return embaralhado.map((perfil, idx) => ({
    customer_id: formatCustomerId(idx + 1),
    behavior_profile: perfil,
  }));
}

module.exports = {
  generateScenarioAssignments,
  PROFILE_OPTIONS,
  PROFILE_WEIGHTS,
};