/**
 * Método do maior resto (Hamilton).
 *
 * Converte pesos em contagens inteiras que somam exatamente `total`,
 * sem erro de arredondamento acumulado.
 *
 * Usa aritmética inteira: quota_i = floor(total * w_i / soma) e
 * resto_i = (total * w_i) mod soma. Com pesos inteiros não há erro de
 * ponto flutuante, então o resultado é exato e determinístico.
 *
 * Empate de resto é resolvido pela ordem dos índices (determinístico).
 */
function quotaLargestRemainder(total, weights) {
  if (!Number.isInteger(total) || total < 0) {
    throw new Error("total precisa ser inteiro não negativo");
  }
  if (weights.some((w) => !Number.isInteger(w) || w < 0)) {
    throw new Error("pesos precisam ser inteiros não negativos");
  }
  const soma = weights.reduce((a, b) => a + b, 0);
  if (soma === 0) throw new Error("a soma dos pesos não pode ser zero");

  const pisos = weights.map((w) => Math.floor((total * w) / soma));
  const restos = weights.map((w, i) => (total * w) - pisos[i] * soma);

  let faltam = total - pisos.reduce((a, b) => a + b, 0);

  const ordem = restos
    .map((r, i) => ({ r, i }))
    .sort((a, b) => b.r - a.r || a.i - b.i)
    .map((x) => x.i);

  const contagens = pisos.slice();
  for (let k = 0; k < faltam; k++) {
    contagens[ordem[k]] += 1;
  }
  return contagens;
}

module.exports = { quotaLargestRemainder };
