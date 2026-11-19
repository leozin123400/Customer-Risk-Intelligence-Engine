const { test } = require("node:test");
const assert = require("node:assert");
const { quotaLargestRemainder } = require("../src/rng/quota");
const { chiSquare, tabular } = require("../src/stats/chiSquare");
const {
  generateScenarioAssignments,
  PROFILE_OPTIONS,
  PROFILE_WEIGHTS,
} = require("../src/generators/scenarios");

const TOTAL = 1000;
const BINS = 5; // faixas de ID: 1-200, 201-400, ...
// Valor crítico do qui-quadrado, alpha = 0,001, df = (5-1)*(9-1) = 32 (tabela/scipy).
const CRITICO_001 = 62.49;

// Lista "do jeito perigoso": perfis em blocos, IDs na ordem de geração (sem embaralhar).
function listaEmBlocos(total) {
  const contagens = quotaLargestRemainder(total, PROFILE_WEIGHTS);
  const lista = [];
  PROFILE_OPTIONS.forEach((perfil, i) => {
    for (let k = 0; k < contagens[i]; k++) lista.push(perfil);
  });
  return lista.map((perfil, idx) => ({
    customer_id: `CUS-${String(idx + 1).padStart(6, "0")}`,
    behavior_profile: perfil,
  }));
}

// Estatística qui-quadrado de independência entre faixa de ID e perfil.
function qui2(lista, bins) {
  const faixas = lista.map((_, idx) => Math.floor((idx * bins) / lista.length));
  const tabela = tabular(faixas, [...Array(bins).keys()], lista.map((c) => c.behavior_profile), PROFILE_OPTIONS);
  return chiSquare(tabela).stat;
}

// "Adivinha o perfil" só pelo ID: aprende o perfil mais comum de cada faixa de ID
// nas posições pares e é avaliado nas ímpares (sem olhar a resposta que está testando).
function acuraciaDoPalpite(lista, bins) {
  const tamanho = lista.length / bins;
  const contagem = Array.from({ length: bins }, () => ({}));
  lista.forEach((c, idx) => {
    if (idx % 2 === 0) {
      const f = Math.floor(idx / tamanho);
      contagem[f][c.behavior_profile] = (contagem[f][c.behavior_profile] || 0) + 1;
    }
  });
  const palpite = contagem.map((cont) => Object.entries(cont).sort((a, b) => b[1] - a[1])[0][0]);
  let acertos = 0, avaliados = 0;
  lista.forEach((c, idx) => {
    if (idx % 2 === 1) {
      avaliados++;
      if (palpite[Math.floor(idx / tamanho)] === c.behavior_profile) acertos++;
    }
  });
  return acertos / avaliados;
}

test("independência: faixa de ID e perfil são independentes (21 seeds, alpha = 0,001)", () => {
  const seeds = [42, ...Array.from({ length: 20 }, (_, i) => i + 1)];
  for (const seed of seeds) {
    const estat = qui2(generateScenarioAssignments(seed, TOTAL), BINS);
    assert.ok(estat < CRITICO_001, `seed ${seed}: qui2 = ${estat.toFixed(1)} (limite ${CRITICO_001})`);
  }
});

test("controle negativo: sem embaralhar, o mesmo teste detecta o vazamento", () => {
  const estat = qui2(listaEmBlocos(TOTAL), BINS);
  assert.ok(estat > 10 * CRITICO_001, `qui2 = ${estat.toFixed(1)} deveria ser enorme`);
});

test("adivinhar o perfil pelo ID: acurácia fica no nível do acaso (baseline 35%)", () => {
  const baseline = Math.max(...PROFILE_WEIGHTS) / 100; // sempre chutar o perfil mais comum
  for (const seed of [42, 1, 2, 3, 4, 5]) {
    const acc = acuraciaDoPalpite(generateScenarioAssignments(seed, TOTAL), 20);
    assert.ok(acc < baseline + 0.07, `seed ${seed}: acurácia ${acc.toFixed(3)} acima do acaso`);
  }
});

test("controle negativo: sem embaralhar, o palpite pelo ID acerta quase tudo", () => {
  const acc = acuraciaDoPalpite(listaEmBlocos(TOTAL), 20);
  assert.ok(acc > 0.9, `acurácia ${acc.toFixed(3)} deveria ser alta`);
});
