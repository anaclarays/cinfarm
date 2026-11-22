from flask import Blueprint, request, url_for
from flask.typing import ResponseReturnValue
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError

from ..conf_database import db
from .model import Person
from .profile_service import apply_profile, serialize, serialize_detail
from .profiles import Medication
from .schema import MedicationSchema, PersonSchema

bp = Blueprint("person", __name__, url_prefix="/person")
medication_bp = Blueprint("medication", __name__, url_prefix="/medication")

create_schema = PersonSchema()
update_schema = PersonSchema(exclude=("cpf",))
medication_schema = MedicationSchema()


@bp.get("/", strict_slashes=False)
def find_all() -> ResponseReturnValue:
    people = db.session.scalars(db.select(Person).order_by(Person.cpf))
    return {"All people": [serialize(person) for person in people]}


@bp.get("/<cpf>")
def find_by_cpf(cpf: str) -> ResponseReturnValue:
    person = db.session.get(Person, cpf)
    if person is None:
        return {"error": "Pessoa não encontrada."}, 404
    return serialize_detail(person)


@bp.post("/", strict_slashes=False)
def create() -> ResponseReturnValue:
    try:
        values = create_schema.load(request.get_json(silent=True))
        person = Person(
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
        if db.session.get(Person, person.cpf) is not None:
            return {"error": "Já existe uma pessoa cadastrada com esse CPF."}, 409
        return {"error": "Um vínculo dos dados informados deixou de ser válido."}, 409

    return result, 201, {"Location": url_for("person.find_by_cpf", cpf=result["cpf"])}


@bp.route("/<cpf>", methods=["PUT", "PATCH"])
def update(cpf: str) -> ResponseReturnValue:
    partial = request.method == "PATCH"
    try:
        values = update_schema.load(request.get_json(silent=True), partial=partial)
        if not values:
            raise ValidationError({"body": ["Informe pelo menos um campo para atualizar."]})
    except ValidationError as error:
        return {"errors": error.messages}, 400

    person = db.session.get(Person, cpf, with_for_update=True)
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


@medication_bp.get("/", strict_slashes=False)
def list_medications() -> ResponseReturnValue:
    medications = db.session.scalars(db.select(Medication).order_by(Medication.medicamento_id))
    return {"medicamentos": medication_schema.dump(medications, many=True)}


@medication_bp.post("/", strict_slashes=False)
def create_medication() -> ResponseReturnValue:
    try:
        values = medication_schema.load(request.get_json(silent=True))
    except ValidationError as error:
        return {"errors": error.messages}, 400

    medication = Medication(**values)
    db.session.add(medication)
    db.session.flush()
    result = medication_schema.dump(medication)
    db.session.commit()
    return result, 201
