from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from ..extensions import db


class Medication(db.Model):
    __tablename__ = "medicamento"

    medicamento_id: Mapped[int] = mapped_column(primary_key=True)
    nome_medicamento: Mapped[str] = mapped_column(String(200))
