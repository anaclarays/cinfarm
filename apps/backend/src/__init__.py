from flask import Flask
from .extensions import db, migrate

def create_app(config_object="src.config.Config"):
    app = Flask(__name__)
    app.config.from_object(config_object)

    db.init_app(app)
    migrate.init_app(app, db)

    from .app_module import app_module
    from .core import register_module
    register_module(app, app_module)
            
    return app