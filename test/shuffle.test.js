const { test } = require("node:test");
const assert = require("node:assert");
const { mulberry32 } = require("../src/rng/prng");
const { seededShuffle } = require("../src/rng/shuffle");

function makeRng(seed) { return { next: mulberry32(seed) }; }

test("mesma seed produz o mesmo embaralhamento", () => {
  const original = Array.from({ length: 50 }, (_, i) => i);
  assert.deepStrictEqual(
    seededShuffle(original, makeRng(42)),
    seededShuffle(original, makeRng(42))
  );
});

test("seeds diferentes produzem embaralhamentos diferentes", () => {
  const original = Array.from({ length: 50 }, (_, i) => i);
  assert.notDeepStrictEqual(
    seededShuffle(original, makeRng(42)),
    seededShuffle(original, makeRng(99))
  );
});

test("o array original não é modificado (função pura)", () => {
  const original = [1, 2, 3, 4, 5];
  const copia = [...original];
  seededShuffle(original, makeRng(1));
  assert.deepStrictEqual(original, copia);
});

test("o resultado é uma permutação", () => {
  const original = Array.from({ length: 1000 }, (_, i) => i);
  const embaralhado = seededShuffle(original, makeRng(7));
  assert.strictEqual(embaralhado.length, original.length);
  assert.deepStrictEqual([...embaralhado].sort((x, y) => x - y), original);
});

test("D7: após embaralhar, o ID não revela mais o bloco de perfil original", () => {
  const perfisEmBlocos = [
    ...Array(350).fill("HEALTHY_STABLE"),
    ...Array(150).fill("HEALTHY_GROWING"),
    ...Array(500).fill("OUTROS"),
  ];
  const embaralhado = seededShuffle(perfisEmBlocos, makeRng(42));
  assert.strictEqual(perfisEmBlocos.slice(0, 350).every((p) => p === "HEALTHY_STABLE"), true);
  assert.strictEqual(embaralhado.slice(0, 350).every((p) => p === "HEALTHY_STABLE"), false);
  const contagem = {};
  for (const p of embaralhado) contagem[p] = (contagem[p] || 0) + 1;
  assert.strictEqual(contagem["HEALTHY_STABLE"], 350);
  assert.strictEqual(contagem["HEALTHY_GROWING"], 150);
  assert.strictEqual(contagem["OUTROS"], 500);
});