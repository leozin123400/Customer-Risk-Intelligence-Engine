const { test } = require("node:test");
const assert = require("node:assert");
const { generateComposition, INDUSTRY_OPTIONS } = require("../src/generators/customers");
const { generateScenarioAssignments, PROFILE_OPTIONS } = require("../src/generators/scenarios");
const { COMPANY_SIZES, PLANS, SIZE_WEIGHTS, PLAN_BY_SIZE, PLAN_TARGET } = require("../src/config/planBySize");
const { chiSquare, tabular } = require("../src/stats/chiSquare");

const SEEDS = [42, ...Array.from({ length: 20 }, (_, i) => i + 1)];

// Valores críticos do qui-quadrado a alpha = 0,001 (tabela/scipy), por graus de liberdade.
const CRITICO = { 6: 22.46, 8: 26.12, 12: 32.91, 16: 39.25 };

// Perfis agrupados (para ter contagens esperadas >= 5 nas tabelas pequenas).
const GRUPO = {
  HEALTHY_STABLE: "SAUDAVEL", HEALTHY_GROWING: "SAUDAVEL", HEALTHY_LOW_USAGE: "SAUDAVEL",
  DETERIORATING: "RISCO", HIGH_RISK: "RISCO", CRITICAL: "RISCO",
  VOLATILE: "OUTRO", FINANCIAL_RISK: "OUTRO", RECOVERY: "OUTRO",
};
const GRUPOS = ["SAUDAVEL", "RISCO", "OUTRO"];

function faixasDeId(n, bins) {
  return Array.from({ length: n }, (_, idx) => Math.floor((idx * bins) / n));
}

function qui2(listaA, catA, listaB, catB) {
  const { stat, df } = chiSquare(tabular(listaA, catA, listaB, catB));
  return { stat, df };
}

test("mesma seed, mesma composição; seed diferente, composição diferente", () => {
  assert.deepStrictEqual(generateComposition(42, 1000), generateComposition(42, 1000));
  assert.notDeepStrictEqual(generateComposition(42, 1000), generateComposition(43, 1000));
});

test("IDs sequenciais de CUS-000001 até o total, sem repetição", () => {
  const c = generateComposition(42, 250);
  assert.strictEqual(c.length, 250);
  assert.strictEqual(c[0].customer_id, "CUS-000001");
  assert.strictEqual(c[249].customer_id, "CUS-000250");
  assert.strictEqual(new Set(c.map((x) => x.customer_id)).size, 250);
});

test("cada célula porte x plano fica a menos de 1 cliente da cota exata", () => {
  for (const total of [100, 250, 333, 1000]) {
    const c = generateComposition(42, total);
    COMPANY_SIZES.forEach((porte, i) => {
      PLANS.forEach((plano, j) => {
        const obtido = c.filter((x) => x.company_size === porte && x.plan === plano).length;
        const exato = (total * SIZE_WEIGHTS[i] * PLAN_BY_SIZE[i][j]) / 10000;
        assert.ok(Math.abs(obtido - exato) < 1, `${porte}/${plano} total=${total}: ${obtido} vs ${exato}`);
      });
    });
  }
});

test("1000 clientes: marginal de plano EXATA (400/350/200/50)", () => {
  const c = generateComposition(42, 1000);
  const contagem = PLANS.map((p) => c.filter((x) => x.plan === p).length);
  assert.deepStrictEqual(contagem, PLAN_TARGET.map((m) => m * 10));
});

test("marginais de porte e plano ficam a no máximo 1,5 cliente da meta (vários tamanhos)", () => {
  for (const total of [100, 250, 333, 1000, 4321]) {
    const c = generateComposition(42, total);
    COMPANY_SIZES.forEach((porte, i) => {
      const dev = c.filter((x) => x.company_size === porte).length - (total * SIZE_WEIGHTS[i]) / 100;
      assert.ok(Math.abs(dev) <= 1.5, `porte ${porte} total=${total}: desvio ${dev}`);
    });
    PLANS.forEach((plano, j) => {
      const dev = c.filter((x) => x.plan === plano).length - (total * PLAN_TARGET[j]) / 100;
      assert.ok(Math.abs(dev) <= 1.5, `plano ${plano} total=${total}: desvio ${dev}`);
    });
  }
});

test("industry: 125 clientes em cada uma das 8 indústrias (1000 clientes)", () => {
  const c = generateComposition(42, 1000);
  for (const ind of INDUSTRY_OPTIONS) {
    assert.strictEqual(c.filter((x) => x.industry === ind).length, 125, ind);
  }
});

test("D7: a faixa de ID não prevê porte nem plano (21 seeds, alpha = 0,001)", () => {
  const bins = [0, 1, 2, 3, 4];
  for (const seed of SEEDS) {
    const c = generateComposition(seed, 1000);
    const f = faixasDeId(1000, 5);
    const porte = qui2(f, bins, c.map((x) => x.company_size), COMPANY_SIZES);
    const plano = qui2(f, bins, c.map((x) => x.plan), PLANS);
    assert.ok(porte.stat < CRITICO[porte.df], `seed ${seed}: ID x porte qui2=${porte.stat.toFixed(1)}`);
    assert.ok(plano.stat < CRITICO[plano.df], `seed ${seed}: ID x plano qui2=${plano.stat.toFixed(1)}`);
  }
});

test("controle negativo: sem embaralhar, a faixa de ID prevê o porte (teste detecta)", () => {
  const ordem = generateComposition(42, 1000)
    .map((x) => x.company_size)
    .sort((a, b) => COMPANY_SIZES.indexOf(a) - COMPANY_SIZES.indexOf(b));
  const r = qui2(faixasDeId(1000, 5), [0, 1, 2, 3, 4], ordem, COMPANY_SIZES);
  assert.ok(r.stat > 10 * CRITICO[r.df], `qui2=${r.stat.toFixed(1)} deveria ser enorme`);
});

test("perfil de risco é independente de porte e de plano (21 seeds, alpha = 0,001)", () => {
  for (const seed of SEEDS) {
    const c = generateComposition(seed, 1000);
    const grupo = generateScenarioAssignments(seed, 1000).map((x) => GRUPO[x.behavior_profile]);
    const porte = qui2(c.map((x) => x.company_size), COMPANY_SIZES, grupo, GRUPOS);
    const plano = qui2(c.map((x) => x.plan), PLANS, grupo, GRUPOS);
    assert.ok(porte.stat < CRITICO[porte.df], `seed ${seed}: porte x perfil qui2=${porte.stat.toFixed(1)}`);
    assert.ok(plano.stat < CRITICO[plano.df], `seed ${seed}: plano x perfil qui2=${plano.stat.toFixed(1)}`);
  }
});

test("controle negativo: se o perfil acompanhar o porte, o teste detecta a dependência", () => {
  const porte = generateComposition(42, 1000)
    .map((x) => x.company_size)
    .sort((a, b) => COMPANY_SIZES.indexOf(a) - COMPANY_SIZES.indexOf(b));
  const grupo = generateScenarioAssignments(42, 1000)
    .map((x) => GRUPO[x.behavior_profile])
    .sort((a, b) => GRUPOS.indexOf(a) - GRUPOS.indexOf(b));
  const r = qui2(porte, COMPANY_SIZES, grupo, GRUPOS);
  assert.ok(r.stat > 10 * CRITICO[r.df], `qui2=${r.stat.toFixed(1)} deveria ser enorme`);
});

test("todos os valores de porte, plano e industry pertencem às listas válidas", () => {
  for (const x of generateComposition(42, 1000)) {
    assert.ok(COMPANY_SIZES.includes(x.company_size));
    assert.ok(PLANS.includes(x.plan));
    assert.ok(INDUSTRY_OPTIONS.includes(x.industry));
  }
  assert.strictEqual(PROFILE_OPTIONS.length, 9);
});