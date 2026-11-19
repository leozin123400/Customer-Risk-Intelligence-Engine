const { test } = require("node:test");
const assert = require("node:assert");
const { mulberry32, createChildRng } = require("../src/rng/prng");

test("mesma seed produz a mesma sequência", () => {
  const rngA = mulberry32(42);
  const rngB = mulberry32(42);
  assert.deepStrictEqual(
    Array.from({ length: 5 }, () => rngA()),
    Array.from({ length: 5 }, () => rngB())
  );
});

test("seeds diferentes produzem sequências diferentes", () => {
  assert.notStrictEqual(mulberry32(42)(), mulberry32(43)());
});

test("todos os valores ficam entre 0 (inclusive) e 1 (exclusivo)", () => {
  const rng = mulberry32(7);
  for (let i = 0; i < 1000; i++) {
    const v = rng();
    assert.ok(v >= 0 && v < 1);
  }
});

test("cada cliente tem sequência independente (isolamento)", () => {
  const globalSeed = 42;
  const a1 = createChildRng(globalSeed, "CUS-000001");
  const seqA1 = Array.from({ length: 5 }, () => a1.next());
  const b = createChildRng(globalSeed, "CUS-000002");
  Array.from({ length: 5 }, () => b.next());
  const a2 = createChildRng(globalSeed, "CUS-000001");
  const seqA2 = Array.from({ length: 5 }, () => a2.next());
  assert.deepStrictEqual(seqA1, seqA2);
});

test("dataset simulado é idêntico ao regenerar com a mesma seed", () => {
  function gerar(seed) {
    return ["CUS-000001", "CUS-000002", "CUS-000003"].map((id) => {
      const rng = createChildRng(seed, id);
      return { id, valores: Array.from({ length: 3 }, () => rng.next()) };
    });
  }
  assert.deepStrictEqual(gerar(42), gerar(42));
  assert.notDeepStrictEqual(gerar(42), gerar(99));
});