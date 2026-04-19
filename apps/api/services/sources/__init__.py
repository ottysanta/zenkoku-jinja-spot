"""Pluggable shrine data sources.

各外部ソース（OSM / Wikidata / MLIT / GSI / 文化庁 / Google Places / Manual）は
`ShrineSource` 抽象を実装し、`SourceRegistry` 経由で統一的に呼ばれる。

設計原則:
  - ソースの追加は新しいクラスを書いて `register()` するだけ
  - 各ソースは自らの fetch/normalize のみ責務を持ち、マージ・保存には関与しない
  - バッチ実行は `services.sync.run_import(source_type)` で統一
  - ソース優先度は `source_priority.PRIORITY` で一元管理
"""
from __future__ import annotations

from .base import (
    ShrineSource,
    SourceRecord,
    SourceFetchResult,
    SourceRegistry,
    registry,
)
from . import source_priority

# 各ソース実装を import し、registry に自動登録させる
from . import manual as _manual      # noqa: F401
from . import osm as _osm            # noqa: F401
from . import wikidata as _wd        # noqa: F401
from . import mlit as _mlit          # noqa: F401
from . import gsi as _gsi            # noqa: F401
from . import bunka as _bunka        # noqa: F401
from . import jinjacho as _jinjacho  # noqa: F401
from . import places as _places      # noqa: F401

__all__ = [
    "ShrineSource",
    "SourceRecord",
    "SourceFetchResult",
    "SourceRegistry",
    "registry",
    "source_priority",
]
