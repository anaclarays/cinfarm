from marshmallow import Schema, ValidationError, fields, validate
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from .model import MedicamentoModel

def not_blank(value: str) -> None:
    if not value.strip() or "\0" in value:
        raise ValidationError("Informe um texto não vazio e válido.")

class MedicamentoSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = MedicamentoModel
        load_instance = False
        dump_only = ("medicamento_id",)

    medicamento_id = fields.Integer(dump_only=True)
    nome_medicamento = fields.String(
        required=True, 
        validate=[validate.Length(max=200), not_blank]
    )

class MedicamentoListaSchema(Schema):
    medicamentos = fields.List(fields.Nested(MedicamentoSchema))

class ErroSchema(Schema):
    error = fields.String()

class ErrosSchema(Schema):
    errors = fields.Dict()
