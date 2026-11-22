from flask import Flask
from .conf_database import db, migrate
from .conf_swagger import api, build_swagger
from .core import register_module
from .app_module import app_module


def create_app(config_object="src.conf_flask.Config"):
    app = Flask(__name__)
    app.config.from_object(config_object)
    
    db.init_app(app)
    migrate.init_app(app, db)
    build_swagger(app)
    
    register_module(api, app_module)
            
    return app