import os
from sqlalchemy.engine import URL

def build_database_uri(database: str | None = None) -> URL:
    return URL.create(
        "postgresql+psycopg",
        username=os.environ["POSTGRES_USER"],
        password=os.environ["POSTGRES_PASSWORD"],
        host=os.environ.get("POSTGRES_HOST", "database"),
        port=int(os.environ.get("POSTGRES_PORT", 5432)),
        database=database or os.environ["POSTGRES_DB"],
    )

class Config:
    SQLALCHEMY_DATABASE_URI = build_database_uri()

class TestConfig(Config):
    SQLALCHEMY_DATABASE_URI = build_database_uri(
        os.environ.get("POSTGRES_TEST_DB", "db_cinfarm_test")
    )
    TESTING = True
