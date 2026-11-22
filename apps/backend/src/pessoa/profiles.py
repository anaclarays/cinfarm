from __future__ import annotations

from datetime import date
from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..conf_database import db


class CareProvider(db.Model):
    __tablename__ = "responsavel_atendimento"

    id: Mapped[int] = mapped_column(primary_key=True)


class Intern(db.Model):
    __tablename__ = "estagiario"

    cpf: Mapped[str] = mapped_column(ForeignKey("person.cpf", ondelete="CASCADE"), primary_key=True)
    curso: Mapped[str] = mapped_column(String(200))
    instituicao_ensino: Mapped[str] = mapped_column(String(200))
    responsavel_atendimento_id: Mapped[int] = mapped_column(
        ForeignKey("responsavel_atendimento.id"), unique=True
    )
    responsavel_atendimento: Mapped[CareProvider] = relationship(
        cascade="all, delete-orphan", single_parent=True
    )


class HealthProfessional(db.Model):
    __tablename__ = "profissional_saude"

    cpf: Mapped[str] = mapped_column(ForeignKey("person.cpf", ondelete="CASCADE"), primary_key=True)
    instituicao_vinculo: Mapped[str] = mapped_column(String(200))
    especialidade: Mapped[str] = mapped_column(String(200))
    conselho: Mapped[str] = mapped_column(String(100))
    numero_registro: Mapped[str] = mapped_column(String(50))
    responsavel_atendimento_id: Mapped[int] = mapped_column(
        ForeignKey("responsavel_atendimento.id"), unique=True
    )
    responsavel_atendimento: Mapped[CareProvider] = relationship(
        cascade="all, delete-orphan", single_parent=True
    )


class Patient(db.Model):
    __tablename__ = "paciente"

    cpf: Mapped[str] = mapped_column(ForeignKey("person.cpf", ondelete="CASCADE"), primary_key=True)
    rg: Mapped[str] = mapped_column(String(30))
    cartao_sus: Mapped[str] = mapped_column(String(15))
    data_nascimento: Mapped[date]
    sexo_bio: Mapped[str] = mapped_column(String(50))
    genero: Mapped[str | None] = mapped_column(String(100))
    escolaridade: Mapped[str | None] = mapped_column(String(100))
    email: Mapped[str | None] = mapped_column(String(254))
    telefone_contato: Mapped[str] = mapped_column(String(15))
    raca_cor: Mapped[str] = mapped_column(String(100))
    estado_civil: Mapped[str] = mapped_column(String(100))
    ocupacao: Mapped[str] = mapped_column(String(200))
    renda: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    cep: Mapped[str] = mapped_column(String(9))
    logradouro: Mapped[str] = mapped_column(String(200))
    estado: Mapped[str] = mapped_column(String(50))
    cidade: Mapped[str] = mapped_column(String(100))
    bairro: Mapped[str] = mapped_column(String(100))
    numero: Mapped[str] = mapped_column(String(30))
    complemento: Mapped[str | None] = mapped_column(String(200))
    nome_contato_emergencia: Mapped[str] = mapped_column(String(200))
    telefone_contato_emergencia: Mapped[str] = mapped_column(String(15))
    relacao_emergencia: Mapped[str] = mapped_column(String(100))
    possui_plano_saude: Mapped[bool]
    operadora: Mapped[str | None] = mapped_column(String(200))

    condicoes_saude: Mapped[list[HealthCondition]] = relationship(
        cascade="all, delete-orphan", order_by="HealthCondition.id"
    )
    reacoes_alergicas: Mapped[list[AllergicReaction]] = relationship(
        cascade="all, delete-orphan", order_by="AllergicReaction.id"
    )

    @property
    def idade(self) -> int:
        today = date.today()
        birth = self.data_nascimento
        return today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day))


class HealthCondition(db.Model):
    __tablename__ = "condicao_saude"

    id: Mapped[int] = mapped_column("condicao_id", primary_key=True)
    paciente_cpf: Mapped[str] = mapped_column(
        ForeignKey("paciente.cpf", ondelete="CASCADE"), index=True
    )
    nome: Mapped[str] = mapped_column(String(200))
    tipo: Mapped[str] = mapped_column(String(100))
    data_inicio: Mapped[date]


class AllergicReaction(db.Model):
    __tablename__ = "reacao_alergica"

    id: Mapped[int] = mapped_column("reacao_alergica_id", primary_key=True)
    paciente_cpf: Mapped[str] = mapped_column(
        ForeignKey("paciente.cpf", ondelete="CASCADE"), index=True
    )
    medicamento_id: Mapped[int] = mapped_column(
        ForeignKey("medicamento.medicamento_id"), index=True
    )
    descricao: Mapped[str] = mapped_column(Text)
    data_ocorrencia: Mapped[date]
