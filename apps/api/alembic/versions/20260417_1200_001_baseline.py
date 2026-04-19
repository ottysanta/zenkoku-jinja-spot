"""baseline: spots / user_posts / spot_submissions / checkins

Phase 0b 終了時点の現行スキーマを Alembic 管理下に置く。
既存の SQLite DB では `alembic stamp 001` で適用済みとして扱う。

Revision ID: 001
Revises:
Create Date: 2026-04-17 12:00:00

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "001"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "spots",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("address", sa.String(), nullable=True),
        sa.Column("lat", sa.Float(), nullable=False),
        sa.Column("lng", sa.Float(), nullable=False),
        sa.Column("shrine_type", sa.String(), nullable=True),
        sa.Column("deity", sa.Text(), nullable=True),
        sa.Column("benefits", sa.Text(), nullable=True),
        sa.Column("shrine_rank", sa.String(), nullable=True),
        sa.Column("founded", sa.String(), nullable=True),
        sa.Column("goshuin_available", sa.Boolean(), nullable=True),
        sa.Column("goshuin_info", sa.Text(), nullable=True),
        sa.Column("juyohin_info", sa.Text(), nullable=True),
        sa.Column("prefecture", sa.String(), nullable=True),
        sa.Column("website", sa.String(), nullable=True),
        sa.Column("external_id", sa.String(), nullable=True),
        sa.Column("source_layer", sa.String(), nullable=True),
        sa.Column("access_info", sa.Text(), nullable=True),
        sa.Column("source_url", sa.String(), nullable=True),
        sa.UniqueConstraint("external_id", name="uq_spots_external_id"),
    )
    op.create_index("ix_spots_id", "spots", ["id"])
    op.create_index("ix_spots_shrine_type", "spots", ["shrine_type"])
    op.create_index("ix_spots_shrine_rank", "spots", ["shrine_rank"])
    op.create_index("ix_spots_prefecture", "spots", ["prefecture"])
    op.create_index("ix_spots_external_id", "spots", ["external_id"])
    op.create_index("ix_spots_source_layer", "spots", ["source_layer"])

    op.create_table(
        "user_posts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("spot_id", sa.Integer(), nullable=False),
        sa.Column("image_path", sa.String(), nullable=False),
        sa.Column("media_title", sa.String(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("nickname", sa.String(), nullable=True),
        sa.Column("created_at", sa.String(), nullable=True),
    )
    op.create_index("ix_user_posts_id", "user_posts", ["id"])
    op.create_index("ix_user_posts_spot_id", "user_posts", ["spot_id"])

    op.create_table(
        "spot_submissions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("address", sa.String(), nullable=True),
        sa.Column("shrine_type", sa.String(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("image_path", sa.String(), nullable=True),
        sa.Column("nickname", sa.String(), nullable=True),
        sa.Column("created_at", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=True, server_default="pending"),
    )
    op.create_index("ix_spot_submissions_id", "spot_submissions", ["id"])

    op.create_table(
        "checkins",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("spot_id", sa.Integer(), nullable=False),
        sa.Column("client_id", sa.String(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("lat", sa.Float(), nullable=False),
        sa.Column("lng", sa.Float(), nullable=False),
        sa.Column("accuracy_m", sa.Float(), nullable=True),
        sa.Column("distance_m", sa.Float(), nullable=False),
        sa.Column("wish_type", sa.String(), nullable=True),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("nickname", sa.String(), nullable=True),
        sa.Column("created_at", sa.String(), nullable=False),
    )
    op.create_index("ix_checkins_id", "checkins", ["id"])
    op.create_index("ix_checkins_spot_id", "checkins", ["spot_id"])
    op.create_index("ix_checkins_client_id", "checkins", ["client_id"])
    op.create_index("ix_checkins_user_id", "checkins", ["user_id"])
    op.create_index("ix_checkins_created_at", "checkins", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_checkins_created_at", table_name="checkins")
    op.drop_index("ix_checkins_user_id", table_name="checkins")
    op.drop_index("ix_checkins_client_id", table_name="checkins")
    op.drop_index("ix_checkins_spot_id", table_name="checkins")
    op.drop_index("ix_checkins_id", table_name="checkins")
    op.drop_table("checkins")

    op.drop_index("ix_spot_submissions_id", table_name="spot_submissions")
    op.drop_table("spot_submissions")

    op.drop_index("ix_user_posts_spot_id", table_name="user_posts")
    op.drop_index("ix_user_posts_id", table_name="user_posts")
    op.drop_table("user_posts")

    op.drop_index("ix_spots_source_layer", table_name="spots")
    op.drop_index("ix_spots_external_id", table_name="spots")
    op.drop_index("ix_spots_prefecture", table_name="spots")
    op.drop_index("ix_spots_shrine_rank", table_name="spots")
    op.drop_index("ix_spots_shrine_type", table_name="spots")
    op.drop_index("ix_spots_id", table_name="spots")
    op.drop_table("spots")
