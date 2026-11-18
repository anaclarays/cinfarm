"""cria tabelas agendamento, medicao_clinica e tipo_parametro

Revision ID: c4f8a2b1d9e3
Revises: 18e23774d911, 597b2c548f8b
Create Date: 2026-11-18 18:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "c4f8a2b1d9e3"
down_revision = ("18e23774d911", "597b2c548f8b")
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "tipo_parametro",
        sa.Column("parametro_id", sa.Integer(), nullable=False),
        sa.Column("tipo", sa.String(length=200), nullable=False),
        sa.Column("unidade_medida", sa.String(length=100), nullable=False),
        sa.Column("faixa_referencia", sa.String(length=200), nullable=False),
        sa.PrimaryKeyConstraint("parametro_id"),
    )
    op.create_table(
        "agendamento",
        sa.Column("agendamento_id", sa.Integer(), nullable=False),
        sa.Column("paciente_cpf", sa.String(), nullable=False),
        sa.Column("profissional_saude_cpf", sa.String(), nullable=False),
        sa.Column("data_hora_prevista", sa.DateTime(), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("observacoes", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["paciente_cpf"], ["paciente.cpf"]),
        sa.ForeignKeyConstraint(["profissional_saude_cpf"], ["profissional_saude.cpf"]),
        sa.PrimaryKeyConstraint("agendamento_id"),
    )
    op.create_table(
        "medicao_clinica",
        sa.Column("medicao_id", sa.Integer(), nullable=False),
        sa.Column("agendamento_id", sa.Integer(), nullable=False),
        sa.Column("parametro_id", sa.Integer(), nullable=False),
        sa.Column("profissional_saude_cpf", sa.String(), nullable=False),
        sa.Column("valor", sa.String(length=200), nullable=False),
        sa.Column("data_medicao", sa.Date(), nullable=False),
        sa.Column("hora_medicao", sa.Time(), nullable=False),
        sa.ForeignKeyConstraint(["agendamento_id"], ["agendamento.agendamento_id"]),
        sa.ForeignKeyConstraint(["parametro_id"], ["tipo_parametro.parametro_id"]),
        sa.ForeignKeyConstraint(["profissional_saude_cpf"], ["profissional_saude.cpf"]),
        sa.PrimaryKeyConstraint("medicao_id"),
    )


def downgrade() -> None:
    op.drop_table("medicao_clinica")
    op.drop_table("agendamento")
    op.drop_table("tipo_parametro")
