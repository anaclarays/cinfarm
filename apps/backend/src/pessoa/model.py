from __future__ import annotations

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..conf_database import db
from .profiles import HealthProfessional, Intern, Patient


class PessoaModel(db.Model):
    __tablename__ = "person"

    cpf: Mapped[str] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    telephone: Mapped[str] = mapped_column(String(15))

    paciente: Mapped[Patient | None] = relationship(cascade="all, delete-orphan")
    profissional_saude: Mapped[HealthProfessional | None] = relationship(
        cascade="all, delete-orphan"
    )
    estagiario: Mapped[Intern | None] = relationship(cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"PessoaModel(id={self.cpf!r}, name={self.name!r}, telephone={self.telephone!r})"
