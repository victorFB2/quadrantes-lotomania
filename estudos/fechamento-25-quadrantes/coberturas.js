'use strict';
// Tabela pura de quadrantes: jogar K quadrantes (10..14) em jogos de 10.
// Se dos K jogados "faltaram" d (nao sairam), preciso de um jogo cujos K-10 quadrantes
// de fora contenham esses d. Isso e uma cobertura: blocos de tamanho K-10 cobrindo
// todos os subconjuntos de tamanho d dos K quadrantes (posicoes 1..K).
const fs = require('fs');
const comb = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return Math.round(r); };
function subconjuntos(n, k) { const out = []; const c = []; (function rec(i) { if (c.length === k) { out.push(c.slice()); return; } for (let j = i; j < n; j++) { c.push(j); rec(j + 1); c.pop(); } }(0)); return out; }
function cobre(blocos, n, d) {
  const alvo = subconjuntos(n, d); const chave = (s) => s.join(',');
  const vistos = new Set();
  for (const b of blocos) for (const s of subconjuntos(b.length, d)) vistos.add(chave(s.map((i) => b[i])));
  const faltam = alvo.filter((s) => !vistos.has(chave(s)));
  return { ok: faltam.length === 0, faltam: faltam.length, total: alvo.length };
}
// busca local para cobertura C(n,k,d) com m blocos (semente fixa)
function buscar(n, k, d, m, semente, passos) {
  let s = semente >>> 0; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const alvo = subconjuntos(n, d); const idx = new Map(alvo.map((t, i) => [t.join(','), i]));
  const subsDe = (b) => subconjuntos(b.length, d).map((s) => idx.get(s.map((i) => b[i]).join(',')));
  const blocos = []; for (let i = 0; i < m; i++) { const p = [...Array(n).keys()].sort(() => rnd() - 0.5).slice(0, k).sort((a, b) => a - b); blocos.push(p); }
  const cont = new Array(alvo.length).fill(0); const cache = blocos.map(subsDe); for (const c of cache) for (const t of c) cont[t]++;
  let descobertos = cont.filter((x) => x === 0).length;
  for (let passo = 0; passo < passos && descobertos > 0; passo++) {
    const bi = Math.floor(rnd() * m); const b = blocos[bi];
    const pos = Math.floor(rnd() * k); let novo; do { novo = Math.floor(rnd() * n); } while (b.includes(novo));
    const b2 = b.slice(); b2[pos] = novo; b2.sort((a, c) => a - c);
    const c2 = subsDe(b2);
    for (const t of cache[bi]) cont[t]--; for (const t of c2) cont[t]++;
    const desc2 = cont.filter((x) => x === 0).length;
    if (desc2 <= descobertos || rnd() < 0.01) { blocos[bi] = b2; cache[bi] = c2; descobertos = desc2; }
    else { for (const t of c2) cont[t]--; for (const t of cache[bi]) cont[t]++; }
  }
  return descobertos === 0 ? blocos : null;
}

const R = { tabela: {}, coberturas: {} };
const casos = [];
for (const K of [10, 12, 13, 14]) {
  const k = K - 10; R.tabela[K] = { completo: comb(K, 10), porFalta: {} };
  for (let d = 0; d <= k; d++) casos.push({ K, k, d });
}
for (const { K, k, d } of casos) {
  let blocos = null; let nome = '';
  if (d === 0) { blocos = [[...Array(k).keys()]]; nome = 'qualquer jogo'; }
  else if (d === k) { blocos = subconjuntos(K, k); nome = 'todas as combinacoes'; }
  else if (K === 12 && d === 1) { blocos = [[0, 1], [2, 3], [4, 5], [6, 7], [8, 9], [10, 11]]; nome = '6 pares'; }
  else if (K === 13 && d === 1) { blocos = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9, 10, 11], [12, 0, 1]]; nome = '5 trios'; }
  else if (K === 13 && d === 2) { blocos = []; for (let i = 0; i < 13; i++) { blocos.push([i, (i + 1) % 13, (i + 4) % 13].sort((a, b) => a - b)); blocos.push([i, (i + 2) % 13, (i + 7) % 13].sort((a, b) => a - b)); } nome = 'sistema de Steiner STS(13), 26 trios'; }
  else if (K === 14 && d === 1) { blocos = [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 0, 1]]; nome = '4 quartetos'; }
  else if (K === 14 && d === 2) { for (const sem of [1, 2, 3, 4, 5, 6, 7, 8]) { blocos = buscar(14, 4, 2, 18, sem, 400000); if (blocos) break; } nome = blocos ? '18 quartetos (busca)' : 'nao achou 18'; }
  else if (K === 14 && d === 3) {
    const arq = __dirname + '/sqs14.json';
    if (fs.existsSync(arq)) { blocos = JSON.parse(fs.readFileSync(arq, 'utf8')); nome = 'sistema de Steiner SQS(14), 91 quartetos (La Jolla)'; }
    else { for (const m of [91, 95, 100, 105, 110]) { for (const sem of [1, 2, 3]) { blocos = buscar(14, 4, 3, m, sem, 1500000); if (blocos) break; } if (blocos) { nome = `${m} quartetos (busca)`; break; } } }
  }
  const v = blocos ? cobre(blocos, K, d) : { ok: false };
  const minimo = d === 0 ? 1 : d === k ? comb(K, k) : null;
  console.log(`K=${K} faltam ${d}: ${blocos ? blocos.length : '-'} jogos | ${nome} | cobre tudo: ${v.ok}${v.ok ? '' : ' (faltam ' + v.faltam + ' de ' + v.total + ')'}`);
  R.tabela[K].porFalta[d] = { jogos: blocos ? blocos.length : null, nome, ok: v.ok };
  R.coberturas[`${K}-${d}`] = blocos;
}
fs.writeFileSync(__dirname + '/coberturas.json', JSON.stringify(R));
