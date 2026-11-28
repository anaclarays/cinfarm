from flask import request, url_for
from flask_smorest import Blueprint
from flask.typing import ResponseReturnValue
from flask.views import MethodView
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

from ..conf_database import db
from .model import PessoaModel
from .profile_service import (
    PROFILES,
    apply_profile, 
    serialize, 
    serialize_detail
)
from .schema import (
    ErroSchema,
    ErrosSchema,
    PessoaSchema,
    PessoaListaSchema,
)

bp = Blueprint(
    "pessoa", 
    __name__, 
    url_prefix="/pessoa",
    description="Rota de pessoas"
)

create_schema = PessoaSchema()
update_schema = PessoaSchema(exclude=("cpf",))


@bp.route("/", strict_slashes=False)
class PersonList(MethodView):
    
    @bp.doc(summary="Lista pessoas")
    @bp.alt_response(200, schema=PessoaListaSchema, description="Lista de pessoas")
    def get(self) -> ResponseReturnValue:
        query = (
            db.select(PessoaModel)
            .options(*(selectinload(getattr(PessoaModel, key)) for key in PROFILES))
            .order_by(PessoaModel.cpf)
        )
        people = db.session.scalars(query)
        return {
            "All people": [
                {
                    **serialize(person),
                    "perfil": next((key for key in PROFILES if getattr(person, key) is not None), None),
                }
                for person in people
            ]
        }
        
    @bp.doc(summary="Cria uma pessoa")
    @bp.alt_response(201, schema=PessoaSchema, description="Pessoa criada (header Location com a URL)")
    @bp.alt_response(400, schema=ErrosSchema, description="Dados inválidos")
    @bp.alt_response(409, schema=ErroSchema, description="CPF já cadastrado ou vínculo inválido")
    def post(self) -> ResponseReturnValue:
        try:
            values = create_schema.load(request.get_json(silent=True))
            person = PessoaModel(
                cpf=values.pop("cpf"), name=values.pop("name"), telephone=values.pop("telephone")
            )
            apply_profile(person, values, required=True)
        except ValidationError as error:
            return {"errors": error.messages}, 400
    
        db.session.add(person)
        try:
            db.session.flush()
            result = serialize_detail(person)
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            if db.session.get(PessoaModel, person.cpf) is not None:
                return {"error": "Já existe uma pessoa cadastrada com esse CPF."}, 409
            return {"error": "Um vínculo dos dados informados deixou de ser válido."}, 409
    
        return result, 201, {"Location": url_for(f"{bp.name}.find_by_cpf", cpf=result["cpf"])}


@bp.route("/<cpf>", strict_slashes=False, endpoint="find_by_cpf")
class Person(MethodView):

    @bp.doc(summary="Busca uma pessoa pelo CPF")
    @bp.alt_response(200, schema=PessoaSchema, description="Pessoa")
    @bp.alt_response(404, schema=ErroSchema, description="Não encontrada")
    def get(self, cpf: str) -> ResponseReturnValue:
        person = db.session.get(PessoaModel, cpf)
        if person is None:
            return {"error": "Pessoa não encontrada."}, 404
        return serialize_detail(person)
    
    def _update(self, cpf: str) -> ResponseReturnValue:
        partial = request.method == "PATCH"
        try:
            values = update_schema.load(request.get_json(silent=True), partial=partial)
            if not values:
                raise ValidationError({"body": ["Informe pelo menos um campo para atualizar."]})
        except ValidationError as error:
            return {"errors": error.messages}, 400
    
        person = db.session.get(PessoaModel, cpf, with_for_update=True)
        if person is None:
            return {"error": "Pessoa não encontrada."}, 404
    
        try:
            apply_profile(person, values, partial=partial)
            person.name = values.get("name", person.name)
            person.telephone = values.get("telephone", person.telephone)
            db.session.flush()
            result = serialize_detail(person)
            db.session.commit()
        except ValidationError as error:
            db.session.rollback()
            return {"errors": error.messages}, 400
        except IntegrityError:
            db.session.rollback()
            return {"error": "Um vínculo dos dados informados deixou de ser válido."}, 409
    
        return result

    @bp.doc(summary="Substitui os dados de uma pessoa")
    @bp.alt_response(200, schema=PessoaSchema, description="Atualizada")
    @bp.alt_response(400, schema=ErrosSchema, description="Dados inválidos")
    @bp.alt_response(404, schema=ErroSchema, description="Não encontrada")
    @bp.alt_response(409, schema=ErroSchema, description="Vínculo inválido")
    def put(self, cpf: str) -> ResponseReturnValue:
        return self._update(cpf)

    @bp.doc(summary="Atualiza parcialmente uma pessoa")
    @bp.alt_response(200, schema=PessoaSchema, description="Atualizada")
    @bp.alt_response(400, schema=ErrosSchema, description="Dados inválidos")
    @bp.alt_response(404, schema=ErroSchema, description="Não encontrada")
    @bp.alt_response(409, schema=ErroSchema, description="Vínculo inválido")
    def patch(self, cpf: str) -> ResponseReturnValue:
        return self._update(cpf)

    @bp.doc(summary="Remove uma pessoa")
    @bp.alt_response(204, description="Removida")
    @bp.alt_response(404, schema=ErroSchema, description="Não encontrada")
    @bp.alt_response(409, schema=ErroSchema, description="Possui registros vinculados")
    def delete(self, cpf: str) -> ResponseReturnValue:
        person = db.session.get(PessoaModel, cpf, with_for_update=True)
        if person is None:
            return {"error": "Pessoa não encontrada."}, 404
    
        db.session.delete(person)
        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            return {"error": "A pessoa possui registros vinculados."}, 409
    
        return "", 204
