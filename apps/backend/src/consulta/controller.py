from flask import Blueprint, request
from flask.typing import ResponseReturnValue
from marshmallow import Schema, ValidationError, fields, validate
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from ..estabelecimento.model import Estabelecimento
from ..extensions import db
from ..person.profiles import CareProvider, HealthProfessional, Intern
from .model import Consulta

bp = Blueprint("consulta", __name__, url_prefix="/consultas")


class ConsultaSchema(Schema):
    responsavel_atendimento_id = fields.Integer(
        required=True, strict=True, validate=validate.Range(min=1)
    )
    estabelecimento_id = fields.Integer(
        required=True, strict=True, validate=validate.Range(min=1)
    )
    supervisor_cpf = fields.String(
        required=False,
        allow_none=True,
        validate=validate.Regexp(r"\A[0-9]{11}\Z", error="Informe um CPF com 11 dígitos."),
    )


schema = ConsultaSchema()


def serialize(consulta: Consulta) -> dict[str, int | str | None]:
    return {
        "consulta_id": consulta.consulta_id,
        "responsavel_atendimento_id": consulta.responsavel_atendimento_id,
        "estabelecimento_id": consulta.estabelecimento_id,
        "supervisor_cpf": consulta.supervisor_cpf,
    }


@bp.get("/", strict_slashes=False)
def find_all() -> ResponseReturnValue:
    query = select(Consulta).order_by(Consulta.consulta_id)
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
        query = query.where(Consulta.estabelecimento_id == estabelecimento_id)
    return {"consultas": [serialize(item) for item in db.session.scalars(query)]}


@bp.get("/<int:consulta_id>")
def find_by_id(consulta_id: int) -> ResponseReturnValue:
    consulta = db.session.get(Consulta, consulta_id)
    if consulta is None:
        return {"error": "Consulta não encontrada."}, 404
    return serialize(consulta)


@bp.post("/", strict_slashes=False)
def create() -> ResponseReturnValue:
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return {"error": "Envie um objeto JSON com os dados da consulta."}, 400
    try:
        values = schema.load(payload)
    except ValidationError as error:
        return {"errors": error.messages}, 400

    estabelecimento_id = values["estabelecimento_id"]
    if db.session.get(Estabelecimento, estabelecimento_id) is None:
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

    consulta = Consulta(**values)
    db.session.add(consulta)
    try:
        db.session.flush()
        result = serialize(consulta)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return {"error": "Um vínculo dos dados informados deixou de ser válido."}, 409
    return result, 201
