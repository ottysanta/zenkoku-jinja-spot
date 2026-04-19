"""campaign_contributions.offering_id に UNIQUE を付与

Stripe Webhook の重複配信で CampaignContribution が二重計上される問題への対策。

Revision ID: 007
Revises: 006
Create Date: 2026-04-17 13:00:00

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op


revision: str = "007"
down_revision: Union[str, Sequence[str], None] = "006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("campaign_contributions") as batch:
        batch.create_unique_constraint(
            "uq_campaign_contrib_offering",
            ["offering_id"],
        )


def downgrade() -> None:
    with op.batch_alter_table("campaign_contributions") as batch:
        batch.drop_constraint("uq_campaign_contrib_offering", type_="unique")
