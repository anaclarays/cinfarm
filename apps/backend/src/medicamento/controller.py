from flask import request
from flask_smorest import Blueprint
from flask.typing import ResponseReturnValue
from flask.views import MethodView
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError

from ..conf_database import db
from .model import MedicamentoModel
from .schema import (
    MedicamentoSchema,
    MedicamentoListaSchema,
    ErroSchema,
    ErrosSchema
)

bp = Blueprint(
    "medicamento", 
    __name__, 
    url_prefix="/medicamento",
    description="Rota de medicamentos"
)

medication_schema = MedicamentoSchema()

@bp.route("/", strict_slashes=False)
class MedicationList(MethodView):

    @bp.doc(summary="Lista medicamentos")
    @bp.alt_response(200, schema=MedicamentoListaSchema, description="Lista de medicamentos")
    def get(self) -> ResponseReturnValue:
        medications = db.session.scalars(db.select(MedicamentoModel).order_by(MedicamentoModel.medicamento_id))
        return {"medicamentos": medication_schema.dump(medications, many=True)}
    
    
    @bp.doc(summary="Cria um medicamento")
    @bp.alt_response(201, schema=MedicamentoSchema, description="Medicamento criado")
    @bp.alt_response(400, schema=ErrosSchema, description="Dados inválidos")
    def post(self) -> ResponseReturnValue:
        try:
            values = medication_schema.load(request.get_json(silent=True))
        except ValidationError as error:
            return {"errors": error.messages}, 400
    
        medication = MedicamentoModel(**values)
        db.session.add(medication)
        db.session.flush()
        result = medication_schema.dump(medication)
        db.session.commit()
        return result, 201

@bp.route("/<int:medicamento_id>", strict_slashes=False)
class Medication(MethodView):

    @bp.doc(summary="Busca um medicamento pelo ID")
    @bp.alt_response(200, schema=MedicamentoSchema, description="Medicamento")
    @bp.alt_response(404, schema=ErroSchema, description="Não encontrado")
    def get(self, medicamento_id: int) -> ResponseReturnValue:
        medication = db.session.get(MedicamentoModel, medicamento_id)
        if medication is None:
            return {"error": "Medicamento não encontrado."}, 404
        return medication_schema.dump(medication)
    
    
    def _update(self, medicamento_id: int) -> ResponseReturnValue:
        medication = db.session.get(MedicamentoModel, medicamento_id)
        if medication is None:
            return {"error": "Medicamento não encontrado."}, 404
    
        try:
            values = medication_schema.load(request.get_json(silent=True))
        except ValidationError as error:
            return {"errors": error.messages}, 400
    
        medication.nome_medicamento = values["nome_medicamento"]
        db.session.commit()
        return medication_schema.dump(medication)
    
    @bp.doc(summary="Atualiza um medicamento")
    @bp.alt_response(200, schema=MedicamentoSchema, description="Atualizado")
    @bp.alt_response(400, schema=ErrosSchema, description="Dados inválidos")
    @bp.alt_response(404, schema=ErroSchema, description="Não encontrado")
    def put(self, medicamento_id: int) -> ResponseReturnValue:
        return self._update(medicamento_id)

    @bp.doc(summary="Remove um medicamento")
    @bp.alt_response(204, description="Removido")
    @bp.alt_response(404, schema=ErroSchema, description="Não encontrado")
    @bp.alt_response(409, schema=ErroSchema, description="Possui registros vinculados")
    def delete(self, medicamento_id: int) -> ResponseReturnValue:
        medication = db.session.get(MedicamentoModel, medicamento_id)
        if medication is None:
            return {"error": "Medicamento não encontrado."}, 404
    
        db.session.delete(medication)
        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            return {"error": "O medicamento possui registros vinculados."}, 409
    
        return "", 204
