from typing import Any

from flask import request
from flask.typing import ResponseReturnValue
from flask.views import MethodView
from flask_smorest import Blueprint
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError

from ..conf_database import db
from ..pessoa.profiles import HealthProfessional, Patient
from .model import AgendamentoModel, MedicaoClinicaModel, TipoParametroModel
from .schema import AgendamentoSchema, ErroSchema, ErroValidacaoSchema

bp = Blueprint(
    "agendamento", 
    __name__, 
    url_prefix="/agendamento",
    description="Rota de Agendamento"
)

_create_schema = AgendamentoSchema()

def _serialize_tipo_parametro(tp: TipoParametroModel) -> dict[str, Any]:
    return {
        "parametro_id": tp.parametro_id,
        "tipo": tp.tipo,
        "unidade_medida": tp.unidade_medida,
        "faixa_referencia": tp.faixa_referencia,
    }


def _serialize_medicao(m: MedicaoClinicaModel) -> dict[str, Any]:
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

def _serialize(a: AgendamentoModel) -> dict[str, Any]:
    return {
        "agendamento_id": a.agendamento_id,
        "paciente_cpf": a.paciente_cpf,
        "profissional_saude_cpf": a.profissional_saude_cpf,
        "data_hora_prevista": a.data_hora_prevista.isoformat(),
        "status": a.status,
        "observacoes": a.observacoes,
        "medicoes_clinicas": [_serialize_medicao(m) for m in a.medicoes_clinicas],
    }

@bp.route("/", strict_slashes=False)
class Agendamento(MethodView):
    
    @bp.doc(summary="Cria um agendamento")
    @bp.alt_response(201, schema=AgendamentoSchema, description="Agendamento criado")
    @bp.alt_response(400, schema=ErroValidacaoSchema, description="Dados inválidos")
    @bp.alt_response(404, schema=ErroSchema, description="Paciente ou profissional de saúde não encontrado")
    @bp.alt_response(409, schema=ErroSchema, description="Um vínculo dos dados informados deixou de ser válido")
    def post(self) -> ResponseReturnValue:
        """Cria um agendamento."""
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
        medicoes: list[MedicaoClinicaModel] = []
        for m_data in medicoes_data:
            tp_data: dict[str, Any] = m_data["tipo_parametro"]
            tipo_parametro = TipoParametroModel(
                tipo=tp_data["tipo"],
                unidade_medida=tp_data["unidade_medida"],
                faixa_referencia=tp_data["faixa_referencia"],
            )
            db.session.add(tipo_parametro)
            medicoes.append(
                MedicaoClinicaModel(
                    profissional_saude_cpf=m_data["profissional_saude_cpf"],
                    valor=m_data["valor"],
                    data_medicao=m_data["data_medicao"],
                    hora_medicao=m_data["hora_medicao"],
                    tipo_parametro=tipo_parametro,
                )
            )
    
        agendamento = AgendamentoModel(
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
