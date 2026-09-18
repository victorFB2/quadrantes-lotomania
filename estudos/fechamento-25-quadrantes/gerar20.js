'use strict';
// 20 quadrantes de 5 numeros (meia linha cada): 1 = 01-05, 2 = 06-10, 3 = 11-15, ..., 20 = 96-00.
// Fechamento de 12 quadrantes (60 numeros) em volantes de 10 quadrantes inteiros (50 numeros).
const fs = require('fs');
const dois = (n) => String(n).padStart(2, '0');
const pos = (n) => (n === 0 ? 100 : n) - 1;
const quad = (n) => Math.floor(pos(n) / 10) * 2 + (pos(n) % 10 < 5 ? 0 : 1); // 0..19
const NUMS = {}; for (let n = 0; n < 100; n++) (NUMS[quad(n)] = NUMS[quad(n)] || []).push(n);
for (const q in NUMS) NUMS[q].sort((a, b) => pos(a) - pos(b));
if (NUMS[0].join() !== '1,2,3,4,5' || NUMS[1].join() !== '6,7,8,9,10' || NUMS[19].join() !== '96,97,98,99,0') throw new Error('mapa errado');

// Grupo do exemplo: quadrantes 1..12 (indices 0..11). Um desenho = lista de pares de quadrantes descartados.
const G = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const DESENHOS = [
  { nome: '12 quadrantes, 5 volantes, garantia 16', pares: [[0, 1], [2, 3], [4, 5], [6, 7], [8, 9]], garantia: 16,
    regra: 'Os 12 quadrantes formam 6 pares: (1,2), (3,4), (5,6), (7,8), (9,10), (11,12). Cada volante tira um par inteiro e marca os outros 10 quadrantes. São 5 volantes: tiram os pares (1,2), (3,4), (5,6), (7,8) e (9,10); o par (11,12) fica marcado em todos.' },
  { nome: '12 quadrantes, 6 volantes, garantia 17', pares: [[0, 1], [2, 3], [4, 5], [6, 7], [8, 9], [10, 11]], garantia: 17,
    regra: 'Os mesmos 6 pares. Cada volante tira um par inteiro e marca os outros 10 quadrantes. São 6 volantes, um para cada par.' },
  { nome: '12 quadrantes, 18 volantes, garantia 18', pares: [], garantia: 18,
    regra: 'Os 12 quadrantes formam 3 grupos de 4: (1,2,3,4), (5,6,7,8), (9,10,11,12). Dentro de cada grupo há 6 duplas possíveis; cada volante tira uma dupla do grupo e marca os outros 10 quadrantes. 3 grupos × 6 duplas = 18 volantes. É o máximo que se pode garantir com quadrantes inteiros: nenhum fechamento chega a 19.' },
];
for (const g of [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11]]) for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) DESENHOS[2].pares.push([g[i], g[j]]);

// Adversario exato: distribui 20 numeros pelos 12 quadrantes (0..5 em cada) para maximizar
// o MINIMO, entre os volantes, de numeros caidos nos 2 quadrantes descartados. Exaustivo.
const c = new Array(12).fill(0);
const melhorAdv = DESENHOS.map(() => -1);
let folhas = 0;
function dfs(i, resta) {
  if (i === 11) {
    if (resta > 5) return;
    c[11] = resta; folhas++;
    for (let d = 0; d < DESENHOS.length; d++) {
      let mn = 99;
      for (const [a, b] of DESENHOS[d].pares) { const s = c[a] + c[b]; if (s < mn) { mn = s; if (mn <= melhorAdv[d]) break; } }
      if (mn > melhorAdv[d]) melhorAdv[d] = mn;
    }
    return;
  }
  const maxAqui = Math.min(5, resta);
  const minAqui = Math.max(0, resta - 5 * (11 - i));
  for (let v = minAqui; v <= maxAqui; v++) { c[i] = v; dfs(i + 1, resta - v); }
}
const t0 = Date.now(); dfs(0, 20);
console.log(`distribuicoes testadas: ${folhas.toLocaleString('pt-BR')} em ${((Date.now() - t0) / 1000).toFixed(1)}s`);

const F = [];
for (let d = 0; d < DESENHOS.length; d++) {
  const D = DESENHOS[d];
  const garantiaExata = 20 - melhorAdv[d];
  if (garantiaExata !== D.garantia) throw new Error(`${D.nome}: garantia exata ${garantiaExata} != ${D.garantia}`);
  const todos = new Set(G.flatMap((q) => NUMS[q]));
  const volantes = D.pares.map(([a, b]) => [...todos].filter((n) => !NUMS[a].includes(n) && !NUMS[b].includes(n)).sort((x, y) => pos(x) - pos(y)));
  for (const v of volantes) if (v.length !== 50 || new Set(v).size !== 50) throw new Error('volante sem 50');
  F.push({ nome: D.nome, regra: D.regra, grupo: G, pares: D.pares, descartes: D.pares.map(([a, b]) => [...NUMS[a], ...NUMS[b]]), volantes, garantia: D.garantia, custo: volantes.length * 3, piorCaso: melhorAdv[d] });
  console.log(`${D.nome} | custo R$ ${volantes.length * 3} | pior caso: ${melhorAdv[d]} numeros nos 2 quadrantes descartados do melhor volante -> garantia exata ${garantiaExata}`);
}

// Probabilidades e historico
const C = (n, k) => { let r = 1n; for (let i = 1n; i <= BigInt(k); i++) r = r * (BigInt(n) - BigInt(k) + i) / i; return r; };
const umEm60 = Number(C(100, 20) * 1000n / C(60, 20)) / 1000;
global.window = {}; require(process.argv[2] + '/dados.js'); const D = window.DATA || window.DADOS_LOTOMANIA;
const ult = D.concursos.slice(-2000); let cabem12 = 0; const hist = {};
for (const [, , dz] of ult) { const s = new Set(); for (let i = 0; i < 40; i += 2) s.add(quad(parseInt(dz.slice(i, i + 2), 10))); hist[s.size] = (hist[s.size] || 0) + 1; if (s.size <= 12) cabem12++; }
console.log('1 em', umEm60, '| ultimos 2000: sorteios que tocam <= 12 dos 20 quadrantes:', cabem12, `(${(cabem12 / 20).toFixed(1)}%)`, '| distribuicao:', JSON.stringify(hist));
fs.writeFileSync(__dirname + '/fechamentos20.json', JSON.stringify({ F, umEm60, cabem12pct: cabem12 / 20, hist, NUMS }, null, 1));
