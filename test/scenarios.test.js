const { test } = require("node:test");
const assert = require("node:assert");
const { quotaLargestRemainder } = require("../src/rng/quota");
const {
  generateScenarioAssignments,
  PROFILE_OPTIONS,
  PROFILE_WEIGHTS,
} = require("../src/generators/scenarios");

test("maior resto: 1000 clientes reproduzem exatamente a Fase 3B §31", () => {
  assert.deepStrictEqual(
    quotaLargestRemainder(1000, PROFILE_WEIGHTS),
    [350, 150, 100, 150, 80, 50, 50, 40, 30]
  );
});

test("maior resto: soma sempre igual ao total, para vários tamanhos", () => {
  for (const total of [1, 7, 100, 250, 333, 999, 1000, 4321]) {
    const c = quotaLargestRemainder(total, PROFILE_WEIGHTS);
    assert.strictEqual(c.reduce((a, b) => a + b, 0), total, `total=${total}`);
  }
});

test("maior resto: cada categoria fica no piso ou no teto da cota exata", () => {
  const total = 333;
  const soma = PROFILE_WEIGHTS.reduce((a, b) => a + b, 0);
  const c = quotaLargestRemainder(total, PROFILE_WEIGHTS);
  PROFILE_WEIGHTS.forEach((w, i) => {
    const exatoNum = total * w; // cota exata = exatoNum / soma
    const piso = Math.floor(exatoNum / soma);
    assert.ok(
      c[i] === piso || c[i] === piso + 1,
      `perfil ${i}: ${c[i]} fora de {${piso}, ${piso + 1}}`
    );
  });
});

test("maior resto: unidade que falta vai para o maior resto (caso controlado)", () => {
  // total 10, pesos [5, 3, 2]: cotas exatas 5, 3, 2 (sem resto) -> nada falta.
  // total 10, pesos [1, 1, 1]: cotas exatas 3,33 cada; pisos 3+3+3=9; falta 1.
  // Restos iguais -> desempate por índice: a unidade vai ao primeiro.
  assert.deepStrictEqual(quotaLargestRemainder(10, [1, 1, 1]), [4, 3, 3]);
  // total 10, pesos [1, 2]: cotas exatas 3,33 e 6,67; pisos 3+6=9; falta 1;
  // maior resto é o de 6,67 (resto 2/3 > 1/3) -> recebe a unidade.
  assert.deepStrictEqual(quotaLargestRemainder(10, [1, 2]), [3, 7]);
});

test("maior resto: rejeita entradas inválidas", () => {
  assert.throws(() => quotaLargestRemainder(-1, [1]));
  assert.throws(() => quotaLargestRemainder(10, [1.5, 2]));
  assert.throws(() => quotaLargestRemainder(10, [0, 0]));
});

test("cenários: o total de cada perfil bate com a cota exata", () => {
  const lista = generateScenarioAssignments(42, 1000);
  const contagem = {};
  for (const a of lista) contagem[a.behavior_profile] = (contagem[a.behavior_profile] || 0) + 1;
  PROFILE_OPTIONS.forEach((perfil, i) => {
    assert.strictEqual(contagem[perfil], PROFILE_WEIGHTS[i] * 10, perfil);
  });
});

test("cenários: mesma seed, mesma atribuição", () => {
  assert.deepStrictEqual(
    generateScenarioAssignments(42, 500),
    generateScenarioAssignments(42, 500)
  );
});

test("cenários: IDs são sequenciais de CUS-000001 até o total", () => {
  const lista = generateScenarioAssignments(42, 250);
  assert.strictEqual(lista[0].customer_id, "CUS-000001");
  assert.strictEqual(lista[249].customer_id, "CUS-000250");
  assert.strictEqual(lista.length, 250);
});

test("D7: o ID não revela o perfil (os primeiros 350 não são todos HEALTHY_STABLE)", () => {
  const lista = generateScenarioAssignments(42, 1000);
  const primeiros350 = lista.slice(0, 350).map((a) => a.behavior_profile);
  assert.ok(
    primeiros350.some((p) => p !== "HEALTHY_STABLE"),
    "IDs 1-350 não podem coincidir com o bloco de geração"
  );
});

test("D7: perfis por faixa de ID ficam próximos da proporção global (sem bloco)", () => {
  const lista = generateScenarioAssignments(42, 1000);
  const faixa = lista.slice(0, 200).filter((a) => a.behavior_profile === "HEALTHY_STABLE").length;
  // Esperado: 35% de 200 = 70. Tolerância ampla: não pode ser 0 nem 200.
  assert.ok(faixa > 40 && faixa < 100, `HEALTHY_STABLE nos 200 primeiros: ${faixa}`);
});
