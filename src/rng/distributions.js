/**
 * Escolhe um item de `options` respeitando os pesos em `weights`.
 *
 * Exemplo: weightedChoice(rng, ["A", "B"], [0.8, 0.2]) escolhe "A" em
 * ~80% das chamadas e "B" em ~20%, ao longo de muitas chamadas.
 *
 * `weights` não precisa somar 1 (ex.: pode usar [20, 35, 25, 15, 5],
 * que são as porcentagens da Fase 3B §7 direto, sem converter).
 */
function weightedChoice(rng, options, weights) {
  if (options.length !== weights.length) {
    throw new Error("options e weights precisam ter o mesmo tamanho");
  }

  const total = weights.reduce((sum, w) => sum + w, 0);
  let ticket = rng.next() * total; // sorteia um ponto dentro da "régua"

  for (let i = 0; i < options.length; i++) {
    ticket -= weights[i];
    if (ticket < 0) {
      return options[i];
    }
  }

  // Só chega aqui por erro de arredondamento de ponto flutuante
  // (ex.: soma deu 99.9999999998 em vez de 100). Devolve a última
  // opção em vez de deixar a função retornar undefined.
  return options[options.length - 1];
}

module.exports = { weightedChoice };
