from marshmallow import Schema, ValidationError, fields, validate


def _str(max_length: int, *, required: bool = True) -> fields.String:
    return fields.String(
        required=required,
        allow_none=not required,
        validate=[
            validate.Length(max=max_length),
            validate.Regexp(r"\A[^\x00]*[^\s\x00][^\x00]*\Z", error="Informe um texto válido."),
        ],
    )


def _cpf() -> fields.String:
    return fields.String(
        required=True,
        validate=validate.Regexp(r"\A[0-9]{11}\Z", error="Informe o CPF com 11 dígitos."),
    )


class TipoParametroSchema(Schema):
    tipo = _str(200)
    unidade_medida = _str(100)
    faixa_referencia = _str(200)


class MedicaoClinicaSchema(Schema):
    profissional_saude_cpf = _cpf()
    valor = _str(200)
    data_medicao = fields.Date(required=True)
    hora_medicao = fields.Time(required=True)
    tipo_parametro = fields.Nested(TipoParametroSchema, required=True)


def _at_least_one(value: list[object]) -> None:
    if len(value) < 1:
        raise ValidationError("Informe pelo menos uma medição clínica.")


class AgendamentoSchema(Schema):
    paciente_cpf = _cpf()
    profissional_saude_cpf = _cpf()
    data_hora_prevista = fields.DateTime(required=True)
    status = _str(50)
    observacoes = _str(2000, required=False)
    medicoes_clinicas = fields.List(
        fields.Nested(MedicaoClinicaSchema),
        required=True,
        validate=_at_least_one,
    )
