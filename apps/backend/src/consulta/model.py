from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from ..extensions import Base


class Consulta(Base):
    __tablename__ = "consulta"

    consulta_id: Mapped[int] = mapped_column(primary_key=True)
    responsavel_atendimento_id: Mapped[int] = mapped_column(
        ForeignKey("responsavel_atendimento.id")
    )
    estabelecimento_id: Mapped[int] = mapped_column(
        ForeignKey("estabelecimento.estabelecimento_id")
    )
    supervisor_cpf: Mapped[str | None] = mapped_column(
        ForeignKey("profissional_saude.cpf"), nullable=True
    )
