const { test } = require("node:test");
const assert = require("node:assert");
const { generateTruthScenarios } = require("../src/generators/truthScenarios");
const { chiSquare, tabular } = require("../src/stats/chiSquare");
const R = require("../src/config/scenarioRules");

const T = generateTruthScenarios(42, 1000);
const cnt = (lista, f) => lista.reduce((m, r) => ((m[f(r)] = (m[f(r)] || 0) + 1), m), {});
const SEEDS = [42, 1, 2, 3, 4];

test("mesma seed, mesmos cenários", () => {
  assert.deepStrictEqual(generateTruthScenarios(42, 300), generateTruthScenarios(42, 300));
});

test("novos clientes: 15% exato (150 de 1000)", () => {
  assert.strictEqual(T.filter((r) => r.is_new).length, 150);
});

test("novos: cadastro nos primeiros 150 dias; antigos: entre 24 meses antes e a janela", () => {
  for (const r of T) {
    if (r.is_new) assert.ok(r.signup_offset_days >= 0 && r.signup_offset_days <= R.NEW_SIGNUP_MAX_DAY);
    else assert.ok(r.signup_offset_days >= R.OLD_SIGNUP_MIN_OFFSET && r.signup_offset_days <= -1);
  }
});

test("lifecycle_start: novos = ONBOARDING; antigos seguem as faixas de idade", () => {
  for (const r of T) {
    if (r.is_new) { assert.strictEqual(r.lifecycle_start, "ONBOARDING"); continue; }
    const idade = -r.signup_offset_days;
    const esperado = idade <= R.ACTIVATED_MAX_AGE ? "ACTIVATED"
      : idade <= R.ADOPTED_MAX_AGE ? "ADOPTED" : "MATURE";
    assert.strictEqual(r.lifecycle_start, esperado, `idade ${idade}`);
  }
});

test("onset_day: só nos perfis com mudança, dentro da faixa aprovada", () => {
  for (const r of T) {
    const faixa = R.ONSET_RANGE[r.behavior_profile];
    if (!faixa) assert.strictEqual(r.onset_day, null, r.behavior_profile);
    else assert.ok(r.onset_day >= faixa[0] && r.onset_day <= faixa[1], `${r.behavior_profile}: ${r.onset_day}`);
  }
});

test("volatility_level: VOLATILE = HIGH; HEALTHY_STABLE = LOW 70% exato; demais = MEDIUM", () => {
  const estaveis = T.filter((r) => r.behavior_profile === "HEALTHY_STABLE");
  const low = estaveis.filter((r) => r.volatility_level === "LOW").length;
  assert.ok(Math.abs(low - estaveis.length * 0.7) <= 1, `LOW ${low} de ${estaveis.length}`);
  for (const r of T) {
    if (r.behavior_profile === "VOLATILE") assert.strictEqual(r.volatility_level, "HIGH");
    else if (r.behavior_profile !== "HEALTHY_STABLE") assert.strictEqual(r.volatility_level, "MEDIUM");
    else assert.ok(["LOW", "MEDIUM"].includes(r.volatility_level));
  }
});

test("seasonality_profile: 25/45/10/20% exato em 1000 clientes", () => {
  const c = cnt(T, (r) => r.seasonality_profile);
  assert.deepStrictEqual(c, { NONE: 250, WEEKDAY: 450, MONTH_END: 100, WEEKDAY_MONTH_END: 200 });
});

test("anomaly_count: 5% com 1 ou 2 anomalias (25 + 25 em 1000)", () => {
  const c = cnt(T, (r) => r.anomaly_count);
  assert.deepStrictEqual(c, { 0: 950, 1: 25, 2: 25 });
});

test("adversarial_tag derivado do perfil (LOW_USAGE, VOLATILE, FINANCIAL_RISK)", () => {
  for (const r of T) {
    if (r.behavior_profile === "HEALTHY_LOW_USAGE") assert.strictEqual(r.adversarial_tag, "LOW_USAGE_HEALTHY");
    if (r.behavior_profile === "VOLATILE") assert.strictEqual(r.adversarial_tag, "HIGH_VOLATILITY_HEALTHY");
    if (r.behavior_profile === "FINANCIAL_RISK") assert.strictEqual(r.adversarial_tag, "FINANCIAL_FAIL_HEALTHY_PRODUCT");
  }
});

test("NEW_LITTLE_HISTORY: novos sem tag de perfil (precedência do perfil)", () => {
  for (const r of T) {
    if (r.adversarial_tag === "NEW_LITTLE_HISTORY") assert.ok(r.is_new);
    if (r.is_new && !R.TAG_BY_PROFILE[r.behavior_profile]) {
      assert.ok(["NEW_LITTLE_HISTORY", "HIGH_TICKETS_HEALTHY", "HIGH_USAGE_DETERIORATING"].includes(r.adversarial_tag) || r.adversarial_tag === null);
    }
  }
});

test("HIGH_USAGE_DETERIORATING: 20 clientes, todos DETERIORATING e entre os de maior uso", () => {
  const alvo = T.filter((r) => r.adversarial_tag === "HIGH_USAGE_DETERIORATING");
  assert.strictEqual(alvo.length, 20);
  assert.ok(alvo.every((r) => r.behavior_profile === "DETERIORATING"));
  const menorAlvo = Math.min(...alvo.map((r) => r.baseline_daily_events));
  const demais = T.filter((r) => r.behavior_profile === "DETERIORATING" && r.adversarial_tag !== "HIGH_USAGE_DETERIORATING" && !r.is_new);
  assert.ok(demais.every((r) => r.baseline_daily_events <= menorAlvo));
});

test("HIGH_TICKETS_HEALTHY: 20 clientes saudáveis (STABLE ou GROWING), sem sobreposição", () => {
  const alvo = T.filter((r) => r.adversarial_tag === "HIGH_TICKETS_HEALTHY");
  assert.strictEqual(alvo.length, 20);
  assert.ok(alvo.every((r) => ["HEALTHY_STABLE", "HEALTHY_GROWING"].includes(r.behavior_profile)));
});

test("generation_seed é único por cliente e reproduzível", () => {
  assert.strictEqual(new Set(T.map((r) => r.generation_seed)).size, T.length);
  assert.strictEqual(T[10].generation_seed, generateTruthScenarios(42, 1000)[10].generation_seed);
});

test("independência: sazonalidade não prevê perfil (agrupado, 21 seeds, alpha = 0,001)", () => {
  const CRIT_6 = 22.46; // df = (4-1)*(3-1)
  const grupo = (p) => (p.startsWith("HEALTHY") ? "SAUDAVEL" : ["DETERIORATING", "HIGH_RISK", "CRITICAL"].includes(p) ? "RISCO" : "OUTRO");
  const G = ["SAUDAVEL", "RISCO", "OUTRO"];
  const S = ["NONE", "WEEKDAY", "MONTH_END", "WEEKDAY_MONTH_END"];
  for (const seed of [...SEEDS, ...Array.from({ length: 16 }, (_, i) => i + 5)]) {
    const t = generateTruthScenarios(seed, 1000);
    const { stat } = chiSquare(tabular(t.map((r) => r.seasonality_profile), S, t.map((r) => grupo(r.behavior_profile)), G));
    assert.ok(stat < CRIT_6, `seed ${seed}: qui2 ${stat.toFixed(1)}`);
  }
});

test("controle negativo: sazonalidade alinhada ao perfil é detectada", () => {
  const grupo = (p) => (p.startsWith("HEALTHY") ? "SAUDAVEL" : ["DETERIORATING", "HIGH_RISK", "CRITICAL"].includes(p) ? "RISCO" : "OUTRO");
  const G = ["SAUDAVEL", "RISCO", "OUTRO"];
  const S = ["NONE", "WEEKDAY", "MONTH_END", "WEEKDAY_MONTH_END"];
  // Sazonalidade alinhada ao grupo, usando as 4 categorias (alternando dentro de cada grupo):
  // saudáveis -> NONE/WEEKDAY; risco/outros -> MONTH_END/WEEKDAY_MONTH_END.
  const fake = T.map((r, i) => {
    const g = grupo(r.behavior_profile);
    const s = g === "SAUDAVEL" ? (i % 2 ? "WEEKDAY" : "NONE") : (i % 2 ? "WEEKDAY_MONTH_END" : "MONTH_END");
    return { s, g };
  });
  const { stat } = chiSquare(tabular(fake.map((x) => x.s), S, fake.map((x) => x.g), G));
  assert.ok(stat > 100, `qui2 ${stat.toFixed(1)}`);
});
