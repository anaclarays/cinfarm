from flask import Blueprint, request, url_for
from flask.typing import ResponseReturnValue
from sqlalchemy.exc import IntegrityError

from ..extensions import db
from .model import Person

bp = Blueprint("person", __name__, url_prefix="/person")

PERSON_FIELDS = {"name": 200, "telephone": 15}


def serialize(person: Person) -> dict[str, str]:
    return {"cpf": person.cpf, "name": person.name, "telephone": person.telephone}


def read_person_fields(
    *, create: bool = False, partial: bool = False
) -> tuple[dict[str, str], dict[str, str]]:
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict) or not payload:
        return {}, {"body": "Envie um objeto JSON com os dados da pessoa."}

    fields = {"cpf": 11, **PERSON_FIELDS} if create else PERSON_FIELDS
    errors = {key: "Campo não permitido." for key in payload if key not in fields}
    values = {}
    for field, max_length in fields.items():
        if partial and field not in payload:
            continue

        value = payload.get(field)
        if not isinstance(value, str) or not value.strip() or "\0" in value:
            errors[field] = "Informe um texto não vazio e válido."
        elif field == "cpf" and not (len(value) == 11 and value.isascii() and value.isdigit()):
            errors[field] = "Informe o CPF com 11 dígitos, sem pontuação."
        elif len(value) > max_length:
            errors[field] = f"Use no máximo {max_length} caracteres."
        else:
            values[field] = value

    return values, errors


@bp.get("/", strict_slashes=False)
def find_all() -> ResponseReturnValue:
    people = db.session.scalars(db.select(Person).order_by(Person.cpf))
    return {"All people": [serialize(person) for person in people]}


@bp.get("/<cpf>")
def find_by_cpf(cpf: str) -> ResponseReturnValue:
    person = db.session.get(Person, cpf)
    if person is None:
        return {"error": "Pessoa não encontrada."}, 404

    return serialize(person)


@bp.post("/", strict_slashes=False)
def create() -> ResponseReturnValue:
    values, errors = read_person_fields(create=True)
    if errors:
        return {"errors": errors}, 400

    person = Person(cpf=values["cpf"], name=values["name"], telephone=values["telephone"])
    db.session.add(person)
    result = serialize(person)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return {"error": "Já existe uma pessoa cadastrada com esse CPF."}, 409

    return result, 201, {"Location": url_for("person.find_by_cpf", cpf=result["cpf"])}


@bp.route("/<cpf>", methods=["PUT", "PATCH"])
def update(cpf: str) -> ResponseReturnValue:
    values, errors = read_person_fields(partial=request.method == "PATCH")
    if errors:
        return {"errors": errors}, 400

    person = db.session.get(Person, cpf, with_for_update=True)
    if person is None:
        return {"error": "Pessoa não encontrada."}, 404

    person.name = values.get("name", person.name)
    person.telephone = values.get("telephone", person.telephone)
    result = serialize(person)
    db.session.commit()
    return result


@bp.delete("/<cpf>")
def delete(cpf: str) -> ResponseReturnValue:
    person = db.session.get(Person, cpf, with_for_update=True)
    if person is None:
        return {"error": "Pessoa não encontrada."}, 404

    db.session.delete(person)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return {"error": "A pessoa possui registros vinculados."}, 409

    return "", 204
