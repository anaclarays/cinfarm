from datetime import date
from decimal import Decimal

from marshmallow import Schema, ValidationError, fields, validate


def string(max_length: int, *, required: bool = True) -> fields.String:
    return fields.String(
        required=required,
        allow_none=not required,
        validate=[
            validate.Length(max=max_length),
            validate.Regexp(r"\A[^\x00]*[^\s\x00][^\x00]*\Z", error="Informe um texto válido."),
        ],
    )


def not_in_future(value: date) -> None:
    validate.Range(max=date.today(), error="A data de nascimento não pode estar no futuro.")(value)


def require_boolean(value: object) -> None:
    if not isinstance(value, bool):
        raise ValidationError("Informe true ou false.")


class HealthConditionSchema(Schema):
    nome = string(200)
    tipo = string(100)
    data_inicio = fields.Date(required=True)


class AllergicReactionSchema(Schema):
    medicamento_id = fields.Integer(
        required=True, strict=True, validate=validate.Range(min=1, max=2_147_483_647)
    )
    descricao = string(2000)
    data_ocorrencia = fields.Date(required=True)


class PatientSchema(Schema):
    rg = string(30)
    cartao_sus = string(15)
    data_nascimento = fields.Date(required=True, validate=not_in_future)
    idade = fields.Integer(dump_only=True)
    sexo_bio = string(50)
    genero = string(100, required=False)
    escolaridade = string(100, required=False)
    email = fields.Email(allow_none=True, validate=validate.Length(max=254))
    telefone_contato = string(15)
    raca_cor = string(100)
    estado_civil = string(100)
    ocupacao = string(200)
    renda = fields.Decimal(
        required=True,
        as_string=True,
        places=2,
        validate=validate.Range(min=0, max=Decimal("9999999999.99")),
    )
    cep = string(9)
    logradouro = string(200)
    estado = string(50)
    cidade = string(100)
    bairro = string(100)
    numero = string(30)
    complemento = string(200, required=False)
    nome_contato_emergencia = string(200)
    telefone_contato_emergencia = string(15)
    relacao_emergencia = string(100)
    possui_plano_saude = fields.Raw(required=True, validate=require_boolean)
    operadora = string(200, required=False)
    condicoes_saude = fields.List(fields.Nested(HealthConditionSchema))
    reacoes_alergicas = fields.List(fields.Nested(AllergicReactionSchema))


class InternSchema(Schema):
    curso = string(200)
    instituicao_ensino = string(200)
    responsavel_atendimento_id = fields.Integer(dump_only=True)


class HealthProfessionalSchema(Schema):
    instituicao_vinculo = string(200)
    especialidade = string(200)
    conselho = string(100)
    numero_registro = string(50)
    responsavel_atendimento_id = fields.Integer(dump_only=True)


class PersonSchema(Schema):
    cpf = fields.String(
        required=True,
        validate=validate.Regexp(r"\A[0-9]{11}\Z", error="Informe o CPF com 11 dígitos."),
    )
    name = string(200)
    telephone = string(15)
    paciente = fields.Raw()
    profissional_saude = fields.Raw()
    estagiario = fields.Raw()
