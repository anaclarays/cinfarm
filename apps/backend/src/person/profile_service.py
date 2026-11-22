from typing import Any

from marshmallow import ValidationError

<<<<<<< HEAD
from ..conf_database import db
=======
from ..extensions import db
from ..medicamento.model import Medication
>>>>>>> 64f075d153de0a3fa98d3ac6074fbc592ca35f3d
from .model import Person
from .profiles import (
    AllergicReaction,
    CareProvider,
    HealthCondition,
    HealthProfessional,
    Intern,
    Patient,
)
from .schema import HealthProfessionalSchema, InternSchema, PatientSchema

PROFILES = {
    "paciente": (Patient, PatientSchema()),
    "profissional_saude": (HealthProfessional, HealthProfessionalSchema()),
    "estagiario": (Intern, InternSchema()),
}


def serialize(person: Person) -> dict[str, str]:
    return {"cpf": person.cpf, "name": person.name, "telephone": person.telephone}


def serialize_detail(person: Person) -> dict[str, Any]:
    result = serialize(person)
    for key, (_, schema) in PROFILES.items():
        if (profile := getattr(person, key)) is not None:
            return {**result, key: schema.dump(profile)}
    return result


def apply_profile(
    person: Person, data: dict[str, Any], *, required: bool = False, partial: bool = False
) -> None:
    supplied = [key for key in PROFILES if key in data]
    if len(supplied) > 1 or (required and not supplied):
        raise ValidationError({"perfil": ["Informe exatamente um perfil."]})
    if not supplied:
        return

    key = supplied[0]
    if any(getattr(person, other) is not None for other in PROFILES if other != key):
        raise ValidationError({key: ["O CPF já possui outro perfil."]})

    model, schema = PROFILES[key]
    current = getattr(person, key)
    # A partial edit can omit patient fields, but submitted list entries must be complete.
    partial_fields = tuple(schema.fields) if partial and current is not None else False
    try:
        values = schema.load(data.pop(key), partial=partial_fields)
        if model is Patient:
            prepare_patient(values, current)
    except ValidationError as error:
        raise ValidationError({key: error.messages}) from error

    if current is None:
        if model in (Intern, HealthProfessional):
            values["responsavel_atendimento"] = CareProvider()
        setattr(person, key, model(**values))
        return

    for field, value in values.items():
        setattr(current, field, value)


def prepare_patient(values: dict[str, Any], patient: Patient | None) -> None:
    has_plan = values.get("possui_plano_saude", patient.possui_plano_saude if patient else None)
    provider = values.get("operadora", patient.operadora if patient else None)
    if has_plan and not provider:
        raise ValidationError({"operadora": ["Informe a operadora do plano."]})
    if not has_plan:
        if values.get("operadora") is not None:
            raise ValidationError({"operadora": ["Informe a operadora apenas se houver plano."]})
        values["operadora"] = None

    if "reacoes_alergicas" in values:
        reactions = values["reacoes_alergicas"]
        ids = {reaction["medicamento_id"] for reaction in reactions}
        existing_ids = (
            set(
                db.session.scalars(
                    db.select(Medication.medicamento_id).where(Medication.medicamento_id.in_(ids))
                )
            )
            if ids
            else set()
        )
        errors = {
            index: {"medicamento_id": ["Medicamento não encontrado."]}
            for index, reaction in enumerate(reactions)
            if reaction["medicamento_id"] not in existing_ids
        }
        if errors:
            raise ValidationError({"reacoes_alergicas": errors})
        values["reacoes_alergicas"] = [AllergicReaction(**reaction) for reaction in reactions]

    if "condicoes_saude" in values:
        values["condicoes_saude"] = [
            HealthCondition(**condition) for condition in values["condicoes_saude"]
        ]
