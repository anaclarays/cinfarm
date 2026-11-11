from flask import Blueprint

bp = Blueprint("health", __name__, url_prefix="/health")

@bp.get("/")
def health():
    return { "status" : "OK"}