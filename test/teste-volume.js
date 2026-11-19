function media(v) {
  return v.reduce((a, b) => a + b, 0) / v.length;
}

function mediana(v) {
  const ordenado = [...v].sort((a, b) => a - b);
  return ordenado[Math.floor((ordenado.length - 1) / 2)];
}

function soma(v) {
  return v.reduce((a, b) => a + b, 0);
}

const antes = [2, 3, 3, 4, 100];
const depois = [2, 3, 3, 4, 1000];

console.log("antes  -> média:", media(antes), "| mediana:", mediana(antes), "| soma:", soma(antes));
console.log("depois -> média:", media(depois), "| mediana:", mediana(depois), "| soma:", soma(depois));