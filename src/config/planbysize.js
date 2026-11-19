/**
 * Distribuição do PLANO dentro de cada PORTE de empresa (em %).
 *
 * PROVISÓRIA: nenhum documento das Fases 0-3B define esta relação
 * (a 3A §7 só diz que plano e porte "não devem ser totalmente
 * independentes" e que "exceções devem existir"). Esta matriz é uma
 * suposição documentada, ajustada para reproduzir EXATAMENTE as marginais
 * da 3A: porte 20/35/25/15/5 e plano 40/35/20/5.
 *
 * Cada linha é P(plano | porte) e soma 100.
 */
const COMPANY_SIZES = ["MICRO", "SMALL", "MEDIUM", "LARGE", "ENTERPRISE"];
const PLANS = ["STARTER", "GROWTH", "BUSINESS", "ENTERPRISE"];

// Fase 3A §6 e §7 (em %)
const SIZE_WEIGHTS = [20, 35, 25, 15, 5];
const PLAN_TARGET = [40, 35, 20, 5];

//                STARTER GROWTH BUSINESS ENTERPRISE
const PLAN_BY_SIZE = [
  /* MICRO      */[85, 13, 1, 1],
  /* SMALL      */[49, 42, 8, 1],
  /* MEDIUM     */[20, 49, 30, 1],
  /* LARGE      */[5, 33, 50, 12],
  /* ENTERPRISE */[2, 10, 40, 48],
];

module.exports = { COMPANY_SIZES, PLANS, SIZE_WEIGHTS, PLAN_TARGET, PLAN_BY_SIZE };