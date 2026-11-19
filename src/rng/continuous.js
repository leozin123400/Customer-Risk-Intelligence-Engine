/**
 * Distribuições contínuas a partir do rng com seed.
 *
 * normal(): Box-Muller. Transforma DOIS números uniformes em [0,1) em um
 * número com distribuição normal padrão (média 0, desvio 1).
 *
 * lognormalFromRange(): log-normal ASSIMÉTRICA ajustada a uma faixa [min, max].
 * Se Y ~ Normal(mu, sigma), então X = exp(Y) é log-normal: sempre positivo,
 * concentrado perto da mediana e com cauda longa à direita (poucos valores grandes).
 */
function normal(rng) {
  const u1 = 1 - rng.next(); // em (0, 1]: evita log(0)
  const u2 = rng.next();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// 1,645 = z que deixa 5% em cada ponta da normal padrão (intervalo central de 90%).
const Z_90 = 1.6449;

/**
 * A faixa [min, max] é tratada como o INTERVALO CENTRAL DE 90% (percentis 5 e 95):
 * ~5% dos valores caem abaixo de min e ~5% acima de max ("faixas são referências,
 * não limites rígidos": Fase 3A §5). A mediana é a média geométrica sqrt(min*max).
 */
function lognormalFromRange(rng, min, max) {
  if (!(min > 0) || !(max > min)) throw new Error("faixa inválida: precisa 0 < min < max");
  const mu = (Math.log(min) + Math.log(max)) / 2;
  const sigma = (Math.log(max) - Math.log(min)) / (2 * Z_90);
  return Math.exp(mu + sigma * normal(rng));
}

module.exports = { normal, lognormalFromRange, Z_90 };
