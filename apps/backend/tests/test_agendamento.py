from datetime import date
from decimal import Decimal

import pytest

from src.agendamento.model import Agendamento, MedicaoClinica, TipoParametro
from src.extensions import db
from src.person.model import Person
from src.person.profiles import CareProvider, HealthProfessional, Patient

URL = "/agendamentos/"

VALIDO = {
    "paciente_cpf": "12345678901",
    "profissional_saude_cpf": "98765432100",
    "data_hora_prevista": "2026-11-25T14:30:00",
    "status": "agendado",
    "observacoes": "Paciente em acompanhamento de rotina.",
    "medicoes_clinicas": [
        {
            "profissional_saude_cpf": "98765432100",
            "valor": "120/80",
            "data_medicao": "2026-11-25",
            "hora_medicao": "14:45:00",
            "tipo_parametro": {
                "tipo": "Pressão Arterial",
                "unidade_medida": "mmHg",
                "faixa_referencia": "120/80",
            },
        },
        {
            "profissional_saude_cpf": "98765432100",
            "valor": "95",
            "data_medicao": "2026-11-25",
            "hora_medicao": "14:46:00",
            "tipo_parametro": {
                "tipo": "Glicemia em Jejum",
                "unidade_medida": "mg/dL",
                "faixa_referencia": "70-99",
            },
        },
    ],
}


@pytest.fixture()
def pessoas(client):
    care = CareProvider()
    db.session.add(care)
    db.session.flush()

    p_paciente = Person(cpf="12345678901", name="Maria Silva", telephone="81999990001")
    paciente = Patient(
        cpf="12345678901",
        rg="1234567",
        cartao_sus="123456789012345",
        data_nascimento=date(1990, 1, 1),
        sexo_bio="Feminino",
        telefone_contato="81999990001",
        raca_cor="Parda",
        estado_civil="Solteira",
        ocupacao="Professora",
        renda=Decimal("3000.00"),
        cep="50000000",
        logradouro="Rua A",
        estado="PE",
        cidade="Recife",
        bairro="Centro",
        numero="10",
        nome_contato_emergencia="João Silva",
        telefone_contato_emergencia="81999990002",
        relacao_emergencia="Irmão",
        possui_plano_saude=False,
    )
    p_prof = Person(cpf="98765432100", name="Dr. Carlos", telephone="81999990003")
    prof = HealthProfessional(
        cpf="98765432100",
        instituicao_vinculo="Hospital Central",
        especialidade="Cardiologia",
        conselho="CRM",
        numero_registro="12345",
        responsavel_atendimento_id=care.id,
    )
    db.session.add_all([p_paciente, paciente, p_prof, prof])
    db.session.commit()
    return {
        "paciente_cpf": "12345678901",
        "profissional_saude_cpf": "98765432100",
    }


def criar(client, **mudancas):
    r = client.post(URL, json={**VALIDO, **mudancas})
    assert r.status_code == 201, r.get_json()
    return r.get_json()


# ---------------------------------------------------------------- cadastrar
def test_cadastrar_retorna_201_com_dados_completos(client, pessoas):
    r = client.post(URL, json=VALIDO)
    assert r.status_code == 201
    corpo = r.get_json()
    assert corpo["agendamento_id"] == 1
    assert corpo["paciente_cpf"] == "12345678901"
    assert corpo["profissional_saude_cpf"] == "98765432100"
    assert corpo["data_hora_prevista"] == "2026-11-25T14:30:00"
    assert corpo["status"] == "agendado"
    assert corpo["observacoes"] == "Paciente em acompanhamento de rotina."

    medicoes = corpo["medicoes_clinicas"]
    assert len(medicoes) == 2

    m1 = medicoes[0]
    assert m1["medicao_id"] == 1
    assert m1["agendamento_id"] == 1
    assert m1["profissional_saude_cpf"] == "98765432100"
    assert m1["valor"] == "120/80"
    assert m1["data_medicao"] == "2026-11-25"
    assert m1["hora_medicao"] == "14:45:00"
    assert m1["tipo_parametro"]["tipo"] == "Pressão Arterial"
    assert m1["tipo_parametro"]["unidade_medida"] == "mmHg"
    assert m1["tipo_parametro"]["faixa_referencia"] == "120/80"

    m2 = medicoes[1]
    assert m2["medicao_id"] == 2
    assert m2["agendamento_id"] == 1
    assert m2["profissional_saude_cpf"] == "98765432100"
    assert m2["valor"] == "95"
    assert m2["data_medicao"] == "2026-11-25"
    assert m2["hora_medicao"] == "14:46:00"
    assert m2["tipo_parametro"]["tipo"] == "Glicemia em Jejum"
    assert m2["tipo_parametro"]["unidade_medida"] == "mg/dL"
    assert m2["tipo_parametro"]["faixa_referencia"] == "70-99"

    assert m1["parametro_id"] != m2["parametro_id"]
    assert m1["tipo_parametro"]["parametro_id"] != m2["tipo_parametro"]["parametro_id"]


def test_cadastrar_persistencia_no_banco(client, pessoas):
    criar(client)
    agendamento = db.session.get(Agendamento, 1)
    assert agendamento is not None
    assert agendamento.paciente_cpf == pessoas["paciente_cpf"]
    assert len(agendamento.medicoes_clinicas) == 2

    medicoes = db.session.scalars(db.select(MedicaoClinica)).all()
    assert len(medicoes) == 2

    tipos = db.session.scalars(db.select(TipoParametro)).all()
    assert len(tipos) == 2


def test_cadastrar_sem_observacoes(client, pessoas):
    corpo = {k: v for k, v in VALIDO.items() if k != "observacoes"}
    r = client.post(URL, json=corpo)
    assert r.status_code == 201
    assert r.get_json()["observacoes"] is None


def test_cadastrar_paciente_inexistente_retorna_404(client, pessoas):
    r = client.post(URL, json={**VALIDO, "paciente_cpf": "99999999999"})
    assert r.status_code == 404
    assert "error" in r.get_json()
    assert r.get_json()["error"] == "Paciente não encontrado."


def test_cadastrar_profissional_saude_agendamento_inexistente_retorna_404(client, pessoas):
    r = client.post(URL, json={**VALIDO, "profissional_saude_cpf": "99999999999"})
    assert r.status_code == 404
    assert "error" in r.get_json()
    assert r.get_json()["error"] == "Profissional de saúde do agendamento não encontrado."


def test_cadastrar_profissional_saude_medicao_inexistente_retorna_404(client, pessoas):
    cpf_inexistente = "88888888888"
    corpo = {
        **VALIDO,
        "medicoes_clinicas": [
            {
                **VALIDO["medicoes_clinicas"][0],
                "profissional_saude_cpf": cpf_inexistente,
            }
        ],
    }
    r = client.post(URL, json=corpo)
    assert r.status_code == 404
    assert "error" in r.get_json()
    assert cpf_inexistente in r.get_json()["error"]

    assert len(db.session.scalars(db.select(Agendamento)).all()) == 0
    assert len(db.session.scalars(db.select(MedicaoClinica)).all()) == 0
    assert len(db.session.scalars(db.select(TipoParametro)).all()) == 0


def test_cadastrar_medicoes_clinicas_vazia(client, pessoas):
    r = client.post(URL, json={**VALIDO, "medicoes_clinicas": []})
    assert r.status_code == 400
    assert "medicoes_clinicas" in r.get_json()["errors"]


def test_cadastrar_medicoes_clinicas_ausente(client, pessoas):
    corpo = {k: v for k, v in VALIDO.items() if k != "medicoes_clinicas"}
    r = client.post(URL, json=corpo)
    assert r.status_code == 400
    assert "medicoes_clinicas" in r.get_json()["errors"]


def test_cadastrar_campos_obrigatorios_ausentes(client, pessoas):
    r = client.post(URL, json={"status": "agendado"})
    assert r.status_code == 400
    erros = r.get_json()["errors"]
    for campo in (
        "paciente_cpf",
        "profissional_saude_cpf",
        "data_hora_prevista",
        "medicoes_clinicas",
    ):
        assert campo in erros
    assert "status" not in erros


def test_cadastrar_valores_invalidos_agendamento(client, pessoas):
    casos = [
        ("paciente_cpf", "123"),
        ("paciente_cpf", "1234567890a"),
        ("paciente_cpf", "123456789012"),
        ("data_hora_prevista", "amanhã"),
        ("status", "   "),
        ("status", "a" * 51),
        ("observacoes", "a" * 2001),
    ]
    for campo, valor in casos:
        r = client.post(URL, json={**VALIDO, campo: valor})
        assert r.status_code == 400, (campo, valor)
        assert campo in r.get_json()["errors"], (campo, valor)


def test_cadastrar_medicao_dados_invalidos(client, pessoas):
    medicao_base = VALIDO["medicoes_clinicas"][0]
    casos = [
        {"data_medicao": "25/11/2026"},
        {"hora_medicao": "meio-dia"},
        {"profissional_saude_cpf": "123"},
        {"valor": ""},
        {"valor": "   "},
    ]
    for alteracao in casos:
        corpo = {
            **VALIDO,
            "medicoes_clinicas": [{**medicao_base, **alteracao}],
        }
        r = client.post(URL, json=corpo)
        assert r.status_code == 400, alteracao
        assert "medicoes_clinicas" in r.get_json()["errors"], alteracao


def test_cadastrar_tipo_parametro_incompleto(client, pessoas):
    corpo = {
        **VALIDO,
        "medicoes_clinicas": [
            {
                **VALIDO["medicoes_clinicas"][0],
                "tipo_parametro": {"tipo": "Pressão Arterial"},
            }
        ],
    }
    r = client.post(URL, json=corpo)
    assert r.status_code == 400
    assert "medicoes_clinicas" in r.get_json()["errors"]


def test_cadastrar_campo_desconhecido_ou_corpo_invalido(client, pessoas):
    assert client.post(URL, json={**VALIDO, "xpto": 1}).status_code == 400
    assert client.post(URL, data="isto não é json").status_code == 400
    assert client.post(URL, json={}).status_code == 400
    assert client.post(URL, json=[1, 2]).status_code == 400
