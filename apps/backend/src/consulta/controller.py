from flask import request
from flask.typing import ResponseReturnValue
from flask.views import MethodView
from flask_smorest import Blueprint
from marshmallow import ValidationError
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from ..conf_database import db
from ..estabelecimento.model import EstabelecimentoModel
from ..pessoa.profiles import (
    CareProvider, 
    HealthProfessional, 
    Intern,
)
from .model import ConsultaModel
from .schema import (
    ConsultaSchema, 
    ConsultaListaSchema,
    ErroSchema,
    ErrosSchema,
    ErroValidacaoSchema
)

bp = Blueprint(
    "consulta", 
    __name__, 
    url_prefix="/consulta",
    description="Rota de consultas"
)

schema = ConsultaSchema()

def serialize(consulta: ConsultaModel) -> dict[str, int | str | None]:
    return {
        "consulta_id": consulta.consulta_id,
        "responsavel_atendimento_id": consulta.responsavel_atendimento_id,
        "estabelecimento_id": consulta.estabelecimento_id,
        "supervisor_cpf": consulta.supervisor_cpf,
    }

@bp.route("/", strict_slashes=False)
class ConsultaLista(MethodView):

    @bp.doc(summary="Lista consultas", parameters=[
            {"name": "estabelecimento_id", "in": "query", "schema": {"type": "integer"}},
        ])
    @bp.alt_response(200, schema=ConsultaListaSchema, description="Lista de consultas")
    @bp.alt_response(400, schema=ErrosSchema, description="Identificador inválido")
    def get(self) -> ResponseReturnValue:
        query = select(ConsultaModel).order_by(ConsultaModel.consulta_id)
        if "estabelecimento_id" in request.args:
            try:
                estabelecimento_id = int(request.args["estabelecimento_id"])
            except ValueError:
                return {
                    "errors": {"estabelecimento_id": ["Informe um identificador inteiro."]}
                }, 400
            if estabelecimento_id < 1:
                return {
                    "errors": {"estabelecimento_id": ["Informe um identificador positivo."]}
                }, 400
            query = query.where(ConsultaModel.estabelecimento_id == estabelecimento_id)
        return {"consultas": [serialize(item) for item in db.session.scalars(query)]}


    @bp.doc(summary="Cria uma consulta")
    @bp.alt_response(201, schema=ConsultaSchema, description="Consulta criada")
    @bp.alt_response(400, schema=ErroValidacaoSchema, description="Dados inválidos ou regra de supervisão violada")
    @bp.alt_response(404, schema=ErroSchema, description="Estabelecimento, responsável ou supervisor não encontrado")
    @bp.alt_response(409, schema=ErroSchema, description="Um vínculo dos dados informados deixou de ser válido")
    def post(self) -> ResponseReturnValue:
        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            return {"error": "Envie um objeto JSON com os dados da consulta."}, 400
        try:
            values = schema.load(payload)
        except ValidationError as error:
            return {"errors": error.messages}, 400
    
        estabelecimento_id = values["estabelecimento_id"]
        if db.session.get(EstabelecimentoModel, estabelecimento_id) is None:
            return {"error": "Estabelecimento não encontrado."}, 404
    
        responsavel_id = values["responsavel_atendimento_id"]
        if db.session.get(CareProvider, responsavel_id) is None:
            return {"error": "Responsável pelo atendimento não encontrado."}, 404
    
        estagiario = db.session.scalar(
            select(Intern).where(Intern.responsavel_atendimento_id == responsavel_id)
        )
        profissional = db.session.scalar(
            select(HealthProfessional).where(
                HealthProfessional.responsavel_atendimento_id == responsavel_id
            )
        )
        supervisor_cpf = values.get("supervisor_cpf")
        if estagiario is not None:
            if not supervisor_cpf:
                return {
                    "error": (
                        "Consulta atendida por estagiário exige um profissional "
                        "de saúde supervisor."
                    )
                }, 400
            if db.session.get(HealthProfessional, supervisor_cpf) is None:
                return {"error": "Profissional de saúde supervisor não encontrado."}, 404
        elif profissional is not None:
            if supervisor_cpf is not None:
                return {
                    "error": "Supervisor só deve ser informado quando o responsável for estagiário."
                }, 400
        else:
            return {"error": "O responsável deve ser um estagiário ou profissional de saúde."}, 400
    
        consulta = ConsultaModel(**values)
        db.session.add(consulta)
        try:
            db.session.flush()
            result = serialize(consulta)
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            return {"error": "Um vínculo dos dados informados deixou de ser válido."}, 409
        return result, 201

@bp.route("/<int:consulta_id>", strict_slashes=False)
class Consulta(MethodView):

    @bp.doc(summary="Busca uma consulta pelo ID")
    @bp.alt_response(200, schema=ConsultaSchema, description="Consulta")
    @bp.alt_response(404, schema=ErroSchema, description="Consulta não encontrada")
    def get(self, consulta_id: int) -> ResponseReturnValue:
        consulta = db.session.get(ConsultaModel, consulta_id)
        if consulta is None:
            return {"error": "Consulta não encontrada."}, 404
        return serialize(consulta)
    
    
