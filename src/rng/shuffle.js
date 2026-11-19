/**
 * Embaralha `array` (não modifica o original) usando Fisher-Yates
 * com um `rng` determinístico — mesma seed, mesmo embaralhamento.
 *
 * Por que precisamos disso (D7): se atribuíssemos behavior_profile
 * em blocos (350 HEALTHY_STABLE, depois 150 HEALTHY_GROWING, ...) e
 * déssemos customer_id na ordem de criação, o ID revelaria o perfil
 * (CUS-000001..000350 = sempre HEALTHY_STABLE). Embaralhando a lista
 * de perfis ANTES de atribuir os IDs, essa correlação desaparece.
 */
function seededShuffle(array, rng) {
  const result = array.slice(); // cópia — não mexe no array original

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1)); // 0 <= j <= i
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

module.exports = { seededShuffle };
