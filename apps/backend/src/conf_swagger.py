from flask import Flask
from flask_smorest import Api

class SwaggerConfig:
    API_TITLE = "cinfarm-api"
    API_VERSION = "v1"
    OPENAPI_VERSION = "3.0.3"
    OPENAPI_URL_PREFIX = "/api"
    OPENAPI_SWAGGER_UI_PATH = "/docs"
    OPENAPI_SWAGGER_UI_URL = "https://cdn.jsdelivr.net/npm/swagger-ui-dist/"

api = Api()

def build_swagger (app: Flask) -> None:
    app.config.from_object(SwaggerConfig)
    api.init_app(app)

    api.spec.components.security_scheme(
        "bearerAuth",
        {"type": "http", "scheme": "bearer", "bearerFormat": "JWT"},
    )