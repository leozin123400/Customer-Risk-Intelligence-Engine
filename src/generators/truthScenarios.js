const { createChildRng, hashStringToSeed } = require("../rng/prng");
const { quotaLargestRemainder } = require("../rng/quota");
const { seededShuffle } = require("../rng/shuffle");
const { generateComposition } = require("./customers");
const { generateScale } = require("./scale");
const { generateScenarioAssignments } = require("./scenarios");
const R = require("../config/scenarioRules");

function expandir(opcoes, contagens) {
  const lista = [];
  opcoes.forEach((o, i) => { for (let k = 0; k < contagens[i]; k++) lista.push(o); });
  return lista;
}

/** Valores categóricos com cotas exatas (maior resto), embaralhados com stream próprio. */
function categoricalStream(globalSeed, label, n, pares) {
  const valores = pares.map((p) => p[0]);
  const pesos = pares.map((p) => p[1]);
  return seededShuffle(expandir(valores, quotaLargestRemainder(n, pesos)), createChildRng(globalSeed, label));
}

function uniformInt(rng, min, max) {
  return min + Math.floor(rng.next() * (max - min + 1));
}

function lifecycleOf(r) {
  if (r.is_new) return "ONBOARDING";
  const idade = -r.signup_offset_days; // dias entre o cadastro e o dia 0 da janela
  if (idade <= R.ACTIVATED_MAX_AGE) return "ACTIVATED";
  if (idade <= R.ADOPTED_MAX_AGE) return "ADOPTED";
  return "MATURE";
}

/**
 * truth.customer_scenarios (Fase 3B §5.8).
 * Ordem: composição (IDs já embaralhados, D7) -> escala -> perfil -> cotas -> draws por cliente.
 */
function generateTruthScenarios(seed, total) {
  const comp = generateComposition(seed, total);
  const perfilPorId = new Map(
    generateScenarioAssignments(seed, total).map((x) => [x.customer_id, x.behavior_profile])
  );
  const rows = comp.map((c) => ({
    ...c,
    ...generateScale(seed, c),
    behavior_profile: perfilPorId.get(c.customer_id),
  }));

  // 1) Novo / antigo: 15% exato
  const novos = categoricalStream(seed, "truth.new_customer", total,
    [["NEW", R.NEW_CUSTOMER_SHARE], ["OLD", 100 - R.NEW_CUSTOMER_SHARE]]);
  rows.forEach((r, i) => { r.is_new = novos[i] === "NEW"; });

  // 2) Draws por cliente (rng próprio: seed + customer_id + ":scenario")
  rows.forEach((r) => {
    const rng = createChildRng(seed, `${r.customer_id}:scenario`);
    r.signup_offset_days = r.is_new
      ? uniformInt(rng, 0, R.NEW_SIGNUP_MAX_DAY)
      : uniformInt(rng, R.OLD_SIGNUP_MIN_OFFSET, -1);
    const faixa = R.ONSET_RANGE[r.behavior_profile];
    r.onset_day = faixa ? uniformInt(rng, faixa[0], faixa[1]) : null;
    r.generation_seed = hashStringToSeed(`${seed}:${r.customer_id}`);
    r.lifecycle_start = lifecycleOf(r);
  });

  // 3) Volatilidade
  const estaveis = rows.filter((r) => r.behavior_profile === "HEALTHY_STABLE");
  const volEst = categoricalStream(seed, "truth.volatility_stable", estaveis.length, R.VOLATILITY_STABLE_PAIRS);
  estaveis.forEach((r, k) => { r.volatility_level = volEst[k]; });
  rows.forEach((r) => {
    if (!r.volatility_level) r.volatility_level = r.behavior_profile === "VOLATILE" ? "HIGH" : "MEDIUM";
  });

  // 4) Sazonalidade e anomalias (independentes do perfil)
  const sazon = categoricalStream(seed, "truth.seasonality", total, R.SEASONALITY_PAIRS);
  const anom = categoricalStream(seed, "truth.anomaly", total, R.ANOMALY_PAIRS);
  rows.forEach((r, i) => {
    r.seasonality_profile = sazon[i];
    r.anomaly_count = anom[i];
  });

  // 5) adversarial_tag derivado do perfil; novos sem perfil de risco recebem NEW_LITTLE_HISTORY
  rows.forEach((r) => {
    r.adversarial_tag = R.TAG_BY_PROFILE[r.behavior_profile] || (r.is_new ? R.TAG_NEW_CUSTOMER : null);
  });

  // 6a) HIGH_USAGE_DETERIORATING: os k DETERIORATING sem tag com mais eventos/dia (SUPOSIÇÃO)
  const k = Math.round((total * R.HIGH_USAGE_DETERIORATING_SHARE) / 100);
  rows
    .filter((r) => r.behavior_profile === "DETERIORATING" && !r.adversarial_tag)
    .sort((a, b) => b.baseline_daily_events - a.baseline_daily_events)
    .slice(0, k)
    .forEach((r) => { r.adversarial_tag = "HIGH_USAGE_DETERIORATING"; });

  // 6b) HIGH_TICKETS_HEALTHY: k clientes saudáveis sorteados
  const kT = Math.round((total * R.HIGH_TICKETS_HEALTHY_SHARE) / 100);
  const candTickets = rows.filter((r) =>
    (r.behavior_profile === "HEALTHY_STABLE" || r.behavior_profile === "HEALTHY_GROWING") && !r.adversarial_tag);
  seededShuffle(candTickets, createChildRng(seed, "truth.high_tickets"))
    .slice(0, kT)
    .forEach((r) => { r.adversarial_tag = "HIGH_TICKETS_HEALTHY"; });

  return rows.map((r) => ({
    customer_id: r.customer_id,
    behavior_profile: r.behavior_profile,
    lifecycle_start: r.lifecycle_start,
    baseline_daily_events: r.baseline_daily_events,
    expected_users: r.expected_users,
    volatility_level: r.volatility_level,
    seasonality_profile: r.seasonality_profile,
    onset_day: r.onset_day,
    anomaly_count: r.anomaly_count,
    adversarial_tag: r.adversarial_tag,
    generation_seed: r.generation_seed,
    is_new: r.is_new,
    signup_offset_days: r.signup_offset_days,
  }));
}

module.exports = { generateTruthScenarios };
