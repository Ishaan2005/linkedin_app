"""initial_leads

Revision ID: 9f24355549fe
Revises: 
Create Date: 2026-09-04 23:25:40.718276

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9f24355549fe'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    if 'leads' not in tables:
        op.create_table(
            'leads',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('name', sa.String(), nullable=False),
            sa.Column('title', sa.String(), nullable=True),
            sa.Column('company', sa.String(), nullable=True),
            sa.Column('location', sa.String(), nullable=True),
            sa.Column('linkedin_url', sa.String(), nullable=True),
            sa.Column('relevance_score', sa.Float(), nullable=True),
            sa.Column('status', sa.String(), nullable=True),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('linkedin_url'),
        )
        op.create_index(op.f('ix_leads_id'), 'leads', ['id'], unique=False)


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    if 'leads' in tables:
        op.drop_index(op.f('ix_leads_id'), table_name='leads')
        op.drop_table('leads')

