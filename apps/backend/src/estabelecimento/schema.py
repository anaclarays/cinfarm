from marshmallow import Schema, fields, RAISE
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

from .model import EstabelecimentoModel

class EstabelecimentoSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = EstabelecimentoModel
        load_instance = False
        dump_only = ("estabelecimento_id",)

class EstabelecimentoListaSchema(Schema):
    estabelecimentos = fields.List(fields.Nested(EstabelecimentoSchema))

class EstabelecimentoFiltrosSchema(Schema):
    class Meta:
        unknown = RAISE 

    nome = fields.String()
    cidade = fields.String()
    estado = fields.String()
    tipo_atendimento = fields.String()

class ErroSchema(Schema):
    error = fields.String()


class ErrosSchema(Schema):
    errors = fields.Dict()