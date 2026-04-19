"""ShrineSource 抽象と Registry。

各ソース実装は `ShrineSource` を継承し、次の最小契約を満たす:
  - source_type: ソース識別子（DB の source_records.source_type に直結）
  - fetch(**kwargs) -> Iterable[SourceRecord]: 正規化済みレコードを yield
  - 各 SourceRecord は外部IDと座標と生ペイロードを持つ

normalize は fetch 内で行われ、外部仕様の違いはこの層で吸収される。
マージ・DB書き込みは呼び出し側 (sync_runner) の責務。
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Iterable, Iterator


@dataclass
class SourceRecord:
    """各ソースから取得した正規化済みレコード。

    Repository 層はこれを受け取り、既存 shrine への紐付けまたは新規作成を行う。
    """
    source_type: str
    source_object_id: str            # "osm:node/123" / "wd:Q1234" / "places:ChIJ..."
    name: str
    lat: float
    lng: float
    address: str | None = None
    url: str | None = None
    prefecture: str | None = None
    # 構造化属性（任意）
    shrine_rank: str | None = None
    shrine_type: str | None = None
    deity: str | None = None
    founded: str | None = None
    # 生ペイロード（監査・再マージ用）
    raw: dict[str, Any] = field(default_factory=dict)
    # ソースごとに計算される信頼度（0-100）。
    # 例: OSM=40 / Wikidata=50 / MLIT=70 / Bunka=80 / Manual=100
    confidence_hint: int = 40


@dataclass
class SourceFetchResult:
    """fetch の集計結果。"""
    total: int = 0
    fetched: int = 0
    errors: list[str] = field(default_factory=list)


class ShrineSource(ABC):
    """全ソース共通の契約。fetch の実装のみ必須。"""

    #: 登録 ID。DB 上の source_type と一致させる。
    source_type: str = ""

    #: 人間可読な表示名（管理UI用）。
    display_name: str = ""

    #: このソースが保持するレコードの平均信頼度ヒント（0-100）。
    default_confidence: int = 40

    #: このソースがポリシー上 DB に永続化してよいか（Google Places 等は False）。
    allow_persist: bool = True

    @abstractmethod
    def fetch(self, **kwargs: Any) -> Iterator[SourceRecord]:
        """外部ソースからレコードを取得し、正規化して yield する。

        kwargs 例: bbox=(south,west,north,east), prefecture="東京都", limit=1000
        実装は必ず iterator を返し、呼び出し側でストリーム処理できるようにする。
        """
        raise NotImplementedError

    def health_check(self) -> tuple[bool, str]:
        """ソース疎通確認。失敗理由は管理UIで表示する。"""
        return True, "ok"


class SourceRegistry:
    """ソース実装の中央レジストリ。`registry.register(cls)` で登録。"""

    def __init__(self) -> None:
        self._sources: dict[str, ShrineSource] = {}

    def register(self, source: ShrineSource) -> ShrineSource:
        if not source.source_type:
            raise ValueError("source.source_type must be set")
        self._sources[source.source_type] = source
        return source

    def get(self, source_type: str) -> ShrineSource:
        if source_type not in self._sources:
            raise KeyError(f"unknown source_type: {source_type}")
        return self._sources[source_type]

    def list(self) -> list[ShrineSource]:
        return list(self._sources.values())

    def has(self, source_type: str) -> bool:
        return source_type in self._sources


#: シングルトンレジストリ。各ソース実装モジュールの import 時に登録される。
registry = SourceRegistry()
