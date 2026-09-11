# Quadrantes com espelho — Lotomania

A ferramenta do seu pai, sozinha, fora do site do Projeto Loterias.

## O que ela faz

O volante da Lotomania aparece igual ao de papel, com os 10 quadrantes
separados por linhas azuis (blocos de 2 linhas por 5 colunas). Seu pai:

1. escolhe quantos quadrantes alternam com o espelho: 5, 6, 7, 8, 9 ou 10
   (32, 64, 128, 256, 512 ou 1.024 volantes);
2. risca 5 números em cada quadrante — os outros 5 viram o espelho sozinhos;
3. toca em **Montar os volantes**.

A página mostra o custo, quanto o sistema teria dado nos concursos passados
(com os prêmios reais), a comparação com jogar ao acaso, um sorteio de exemplo
em que nenhum volante ganha, e a lista de volantes para **baixar, copiar ou
mandar pelo WhatsApp**.

As marcações ficam guardadas no celular dele: fechou e abriu, está tudo lá.

## Por que é leve

É uma página só, sem servidor. Ela roda inteira no celular ou no computador de
quem abre. Não tem nada para "dormir" ou travar — é o mesmo tipo de coisa que
um cardápio online.

## Os arquivos

| Arquivo | O que é |
|---|---|
| `index.html` | a página que seu pai abre |
| `sistema.js` | a conta (a mesma testada no site, volante por volante) |
| `dados.js` | o histórico da Lotomania com os prêmios de cada concurso |
| `atualizar_dados.py` | busca na Caixa os concursos novos e atualiza o `dados.js` |
| `teste.js` | os testes da conta |

## Atualizar o histórico

Os volantes não dependem disso — só o "teste no passado". Quando quiser pôr os
concursos novos:

```
python atualizar_dados.py
```

e publique de novo (o mesmo passo de sempre).

## Trocar o preço da aposta

No começo do `sistema.js`, na linha `const PRECO_APOSTA = 3.00;`.

## Rodar os testes

```
node teste.js
```
