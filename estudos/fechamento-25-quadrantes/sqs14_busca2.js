'use strict';
// SQS(14) por cobertura exata (Algoritmo X) com um grupo de simetria: tenta varias
// permutacoes geradoras dos 14 pontos; as orbitas de quartetos sao as opcoes e os
// 364 trios sao os itens, cada um coberto exatamente uma vez.
const fs = require('fs');
const N = 14;
const chave = (t) => t.slice().sort((a, b) => a - b).join(',');
const trios = []; const idxTrio = new Map();
for (let a = 0; a < N; a++) for (let b = a + 1; b < N; b++) for (let c = b + 1; c < N; c++) { idxTrio.set(chave([a, b, c]), trios.length); trios.push([a, b, c]); }
const triosDe = (q) => [[q[0], q[1], q[2]], [q[0], q[1], q[3]], [q[0], q[2], q[3]], [q[1], q[2], q[3]]].map((t) => idxTrio.get(chave(t)));

// geradores: cada um e uma permutacao (array p com p[i] = imagem de i)
function ciclo(partes) { // partes: lista de ciclos (arrays de pontos); pontos ausentes ficam fixos
  const p = [...Array(N).keys()];
  for (const c of partes) for (let i = 0; i < c.length; i++) p[c[i]] = c[(i + 1) % c.length];
  return p;
}
const seq = (a, b) => Array.from({ length: b - a }, (_, i) => a + i);
const GRUPOS = {
  'Z14': [ciclo([seq(0, 14)])],
  'Z7 x 2 orbitas': [ciclo([seq(0, 7), seq(7, 14)])],
  'Z7 x 2 orbitas + troca': [ciclo([seq(0, 7), seq(7, 14)]), ciclo(seq(0, 7).map((i) => [i, i + 7]))],
  'Z13 + fixo': [ciclo([seq(0, 13)])],
  'Z12 + 2 fixos': [ciclo([seq(0, 12)])],
  'Z6 x 2 + 2 fixos': [ciclo([seq(0, 6), seq(6, 12)])],
  'Z4 x 3 + 2 fixos': [ciclo([seq(0, 4), seq(4, 8), seq(8, 12)])],
  'Z2 x 7': [ciclo(seq(0, 7).map((i) => [2 * i, 2 * i + 1]))],
  'Z3 x 4 + 2 fixos': [ciclo([seq(0, 3), seq(3, 6), seq(6, 9), seq(9, 12)])],
};

function orbitaDe(q, gens) { // orbita de um quarteto sob o grupo gerado
  const vistos = new Set([chave(q)]); const fila = [q.slice()]; const out = [q.slice().sort((a, b) => a - b)];
  while (fila.length) { const x = fila.pop(); for (const p of gens) { const y = x.map((i) => p[i]).sort((a, b) => a - b); const k = chave(y); if (!vistos.has(k)) { vistos.add(k); fila.push(y); out.push(y); } } }
  return out;
}

function resolverCom(nome, gens) {
  // opcoes = orbitas de quartetos cuja cobertura de trios nao repete trio
  const vistos = new Set(); const opcoes = [];
  for (let a = 0; a < N; a++) for (let b = a + 1; b < N; b++) for (let c = b + 1; c < N; c++) for (let d = c + 1; d < N; d++) {
    const k = chave([a, b, c, d]); if (vistos.has(k)) continue;
    const orb = orbitaDe([a, b, c, d], gens); for (const q of orb) vistos.add(chave(q));
    const itens = []; const s = new Set(); let repete = false;
    for (const q of orb) for (const t of triosDe(q)) { if (s.has(t)) { repete = true; break; } s.add(t); itens.push(t); }
    if (!repete) opcoes.push({ blocos: orb, itens });
  }
  // Algoritmo X simples: item com menos opcoes primeiro
  const coberto = new Array(trios.length).fill(false); const escolha = [];
  const porItem = trios.map((_, i) => opcoes.filter((o) => o.itens.includes(i)));
  let nos = 0; const LIMITE = 3e6;
  function rec() {
    if (++nos > LIMITE) return false;
    let melhor = -1; let menor = Infinity;
    for (let i = 0; i < trios.length; i++) { if (coberto[i]) continue; let n = 0; for (const o of porItem[i]) { if (!o.itens.some((t) => coberto[t])) n++; } if (n < menor) { menor = n; melhor = i; if (n === 0) return false; } }
    if (melhor === -1) return true;
    for (const o of porItem[melhor]) {
      if (o.itens.some((t) => coberto[t])) continue;
      for (const t of o.itens) coberto[t] = true; escolha.push(o);
      if (rec()) return true;
      escolha.pop(); for (const t of o.itens) coberto[t] = false;
    }
    return false;
  }
  const t0 = Date.now(); const ok = rec();
  console.log(`${nome}: ${opcoes.length} orbitas de quartetos | ${ok ? 'ACHOU' : 'nao achou'} (${nos} nos, ${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  if (!ok) return null;
  return escolha.flatMap((o) => o.blocos);
}

let blocos = null;
for (const [nome, gens] of Object.entries(GRUPOS)) { blocos = resolverCom(nome, gens); if (blocos) break; }
if (!blocos) { console.log('nenhum grupo deu SQS(14)'); process.exit(2); }
const cont = new Map(); for (const b of blocos) for (const t of triosDe(b)) cont.set(t, (cont.get(t) || 0) + 1);
const ok = blocos.length === 91 && cont.size === 364 && [...cont.values()].every((v) => v === 1);
console.log(`SQS(14): ${blocos.length} blocos, cada trio exatamente uma vez: ${ok}`);
if (ok) fs.writeFileSync(__dirname + '/sqs14.json', JSON.stringify(blocos));
process.exit(ok ? 0 : 1);
