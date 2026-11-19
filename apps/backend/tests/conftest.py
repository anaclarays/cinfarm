import os
from collections.abc import Iterator

import pytest
from flask.testing import FlaskClient
from sqlalchemy.engine import make_url
from sqlalchemy.pool import StaticPool

# Por padrão os testes usam SQLite em memória (não precisam do Docker/PostgreSQL).
# Para testar no PostgreSQL: TEST_DATABASE_URL=postgresql+psycopg://user:senha@host/db_teste
TEST_URL = os.environ.get("TEST_DATABASE_URL", "sqlite://")
TEST_DATABASE = make_url(TEST_URL)
if (
    TEST_DATABASE.drivername.startswith("postgres")
    and TEST_DATABASE.database != "db_cinfarm_test"
):
    raise RuntimeError(
        "TEST_DATABASE_URL deve apontar para o banco isolado db_cinfarm_test; "
        "a suíte apaga e recria as tabelas durante os testes."
    )


class TestConfig:
    TESTING = True
    SQLALCHEMY_DATABASE_URI = TEST_URL
    if TEST_URL.startswith("sqlite"):
        SQLALCHEMY_ENGINE_OPTIONS = {
            "poolclass": StaticPool,
            "connect_args": {"check_same_thread": False},
        }


@pytest.fixture()
def client() -> Iterator[FlaskClient]:
    from src import create_app
    from src.extensions import db

    app = create_app(TestConfig)
    with app.app_context():
        db.drop_all()
        db.create_all()
        yield app.test_client()
        db.session.remove()
        db.drop_all()
