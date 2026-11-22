from marshmallow import (
    Schema, 
    fields, 
    validate,
)
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

from .model import ConsultaModel

class ConsultaSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = ConsultaModel
        load_instance = False
    
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

class ConsultaListaSchema(Schema):
    consultas = fields.List(fields.Nested(ConsultaSchema))

class ErroSchema(Schema):
    error = fields.String()

class ErrosSchema(Schema):
    error = fields.Dict()


class ErroValidacaoSchema(Schema):
    error = fields.String()
    erros = fields.Dict()