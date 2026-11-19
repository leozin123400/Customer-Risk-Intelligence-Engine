const { test } = require("node:test");
const assert = require("node:assert");
const {
    SIZE_WEIGHTS,
    PLAN_TARGET,
    PLAN_BY_SIZE,
} = require("../src/config/planBySize");

test("cada linha (porte) soma 100%", () => {
    PLAN_BY_SIZE.forEach((linha, i) => {
        assert.strictEqual(linha.reduce((a, b) => a + b, 0), 100, `linha ${i}`);
    });
});

test("marginal de plano bate EXATAMENTE com 40/35/20/5 (aritmética inteira)", () => {
    // soma_i( peso_porte_i * x_ij ) = 100 * meta_j, tudo em inteiros: sem erro de ponto flutuante
    PLAN_TARGET.forEach((meta, j) => {
        const soma = PLAN_BY_SIZE.reduce((s, linha, i) => s + SIZE_WEIGHTS[i] * linha[j], 0);
        assert.strictEqual(soma, meta * 100, `plano ${j}: ${soma / 100}% (meta ${meta}%)`);
    });
});

test("toda célula é >= 1% (exceções existem: 3A §5 e §7)", () => {
    for (const linha of PLAN_BY_SIZE) {
        for (const x of linha) assert.ok(x >= 1);
    }
});

test("estrutura: Starter cai e Enterprise sobe conforme o porte aumenta", () => {
    for (let i = 0; i < PLAN_BY_SIZE.length - 1; i++) {
        assert.ok(PLAN_BY_SIZE[i][0] >= PLAN_BY_SIZE[i + 1][0], `Starter sobe entre linhas ${i} e ${i + 1}`);
        assert.ok(PLAN_BY_SIZE[i][3] <= PLAN_BY_SIZE[i + 1][3], `Enterprise cai entre linhas ${i} e ${i + 1}`);
    }
});

test("estrutura: plano mais comum de cada porte (Starter, Starter, Growth, Business, Enterprise)", () => {
    const modal = [0, 0, 1, 2, 3];
    PLAN_BY_SIZE.forEach((linha, i) => {
        assert.strictEqual(linha[modal[i]], Math.max(...linha), `linha ${i}`);
    });
});