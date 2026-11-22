from .conf_database import DatabaseConfig
from .conf_swagger import SwaggerConfig

class Config(DatabaseConfig, SwaggerConfig):
    pass

class DevConfig(Config):
    DEBUG = True

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"