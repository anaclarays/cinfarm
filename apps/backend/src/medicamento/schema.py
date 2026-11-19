from marshmallow import Schema, ValidationError, fields, validate


def not_blank(value: str) -> None:
    if not value.strip() or "\0" in value:
        raise ValidationError("Informe um texto não vazio e válido.")


class MedicationSchema(Schema):
    medicamento_id = fields.Integer(dump_only=True)
    nome_medicamento = fields.String(required=True, validate=[validate.Length(max=200), not_blank])
