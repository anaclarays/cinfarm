VALIDO = {
    "nome": "UBS Centro",
    "tipo_atendimento": "publico",
    "logradouro": "Rua das Flores",
    "numero": "100",
    "complemento": "Bloco B",
    "bairro": "Centro",
    "cidade": "Recife",
    "estado": "PE",
    "cep": "50000000",
}
URL = "/estabelecimentos"


def criar(client, **mudancas):
    r = client.post(URL, json={**VALIDO, **mudancas})
    assert r.status_code == 201, r.get_json()
    return r.get_json()


# ---------------------------------------------------------------- cadastrar
def test_cadastrar_retorna_201_com_id_e_location(client):
    r = client.post(URL, json=VALIDO)
    assert r.status_code == 201
    corpo = r.get_json()
    assert corpo["estabelecimento_id"] == 1
    assert corpo["nome"] == "UBS Centro"
    assert r.headers["Location"].endswith("/estabelecimentos/1")


def test_cadastrar_sem_campos_opcionais(client):
    corpo = {k: v for k, v in VALIDO.items() if k not in ("numero", "complemento")}
    r = client.post(URL, json=corpo)
    assert r.status_code == 201
    assert r.get_json()["numero"] is None and r.get_json()["complemento"] is None


def test_cadastrar_converte_estado_para_maiusculo(client):
    assert criar(client, estado="pe")["estado"] == "PE"


def test_cadastrar_campos_obrigatorios_ausentes(client):
    r = client.post(URL, json={"nome": "Só o nome"})
    assert r.status_code == 400
    erros = r.get_json()["errors"]
    for campo in ("tipo_atendimento", "logradouro", "bairro", "cidade", "estado", "cep"):
        assert campo in erros
    assert "nome" not in erros


def test_cadastrar_valores_invalidos(client):
    for campo, valor in [
        ("tipo_atendimento", "misto"),
        ("cep", "5000-000"),
        ("cep", "123"),
        ("estado", "PER"),
        ("estado", "P1"),
        ("nome", "   "),
        ("nome", 123),
        ("nome", "x" * 201),
    ]:
        r = client.post(URL, json={**VALIDO, campo: valor})
        assert r.status_code == 400, (campo, valor)
        assert campo in r.get_json()["errors"]


def test_cadastrar_campo_desconhecido_ou_corpo_invalido(client):
    assert client.post(URL, json={**VALIDO, "xpto": 1}).status_code == 400
    assert client.post(URL, data="isto não é json").status_code == 400
    assert client.post(URL, json={}).status_code == 400
    assert client.post(URL, json=[1, 2]).status_code == 400


# ----------------------------------------------------------------- consultar
def test_consultar_por_id(client):
    criar(client)
    r = client.get(f"{URL}/1")
    assert r.status_code == 200
    assert r.get_json()["cidade"] == "Recife"


def test_consultar_id_inexistente_retorna_404(client):
    r = client.get(f"{URL}/999")
    assert r.status_code == 404
    assert "error" in r.get_json()


def test_listar_vazio_e_com_itens(client):
    assert client.get(URL).get_json() == {"estabelecimentos": []}
    criar(client)
    criar(client, nome="Hospital Geral", tipo_atendimento="privado")
    lista = client.get(URL).get_json()["estabelecimentos"]
    assert [e["nome"] for e in lista] == ["UBS Centro", "Hospital Geral"]


def test_listar_com_filtros(client):
    criar(client)
    criar(client, nome="Hospital Geral", tipo_atendimento="privado", cidade="Caruaru")
    criar(client, nome="Clínica Vida", tipo_atendimento="privado", estado="SP", cidade="Santos")

    def nomes(query):
        r = client.get(f"{URL}?{query}")
        assert r.status_code == 200, r.get_json()
        return [e["nome"] for e in r.get_json()["estabelecimentos"]]

    assert nomes("tipo_atendimento=privado") == ["Hospital Geral", "Clínica Vida"]
    assert nomes("estado=pe") == ["UBS Centro", "Hospital Geral"]
    assert nomes("cidade=caruaru") == ["Hospital Geral"]
    assert nomes("nome=hospital") == ["Hospital Geral"]
    assert nomes("estado=PE&tipo_atendimento=privado") == ["Hospital Geral"]
    assert client.get(f"{URL}?foo=1").status_code == 400


# ----------------------------------------------------------------- atualizar
def test_put_substitui_todos_os_campos(client):
    criar(client)
    novo = {**VALIDO, "nome": "UBS Nova", "tipo_atendimento": "privado"}
    del novo["complemento"]  # opcional omitido no PUT vira vazio
    r = client.put(f"{URL}/1", json=novo)
    assert r.status_code == 200
    assert r.get_json()["nome"] == "UBS Nova"
    assert r.get_json()["tipo_atendimento"] == "privado"
    assert r.get_json()["complemento"] is None


def test_put_exige_todos_os_obrigatorios(client):
    criar(client)
    r = client.put(f"{URL}/1", json={"nome": "Só isso"})
    assert r.status_code == 400
    assert "cep" in r.get_json()["errors"]


def test_patch_altera_apenas_o_enviado(client):
    criar(client)
    r = client.patch(f"{URL}/1", json={"telefone": "x"})
    assert r.status_code == 400  # campo que não existe no modelo
    r = client.patch(f"{URL}/1", json={"bairro": "Boa Vista"})
    assert r.status_code == 200
    corpo = r.get_json()
    assert corpo["bairro"] == "Boa Vista"
    assert corpo["nome"] == "UBS Centro" and corpo["complemento"] == "Bloco B"
    # persistiu mesmo
    assert client.get(f"{URL}/1").get_json()["bairro"] == "Boa Vista"


def test_patch_pode_limpar_campo_opcional(client):
    criar(client)
    r = client.patch(f"{URL}/1", json={"complemento": None})
    assert r.status_code == 200 and r.get_json()["complemento"] is None


def test_patch_valor_invalido_e_corpo_vazio(client):
    criar(client)
    assert client.patch(f"{URL}/1", json={"cep": "abc"}).status_code == 400
    assert client.patch(f"{URL}/1", json={}).status_code == 400
    assert client.get(f"{URL}/1").get_json()["cep"] == "50000000"  # nada mudou


def test_atualizar_inexistente_retorna_404(client):
    assert client.put(f"{URL}/999", json=VALIDO).status_code == 404
    assert client.patch(f"{URL}/999", json={"nome": "x"}).status_code == 404


# ------------------------------------------------------------------- remover
def test_remover(client):
    criar(client)
    r = client.delete(f"{URL}/1")
    assert r.status_code == 204 and r.data == b""
    assert client.get(f"{URL}/1").status_code == 404
    assert client.get(URL).get_json() == {"estabelecimentos": []}


def test_remover_inexistente_retorna_404(client):
    assert client.delete(f"{URL}/999").status_code == 404
