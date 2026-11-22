from flask import Flask
from .conf_database import db, migrate
from .conf_swagger import api, build_swagger


def create_app(config_object="src.conf_flask.Config"):
    app = Flask(__name__)
    app.config.from_object(config_object)
    
    db.init_app(app)
    migrate.init_app(app, db)
    build_swagger(app)
    
    from .app_module import app_module
    from .core import register_module
    register_module(app, app_module)
            
    return app