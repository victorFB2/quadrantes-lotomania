/*
  GERADOR DO FECHAMENTO DE 12 EM 20 QUADRANTES - LOTOMANIA

  Ideia do pai do Victor: o volante dividido em 20 quadrantes de 5 numeros, um
  por meia linha (quadrante 1 = 01-05, 2 = 06-10, 3 = 11-15, ..., 20 = 96-00).
  Cada quadrante vira um "numero" de 1 a 20. Ele escolhe 12; o gerador monta
  os volantes: cada um marca 10 quadrantes inteiros (50 numeros) e deixa 2 de
  fora. A garantia vale quando os 20 sorteados caem todos nos 12 escolhidos.

  Tres tamanhos, com a garantia provada por enumeracao de todas as 36.154.767
  formas de os 20 numeros se espalharem pelos 12 quadrantes (gerar20.js, no
  estudo):
    5 volantes  -> pelo menos 16 pontos em algum volante
    6 volantes  -> pelo menos 17 pontos
    18 volantes -> pelo menos 18 pontos (o maximo possivel com quadrantes
                   inteiros: quando todo quadrante recebe pelo menos 1
                   sorteado - por exemplo 8 com 2 e 4 com 1 - todo volante
                   perde pelo menos 2, entao nenhum desenho garante 19)

  Este arquivo e so a conta. A mesma conta roda na pagina (index.html) e nos
  testes (node teste_gerador20.js).
*/
(function (raiz) {
  'use strict';

  const PRECO_APOSTA = 3.00;
  const FAIXAS = [20, 19, 18, 17, 16, 15, 0];
  const SORTEADAS = 20;
  const APOSTA = 50;
  const ESCOLHER = 12;
  const PERIODO_PADRAO = 500;

  const pos = (n) => (n === 0 ? 100 : n) - 1;
  const quadranteDe = (n) => Math.floor(pos(n) / 10) * 2 + (pos(n) % 10 < 5 ? 0 : 1); // 0..19
  // NUMEROS[q] = os 5 numeros do quadrante q (0..19), na ordem do papel.
  const NUMEROS = [];
  for (let q = 0; q < 20; q += 1) {
    const linha = Math.floor(q / 2);
    const col = (q % 2) * 5;
    NUMEROS.push([0, 1, 2, 3, 4].map((i) => (linha * 10 + col + i + 1) % 100));
  }

  // Os tamanhos. "pares" sao posicoes (0..11) na lista ORDENADA dos 12 escolhidos.
  const paresDoGrupo = (g) => { const out = []; for (let i = 0; i < 4; i += 1) for (let j = i + 1; j < 4; j += 1) out.push([g[i], g[j]]); return out; };
  const TAMANHOS = {
    5: { garantia: 16, pares: [[0, 1], [2, 3], [4, 5], [6, 7], [8, 9]],
      regra: 'Ponha os seus 12 quadrantes em ordem crescente (o 1º é o menor que você marcou). Eles formam 6 pares: (1º,2º), (3º,4º), (5º,6º), (7º,8º), (9º,10º), (11º,12º). Cada volante tira um par e marca os outros 10 quadrantes. Os 5 volantes tiram os 5 primeiros pares; o par (11º,12º) fica marcado em todos.' },
    6: { garantia: 17, pares: [[0, 1], [2, 3], [4, 5], [6, 7], [8, 9], [10, 11]],
      regra: 'Ponha os seus 12 quadrantes em ordem crescente e forme os 6 pares: (1º,2º), (3º,4º), ..., (11º,12º). Cada volante tira um par e marca os outros 10 quadrantes: um volante para cada par.' },
    18: { garantia: 18, pares: [...paresDoGrupo([0, 1, 2, 3]), ...paresDoGrupo([4, 5, 6, 7]), ...paresDoGrupo([8, 9, 10, 11])],
      regra: 'Ponha os seus 12 quadrantes em ordem crescente e forme 3 grupos de 4: (1º a 4º), (5º a 8º), (9º a 12º). Dentro de cada grupo há 6 duplas; cada volante tira uma dupla do grupo e marca os outros 10 quadrantes. 3 × 6 = 18 volantes. É o máximo que se garante com quadrantes inteiros.' },
  };

  const dois = (n) => String(n).padStart(2, '0');
  const reais = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace(/ /g, ' ');
  const milhar = (n) => n.toLocaleString('pt-BR');
  const ordenar = (xs) => [...xs].sort((a, b) => a - b);

  function comb(n, k) {
    if (k < 0 || k > n) return 0;
    k = Math.min(k, n - k);
    let r = 1;
    for (let i = 1; i <= k; i += 1) r = (r * (n - k + i)) / i;
    return r;
  }
  const TOTAL = comb(100, SORTEADAS);
  const PROB_ACASO = [];
  for (let h = 0; h <= SORTEADAS; h += 1) PROB_ACASO[h] = (comb(APOSTA, h) * comb(100 - APOSTA, SORTEADAS - h)) / TOTAL;
  // Chance de os 20 sorteados cairem todos nos 60 numeros dos 12 quadrantes.
  const UM_EM = comb(100, 20) / comb(60, 20);

  function validar(escolhidos, tamanho) {
    const e = new Set(escolhidos);
    if (e.size !== escolhidos.length) return 'Tem quadrante repetido.';
    for (const q of e) if (!Number.isInteger(q) || q < 0 || q > 19) return 'Quadrante inválido.';
    if (e.size !== ESCOLHER) return `Escolha exatamente ${ESCOLHER} quadrantes (você marcou ${e.size}).`;
    if (!Object.hasOwn(TAMANHOS, tamanho)) return 'Tamanho de fechamento inválido.';
    return null;
  }

  // Monta os volantes. Devolve tambem, para cada volante, quais quadrantes ficam de fora.
  function gerar(escolhidos, tamanho) {
    const erro = validar(escolhidos, tamanho);
    if (erro) throw new Error(erro);
    const grupo = ordenar(new Set(escolhidos));
    const numerosDoGrupo = grupo.flatMap((q) => NUMEROS[q]);
    const T = TAMANHOS[tamanho];
    const volantes = [];
    const fora = [];
    for (const [i, j] of T.pares) {
      const qa = grupo[i];
      const qb = grupo[j];
      const tirar = new Set([...NUMEROS[qa], ...NUMEROS[qb]]);
      const v = numerosDoGrupo.filter((n) => !tirar.has(n)).sort((a, b) => pos(a) - pos(b));
      if (v.length !== 50) throw new Error('Volante sem 50 números.');
      volantes.push(v);
      fora.push({ quadrantes: [qa, qb], posicoes: [i + 1, j + 1], numeros: ordenar(tirar).sort((a, b) => pos(a) - pos(b)) });
    }
    return { grupo, volantes, fora, garantia: T.garantia, regra: T.regra, custo: volantes.length * PRECO_APOSTA };
  }

  // Le o historico (dados.js) uma vez so - mesmo formato do sistema.js.
  function lerConcursos(dados) {
    if (dados._lidos20) return dados._lidos20;
    dados._lidos20 = dados.concursos.map(([concurso, data, dezenas, premios]) => {
      const nums = [];
      for (let i = 0; i < dezenas.length; i += 2) nums.push(parseInt(dezenas.slice(i, i + 2), 10));
      let tabela = null;
      if (premios) {
        tabela = {};
        FAIXAS.forEach((h, i) => { if (premios[i] !== null && premios[i] !== undefined) tabela[h] = premios[i]; });
      }
      return { concurso, data, sorteio: new Set(nums), premios: tabela };
    });
    return dados._lidos20;
  }

  function lerQuantidade(valor, total) {
    if (String(valor || '').trim().toLowerCase() === 'todos') return total;
    let n = parseInt(valor, 10);
    if (!Number.isFinite(n)) n = PERIODO_PADRAO;
    return Math.max(1, Math.min(n, total));
  }

  // Os volantes jogados nos ultimos `quantidade` concursos, com os premios reais
  // (mesmas convencoes do testar() do sistema.js: faixa com valor 0 conta como
  // premiado sem somar dinheiro; concurso sem premios conta so no gasto).
  function testar(dados, volantes, quantidade, preco = PRECO_APOSTA) {
    const todos = lerConcursos(dados);
    if (!todos.length) return { erro: 'O histórico da Lotomania está vazio.' };
    const n = lerQuantidade(quantidade, todos.length);
    const periodo = todos.slice(-n);
    const V = volantes.length;
    let ganho = 0; let esperado = 0; let premiados = 0; let semValor = 0; let semDado = 0; let dentroDoGrupo = 0;
    const faixas = new Map(); const melhor = new Map(); let maior = null;
    const numerosDoGrupo = new Set(volantes.flat());
    for (const c of periodo) {
      let pago = 0; let topo = 0; let volantesPremiados = 0;
      let cabe = true; for (const s of c.sorteio) if (!numerosDoGrupo.has(s)) { cabe = false; break; }
      if (cabe) dentroDoGrupo += 1;
      for (const v of volantes) {
        let h = 0; for (const x of v) if (c.sorteio.has(x)) h += 1;
        if (h > topo) topo = h;
        if (c.premios && h in c.premios) {
          const val = c.premios[h] || 0;
          faixas.set(h, (faixas.get(h) || 0) + 1);
          volantesPremiados += 1;
          if (val === 0) semValor += 1;
          pago += val;
        }
      }
      melhor.set(topo, (melhor.get(topo) || 0) + 1);
      if (!c.premios) semDado += 1;
      else for (const [h, val] of Object.entries(c.premios)) esperado += V * PROB_ACASO[+h] * (val || 0);
      ganho += pago;
      if (pago > 0) premiados += 1;
      if (pago > 0 && (!maior || pago > maior.premio)) maior = { concurso: c.concurso, data: c.data, premio: pago, acertos: topo, volantesPremiados };
    }
    const gasto = n * V * preco;
    const ordemFaixa = (h) => (h === 0 ? 100 : -h);
    return {
      erro: null, periodo: n, baseInteira: n >= todos.length,
      primeiro: periodo[0].concurso, dataPrimeira: periodo[0].data,
      ultimo: periodo[periodo.length - 1].concurso, dataUltima: periodo[periodo.length - 1].data,
      volantes: V, preco, gasto, ganho, saldo: ganho - gasto,
      retorno: gasto ? (ganho / gasto) * 100 : 0,
      premiados, semNada: n - premiados, semValor, semDado, dentroDoGrupo,
      faixas: [...faixas.entries()].sort((a, b) => ordemFaixa(a[0]) - ordemFaixa(b[0])),
      melhor: [...melhor.entries()].sort((a, b) => b[0] - a[0]),
      maior, esperadoAcaso: esperado, retornoAcaso: gasto ? (esperado / gasto) * 100 : 0,
    };
  }

  function textoVolantes(resultado) {
    const r = resultado;
    const linhas = [
      '# Lotomania - fechamento de 12 em 20 quadrantes (quadrantes de 5 numeros, um por meia linha)',
      '# Quadrantes escolhidos: ' + r.grupo.map((q) => q + 1).join(', '),
      '# ' + r.volantes.length + ' volantes de 50 numeros - ' + reais(r.custo) + ' por concurso (' + reais(PRECO_APOSTA) + ' cada)',
      '# Garantia: pelo menos ' + r.garantia + ' pontos em algum volante, SE os 20 sorteados cairem todos nos 12 quadrantes',
      '# (isso acontece 1 vez a cada ' + milhar(Math.round(UM_EM)) + ' sorteios). Nao ha garantia nos outros sorteios.',
      '',
    ];
    r.volantes.forEach((v, i) => {
      const f = r.fora[i];
      linhas.push(String(i + 1).padStart(2, '0') + ' (fora: quadrantes ' + (f.quadrantes[0] + 1) + ' e ' + (f.quadrantes[1] + 1) + '): ' + v.map(dois).join(' '));
    });
    return linhas.join('\n') + '\n';
  }

  const API = { PRECO_APOSTA, FAIXAS, ESCOLHER, PERIODO_PADRAO, NUMEROS, TAMANHOS, PROB_ACASO, UM_EM, quadranteDe, dois, reais, milhar, validar, gerar, testar, textoVolantes, lerConcursos };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else raiz.Gerador20 = API;
}(typeof window !== 'undefined' ? window : globalThis));
