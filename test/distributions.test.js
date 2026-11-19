const { test } = require("node:test");
const assert = require("node:assert");
const { mulberry32 } = require("../src/rng/prng");
const { weightedChoice } = require("../src/rng/distributions");

function makeRng(seed) { return { next: mulberry32(seed) }; }

test("peso 100% numa opção sempre a escolhe", () => {
  const rng = makeRng(1);
  for (let i = 0; i < 100; i++) {
    assert.strictEqual(weightedChoice(rng, ["A", "B"], [1, 0]), "A");
  }
});

test("company_size se aproxima de 20/35/25/15/5 em 100.000 sorteios", () => {
  const rng = makeRng(42);
  const options = ["MICRO", "SMALL", "MEDIUM", "LARGE", "ENTERPRISE"];
  const weights = [20, 35, 25, 15, 5];
  const N = 100000;
  const counts = Object.fromEntries(options.map((o) => [o, 0]));
  for (let i = 0; i < N; i++) counts[weightedChoice(rng, options, weights)]++;
  options.forEach((opt, i) => {
    const esperado = weights[i] / 100;
    const desvio = Math.abs(counts[opt] / N - esperado);
    assert.ok(desvio < 0.01, `${opt}: desvio ${desvio}`);
  });
});

test("mesma seed reproduz a mesma sequência de escolhas", () => {
  const options = ["MICRO", "SMALL", "MEDIUM", "LARGE", "ENTERPRISE"];
  const weights = [20, 35, 25, 15, 5];
  const rngA = makeRng(42), rngB = makeRng(42);
  assert.deepStrictEqual(
    Array.from({ length: 20 }, () => weightedChoice(rngA, options, weights)),
    Array.from({ length: 20 }, () => weightedChoice(rngB, options, weights))
  );
});