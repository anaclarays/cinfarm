"""cria tabela consulta

Revision ID: a6b7c8d9e0f1
Revises: c4f8a2b1d9e3
Create Date: 2026-11-19 18:00:00.000000
"""

import sqlalchemy as sa
from alembic import op

revision = "a6b7c8d9e0f1"
down_revision = "c4f8a2b1d9e3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "consulta",
        sa.Column("consulta_id", sa.Integer(), nullable=False),
        sa.Column("responsavel_atendimento_id", sa.Integer(), nullable=False),
        sa.Column("estabelecimento_id", sa.Integer(), nullable=False),
        sa.Column("supervisor_cpf", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(
            ["responsavel_atendimento_id"], ["responsavel_atendimento.id"]
        ),
        sa.ForeignKeyConstraint(
            ["estabelecimento_id"], ["estabelecimento.estabelecimento_id"]
        ),
        sa.ForeignKeyConstraint(["supervisor_cpf"], ["profissional_saude.cpf"]),
        sa.PrimaryKeyConstraint("consulta_id"),
    )


def downgrade() -> None:
    op.drop_table("consulta")
