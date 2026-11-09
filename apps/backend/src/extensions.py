from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy  import MetaData
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    metadata = MetaData()

db = SQLAlchemy(model_class=Base)
migrate = Migrate()