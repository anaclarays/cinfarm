from typing import Any

from flask import request, url_for
from flask.typing import ResponseReturnValue
from flask_smorest import Blueprint
from flask.views import MethodView
from sqlalchemy.exc import IntegrityError

from ..conf_database import db
from .model import EstabelecimentoModel
from .schema import (
    EstabelecimentoSchema, 
    EstabelecimentoFiltrosSchema, 
    EstabelecimentoListaSchema,
    ErroSchema,
    ErrosSchema
)

bp = Blueprint(
    "estabelecimento", 
    __name__, 
    url_prefix="/estabelecimento",
    description="Rota de estabelecimentos"
)

# campo -> tamanho máximo
REQUIRED_FIELDS = {
    "nome": 200,
    "tipo_atendimento": 10,
    "logradouro": 200,
    "bairro": 100,
    "cidade": 100,
    "estado": 2,
    "cep": 8,
}
OPTIONAL_FIELDS = {"numero": 10, "complemento": 100}
ALL_FIELDS = {**REQUIRED_FIELDS, **OPTIONAL_FIELDS}
TIPOS_ATENDIMENTO = ("publico", "privado")
FILTERS = ("nome", "cidade", "estado", "tipo_atendimento")
QUERY_PARAMS = [
    {"name": f, "in": "query", "schema": {"type": "string"}} for f in FILTERS
]


def serialize(e: EstabelecimentoModel) -> dict[str, Any]:
    return {
        "estabelecimento_id": e.estabelecimento_id,
        "nome": e.nome,
        "tipo_atendimento": e.tipo_atendimento,
        "logradouro": e.logradouro,
        "numero": e.numero,
        "complemento": e.complemento,
        "bairro": e.bairro,
        "cidade": e.cidade,
        "estado": e.estado,
        "cep": e.cep,
    }


def validate_value(field: str, value: Any) -> str | None:
    """Devolve a mensagem de erro do campo, ou None se o valor é válido."""
    if not isinstance(value, str) or not value.strip() or "\0" in value:
        return "Informe um texto não vazio e válido."
    if len(value) > ALL_FIELDS[field]:
        return f"Use no máximo {ALL_FIELDS[field]} caracteres."
    if field == "tipo_atendimento" and value not in TIPOS_ATENDIMENTO:
        return "Use 'publico' ou 'privado'."
    if field == "cep" and not (value.isascii() and value.isdigit() and len(value) == 8):
        return "Informe o CEP com 8 dígitos, sem pontuação."
    if field == "estado" and not (value.isascii() and value.isalpha() and len(value) == 2):
        return "Informe a sigla do estado com 2 letras (ex.: PE)."
    return None


def read_fields(*, partial: bool = False) -> tuple[dict[str, str | None], dict[str, str]]:
    """Lê e valida o JSON da requisição.

    - POST/PUT (partial=False): todos os campos obrigatórios devem vir; os opcionais
      que não vierem ficam vazios (None).
    - PATCH (partial=True): só os campos enviados são validados/alterados.
    """
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict) or not payload:
        return {}, {"body": "Envie um objeto JSON com os dados do estabelecimento."}

    errors = {key: "Campo não permitido." for key in payload if key not in ALL_FIELDS}
    values: dict[str, str | None] = {}
    for field in ALL_FIELDS:
        if field not in payload:
            if field in REQUIRED_FIELDS and not partial:
                errors[field] = "Campo obrigatório."
            elif field in OPTIONAL_FIELDS and not partial:
                values[field] = None
            continue

        value = payload[field]
        if value is None and field in OPTIONAL_FIELDS:
            values[field] = None  # permite limpar um campo opcional
            continue
        error = validate_value(field, value)
        if error:
            errors[field] = error
        else:
            values[field] = value.upper() if field == "estado" else value

    return values, errors


@bp.route("/", strict_slashes=False)
class EstabelecimentoList(MethodView):

    @bp.doc(summary="Lista estabelecimentos", parameters=QUERY_PARAMS)
    @bp.alt_response(200, schema=EstabelecimentoListaSchema, description="Lista de estabelecimentos")
    @bp.alt_response(400, schema=ErroSchema, description="Filtro não permitido")
    def get(self) -> ResponseReturnValue:
        query = db.select(EstabelecimentoModel).order_by(EstabelecimentoModel.estabelecimento_id)
        for key in request.args:
            if key not in FILTERS:
                return {"error": f"Filtro não permitido: {key}."}, 400
        if nome := request.args.get("nome"):
            query = query.where(EstabelecimentoModel.nome.ilike(f"%{nome}%"))
        if cidade := request.args.get("cidade"):
            query = query.where(EstabelecimentoModel.cidade.ilike(cidade))
        if estado := request.args.get("estado"):
            query = query.where(EstabelecimentoModel.estado == estado.upper())
        if tipo := request.args.get("tipo_atendimento"):
            query = query.where(EstabelecimentoModel.tipo_atendimento == tipo)
    
        items = db.session.scalars(query)
        return {"estabelecimentos": [serialize(e) for e in items]}

    @bp.doc(summary="Cria um estabelecimento")
    @bp.alt_response(201, schema=EstabelecimentoSchema, description="Criado (header Location com a URL)")
    @bp.alt_response(400, schema=ErrosSchema, description="Dados inválidos")
    def post(self) -> ResponseReturnValue:
        values, errors = read_fields()
        if errors:
            return {"errors": errors}, 400
    
        estabelecimento = EstabelecimentoModel(**values)
        db.session.add(estabelecimento)
        db.session.commit()
        result = serialize(estabelecimento)
        new_id = result["estabelecimento_id"]
        location = url_for("estabelecimento.find_by_id", estabelecimento_id=new_id)
        return result, 201, {"Location": location}


@bp.route("/<int:estabelecimento_id>", strict_slashes=False, endpoint="find_by_id")
class Estabelecimento(MethodView):

    @bp.doc(summary="Busca um estabelecimento pelo ID")
    @bp.alt_response(200, schema=EstabelecimentoSchema, description="Estabelecimento")
    @bp.alt_response(404, schema=ErroSchema, description="Não encontrado")
    def get(self, estabelecimento_id: int) -> ResponseReturnValue:
        estabelecimento = db.session.get(EstabelecimentoModel, estabelecimento_id)
        if estabelecimento is None:
            return {"error": "Estabelecimento não encontrado."}, 404
    
        return serialize(estabelecimento)
    
    def _update(self, estabelecimento_id: int) -> ResponseReturnValue:
        values, errors = read_fields(partial=request.method == "PATCH")
        if errors:
            return {"errors": errors}, 400
    
        estabelecimento = db.session.get(EstabelecimentoModel, estabelecimento_id, with_for_update=True)
        if estabelecimento is None:
            return {"error": "Estabelecimento não encontrado."}, 404
    
        for field, value in values.items():
            setattr(estabelecimento, field, value)
        db.session.commit()
        return serialize(estabelecimento)

    @bp.doc(summary="Substitui um estabelecimento")
    @bp.alt_response(200, schema=EstabelecimentoSchema, description="Atualizado")
    @bp.alt_response(400, schema=ErrosSchema, description="Dados inválidos")
    @bp.alt_response(404, schema=ErroSchema, description="Não encontrado")
    def put(self, estabelecimento_id: int) -> ResponseReturnValue:
        return self._update(estabelecimento_id)

    @bp.doc(summary="Atualiza parcialmente um estabelecimento")
    @bp.alt_response(200, schema=EstabelecimentoSchema, description="Atualizado")
    @bp.alt_response(400, schema=ErrosSchema, description="Dados inválidos")
    @bp.alt_response(404, schema=ErroSchema, description="Não encontrado")
    def patch(self, estabelecimento_id: int) -> ResponseReturnValue:
        return self._update(estabelecimento_id)
        
    @bp.doc(summary="Remove um estabelecimento")    
    @bp.alt_response(204, description="Removido")
    @bp.alt_response(404, schema=ErroSchema, description="Não encontrado")
    @bp.alt_response(409, schema=ErroSchema, description="Possui consultas vinculadas")
    def delete(self, estabelecimento_id: int) -> ResponseReturnValue:
        estabelecimento = db.session.get(EstabelecimentoModel, estabelecimento_id, with_for_update=True)
        if estabelecimento is None:
            return {"error": "Estabelecimento não encontrado."}, 404
    
        db.session.delete(estabelecimento)
        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            return {"error": "O estabelecimento possui consultas vinculadas."}, 409
    
        return "", 204
