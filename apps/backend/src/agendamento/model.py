from __future__ import annotations

from datetime import date, datetime, time

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..conf_database import db


class TipoParametro(db.Model):
    __tablename__ = "tipo_parametro"

    parametro_id: Mapped[int] = mapped_column(primary_key=True)
    tipo: Mapped[str] = mapped_column(String(200))
    unidade_medida: Mapped[str] = mapped_column(String(100))
    faixa_referencia: Mapped[str] = mapped_column(String(200))


class Agendamento(db.Model):
    __tablename__ = "agendamento"

    agendamento_id: Mapped[int] = mapped_column(primary_key=True)
    paciente_cpf: Mapped[str] = mapped_column(ForeignKey("paciente.cpf"))
    profissional_saude_cpf: Mapped[str] = mapped_column(ForeignKey("profissional_saude.cpf"))
    data_hora_prevista: Mapped[datetime]
    status: Mapped[str] = mapped_column(String(50))
    observacoes: Mapped[str | None] = mapped_column(Text)

    medicoes_clinicas: Mapped[list[MedicaoClinica]] = relationship(
        cascade="all, delete-orphan", order_by="MedicaoClinica.medicao_id"
    )


class MedicaoClinica(db.Model):
    __tablename__ = "medicao_clinica"

    medicao_id: Mapped[int] = mapped_column(primary_key=True)
    agendamento_id: Mapped[int] = mapped_column(ForeignKey("agendamento.agendamento_id"))
    parametro_id: Mapped[int] = mapped_column(ForeignKey("tipo_parametro.parametro_id"))
    profissional_saude_cpf: Mapped[str] = mapped_column(ForeignKey("profissional_saude.cpf"))
    valor: Mapped[str] = mapped_column(String(200))
    data_medicao: Mapped[date]
    hora_medicao: Mapped[time]

    tipo_parametro: Mapped[TipoParametro] = relationship()
