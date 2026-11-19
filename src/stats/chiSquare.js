/**
 * Estatística qui-quadrado de independência para uma tabela de contingência
 * (linhas x colunas de contagens). Devolve { stat, df }.
 *
 * Só é confiável quando as contagens esperadas são >= ~5 em quase todas as células.
 */
function chiSquare(tabela) {
  const linhas = tabela.length;
  const colunas = tabela[0].length;
  const totLinha = tabela.map((l) => l.reduce((a, b) => a + b, 0));
  const totColuna = Array.from({ length: colunas }, (_, j) => tabela.reduce((s, l) => s + l[j], 0));
  const n = totLinha.reduce((a, b) => a + b, 0);

  let stat = 0;
  for (let i = 0; i < linhas; i++) {
    for (let j = 0; j < colunas; j++) {
      const esperado = (totLinha[i] * totColuna[j]) / n;
      stat += (tabela[i][j] - esperado) ** 2 / esperado;
    }
  }
  return { stat, df: (linhas - 1) * (colunas - 1) };
}

/** Monta a tabela de contingência entre duas listas pareadas de categorias. */
function tabular(listaA, categoriasA, listaB, categoriasB) {
  const tabela = categoriasA.map(() => Array(categoriasB.length).fill(0));
  listaA.forEach((a, k) => {
    tabela[categoriasA.indexOf(a)][categoriasB.indexOf(listaB[k])]++;
  });
  return tabela;
}

module.exports = { chiSquare, tabular };
