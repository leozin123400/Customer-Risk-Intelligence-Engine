/**
 * PRNG determinístico (mulberry32).
 *
 * Por que não Math.random(): o motor JS não aceita seed, então cada
 * execução produz uma sequência diferente e o dataset nunca seria
 * reproduzível (Fase 3A §36).
 *
 * mulberry32 recebe um inteiro de 32 bits (a seed) e devolve uma
 * função geradora: cada chamada dela retorna o próximo número em
 * [0, 1), sempre na mesma ordem para a mesma seed.
 */

function mulberry32(seed) {
  let a = seed >>> 0; // força inteiro sem sinal de 32 bits

  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deriva uma seed de 32 bits a partir de uma string qualquer
 * (ex.: "42:CUS-000417"). Usamos um hash simples (djb2) só para
 * transformar texto em um inteiro — não precisa ser criptográfico,
 * só precisa ser determinístico.
 */
function hashStringToSeed(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0;
}

/**
 * Cria um gerador "filho" isolado para uma entidade específica
 * (um cliente, por exemplo), a partir da seed global do dataset.
 *
 * Isso implementa o generation_seed da Fase 3B §5.8: cada cliente
 * tem sua própria sequência, então regenerar um cliente isolado
 * não muda a sequência de nenhum outro.
 */
function createChildRng(globalSeed, entityKey) {
  const childSeed = hashStringToSeed(`${globalSeed}:${entityKey}`);
  return {
    seed: childSeed,
    next: mulberry32(childSeed),
  };
}

module.exports = { mulberry32, hashStringToSeed, createChildRng };
