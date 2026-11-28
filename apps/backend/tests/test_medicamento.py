URL = "/api/medicamento"


def criar(client, nome="Dipirona"):
    r = client.post(URL, json={"nome_medicamento": nome})
    assert r.status_code == 201, r.get_json()
    return r.get_json()


def test_criar_retorna_201_com_id(client):
    r = client.post(URL, json={"nome_medicamento": "Dipirona"})
    assert r.status_code == 201
    assert r.get_json() == {"medicamento_id": 1, "nome_medicamento": "Dipirona"}


def test_criar_sem_nome_retorna_400(client):
    r = client.post(URL, json={})
    assert r.status_code == 400
    assert "nome_medicamento" in r.get_json()["errors"]


def test_criar_valores_invalidos(client):
    for valor in ["   ", "", 123, None, "x" * 201]:
        r = client.post(URL, json={"nome_medicamento": valor})
        assert r.status_code == 400, valor
        assert "nome_medicamento" in r.get_json()["errors"]


def test_criar_campo_desconhecido_ou_corpo_invalido(client):
    assert client.post(URL, json={"nome_medicamento": "A", "xpto": 1}).status_code == 400
    assert client.post(URL, data="isto não é json").status_code == 400


def test_listar_vazio(client):
    r = client.get(URL)
    assert r.status_code == 200
    assert r.get_json() == {"medicamentos": []}


def test_listar_ordenado_por_id(client):
    criar(client, "Dipirona")
    criar(client, "Paracetamol")
    nomes = [m["nome_medicamento"] for m in client.get(URL).get_json()["medicamentos"]]
    assert nomes == ["Dipirona", "Paracetamol"]


def test_buscar_por_id(client):
    criar(client)
    r = client.get(f"{URL}/1")
    assert r.status_code == 200
    assert r.get_json()["nome_medicamento"] == "Dipirona"


def test_buscar_inexistente_retorna_404(client):
    assert client.get(f"{URL}/999").status_code == 404


def test_atualizar_nome(client):
    criar(client)
    r = client.put(f"{URL}/1", json={"nome_medicamento": "Paracetamol"})
    assert r.status_code == 200
    assert r.get_json()["nome_medicamento"] == "Paracetamol"
    assert client.get(f"{URL}/1").get_json()["nome_medicamento"] == "Paracetamol"


def test_atualizar_inexistente_retorna_404(client):
    r = client.put(f"{URL}/999", json={"nome_medicamento": "X"})
    assert r.status_code == 404


def test_atualizar_valor_invalido_retorna_400(client):
    criar(client)
    r = client.put(f"{URL}/1", json={"nome_medicamento": "  "})
    assert r.status_code == 400
    assert client.get(f"{URL}/1").get_json()["nome_medicamento"] == "Dipirona"


def test_remover_retorna_204_e_some(client):
    criar(client)
    assert client.delete(f"{URL}/1").status_code == 204
    assert client.get(f"{URL}/1").status_code == 404


def test_remover_inexistente_retorna_404(client):
    assert client.delete(f"{URL}/999").status_code == 404
