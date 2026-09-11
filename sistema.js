/*
  SISTEMA DOS QUADRANTES COM ESPELHO - LOTOMANIA

  A ideia e do pai do Victor. O volante tem 100 numeros, divididos em 10
  quadrantes do jeito que aparecem no papel: blocos de 2 linhas por 5
  colunas. Em cada quadrante ele risca 5 numeros; os outros 5 sao o espelho.
  Nos quadrantes que alternam, cada volante leva ou os riscados ou o espelho.
  Com os 10 alternando: 2x2x2x2x2x2x2x2x2x2 = 1.024 volantes.

  Este arquivo e so a conta - sem tela nenhuma. A mesma conta roda no
  celular (index.html) e nos testes (teste.js).

  Veio do site do Projeto Loterias (versoes V61 e V61.1), onde foi testada
  volante por volante. Aqui ela foi separada para ficar sozinha e leve.

  O QUE O ESTUDO MOSTROU ANTES DE CONSTRUIR (setembro de 2026)
  - Os volantes sao todos validos e diferentes; com os 10 alternando, cada
    numero aparece em exatamente metade deles.
  - O sistema NAO garante premio: para qualquer escolha existe um sorteio em
    que todos os volantes fazem exatamente 10 acertos (sorteioSemPremio).
  - Ele nao aumenta o retorno: nos ultimos 500 concursos, 1.024 volantes do
    sistema devolveram cerca de 15% do gasto; 1.024 apostas ao acaso, ~19%.
*/
(function (raiz) {
  'use strict';

  // Preco da aposta simples da Lotomania na Caixa: R$ 3,00, sem reajuste desde
  // abril de 2023 (conferido em setembro de 2026). Se a Caixa reajustar,
  // e so trocar este numero.
  const PRECO_APOSTA = 3.00;

  // Os quadrantes do volante de papel, do jeito que o pai mandou. O 00 fica no
  // fim, no lugar do 100.
  const QUADRANTES = [
    [1, 2, 3, 4, 5, 11, 12, 13, 14, 15],
    [6, 7, 8, 9, 10, 16, 17, 18, 19, 20],
    [21, 22, 23, 24, 25, 31, 32, 33, 34, 35],
    [26, 27, 28, 29, 30, 36, 37, 38, 39, 40],
    [41, 42, 43, 44, 45, 51, 52, 53, 54, 55],
    [46, 47, 48, 49, 50, 56, 57, 58, 59, 60],
    [61, 62, 63, 64, 65, 71, 72, 73, 74, 75],
    [66, 67, 68, 69, 70, 76, 77, 78, 79, 80],
    [81, 82, 83, 84, 85, 91, 92, 93, 94, 95],
    [86, 87, 88, 89, 90, 96, 97, 98, 99, 0],
  ];
  const QUADRANTE_DE = {};
  QUADRANTES.forEach((numeros, q) => numeros.forEach((n) => { QUADRANTE_DE[n] = q; }));
  if (Object.keys(QUADRANTE_DE).length !== 100) {
    throw new Error('Quadrantes errados: cada numero precisa estar em um quadrante so.');
  }

  const POR_QUADRANTE = 5;
  const MIN_ALTERNAM = 5;
  const MAX_ALTERNAM = 10;
  const SORTEADAS = 20;
  const APOSTA = 50;
  const PERIODOS = [50, 100, 250, 500, 1000, 2000];
  // 500 e o padrao: e o trecho em que os premios estao em valores parecidos
  // com os de hoje. Testar desde 1999 compararia premio em dinheiro da epoca
  // com o preco de hoje.
  const PERIODO_PADRAO = 500;
  // A ordem em que os premios de cada concurso estao guardados em dados.js.
  const FAIXAS = [20, 19, 18, 17, 16, 15, 0];

  function comb(n, k) {
    if (k < 0 || k > n) return 0;
    k = Math.min(k, n - k);
    let r = 1;
    for (let i = 1; i <= k; i += 1) r = (r * (n - k + i)) / i;
    return r;
  }
  // Chance de uma aposta de 50 numeros, feita ao acaso, fazer h acertos. E a
  // conta exata do "jogar sem sistema".
  const TOTAL = comb(100, SORTEADAS);
  const PROB_ACASO = [];
  for (let h = 0; h <= SORTEADAS; h += 1) {
    PROB_ACASO[h] = (comb(APOSTA, h) * comb(100 - APOSTA, SORTEADAS - h)) / TOTAL;
  }

  const dois = (n) => String(n).padStart(2, '0');
  const rotulo = (q) => 'quadrante ' + (q + 1);
  const faixaTexto = (q) => {
    const ns = QUADRANTES[q];
    return `${dois(ns[0])}–${dois(ns[4])} e ${dois(ns[5])}–${dois(ns[9])}`;
  };
  // O formato brasileiro poe um espaco especial (que nao quebra linha) entre
  // o "R$" e o numero. Na tela nao faz diferenca, mas no arquivo dos volantes
  // alguns programas mostram um simbolo estranho no lugar - vira espaco comum.
  const reais = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace(/\u00a0/g, ' ');
  const milhar = (n) => n.toLocaleString('pt-BR');
  const ordenar = (xs) => [...xs].sort((a, b) => a - b);

  function validar(marcados, alternam) {
    const m = new Set(marcados);
    if (m.size !== marcados.length) return 'Tem número repetido. Marque de novo.';
    for (const n of m) {
      if (!Number.isInteger(n) || n < 0 || n > 99) return 'Só vale número de 00 a 99.';
    }
    const alt = new Set(alternam);
    for (const q of alt) {
      if (!Number.isInteger(q) || q < 0 || q > 9) return 'Escolha de quadrante inválida.';
    }
    const faltando = [];
    for (let q = 0; q < 10; q += 1) {
      let c = 0;
      for (const n of m) if (QUADRANTE_DE[n] === q) c += 1;
      if (c !== POR_QUADRANTE) faltando.push(q);
    }
    if (faltando.length) {
      return 'Cada quadrante precisa de exatamente 5 números riscados. Confira: '
        + faltando.map(rotulo).join(', ') + '.';
    }
    if (alt.size < MIN_ALTERNAM || alt.size > MAX_ALTERNAM) {
      return `Escolha de ${MIN_ALTERNAM} a ${MAX_ALTERNAM} quadrantes para alternar com o espelho.`;
    }
    return null;
  }

  function lados(marcados) {
    const m = new Set(marcados);
    return {
      riscado: QUADRANTES.map((ns) => ns.filter((n) => m.has(n))),
      espelho: QUADRANTES.map((ns) => ns.filter((n) => !m.has(n))),
    };
  }

  // Todos os volantes. O primeiro e o dos 5 riscados em todos os quadrantes;
  // o ultimo, o espelho em todos os que alternam.
  function gerarVolantes(marcados, alternam) {
    const { riscado, espelho } = lados(marcados);
    const alt = ordenar(new Set(alternam));
    const fixos = [];
    for (let q = 0; q < 10; q += 1) if (!alt.includes(q)) fixos.push(...riscado[q]);
    const total = 2 ** alt.length;
    const volantes = [];
    for (let i = 0; i < total; i += 1) {
      const v = fixos.slice();
      alt.forEach((q, j) => {
        const lado = (i >> (alt.length - 1 - j)) & 1;
        v.push(...(lado === 0 ? riscado[q] : espelho[q]));
      });
      volantes.push(ordenar(v));
    }
    return volantes;
  }

  // Quantos volantes fazem cada numero de acertos num sorteio - conta exata.
  // Quadrante fixo soma o mesmo para todos; quadrante que alterna soma os
  // riscados sorteados em metade dos volantes e os do espelho na outra metade.
  function distribuicao(lad, alternam, sorteio) {
    const s = sorteio instanceof Set ? sorteio : new Set(sorteio);
    const alt = new Set(alternam);
    let base = 0;
    for (let q = 0; q < 10; q += 1) {
      if (!alt.has(q)) for (const n of lad.riscado[q]) if (s.has(n)) base += 1;
    }
    let dist = new Map([[base, 1]]);
    for (const q of ordenar(alt)) {
      let d = 0;
      let e = 0;
      for (const n of lad.riscado[q]) if (s.has(n)) d += 1;
      for (const n of lad.espelho[q]) if (s.has(n)) e += 1;
      const novo = new Map();
      for (const [k, c] of dist) {
        novo.set(k + d, (novo.get(k + d) || 0) + c);
        novo.set(k + e, (novo.get(k + e) || 0) + c);
      }
      dist = novo;
    }
    return dist;
  }

  function contarAcertos(marcados, alternam, sorteio) {
    return distribuicao(lados(marcados), alternam, sorteio);
  }

  // 20 numeros em que TODOS os volantes fazem exatamente 10 acertos - a prova
  // de que o sistema nao garante premio. De cada quadrante que alterna sai 1
  // riscado e 1 espelho (todo volante leva 1); dos fixos sai o que falta,
  // metade riscados (contam para todos) e metade espelho (para nenhum).
  function sorteioSemPremio(marcados, alternam) {
    const { riscado, espelho } = lados(marcados);
    const alt = ordenar(new Set(alternam));
    const fixos = [];
    for (let q = 0; q < 10; q += 1) if (!alt.includes(q)) fixos.push(q);
    const escolhidos = [];
    for (const q of alt) escolhidos.push(Math.min(...riscado[q]), Math.min(...espelho[q]));
    const metade = (SORTEADAS - escolhidos.length) / 2;
    escolhidos.push(...fixos.flatMap((q) => ordenar(riscado[q])).slice(0, metade));
    escolhidos.push(...fixos.flatMap((q) => ordenar(espelho[q])).slice(0, metade));
    return ordenar(escolhidos);
  }

  // Le o historico de dados.js uma vez so e guarda pronto.
  function lerConcursos(dados) {
    if (dados._lidos) return dados._lidos;
    dados._lidos = dados.concursos.map(([concurso, data, dezenas, premios]) => {
      const nums = [];
      for (let i = 0; i < dezenas.length; i += 2) nums.push(parseInt(dezenas.slice(i, i + 2), 10));
      let tabela = null;
      if (premios) {
        tabela = {};
        FAIXAS.forEach((h, i) => {
          if (premios[i] !== null && premios[i] !== undefined) tabela[h] = premios[i];
        });
      }
      return { concurso, data, sorteio: new Set(nums), premios: tabela };
    });
    return dados._lidos;
  }

  function lerQuantidade(valor, total) {
    if (String(valor || '').trim().toLowerCase() === 'todos') return total;
    let n = parseInt(valor, 10);
    if (!Number.isFinite(n)) n = PERIODO_PADRAO;
    return Math.max(1, Math.min(n, total));
  }

  // O sistema jogado nos ultimos `quantidade` concursos, com os premios que a
  // Caixa pagou de verdade em cada um.
  function testar(dados, marcados, alternam, quantidade, preco = PRECO_APOSTA) {
    const todos = lerConcursos(dados);
    if (!todos.length) return { erro: 'O histórico da Lotomania está vazio.' };
    const n = lerQuantidade(quantidade, todos.length);
    const periodo = todos.slice(-n);
    const lad = lados(marcados);
    const alt = ordenar(new Set(alternam));
    const volantes = 2 ** alt.length;

    let ganho = 0;
    let esperado = 0;
    let premiados = 0;
    let semDado = 0;
    let semValor = 0;
    const faixas = new Map();
    const melhor = new Map();
    let maior = null;
    const linhas = [];

    for (const c of periodo) {
      const dist = distribuicao(lad, alt, c.sorteio);
      const topo = Math.max(...dist.keys());
      melhor.set(topo, (melhor.get(topo) || 0) + 1);
      let pago = 0;
      let volantesPremiados = 0;
      if (!c.premios) {
        semDado += 1;
      } else {
        for (const [h, q] of dist) {
          if (!(h in c.premios)) continue;
          const v = c.premios[h] || 0;
          faixas.set(h, (faixas.get(h) || 0) + q);
          volantesPremiados += q;
          // Faixa que ninguem ganhou naquele concurso: a Caixa informa zero, e
          // o valor que teria sido pago e desconhecido. Nao e somado.
          if (v === 0) semValor += q;
          pago += q * v;
        }
        for (const [h, v] of Object.entries(c.premios)) esperado += volantes * PROB_ACASO[+h] * (v || 0);
      }
      ganho += pago;
      if (pago > 0) premiados += 1;
      if (pago > 0 && (!maior || pago > maior.premio)) {
        maior = { concurso: c.concurso, data: c.data, premio: pago, acertos: topo };
      }
      linhas.push({
        concurso: c.concurso, data: c.data, acertos: topo,
        volantesPremiados, premio: pago, semDado: !c.premios,
      });
    }

    const gasto = n * volantes * preco;
    const ordemFaixa = (h) => (h === 0 ? 100 : -h);
    return {
      erro: null,
      periodo: n,
      baseInteira: n >= todos.length,
      primeiro: periodo[0].concurso, dataPrimeira: periodo[0].data,
      ultimo: periodo[periodo.length - 1].concurso, dataUltima: periodo[periodo.length - 1].data,
      volantes,
      alternam: alt,
      preco,
      custoConcurso: volantes * preco,
      gasto,
      ganho,
      saldo: ganho - gasto,
      retorno: gasto ? (ganho / gasto) * 100 : 0,
      premiados,
      semNada: n - premiados,
      faixas: [...faixas.entries()].sort((a, b) => ordemFaixa(a[0]) - ordemFaixa(b[0])),
      semValor,
      semDado,
      melhor: [...melhor.entries()].sort((a, b) => b[0] - a[0]),
      maior,
      esperadoAcaso: esperado,
      retornoAcaso: gasto ? (esperado / gasto) * 100 : 0,
      linhas: linhas.slice(-20).reverse(),
    };
  }

  // A lista completa, para levar a loterica.
  function textoVolantes(marcados, alternam, preco = PRECO_APOSTA) {
    const volantes = gerarVolantes(marcados, alternam);
    const alt = ordenar(new Set(alternam));
    const fixos = [];
    for (let q = 0; q < 10; q += 1) if (!alt.includes(q)) fixos.push(q);
    const linhas = ['# Lotomania - sistema dos quadrantes com espelho', '# Quadrantes do volante de papel:'];
    for (let q = 0; q < 10; q += 1) linhas.push(`#   ${rotulo(q)}: ${faixaTexto(q)}`);
    linhas.push(
      '# Riscados: ' + ordenar(marcados).map(dois).join(' '),
      '# Alternam com o espelho: ' + alt.map(rotulo).join(', '),
      '# Fixos (sempre os riscados): ' + (fixos.map(rotulo).join(', ') || 'nenhum'),
      `# ${milhar(volantes.length)} volantes de 50 números - ${reais(volantes.length * preco)} por concurso (${reais(preco)} cada)`,
      '# Não há garantia de prêmio: este sistema pode sair sem nenhum volante premiado.',
      '',
    );
    volantes.forEach((v, i) => linhas.push(String(i + 1).padStart(4, '0') + ': ' + v.map(dois).join(' ')));
    return linhas.join('\n') + '\n';
  }

  const API = {
    PRECO_APOSTA, QUADRANTES, QUADRANTE_DE, POR_QUADRANTE, MIN_ALTERNAM, MAX_ALTERNAM,
    PERIODOS, PERIODO_PADRAO, FAIXAS, PROB_ACASO,
    dois, rotulo, faixaTexto, reais, milhar,
    validar, gerarVolantes, contarAcertos, sorteioSemPremio, testar, textoVolantes, lerConcursos,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else raiz.Quadrantes = API;
}(typeof window !== 'undefined' ? window : globalThis));
