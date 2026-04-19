"""Multi-source shrine data schema.

ユーザー方針（複数ソース統合・継続更新・鮮度管理）を満たすための正規化スキーマ。

既存 `spots` テーブルは canonical 神社マスタとして残す（FK 関係の影響を避ける）。
周辺に以下を追加:
  - shrine_source_records: ソース別の raw レコード (OSM/Wikidata/MLIT/GSI/Places/Bunka/Manual/Jinjacho)
  - shrine_metadata: 運用メタ情報（巡検・写真方針・検証日など）
  - shrine_translations: 多言語翻訳
  - source_imports: バッチ履歴
  - pending_merges: 曖昧マージ候補（人手レビュー対象）
  - stats_references: 文化庁など統計値の参考表示用

spots に canonical 運用カラムも追加:
  - canonical_name, primary_source, confidence_score, official_status,
    published_status, last_synced_at, data_freshness_status

Revision ID: 008
Revises: 007
Create Date: 2026-04-17 13:10:00
"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "008"
down_revision: Union[str, Sequence[str], None] = "007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- spots に canonical 運用カラムを追加 ---
    with op.batch_alter_table("spots") as batch:
        batch.add_column(sa.Column("canonical_name", sa.String(), nullable=True))
        batch.add_column(sa.Column("primary_source", sa.String(), nullable=True))
        batch.add_column(sa.Column("confidence_score", sa.Integer(), nullable=True))
        batch.add_column(sa.Column("official_status", sa.String(), nullable=True))
        batch.add_column(sa.Column("published_status", sa.String(), nullable=False, server_default="published"))
        batch.add_column(sa.Column("last_synced_at", sa.String(), nullable=True))
        batch.add_column(sa.Column("data_freshness_status", sa.String(), nullable=True))

    # 既存データの backfill
    op.execute("UPDATE spots SET canonical_name = name WHERE canonical_name IS NULL")
    op.execute("UPDATE spots SET primary_source = source_layer WHERE primary_source IS NULL")
    op.execute("UPDATE spots SET confidence_score = 60 WHERE primary_source = 'manual' AND confidence_score IS NULL")
    op.execute("UPDATE spots SET confidence_score = 50 WHERE primary_source IN ('wikidata','wikipedia') AND confidence_score IS NULL")
    op.execute("UPDATE spots SET confidence_score = 40 WHERE confidence_score IS NULL")
    op.execute("""
        UPDATE spots SET official_status =
          CASE
            WHEN primary_source = 'manual' THEN 'registered_ranked'
            WHEN shrine_rank IS NOT NULL AND shrine_rank != '' THEN 'registered_ranked'
            WHEN primary_source IN ('wikidata', 'wikipedia') THEN 'registered_religious_corp'
            ELSE 'unknown'
          END
        WHERE official_status IS NULL
    """)
    op.execute("UPDATE spots SET data_freshness_status = 'stale' WHERE data_freshness_status IS NULL")

    op.create_index("ix_spots_primary_source", "spots", ["primary_source"])
    op.create_index("ix_spots_published_status", "spots", ["published_status"])
    op.create_index("ix_spots_data_freshness", "spots", ["data_freshness_status"])

    # --- shrine_source_records ---
    op.create_table(
        "shrine_source_records",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("shrine_id", sa.Integer(), sa.ForeignKey("spots.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("source_type", sa.String(), nullable=False, index=True),
        sa.Column("source_object_id", sa.String(), nullable=True, index=True),
        sa.Column("source_name", sa.String(), nullable=True),
        sa.Column("source_address", sa.String(), nullable=True),
        sa.Column("source_lat", sa.Float(), nullable=True),
        sa.Column("source_lng", sa.Float(), nullable=True),
        sa.Column("source_url", sa.String(), nullable=True),
        sa.Column("fetched_at", sa.String(), nullable=True),
        sa.Column("raw_payload_json", sa.Text(), nullable=True),
        sa.Column("match_status", sa.String(), nullable=False, server_default="matched"),
        sa.Column("match_score", sa.Float(), nullable=True),
        sa.UniqueConstraint("source_type", "source_object_id", name="uq_ssr_source_type_obj"),
    )
    op.create_index("ix_ssr_source_type", "shrine_source_records", ["source_type"])
    op.create_index("ix_ssr_match_status", "shrine_source_records", ["match_status"])

    # 既存 spots を shrine_source_records に backfill
    # 既存 external_id = "osm:node/XXX" / "wd:QXXX" / "manual:xxx" から source_type を推測
    op.execute("""
        INSERT INTO shrine_source_records
          (shrine_id, source_type, source_object_id, source_name,
           source_address, source_lat, source_lng, source_url,
           fetched_at, match_status, match_score)
        SELECT
          id,
          COALESCE(source_layer, 'unknown'),
          external_id,
          name,
          address,
          lat, lng,
          source_url,
          datetime('now'),
          'matched',
          1.0
        FROM spots
        WHERE external_id IS NOT NULL
    """)

    # --- shrine_metadata ---
    op.create_table(
        "shrine_metadata",
        sa.Column("shrine_id", sa.Integer(), sa.ForeignKey("spots.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("goshuin_supported", sa.Boolean(), nullable=True),
        sa.Column("parking", sa.String(), nullable=True),
        sa.Column("barrier_free", sa.Boolean(), nullable=True),
        sa.Column("foreign_language_support", sa.String(), nullable=True),
        sa.Column("opening_hours_note", sa.Text(), nullable=True),
        sa.Column("access_note", sa.Text(), nullable=True),
        sa.Column("photography_policy", sa.String(), nullable=True),
        sa.Column("last_verified_at", sa.String(), nullable=True),
        sa.Column("verification_method", sa.String(), nullable=True),
    )
    # 既存 spots.goshuin_available を shrine_metadata に流し込み
    op.execute("""
        INSERT INTO shrine_metadata (shrine_id, goshuin_supported, opening_hours_note, access_note)
        SELECT id, goshuin_available, goshuin_info, access_info FROM spots
    """)

    # --- shrine_translations ---
    op.create_table(
        "shrine_translations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("shrine_id", sa.Integer(), sa.ForeignKey("spots.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("language_code", sa.String(), nullable=False, index=True),
        sa.Column("translated_name", sa.String(), nullable=True),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("access_guide", sa.Text(), nullable=True),
        sa.Column("etiquette_guide", sa.Text(), nullable=True),
        sa.Column("updated_at", sa.String(), nullable=True),
        sa.UniqueConstraint("shrine_id", "language_code", name="uq_shrine_translations_lang"),
    )

    # --- source_imports ---
    op.create_table(
        "source_imports",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("source_type", sa.String(), nullable=False, index=True),
        sa.Column("started_at", sa.String(), nullable=False),
        sa.Column("finished_at", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=False, server_default="running"),  # running/completed/failed/cancelled
        sa.Column("inserted", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("updated", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("skipped", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("failed", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("metadata_json", sa.Text(), nullable=True),
        sa.Column("triggered_by", sa.String(), nullable=True),  # cron / manual / admin_user_id
    )
    op.create_index("ix_source_imports_started", "source_imports", ["started_at"])

    # --- pending_merges ---
    op.create_table(
        "pending_merges",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("primary_shrine_id", sa.Integer(), sa.ForeignKey("spots.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("candidate_shrine_id", sa.Integer(), sa.ForeignKey("spots.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("match_score", sa.Float(), nullable=False),
        sa.Column("match_reasons", sa.Text(), nullable=True),  # JSON: {"coord_dist_m": 23, "name_sim": 0.92, ...}
        sa.Column("status", sa.String(), nullable=False, server_default="pending"),  # pending/approved/rejected
        sa.Column("reviewer_user_id", sa.Integer(), nullable=True),
        sa.Column("reviewed_at", sa.String(), nullable=True),
        sa.Column("created_at", sa.String(), nullable=False),
        sa.UniqueConstraint("primary_shrine_id", "candidate_shrine_id", name="uq_pending_merges_pair"),
    )
    op.create_index("ix_pending_merges_status", "pending_merges", ["status"])

    # --- stats_references (文化庁年鑑などの参考値) ---
    op.create_table(
        "stats_references",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("source_name", sa.String(), nullable=False),  # "文化庁 宗教年鑑" 等
        sa.Column("source_url", sa.String(), nullable=True),
        sa.Column("reference_year", sa.Integer(), nullable=False),  # 2022
        sa.Column("reference_as_of", sa.String(), nullable=True),  # "2022-12-31" (対象時点)
        sa.Column("metric_key", sa.String(), nullable=False),  # "registered_shinto_shrines"
        sa.Column("metric_value", sa.Integer(), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),  # "宗教法人登録のみ・実在数とは異なる場合あり"
        sa.Column("published_at", sa.String(), nullable=True),
        sa.UniqueConstraint("source_name", "reference_year", "metric_key", name="uq_stats_refs"),
    )

    # 文化庁 宗教年鑑 2023 (2022年末時点) の数値を投入
    op.execute("""
        INSERT INTO stats_references
          (source_name, source_url, reference_year, reference_as_of,
           metric_key, metric_value, note, published_at)
        VALUES
          ('文化庁 宗教年鑑',
           'https://www.bunka.go.jp/tokei_hakusho_shuppan/hakusho_nenjihokokusho/shukyo_nenkan/',
           2022, '2022-12-31',
           'registered_shinto_shrines', 80608,
           '宗教法人として登録されている神社数。小規模祠・屋敷神・無法人施設等は含まれない。実在神社の総数は20万社前後と推計されるが本数値には含まれない。',
           '2023'),
          ('推計値（祠含む総数）',
           NULL,
           2022, '2022-12-31',
           'estimated_total_shrines_including_hokora', 200000,
           '小規模祠・屋敷神・無法人施設を含めた推計総数。出典は各種民俗学調査に基づく概算。',
           NULL)
    """)


def downgrade() -> None:
    op.drop_table("stats_references")
    op.drop_table("pending_merges")
    op.drop_table("source_imports")
    op.drop_table("shrine_translations")
    op.drop_table("shrine_metadata")
    op.drop_table("shrine_source_records")

    with op.batch_alter_table("spots") as batch:
        batch.drop_index("ix_spots_data_freshness")
        batch.drop_index("ix_spots_published_status")
        batch.drop_index("ix_spots_primary_source")
        batch.drop_column("data_freshness_status")
        batch.drop_column("last_synced_at")
        batch.drop_column("published_status")
        batch.drop_column("official_status")
        batch.drop_column("confidence_score")
        batch.drop_column("primary_source")
        batch.drop_column("canonical_name")
