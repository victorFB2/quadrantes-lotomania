"""
Atualiza o historico da Lotomania que a pagina usa (o arquivo dados.js).

A pagina nao tem servidor: o historico vai junto dela, dentro de dados.js.
Quando sairem concursos novos, rode este arquivo e publique de novo.

    python atualizar_dados.py
        Busca na Caixa os concursos que faltam, com os premios de cada faixa.

    python atualizar_dados.py --da-base CAMINHO/loterias_multi.db
        Monta o historico inteiro a partir da base do Projeto Loterias (e o
        jeito rapido de comecar: a Caixa levaria uns 25 minutos para mandar
        os quase 3.000 concursos um por um).

Nao precisa instalar nada: usa so o que ja vem com o Python.
"""

from __future__ import annotations

import json
import re
import sqlite3
import ssl
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path

AQUI = Path(__file__).resolve().parent
ARQUIVO = AQUI / 'dados.js'
API = 'https://servicebus2.caixa.gov.br/portaldeloterias/api/lotomania'
# A ordem em que os premios ficam guardados - a mesma de sistema.js.
FAIXAS = [20, 19, 18, 17, 16, 15, 0]
INICIO = 'window.DADOS_LOTOMANIA = '
_ACERTOS = re.compile(r'(\d+)\s*acerto')


def data_br(valor) -> str:
    texto = str(valor or '')[:10]
    for formato in ('%d/%m/%Y', '%Y-%m-%d'):
        try:
            return datetime.strptime(texto, formato).strftime('%d/%m/%Y')
        except ValueError:
            pass
    return texto


def ler() -> dict:
    if not ARQUIVO.exists():
        return {'atualizado': '', 'concursos': []}
    texto = ARQUIVO.read_text(encoding='utf-8')
    corpo = texto[texto.index(INICIO) + len(INICIO):].strip().rstrip(';')
    return json.loads(corpo)


def salvar(dados: dict) -> None:
    dados['concursos'].sort(key=lambda c: c[0])
    dados['atualizado'] = datetime.now().strftime('%d/%m/%Y %H:%M')
    # Um concurso por linha: quando algo mudar, da para ver exatamente o que.
    linhas = [json.dumps(c, ensure_ascii=False, separators=(',', ':')) for c in dados['concursos']]
    texto = (
        '/* Historico da Lotomania, com os premios pagos pela Caixa em cada faixa.\n'
        '   Cada concurso: [numero, data, as 20 dezenas coladas de 2 em 2, premios]\n'
        '   Premios na ordem: 20, 19, 18, 17, 16, 15 e 0 acertos (null = faixa nao existia).\n'
        '   Gerado por atualizar_dados.py - nao edite a mao. */\n'
        + INICIO + '{"atualizado":' + json.dumps(dados['atualizado']) + ',"concursos":[\n'
        + ',\n'.join(linhas) + '\n]};\n'
    )
    ARQUIVO.write_text(texto, encoding='utf-8')


def premios_em_ordem(faixas: dict[int, float]) -> list | None:
    if not faixas:
        return None
    return [round(float(faixas[h]), 2) if h in faixas else None for h in FAIXAS]


def da_base(caminho: str) -> dict:
    """Monta o historico a partir da base do Projeto Loterias."""
    conn = sqlite3.connect('file:%s?mode=ro' % Path(caminho).as_posix(), uri=True)
    premios: dict[int, dict[int, float]] = {}
    for concurso, descricao, valor in conn.execute(
            "SELECT contest, descricao, valor FROM premiacao WHERE game='lotomania'"):
        m = _ACERTOS.search(descricao or '')
        if m:
            premios.setdefault(int(concurso), {})[int(m.group(1))] = float(valor or 0)
    concursos = []
    for concurso, data, numeros in conn.execute(
            "SELECT contest, draw_date, numbers FROM draws "
            "WHERE game='lotomania' AND draw_index=1 ORDER BY contest"):
        dezenas = sorted(int(x) for x in str(numeros).split(',') if x.strip())
        concursos.append([int(concurso), data_br(data), ''.join('%02d' % n for n in dezenas),
                          premios_em_ordem(premios.get(int(concurso), {}))])
    conn.close()
    return {'atualizado': '', 'concursos': concursos}


def _abrir(url: str, verificar: bool = True):
    pedido = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json'})
    contexto = None if verificar else ssl._create_unverified_context()  # noqa: SLF001
    with urllib.request.urlopen(pedido, timeout=20, context=contexto) as resposta:
        return json.loads(resposta.read().decode('utf-8'))


def buscar(url: str) -> dict | None:
    for tentativa in range(3):
        try:
            try:
                return _abrir(url)
            except urllib.error.URLError as exc:
                # O certificado da Caixa as vezes nao e reconhecido pelo Python.
                # Sao resultados publicos de loteria: tenta sem conferir o
                # certificado, e avisa.
                if isinstance(getattr(exc, 'reason', None), ssl.SSLError):
                    print('  (aviso: certificado da Caixa nao conferido)', flush=True)
                    return _abrir(url, verificar=False)
                raise
        except Exception as exc:  # noqa: BLE001
            print(f'  tentativa {tentativa + 1} falhou: {exc}', flush=True)
            time.sleep(2 * (tentativa + 1))
    return None


def do_payload(p: dict) -> list:
    concurso = int(p.get('numero') or p.get('concurso'))
    dezenas = sorted(int(x) for x in (p.get('listaDezenas') or p.get('dezenasSorteadasOrdemSorteio') or []))
    if len(dezenas) != 20:
        raise ValueError(f'concurso {concurso} veio com {len(dezenas)} dezenas')
    faixas: dict[int, float] = {}
    for r in p.get('listaRateioPremio') or []:
        m = _ACERTOS.search(str(r.get('descricaoFaixa') or ''))
        if m:
            faixas[int(m.group(1))] = float(r.get('valorPremio') or 0)
    return [concurso, data_br(p.get('dataApuracao')), ''.join('%02d' % n for n in dezenas),
            premios_em_ordem(faixas)]


def da_caixa(dados: dict) -> int:
    ultimo_local = max((c[0] for c in dados['concursos']), default=0)
    atual = buscar(API)
    if not atual:
        print('Nao consegui falar com a Caixa agora. Tente de novo mais tarde.')
        return 0
    ultimo = int(atual.get('numero') or 0)
    if ultimo <= ultimo_local:
        print(f'Ja esta em dia: ultimo concurso {ultimo_local}.')
        return 0
    print(f'Buscando {ultimo - ultimo_local} concurso(s): do {ultimo_local + 1} ao {ultimo}...')
    por_numero = {c[0]: c for c in dados['concursos']}
    novos = 0
    for n in range(ultimo_local + 1, ultimo + 1):
        p = atual if n == ultimo else buscar(f'{API}/{n}')
        if not p:
            print(f'  concurso {n}: nao veio. Pare aqui e rode de novo depois.')
            break
        por_numero[n] = do_payload(p)
        novos += 1
        print(f'  concurso {n} ok', flush=True)
        time.sleep(0.35)
    dados['concursos'] = list(por_numero.values())
    return novos


def main() -> None:
    if '--da-base' in sys.argv:
        caminho = sys.argv[sys.argv.index('--da-base') + 1]
        dados = da_base(caminho)
        print(f'{len(dados["concursos"])} concursos lidos da base do Projeto Loterias.')
    else:
        dados = ler()
        da_caixa(dados)
    salvar(dados)
    ult = dados['concursos'][-1]
    sem_premio = sum(1 for c in dados['concursos'] if c[3] is None)
    print(f'dados.js salvo: {len(dados["concursos"])} concursos, ultimo {ult[0]} ({ult[1]}), '
          f'{sem_premio} sem premio salvo.')


if __name__ == '__main__':
    main()
