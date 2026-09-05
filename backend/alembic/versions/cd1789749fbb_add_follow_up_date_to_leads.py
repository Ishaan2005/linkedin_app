"""add_follow_up_date_to_leads

Revision ID: cd1789749fbb
Revises: 9f24355549fe
Create Date: 2026-09-04 23:25:48.079226

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cd1789749fbb'
down_revision: Union[str, Sequence[str], None] = '9f24355549fe'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('leads')]
    if 'follow_up_date' not in columns:
        with op.batch_alter_table('leads', schema=None) as batch_op:
            batch_op.add_column(sa.Column('follow_up_date', sa.Date(), nullable=True))


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('leads')]
    if 'follow_up_date' in columns:
        with op.batch_alter_table('leads', schema=None) as batch_op:
            batch_op.drop_column('follow_up_date')

