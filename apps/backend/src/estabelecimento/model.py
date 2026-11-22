from sqlalchemy import CheckConstraint, String
from sqlalchemy.orm import Mapped, mapped_column

from ..conf_database import db


class Estabelecimento(db.Model):
    """Local onde as consultas acontecem (hospital, clínica, UBS, consultório...)."""

    __tablename__ = "estabelecimento"
    __table_args__ = (
        CheckConstraint(
            "tipo_atendimento IN ('publico', 'privado')",
            name="ck_estabelecimento_tipo_atendimento",
        ),
    )

    estabelecimento_id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(200))
    tipo_atendimento: Mapped[str] = mapped_column(String(10))  # publico | privado
    # endereço
    logradouro: Mapped[str] = mapped_column(String(200))
    numero: Mapped[str | None] = mapped_column(String(10))
    complemento: Mapped[str | None] = mapped_column(String(100))
    bairro: Mapped[str] = mapped_column(String(100))
    cidade: Mapped[str] = mapped_column(String(100))
    estado: Mapped[str] = mapped_column(String(2))
    cep: Mapped[str] = mapped_column(String(8))

    def __repr__(self) -> str:
        return f"Estabelecimento(id={self.estabelecimento_id!r}, nome={self.nome!r})"
