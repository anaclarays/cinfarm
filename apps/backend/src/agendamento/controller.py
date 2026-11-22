from typing import Any

from flask import Blueprint, request
from flask.typing import ResponseReturnValue
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError

from ..conf_database import db
from ..person.profiles import HealthProfessional, Patient
from .model import Agendamento, MedicaoClinica, TipoParametro
from .schema import AgendamentoSchema

bp = Blueprint("agendamento", __name__, url_prefix="/agendamentos")

_create_schema = AgendamentoSchema()


def _serialize_tipo_parametro(tp: TipoParametro) -> dict[str, Any]:
    return {
        "parametro_id": tp.parametro_id,
        "tipo": tp.tipo,
        "unidade_medida": tp.unidade_medida,
        "faixa_referencia": tp.faixa_referencia,
    }


def _serialize_medicao(m: MedicaoClinica) -> dict[str, Any]:
    return {
        "medicao_id": m.medicao_id,
        "agendamento_id": m.agendamento_id,
        "parametro_id": m.parametro_id,
        "profissional_saude_cpf": m.profissional_saude_cpf,
        "valor": m.valor,
        "data_medicao": m.data_medicao.isoformat(),
        "hora_medicao": m.hora_medicao.isoformat(),
        "tipo_parametro": _serialize_tipo_parametro(m.tipo_parametro),
    }


def _serialize(a: Agendamento) -> dict[str, Any]:
    return {
        "agendamento_id": a.agendamento_id,
        "paciente_cpf": a.paciente_cpf,
        "profissional_saude_cpf": a.profissional_saude_cpf,
        "data_hora_prevista": a.data_hora_prevista.isoformat(),
        "status": a.status,
        "observacoes": a.observacoes,
        "medicoes_clinicas": [_serialize_medicao(m) for m in a.medicoes_clinicas],
    }


@bp.post("/", strict_slashes=False)
def create() -> ResponseReturnValue:
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return {"error": "Dados inválidos."}, 400

    try:
        values: dict[str, Any] = _create_schema.load(payload)
    except ValidationError as error:
        return {"errors": error.messages}, 400

    # Valida paciente
    paciente_cpf: str = values["paciente_cpf"]
    if db.session.get(Patient, paciente_cpf) is None:
        return {"error": "Paciente não encontrado."}, 404

    # Valida profissional de saúde do agendamento
    prof_agendamento_cpf: str = values["profissional_saude_cpf"]
    if db.session.get(HealthProfessional, prof_agendamento_cpf) is None:
        return {"error": "Profissional de saúde do agendamento não encontrado."}, 404

    # Valida profissionais de saúde das medições (batch, sem repetição)
    medicoes_data: list[dict[str, Any]] = values["medicoes_clinicas"]
    cpfs_medicoes = {m["profissional_saude_cpf"] for m in medicoes_data}
    for cpf in cpfs_medicoes:
        if db.session.get(HealthProfessional, cpf) is None:
            return {"error": f"Profissional de saúde com CPF {cpf} não encontrado."}, 404

    # Constrói medições e tipos de parâmetro
    medicoes: list[MedicaoClinica] = []
    for m_data in medicoes_data:
        tp_data: dict[str, Any] = m_data["tipo_parametro"]
        tipo_parametro = TipoParametro(
            tipo=tp_data["tipo"],
            unidade_medida=tp_data["unidade_medida"],
            faixa_referencia=tp_data["faixa_referencia"],
        )
        db.session.add(tipo_parametro)
        medicoes.append(
            MedicaoClinica(
                profissional_saude_cpf=m_data["profissional_saude_cpf"],
                valor=m_data["valor"],
                data_medicao=m_data["data_medicao"],
                hora_medicao=m_data["hora_medicao"],
                tipo_parametro=tipo_parametro,
            )
        )

    agendamento = Agendamento(
        paciente_cpf=paciente_cpf,
        profissional_saude_cpf=prof_agendamento_cpf,
        data_hora_prevista=values["data_hora_prevista"],
        status=values["status"],
        observacoes=values.get("observacoes"),
        medicoes_clinicas=medicoes,
    )
    db.session.add(agendamento)

    try:
        db.session.flush()
        result = _serialize(agendamento)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return {"error": "Um vínculo dos dados informados deixou de ser válido."}, 409
    except Exception:
        db.session.rollback()
        raise

    return result, 201
