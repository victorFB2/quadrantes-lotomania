/*
  Testes do gerador de 12 em 20 quadrantes (fechamentos/20-quadrantes/gerador.js).
  Roda com:  node teste_gerador20.js   (de dentro desta pasta)
*/
'use strict';
const path = require('path');
const RAIZ = path.resolve(__dirname, '..', '..');
global.window = {};
require(path.join(RAIZ, 'dados.js'));
const D = global.window.DADOS_LOTOMANIA;
const G = require(path.join(RAIZ, 'fechamentos', '20-quadrantes', 'gerador.js'));

let falhas = 0; let testes = 0;
function teste(nome, fn) { testes += 1; try { fn(); console.log('  ok   ' + nome); } catch (e) { falhas += 1; console.log('  FALHOU ' + nome + '\n         ' + e.message); } }
function igual(a, b, msg) { const x = JSON.stringify(a); const y = JSON.stringify(b); if (x !== y) throw new Error((msg || '') + ` esperado ${y}, veio ${x}`); }
function perto(a, b, msg) { if (Math.abs(a - b) > 0.005) throw new Error((msg || '') + ` esperado ${b}, veio ${a}`); }
function verdade(v, msg) { if (!v) throw new Error(msg || 'falso'); }
function semente(s) { return () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function amostra(rng, xs, k) { const c = xs.slice(); const out = []; while (out.length < k) out.push(c.splice(Math.floor(rng() * c.length), 1)[0]); return out; }
const pos = (n) => (n === 0 ? 100 : n) - 1;
const quadIndependente = (n) => Math.floor(pos(n) / 10) * 2 + (pos(n) % 10 < 5 ? 0 : 1);

console.log('Gerador 12 em 20 - testes');

teste('20 quadrantes de 5, um por meia linha, 100 numeros uma vez cada', () => {
  igual(G.NUMEROS[0], [1, 2, 3, 4, 5]); igual(G.NUMEROS[1], [6, 7, 8, 9, 10]); igual(G.NUMEROS[2], [11, 12, 13, 14, 15]);
  igual(G.NUMEROS[18], [91, 92, 93, 94, 95]); igual(G.NUMEROS[19], [96, 97, 98, 99, 0]);
  const todos = G.NUMEROS.flat().sort((a, b) => a - b); igual(todos, [...Array(100).keys()]);
  for (let n = 0; n < 100; n += 1) igual(G.quadranteDe(n), quadIndependente(n), `numero ${n}`);
});

teste('validar: precisa de exatamente 12 quadrantes distintos de 1 a 20', () => {
  igual(G.validar([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], 6), null);
  verdade(G.validar([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 6), '11 quadrantes');
  verdade(G.validar([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10], 6), 'repetido');
  verdade(G.validar([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20], 6), 'quadrante 21');
  verdade(G.validar([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], 7), 'tamanho 7');
});

teste('cada volante tem 50 numeros = 10 quadrantes inteiros dos 12; os 2 de fora batem', () => {
  const rng = semente(1);
  for (let k = 0; k < 200; k += 1) {
    const esc = amostra(rng, [...Array(20).keys()], 12);
    for (const t of [5, 6, 18]) {
      const r = G.gerar(esc, t);
      igual(r.volantes.length, t); igual(r.garantia, G.TAMANHOS[t].garantia);
      igual(r.grupo, [...esc].sort((a, b) => a - b));
      const numsGrupo = new Set(r.grupo.flatMap((q) => G.NUMEROS[q]));
      r.volantes.forEach((v, i) => {
        igual(v.length, 50); igual(new Set(v).size, 50);
        for (const n of v) verdade(numsGrupo.has(n), 'numero fora do grupo');
        const qs = new Set(v.map(quadIndependente)); igual(qs.size, 10, 'nao sao 10 quadrantes inteiros');
        for (const q of qs) for (const n of G.NUMEROS[q]) verdade(v.includes(n), 'quadrante pela metade');
        const fora = [...r.grupo].filter((q) => !qs.has(q)).sort((a, b) => a - b);
        igual(fora, [...r.fora[i].quadrantes].sort((a, b) => a - b), 'quadrantes de fora');
        igual(r.fora[i].numeros.length, 10);
      });
      igual(new Set(r.volantes.map((v) => v.join(','))).size, t, 'volantes repetidos');
    }
  }
});

teste('estrutura dos pares: 5 e 6 = pares consecutivos disjuntos; 18 = 3 grupos de 4 com todas as duplas', () => {
  const esc = [...Array(12).keys()];
  igual(G.gerar(esc, 5).fora.map((f) => f.quadrantes), [[0, 1], [2, 3], [4, 5], [6, 7], [8, 9]]);
  igual(G.gerar(esc, 6).fora.map((f) => f.quadrantes), [[0, 1], [2, 3], [4, 5], [6, 7], [8, 9], [10, 11]]);
  const r18 = G.gerar(esc, 18).fora.map((f) => f.quadrantes);
  for (const [a, b] of r18) igual(Math.floor(a / 4), Math.floor(b / 4), 'dupla cruzando grupos');
  igual(new Set(r18.map((p) => p.join('-'))).size, 18);
});

// A garantia, provada por forca bruta sobre as distribuicoes: quantos dos 20 sorteados caem
// em cada um dos 12 quadrantes (0..5, soma 20). Igual ao gerar20.js do estudo.
teste('garantias 16, 17 e 18 (exaustivo sobre as 36.154.767 distribuicoes)', () => {
  const esc = [...Array(12).keys()];
  const desenhos = [5, 6, 18].map((t) => ({ t, pares: G.gerar(esc, t).fora.map((f) => f.quadrantes) }));
  const c = new Array(12).fill(0); const melhorAdv = desenhos.map(() => -1); let folhas = 0;
  (function dfs(i, resta) {
    if (i === 11) {
      if (resta > 5) return; c[11] = resta; folhas += 1;
      for (let d = 0; d < desenhos.length; d += 1) {
        let mn = 99;
        for (const [a, b] of desenhos[d].pares) { const s = c[a] + c[b]; if (s < mn) { mn = s; if (mn <= melhorAdv[d]) break; } }
        if (mn > melhorAdv[d]) melhorAdv[d] = mn;
      }
      return;
    }
    for (let v = Math.max(0, resta - 5 * (11 - i)); v <= Math.min(5, resta); v += 1) { c[i] = v; dfs(i + 1, resta - v); }
  }(0, 20));
  igual(folhas, 36154767, 'numero de distribuicoes');
  desenhos.forEach((d, i) => igual(20 - melhorAdv[i], G.TAMANHOS[d.t].garantia, `garantia do tamanho ${d.t}`));
});

teste('teste no passado bate com a conta volante por volante (ultimos 60)', () => {
  const r = G.gerar([0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 1, 3], 6);
  const t = G.testar(D, r.volantes, 60);
  igual(t.periodo, 60); igual(t.volantes, 6); perto(t.gasto, 60 * 6 * 3);
  const concursos = G.lerConcursos(D).slice(-60);
  let ganho = 0; let premiados = 0; let dentro = 0; const melhor = new Map();
  for (const c of concursos) {
    let pago = 0; let topo = 0;
    for (const v of r.volantes) { const h = v.filter((n) => c.sorteio.has(n)).length; topo = Math.max(topo, h); if (c.premios && h in c.premios) pago += c.premios[h]; }
    melhor.set(topo, (melhor.get(topo) || 0) + 1);
    ganho += pago; if (pago > 0) premiados += 1;
    if ([...c.sorteio].every((n) => r.volantes.some((v) => v.includes(n)))) dentro += 1;
  }
  perto(t.ganho, ganho); igual(t.premiados, premiados); igual(t.dentroDoGrupo, dentro);
  igual(t.melhor.sort(), [...melhor].sort());
  perto(G.PROB_ACASO.reduce((s, p) => s + p, 0), 1);
  perto(G.UM_EM, 127863.37, 'chance de cair no grupo');
});

teste('texto para a loterica: um volante por linha, 50 numeros, com os quadrantes de fora', () => {
  const r = G.gerar([...Array(12).keys()], 18);
  const linhas = G.textoVolantes(r).split('\n').filter((l) => l && !l.startsWith('#'));
  igual(linhas.length, 18);
  for (const l of linhas) igual(l.split('): ')[1].split(' ').length, 50);
  verdade(linhas[0].includes('fora: quadrantes 1 e 2'));
});

console.log(`\n${testes - falhas} de ${testes} testes passaram.`);
process.exit(falhas ? 1 : 0);
