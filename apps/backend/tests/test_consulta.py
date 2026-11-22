from typing import TypedDict

import pytest
from flask.testing import FlaskClient

from src.estabelecimento.model import Estabelecimento
from src.extensions import db
from src.person.model import Person
from src.person.profiles import CareProvider, HealthProfessional, Intern


class ConsultaCadastros(TypedDict):
    profissional_id: int
    estagiario_id: int
    supervisor_cpf: str
    estabelecimento_id: int


@pytest.fixture()
def cadastros_consulta(client: FlaskClient) -> ConsultaCadastros:
    profissional_care = CareProvider()
    estagiario_care = CareProvider()
    supervisor_care = CareProvider()
    db.session.add_all([profissional_care, estagiario_care, supervisor_care])
    db.session.flush()

    profissional = Person(cpf="98765432100", name="Profissional", telephone="81999990001")
    supervisor = Person(cpf="11122233344", name="Supervisor", telephone="81999990002")
    estagiario = Person(cpf="12345678901", name="Estagiário", telephone="81999990003")
    db.session.add_all(
        [
            profissional,
            supervisor,
            estagiario,
            HealthProfessional(
                cpf=profissional.cpf,
                instituicao_vinculo="Clínica Central",
                especialidade="Clínica geral",
                conselho="CRM",
                numero_registro="12345",
                responsavel_atendimento_id=profissional_care.id,
            ),
            HealthProfessional(
                cpf=supervisor.cpf,
                instituicao_vinculo="Clínica Central",
                especialidade="Clínica geral",
                conselho="CRM",
                numero_registro="67890",
                responsavel_atendimento_id=supervisor_care.id,
            ),
            Intern(
                cpf=estagiario.cpf,
                curso="Medicina",
                instituicao_ensino="Universidade",
                responsavel_atendimento_id=estagiario_care.id,
            ),
            Estabelecimento(
                nome="Clínica Central",
                tipo_atendimento="privado",
                logradouro="Rua A",
                bairro="Centro",
                cidade="Recife",
                estado="PE",
                cep="50000000",
            ),
        ]
    )
    db.session.commit()
    estabelecimento_id = db.session.scalar(db.select(Estabelecimento.estabelecimento_id))
    return {
        "profissional_id": profissional_care.id,
        "estagiario_id": estagiario_care.id,
        "supervisor_cpf": supervisor.cpf,
        "estabelecimento_id": estabelecimento_id,
    }


def test_criar_consulta_com_profissional_e_listar(
    client: FlaskClient, cadastros_consulta: ConsultaCadastros
) -> None:
    payload = {
        "responsavel_atendimento_id": cadastros_consulta["profissional_id"],
        "estabelecimento_id": cadastros_consulta["estabelecimento_id"],
    }

    response = client.post("/consultas/", json=payload)

    assert response.status_code == 201
    assert response.json is not None
    assert response.json["supervisor_cpf"] is None
    consulta_id = response.json["consulta_id"]
    detail = client.get(f"/consultas/{consulta_id}")
    listing = client.get("/consultas/")
    assert detail.json is not None
    assert listing.json is not None
    assert detail.json == response.json
    assert listing.json["consultas"] == [response.json]


def test_estagiario_exige_supervisor_profissional(
    client: FlaskClient, cadastros_consulta: ConsultaCadastros
) -> None:
    payload = {
        "responsavel_atendimento_id": cadastros_consulta["estagiario_id"],
        "estabelecimento_id": cadastros_consulta["estabelecimento_id"],
    }

    response = client.post("/consultas/", json=payload)

    assert response.status_code == 400
    assert response.json is not None
    assert "supervisor" in response.json["error"]


def test_criar_consulta_com_estagiario_supervisionado(
    client: FlaskClient, cadastros_consulta: ConsultaCadastros
) -> None:
    payload = {
        "responsavel_atendimento_id": cadastros_consulta["estagiario_id"],
        "estabelecimento_id": cadastros_consulta["estabelecimento_id"],
        "supervisor_cpf": cadastros_consulta["supervisor_cpf"],
    }

    response = client.post("/consultas/", json=payload)

    assert response.status_code == 201
    assert response.json is not None
    assert response.json["supervisor_cpf"] == cadastros_consulta["supervisor_cpf"]


def test_estabelecimento_inexistente_nao_e_aceito(
    client: FlaskClient, cadastros_consulta: ConsultaCadastros
) -> None:
    payload = {
        "responsavel_atendimento_id": cadastros_consulta["profissional_id"],
        "estabelecimento_id": 999,
    }

    response = client.post("/consultas/", json=payload)

    assert response.status_code == 404


def test_filtro_de_estabelecimento_invalido_retorna_400(client: FlaskClient) -> None:
    response = client.get("/consultas/?estabelecimento_id=abc")

    assert response.status_code == 400
