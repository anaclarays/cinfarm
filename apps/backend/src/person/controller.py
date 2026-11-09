from flask import Blueprint

bp = Blueprint("person", __name__, url_prefix="/person")

@bp.get("/")
def find_all():
    return {"All people": []}

@bp.get("/<int:person_id>")
def findById(id):
    return {"id": id}