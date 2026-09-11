/*
  Prova de que a conta do sistema dos quadrantes esta certa.

  O metodo e o mesmo do site: a conta rapida (combinar quadrante por
  quadrante) e comparada com a conta burra (gerar os volantes e conferir um
  por um). Se as duas discordarem em qualquer ponto, o teste quebra.

  Roda com:  node teste.js
*/
'use strict';

global.window = {};
require('./dados.js');
const D = global.window.DADOS_LOTOMANIA;
const Q = require('./sistema.js');

let falhas = 0;
let testes = 0;
function teste(nome, fn) {
  testes += 1;
  try { fn(); console.log('  ok   ' + nome); } catch (e) { falhas += 1; console.log('  FALHOU ' + nome + '\n         ' + e.message); }
}
function igual(a, b, msg) {
  const x = JSON.stringify(a); const y = JSON.stringify(b);
  if (x !== y) throw new Error((msg || '') + ` esperado ${y}, veio ${x}`);
}
function perto(a, b, msg) { if (Math.abs(a - b) > 0.005) throw new Error((msg || '') + ` esperado ${b}, veio ${a}`); }
function verdade(v, msg) { if (!v) throw new Error(msg || 'falso'); }

// Sorteio com semente, para o teste dar sempre o mesmo resultado.
function semente(s) { return () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function amostra(rng, xs, k) { const c = xs.slice(); const out = []; while (out.length < k) out.push(c.splice(Math.floor(rng() * c.length), 1)[0]); return out; }
const escolha = (rng) => Q.QUADRANTES.flatMap((ns) => amostra(rng, ns, 5)).sort((a, b) => a - b);
const doQuadrante = (ns, q) => ns.filter((n) => Q.QUADRANTE_DE[n] === q);
const concursos = Q.lerConcursos(D);

// Os quadrantes que o pai mandou, escritos de novo aqui, a parte, como estao
// na mensagem dele. Se alguem mexer na lista do sistema, este teste acusa.
const PEDIDO = [
  '01,02,03,04,05,11,12,13,14,15', '06,07,08,09,10,16,17,18,19,20',
  '21,22,23,24,25,31,32,33,34,35', '26,27,28,29,30,36,37,38,39,40',
  '41,42,43,44,45,51,52,53,54,55', '46,47,48,49,50,56,57,58,59,60',
  '61,62,63,64,65,71,72,73,74,75', '66,67,68,69,70,76,77,78,79,80',
  '81,82,83,84,85,91,92,93,94,95', '86,87,88,89,90,96,97,98,99,00',
];

console.log('Quadrantes com espelho - testes');

teste('quadrantes sao exatamente os do pedido', () => {
  PEDIDO.forEach((t, q) => igual([...Q.QUADRANTES[q]].sort((a, b) => a - b), t.split(',').map((x) => +x % 100).sort((a, b) => a - b), `quadrante ${q + 1}`));
});

teste('quadrantes seguem o volante de papel (2 linhas x 5 colunas), 100 numeros uma vez cada', () => {
  const vistos = [];
  Q.QUADRANTES.forEach((ns, q) => ns.forEach((n) => {
    const pos = (n || 100) - 1; const linha = Math.floor(pos / 10); const coluna = pos % 10;
    igual(Math.floor(linha / 2) * 2 + Math.floor(coluna / 5), q, `numero ${n}`);
    vistos.push(n);
  }));
  igual(vistos.sort((a, b) => a - b), [...Array(100).keys()]);
  igual(Q.QUADRANTE_DE[10], 1, 'o 10 e do quadrante 2');
  igual(Q.QUADRANTE_DE[0], 9, 'o 00 e do quadrante 10');
});

teste('de 5 a 10 quadrantes alternando: 32, 64, 128, 256, 512, 1024 volantes validos', () => {
  const rng = semente(1);
  const m = escolha(rng);
  for (let k = 5; k <= 10; k += 1) {
    const a = amostra(rng, [...Array(10).keys()], k).sort((x, y) => x - y);
    const vs = Q.gerarVolantes(m, a);
    igual(vs.length, 2 ** k, `${k} alternando`);
    igual(new Set(vs.map((v) => v.join(','))).size, 2 ** k, 'volantes repetidos');
    for (const v of vs) {
      igual(new Set(v).size, 50, 'volante sem 50 numeros diferentes');
      for (let q = 0; q < 10; q += 1) igual(doQuadrante(v, q).length, 5, 'quadrante sem 5');
    }
  }
});

teste('quadrante fixo leva sempre os riscados; o que alterna divide ao meio', () => {
  const m = escolha(semente(2));
  const a = [0, 2, 4, 6, 8];
  const vs = Q.gerarVolantes(m, a);
  for (const v of vs) for (const q of [1, 3, 5, 7, 9]) igual(doQuadrante(v, q), doQuadrante(m, q));
  for (const q of a) {
    const lado = doQuadrante(m, q);
    igual(vs.filter((v) => lado.every((n) => v.includes(n))).length, vs.length / 2, `quadrante ${q + 1}`);
  }
});

teste('com 10 alternando, cada numero esta em metade dos volantes', () => {
  const vs = Q.gerarVolantes(escolha(semente(3)), [...Array(10).keys()]);
  for (let n = 0; n < 100; n += 1) igual(vs.filter((v) => v.includes(n)).length, 512, `numero ${n}`);
});

teste('contagem rapida bate com a conferencia volante por volante (sorteios reais, 5 a 10)', () => {
  const rng = semente(4);
  const alvo = amostra(rng, concursos, 25);
  for (let k = 5; k <= 10; k += 1) {
    const m = escolha(rng);
    const a = amostra(rng, [...Array(10).keys()], k).sort((x, y) => x - y);
    const vs = Q.gerarVolantes(m, a);
    for (const c of alvo) {
      const burra = new Map();
      for (const v of vs) { const h = v.filter((n) => c.sorteio.has(n)).length; burra.set(h, (burra.get(h) || 0) + 1); }
      igual([...Q.contarAcertos(m, a, c.sorteio)].sort(), [...burra].sort(), `k=${k} concurso ${c.concurso}`);
    }
  }
});

teste('espelho completo: cada volante tem uma gemea que faz 20 menos', () => {
  const m = escolha(semente(5));
  for (const c of concursos.slice(0, 50)) {
    const d = Q.contarAcertos(m, [...Array(10).keys()], c.sorteio);
    for (const [h, q] of d) igual(d.get(20 - h) || 0, q, `concurso ${c.concurso}`);
  }
});

teste('nao ha garantia: sempre existe um sorteio em que todos fazem 10', () => {
  const rng = semente(6);
  for (let i = 0; i < 30; i += 1) {
    const m = escolha(rng);
    const a = amostra(rng, [...Array(10).keys()], 5 + Math.floor(rng() * 6)).sort((x, y) => x - y);
    const s = Q.sorteioSemPremio(m, a);
    igual(new Set(s).size, 20);
    igual([...Q.contarAcertos(m, a, s)], [[10, 2 ** a.length]]);
  }
});

teste('escolhas erradas mostram aviso claro', () => {
  const m = escolha(semente(7));
  igual(Q.validar(m, [0, 1, 2, 3, 4]), null);
  verdade(Q.validar(m, [0, 1, 2, 3]), '4 alternando');
  verdade(Q.validar(m, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 'quadrante 11');
  verdade(Q.validar([...m, 100], [0, 1, 2, 3, 4]), 'numero 100');
  const primeiro = doQuadrante(m, 0)[0];
  verdade(Q.validar(m.filter((n) => n !== primeiro), [0, 1, 2, 3, 4]).includes('quadrante 1'), 'tem que dizer qual');
});

teste('teste no passado bate com a conta volante por volante (ultimos 40)', () => {
  const m = escolha(semente(8));
  const a = [0, 1, 2, 3, 4, 5];
  const r = Q.testar(D, m, a, 40);
  igual(r.periodo, 40); igual(r.volantes, 64);
  perto(r.gasto, 40 * 64 * Q.PRECO_APOSTA);
  const vs = Q.gerarVolantes(m, a);
  let ganho = 0; let premiados = 0; const faixas = new Map();
  for (const c of concursos.slice(-40)) {
    let pago = 0;
    for (const v of vs) {
      const h = v.filter((n) => c.sorteio.has(n)).length;
      if (c.premios && h in c.premios) { faixas.set(h, (faixas.get(h) || 0) + 1); pago += c.premios[h]; }
    }
    ganho += pago; if (pago > 0) premiados += 1;
  }
  perto(r.ganho, ganho); igual(r.premiados, premiados); igual(r.semNada, 40 - premiados);
  igual(r.faixas.map(([h, q]) => [h, q]).sort(), [...faixas].sort());
});

teste('comparacao com o acaso: as chances somam 1', () => {
  perto(Q.PROB_ACASO.reduce((s, p) => s + p, 0), 1);
});

teste('periodo: padrao 500, "todos" e numero maior que a base', () => {
  const m = escolha(semente(9));
  igual(Q.testar(D, m, [0, 1, 2, 3, 4], undefined).periodo, 500);
  igual(Q.testar(D, m, [0, 1, 2, 3, 4], 'todos').periodo, concursos.length);
  igual(Q.testar(D, m, [0, 1, 2, 3, 4], 999999).periodo, concursos.length);
});

teste('arquivo para levar a loterica: todos os volantes, 50 numeros cada', () => {
  const t = Q.textoVolantes(escolha(semente(10)), [0, 1, 2, 3, 4, 5, 6]);
  const linhas = t.split('\n').filter((l) => l && !l.startsWith('#'));
  igual(linhas.length, 128);
  for (const l of linhas) igual(l.split(': ')[1].split(' ').length, 50);
  verdade(t.includes('quadrante 10: 86–90 e 96–00'), 'composicao dos quadrantes');
  verdade(t.includes('R$ 384,00 por concurso'), 'custo em reais: ' + t.split('\n').find((l) => l.includes('volantes de 50')));
});

teste('historico: concursos em ordem, 20 dezenas cada, datas no formato brasileiro', () => {
  let anterior = 0;
  for (const c of concursos) {
    verdade(c.concurso > anterior, `ordem no ${c.concurso}`); anterior = c.concurso;
    igual(c.sorteio.size, 20, `concurso ${c.concurso}`);
    verdade(/^\d{2}\/\d{2}\/\d{4}$/.test(c.data), `data do ${c.concurso}: ${c.data}`);
  }
});

console.log(`\n${testes - falhas} de ${testes} testes passaram.`);
process.exit(falhas ? 1 : 0);
