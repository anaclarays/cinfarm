import os

class Config:
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", "postgresql+psycopg://USUARIO:SENHA@database:5432/db_cinfarm"
    )

class TestConfig(Config):
    SQLALCHEMY_DATABASE_URI = "postgresql+psycopg://USUARIO:SENHA@database:5432/db_cinfarm"
    TESTING = True
