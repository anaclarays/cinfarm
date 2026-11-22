from flask import Blueprint, request
from flask.typing import ResponseReturnValue
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError

from ..conf_database import db
from .model import Medication
from .schema import MedicationSchema

bp = Blueprint("medication", __name__, url_prefix="/medication")

medication_schema = MedicationSchema()


@bp.get("/", strict_slashes=False)
def list_medications() -> ResponseReturnValue:
    medications = db.session.scalars(db.select(Medication).order_by(Medication.medicamento_id))
    return {"medicamentos": medication_schema.dump(medications, many=True)}


@bp.post("/", strict_slashes=False)
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


@bp.get("/<int:medicamento_id>", strict_slashes=False)
def get_medication(medicamento_id: int) -> ResponseReturnValue:
    medication = db.session.get(Medication, medicamento_id)
    if medication is None:
        return {"error": "Medicamento não encontrado."}, 404
    return medication_schema.dump(medication)


@bp.put("/<int:medicamento_id>", strict_slashes=False)
def update_medication(medicamento_id: int) -> ResponseReturnValue:
    medication = db.session.get(Medication, medicamento_id)
    if medication is None:
        return {"error": "Medicamento não encontrado."}, 404

    try:
        values = medication_schema.load(request.get_json(silent=True))
    except ValidationError as error:
        return {"errors": error.messages}, 400

    medication.nome_medicamento = values["nome_medicamento"]
    db.session.commit()
    return medication_schema.dump(medication)


@bp.delete("/<int:medicamento_id>", strict_slashes=False)
def delete_medication(medicamento_id: int) -> ResponseReturnValue:
    medication = db.session.get(Medication, medicamento_id)
    if medication is None:
        return {"error": "Medicamento não encontrado."}, 404

    db.session.delete(medication)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return {"error": "O medicamento possui registros vinculados."}, 409

    return "", 204
