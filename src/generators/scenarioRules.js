/**
 * Regras de truth.customer_scenarios (Fase 3B §5.8), aprovadas em 27/10/2026.
 * Janela: 180 dias, dia 0 = 2026-03-01 (D8).
 */
const WINDOW_DAYS = 180;

// Clientes novos: 15% (aprovado). Cadastro nos primeiros 150 dias da janela.
const NEW_CUSTOMER_SHARE = 15;
const NEW_SIGNUP_MAX_DAY = 149;
// Demais: cadastro até 24 meses antes da janela (offset negativo, em dias).
const OLD_SIGNUP_MIN_OFFSET = -730;

// lifecycle_start (aprovado): ONBOARDING (novo); ACTIVATED < 90 dias; ADOPTED 90-365; MATURE > 365.
const ACTIVATED_MAX_AGE = 89;
const ADOPTED_MAX_AGE = 365;

// onset_day (aprovado): dia da janela em que a mudança começa; nulo nos demais perfis.
const ONSET_RANGE = {
  DETERIORATING: [31, 90],
  HIGH_RISK: [31, 90],
  CRITICAL: [31, 90],
  RECOVERY: [31, 90],
  FINANCIAL_RISK: [31, 120],
};

// volatility_level (aprovado): VOLATILE = HIGH; HEALTHY_STABLE = LOW 70% / MEDIUM 30%; demais = MEDIUM.
const VOLATILITY_STABLE_PAIRS = [["LOW", 70], ["MEDIUM", 30]];

// seasonality_profile (aprovado): independente do perfil.
const SEASONALITY_PAIRS = [["NONE", 25], ["WEEKDAY", 45], ["MONTH_END", 10], ["WEEKDAY_MONTH_END", 20]];

// anomaly_count (aprovado): 5% dos clientes com 1 ou 2 anomalias.
// SUPOSIÇÃO: 1 e 2 com a mesma frequência. Pesos inteiros: 0 -> 190/200, 1 -> 5/200, 2 -> 5/200.
const ANOMALY_PAIRS = [[0, 190], [1, 5], [2, 5]];

// adversarial_tag derivado do perfil (aprovado).
const TAG_BY_PROFILE = {
  HEALTHY_LOW_USAGE: "LOW_USAGE_HEALTHY",
  VOLATILE: "HIGH_VOLATILITY_HEALTHY",
  FINANCIAL_RISK: "FINANCIAL_FAIL_HEALTHY_PRODUCT",
};
const TAG_NEW_CUSTOMER = "NEW_LITTLE_HISTORY";

// Casos com regra própria. Estrutura aprovada; QUANTIDADE PROVISÓRIA (2% cada).
const HIGH_USAGE_DETERIORATING_SHARE = 2;
const HIGH_TICKETS_HEALTHY_SHARE = 2;

module.exports = {
  WINDOW_DAYS, NEW_CUSTOMER_SHARE, NEW_SIGNUP_MAX_DAY, OLD_SIGNUP_MIN_OFFSET,
  ACTIVATED_MAX_AGE, ADOPTED_MAX_AGE, ONSET_RANGE, VOLATILITY_STABLE_PAIRS,
  SEASONALITY_PAIRS, ANOMALY_PAIRS, TAG_BY_PROFILE, TAG_NEW_CUSTOMER,
  HIGH_USAGE_DETERIORATING_SHARE, HIGH_TICKETS_HEALTHY_SHARE,
};
