'use strict';
// Documento dos fechamentos de 12 em 20 quadrantes de 5 numeros (HTML + TXT)
const fs = require('fs');
const J = JSON.parse(fs.readFileSync(__dirname + '/fechamentos20.json', 'utf8'));
const dois = (n) => String(n).padStart(2, '0');
const pos = (n) => (n === 0 ? 100 : n) - 1;
const quad = (n) => Math.floor(pos(n) / 10) * 2 + (pos(n) % 10 < 5 ? 0 : 1);
const milhar = (x) => Math.round(x).toLocaleString('pt-BR');
const listaQ = (g) => g.map((q) => q + 1).join(', ').replace(/, (\d+)$/, ' e $1');

function card(f, i) {
  const v = new Set(f.volantes[i]);
  const fora = new Set(f.descartes[i]);
  const grupo = new Set(f.grupo);
  let cells = '';
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      const n = (r * 10 + c + 1) % 100;
      const cls = v.has(n) ? 'm' : fora.has(n) ? 'f' : grupo.has(quad(n)) ? 'm' : 'x';
      cells += '<i class="' + cls + '">' + dois(n) + '</i>';
    }
  }
  const [a, b] = f.pares[i];
  return '<figure><figcaption><b>Volante ' + (i + 1) + '</b><span>fora: quadrantes ' + (a + 1) + ' e ' + (b + 1) + '</span></figcaption><div class="g">' + cells + '</div></figure>';
}

const secoes = J.F.map((f) => '<section>\n'
  + '  <h2>' + f.nome.replace('garantia', 'garante') + ' pontos <small>R$ ' + f.custo + ',00 por concurso</small></h2>\n'
  + '  <p class="regra"><b>Regra:</b> ' + f.regra + '</p>\n'
  + '  <p class="nota">Neste exemplo o grupo é formado pelos quadrantes ' + listaQ(f.grupo) + ' (números 01 a 60). Com outros quadrantes a regra é a mesma: numere os 12 escolhidos de 1 a 12 e siga o padrão.</p>\n'
  + '  <div class="cards">' + f.volantes.map((_, i) => card(f, i)).join('') + '</div>\n'
  + '</section>').join('\n');

const linhasTabela = J.F.map((f) => '<tr><td>' + f.volantes.length + '</td><td>R$ ' + f.custo + ',00</td><td><b>' + f.garantia + ' pontos</b> em pelo menos 1 volante</td><td>' + (f.garantia === 18 ? 'sim, e é o máximo possível com quadrantes inteiros' : 'sim') + '</td></tr>').join('');

const css = `
  body { font: 15px/1.45 system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color: #2b2622; background: #faf7f2; margin: 0; padding: 18px; }
  main { max-width: 1040px; margin: 0 auto; }
  h1 { font-size: 1.6rem; margin: 0 0 6px; } h1 span { color: #e36b17; }
  h2 { font-size: 1.15rem; margin: 30px 0 6px; border-top: 3px solid #e36b17; padding-top: 12px; }
  h2 small { font-weight: 600; color: #756b62; font-size: .9rem; margin-left: 10px; }
  p { margin: 6px 0; } .regra { background: #fff; border: 1px solid #ece3d8; border-radius: 12px; padding: 10px 12px; }
  .nota { color: #756b62; font-size: .9rem; }
  a { color: #1f3a93; font-weight: 600; }
  table { border-collapse: collapse; background: #fff; border-radius: 12px; overflow: hidden; margin: 10px 0; font-size: .92rem; }
  th, td { text-align: left; padding: 7px 10px; border-bottom: 1px solid #ece3d8; } th { font-size: .75rem; text-transform: uppercase; color: #756b62; letter-spacing: .04em; }
  .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 12px; margin-top: 12px; }
  figure { margin: 0; background: #fff; border: 1px solid #ece3d8; border-radius: 12px; padding: 8px; break-inside: avoid; }
  figcaption { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; font-size: .88rem; gap: 6px; }
  figcaption span { color: #b42318; font-weight: 600; font-size: .8rem; text-align: right; }
  .g { display: grid; grid-template-columns: repeat(10, 1fr); gap: 2px; background: #fbf3d5; padding: 6px; border-radius: 8px; border: 1px solid #ecc98a; }
  .g i { font-style: normal; font-size: .68rem; font-weight: 700; text-align: center; line-height: 19px; border-radius: 4px; font-variant-numeric: tabular-nums; margin-bottom: 3px; }
  .g i.m { background: #1f3a93; color: #fff; }
  .g i.f { background: #fff; color: #b42318; border: 1.5px dashed #b42318; text-decoration: line-through; }
  .g i.x { background: transparent; color: #c9b99d; }
  .g i:nth-child(10n+5) { margin-right: 5px; }
  .legenda { display: flex; gap: 14px; flex-wrap: wrap; font-size: .85rem; color: #756b62; margin: 8px 0 0; }
  .legenda i { font-style: normal; display: inline-block; min-width: 26px; text-align: center; border-radius: 4px; font-weight: 700; font-size: .7rem; line-height: 18px; margin-right: 4px; }
  .honesto { background: #fff4e5; border: 1px solid #f5c26b; border-radius: 12px; padding: 10px 12px; margin-top: 24px; }
  @media print { body { background: #fff; padding: 0; } section { break-before: page; } section:first-of-type { break-before: auto; } }
`;

const html = '<!doctype html>\n<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">\n'
  + '<title>Fechamento de 12 em 20 quadrantes — Lotomania</title>\n<style>' + css + '</style></head><body><main>\n'
  + '<h1>Fechamento de 12 em 20 quadrantes <span>— volantes de 10 quadrantes inteiros</span></h1>\n'
  + '<p>O volante dividido em 20 quadrantes de 5 números, um por meia linha: quadrante 1 = 01 a 05, quadrante 2 = 06 a 10, quadrante 3 = 11 a 15, ... quadrante 20 = 96 a 00. Você escolhe 12 quadrantes (60 números). Como 50 números são exatamente 10 quadrantes, cada volante marca 10 quadrantes inteiros do grupo e deixa 2 de fora. Cada volante custa R$ 3,00.</p>\n'
  + '<p><a href="volantes.txt">Versão em texto simples, para imprimir ou levar à lotérica</a> · <a href="../">Ver também: fechamentos com 25 quadrantes de 4 números</a></p>\n'
  + '<table><thead><tr><th>Volantes</th><th>Custo por concurso</th><th>Garante, se os 20 caírem nos 12 quadrantes</th><th>Provado</th></tr></thead><tbody>' + linhasTabela + '</tbody></table>\n'
  + '<p class="nota">Cada garantia foi conferida testando todas as ' + milhar(36154767) + ' maneiras de os 20 números se espalharem pelos 12 quadrantes. A garantia vale quando os 20 sorteados caem todos dentro dos seus 12 quadrantes: 1 vez a cada ' + milhar(J.umEm60) + ' sorteios. Nos últimos 2.000 concursos, ' + J.cabem12pct.toFixed(0) + '% dos sorteios couberam em 12 dos 20 quadrantes, mas em 12 quadrantes diferentes a cada vez.</p>\n'
  + '<p class="legenda"><span><i style="background:#1f3a93;color:#fff">12</i>marcado</span><span><i style="background:#fff;color:#b42318;border:1.5px dashed #b42318">12</i>do grupo, mas fica de fora neste volante</span><span><i style="color:#c9b99d">12</i>fora do grupo</span></p>\n'
  + secoes + '\n'
  + '<div class="honesto"><b>O que a garantia é, e o que não é.</b> Ela promete o mínimo de pontos em um volante <u>somente</u> quando os 20 números sorteados caem todos dentro dos 12 quadrantes escolhidos, e isso é raro. Nos outros sorteios os volantes se comportam como qualquer aposta de 50 números. Nenhum fechamento aumenta a chance de ganhar: ele só organiza as apostas para que, no dia raro em que o grupo acerta, o prêmio venha certo. Com quadrantes inteiros, 18 pontos é o teto: quando cada um dos 12 quadrantes recebe pelo menos 1 número sorteado, todo volante perde pelo menos 2.</div>\n'
  + '</main></body></html>\n';
fs.writeFileSync(__dirname + '/FECHAMENTO-12-EM-20.html', html);

const txt = [];
txt.push('FECHAMENTO DE 12 EM 20 QUADRANTES - Lotomania (20 quadrantes de 5 numeros, um por meia linha)');
txt.push('Quadrante 1 = 01-05 | 2 = 06-10 | 3 = 11-15 | 4 = 16-20 | 5 = 21-25 | 6 = 26-30 | ... | 19 = 91-95 | 20 = 96-00');
txt.push('Cada volante = 10 quadrantes inteiros do grupo (50 numeros). Grupo deste exemplo: quadrantes 1 a 12 (numeros 01 a 60).');
txt.push('');
for (const f of J.F) {
  txt.push('='.repeat(78));
  txt.push(f.nome.toUpperCase() + ' PONTOS - R$ ' + f.custo + ',00 por concurso');
  txt.push('Regra: ' + f.regra);
  txt.push('');
  f.volantes.forEach((v, i) => {
    const [a, b] = f.pares[i];
    txt.push('Volante ' + dois(i + 1) + '  (fora: quadrantes ' + (a + 1) + ' e ' + (b + 1) + ' = ' + f.descartes[i].map(dois).join(' ') + ')');
    txt.push('   ' + v.slice(0, 25).map(dois).join(' '));
    txt.push('   ' + v.slice(25).map(dois).join(' '));
  });
  txt.push('');
}
txt.push('A garantia vale quando os 20 sorteados caem todos nos 12 quadrantes (1 vez a cada ' + milhar(J.umEm60) + ' sorteios).');
txt.push('Nenhum fechamento aumenta a chance de ganhar; ele so organiza as apostas.');
fs.writeFileSync(__dirname + '/FECHAMENTO-12-EM-20.txt', txt.join('\n') + '\n', 'utf8');
console.log('ok', html.length, txt.length);
