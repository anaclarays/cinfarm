from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from ..extensions import db

class Person(db.Model):
    __tablename__ = "person"

    cpf: Mapped[str] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    telephone: Mapped[str] = mapped_column(String(15))

    def __repr__(self) -> str:
        return f"Person(id={self.cpf!r}, name={self.name!r}, telephone={self.telephone!r})"