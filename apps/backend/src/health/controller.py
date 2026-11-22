from flask.views import MethodView
from flask_smorest import Blueprint

from .schema import HealthSchema

bp = Blueprint(
    "health",
    __name__,
    url_prefix="/health",
    description="Verificação de saúde da API"
)

@bp.route("/", strict_slashes=False)
class Health(MethodView):
    @bp.response(200, HealthSchema)
    def get(self):
        """Verifica se a API está no ar."""
        return {"status": "OK"}