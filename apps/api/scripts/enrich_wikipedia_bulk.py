"""Wikipedia 日本語版から神社スポットの photo_url / description / deity を
一括補完するバッチスクリプト。

既存の ``main.py`` の ``_fetch_wikipedia_summary`` / ``_extract_wiki_title``
を再利用し、祭神 (deity) については Infobox を ``action=parse`` API から
取得してローカルで正規表現抽出する。

使用例:
    # 写真と説明が両方欠けてる神社を 50 件ぶん埋める（ドライラン）
    py -m scripts.enrich_wikipedia_bulk --limit 50 --only-missing any --dry-run

    # 本番実行
    py -m scripts.enrich_wikipedia_bulk --limit 200 --sleep 0.5

オプション:
    --limit N              1 回の実行で処理する最大件数 (default: 100)
    --only-missing MODE    photo / description / deity / any から選択
                           (default: any = いずれかが欠けている spot)
    --prefecture PREF      都道府県でフィルタ（例: --prefecture 東京都）
    --sleep S              1 リクエストごとの sleep 秒 (default: 0.3)
    --dry-run              書き込まず件数だけ表示

注意:
    - Wikipedia の Terms of Use および API Etiquette に従い、過度な連打は行わず
      ``--sleep`` に十分な秒数を与えること。
    - 同一タイトルに対する再取得は行っていないため、複数回走らせる場合は
      既に photo_url 等が埋まっているスポットは自動的にスキップされる。
"""
from __future__ import annotations

import argparse
import logging
import re
import sys
import time
from pathlib import Path
from typing import Optional
from urllib import parse as _urlparse
from urllib import request as _urlreq
from urllib import error as _urlerr

# main.py / database.py は apps/api/ 直下に居るので、その親をインポートパスに足す
_API_ROOT = Path(__file__).resolve().parents[1]
if str(_API_ROOT) not in sys.path:
    sys.path.insert(0, str(_API_ROOT))

from database import SessionLocal  # noqa: E402
from models import Spot  # noqa: E402
# main.py 側のヘルパーを再利用（コピペ複製しない）
from main import _fetch_wikipedia_summary, _extract_wiki_title  # noqa: E402


logger = logging.getLogger("enrich_wikipedia_bulk")

USER_AGENT = "ShrineSpots/1.0 (https://shrine-spots.jp)"
DESCRIPTION_MAX_CHARS = 280


# ---------------------------------------------------------------------------
# Infobox 取得 & 祭神抽出（main.py を汚さないためスクリプト内ローカル関数）
# ---------------------------------------------------------------------------

_DEITY_KEYS = ("主祭神", "祭神")
# 例:  主祭神 = [[天照大神]]<br />[[豊受大神]]
_DEITY_FIELD_RE = re.compile(
    r"(?:主祭神|祭神)\s*=\s*([^\n|}]+)",
)
_WIKILINK_PIPED_RE = re.compile(r"\[\[[^\[\]|]+\|([^\[\]]+)\]\]")
_WIKILINK_PLAIN_RE = re.compile(r"\[\[([^\[\]|]+)\]\]")
_HTML_BR_RE = re.compile(r"<\s*br\s*/?\s*>", re.IGNORECASE)
_HTML_TAG_RE = re.compile(r"<[^>]+>")
_REF_TAG_RE = re.compile(r"<ref[^>]*>.*?</ref>|<ref[^/]*/>", re.IGNORECASE | re.DOTALL)


def _fetch_wikipedia_infobox_deity(title: str, lang: str = "ja") -> Optional[str]:
    """Wikipedia の ``action=parse&prop=wikitext`` から祭神フィールドを抽出。

    失敗（ページ不在 / Infobox 無し / パース不能）時は None を返す。
    """
    endpoint = f"https://{lang}.wikipedia.org/w/api.php"
    params = {
        "action": "parse",
        "page": title,
        "prop": "wikitext",
        "format": "json",
        "redirects": "1",
    }
    url = f"{endpoint}?{_urlparse.urlencode(params)}"
    req = _urlreq.Request(url, headers={
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
    })
    try:
        with _urlreq.urlopen(req, timeout=15) as r:
            import json as _json
            data = _json.loads(r.read().decode("utf-8"))
    except _urlerr.HTTPError:
        return None
    except Exception:
        return None

    try:
        wikitext = data["parse"]["wikitext"]["*"]
    except (KeyError, TypeError):
        return None

    return _extract_deity_from_wikitext(wikitext)


def _extract_deity_from_wikitext(wikitext: str) -> Optional[str]:
    """Infobox 風 wikitext から祭神名を抽出して正規化する。"""
    # まず <ref>...</ref> を除去（ノイズ多いため）
    text = _REF_TAG_RE.sub("", wikitext)

    m = _DEITY_FIELD_RE.search(text)
    if not m:
        return None
    raw = m.group(1)

    # <br /> 等は区切り文字に置換
    raw = _HTML_BR_RE.sub("、", raw)
    # 他の HTML タグは除去
    raw = _HTML_TAG_RE.sub("", raw)
    # [[A|B]] → B
    raw = _WIKILINK_PIPED_RE.sub(r"\1", raw)
    # [[A]] → A
    raw = _WIKILINK_PLAIN_RE.sub(r"\1", raw)
    # 残った {{ }} の残骸を除去
    raw = raw.replace("{{", "").replace("}}", "")
    # 区切り文字の重複 / 前後空白を整理
    raw = raw.strip()
    # 連続する区切り記号を 1 つに
    raw = re.sub(r"[、,]\s*[、,]+", "、", raw)
    raw = raw.strip("、, \t")

    return raw or None


# ---------------------------------------------------------------------------
# メイン処理
# ---------------------------------------------------------------------------

def _build_query(db, only_missing: str, prefecture: Optional[str], limit: int):
    q = db.query(Spot)

    if only_missing == "photo":
        q = q.filter((Spot.photo_url == None) | (Spot.photo_url == ""))  # noqa: E711
    elif only_missing == "description":
        q = q.filter((Spot.description == None) | (Spot.description == ""))  # noqa: E711
    elif only_missing == "deity":
        q = q.filter((Spot.deity == None) | (Spot.deity == ""))  # noqa: E711
    else:  # any
        q = q.filter(
            (Spot.photo_url == None) | (Spot.photo_url == "")  # noqa: E711
            | (Spot.description == None) | (Spot.description == "")  # noqa: E711
            | (Spot.deity == None) | (Spot.deity == "")  # noqa: E711
        )

    if prefecture:
        q = q.filter(Spot.prefecture == prefecture)

    q = q.order_by(Spot.id).limit(limit)
    return q


def _candidate_titles(spot: Spot) -> list[str]:
    """対象 spot で試すべき Wikipedia タイトル候補を順序付きで返す。"""
    candidates: list[str] = []
    for c in (spot.wikipedia_title, _extract_wiki_title(spot.source_url), spot.name):
        if c and c not in candidates:
            candidates.append(c)
    return candidates


def process_spot(spot: Spot, sleep_s: float) -> tuple[str, dict]:
    """1 件の spot を処理し、(status, changes) を返す。

    status: 'enriched' / 'skipped_no_match' / 'failed'
    changes: 実際に更新されたフィールド dict（ドライラン用）
    """
    titles = _candidate_titles(spot)
    if not titles:
        return "skipped_no_match", {}

    summary = None
    matched_title: Optional[str] = None
    for t in titles:
        try:
            data = _fetch_wikipedia_summary(t, "ja")
        except Exception as e:  # 念のため
            logger.warning("summary fetch exception spot_id=%s title=%r err=%s", spot.id, t, e)
            data = None
        if sleep_s > 0:
            time.sleep(sleep_s)
        if not data:
            continue
        if data.get("type") in ("disambiguation",):
            continue
        summary = data
        matched_title = t
        break

    if not summary or not matched_title:
        return "skipped_no_match", {}

    changes: dict = {}

    extract = summary.get("extract") or ""
    thumb = (summary.get("thumbnail") or {}).get("source")
    originalimage = (summary.get("originalimage") or {}).get("source")
    content_urls = summary.get("content_urls") or {}
    page_url = (
        (content_urls.get("desktop") or {}).get("page")
        or f"https://ja.wikipedia.org/wiki/{_urlparse.quote(matched_title)}"
    )

    # (d) photo_url が空だったら thumbnail.source をセット
    if (not spot.photo_url) and (thumb or originalimage):
        new_photo = originalimage or thumb
        changes["photo_url"] = new_photo
        changes["photo_attribution"] = "Wikipedia 日本語版より"

    # (e) description が空だったら extract の先頭 280 文字
    if (not spot.description) and extract:
        changes["description"] = extract[:DESCRIPTION_MAX_CHARS]

    # (f) wikipedia_title / wikipedia_url が空ならセット
    if not spot.wikipedia_title:
        changes["wikipedia_title"] = matched_title
    if not spot.wikipedia_url:
        changes["wikipedia_url"] = page_url

    # (g) deity が空なら Infobox から抽出（失敗しても致命的ではない）
    if not spot.deity:
        try:
            deity = _fetch_wikipedia_infobox_deity(matched_title, "ja")
        except Exception as e:
            logger.warning("infobox fetch exception spot_id=%s title=%r err=%s",
                           spot.id, matched_title, e)
            deity = None
        if sleep_s > 0:
            time.sleep(sleep_s)
        if deity:
            changes["deity"] = deity

    if not changes:
        return "skipped_no_match", {}

    return "enriched", changes


def main(argv: Optional[list[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        description="Wikipedia 日本語版から神社の photo_url / description / deity を一括補完する",
    )
    parser.add_argument("--limit", type=int, default=100,
                        help="1 回の実行で処理する最大件数 (default: 100)")
    parser.add_argument("--only-missing",
                        choices=["photo", "description", "deity", "any"],
                        default="any",
                        help="どのフィールドが欠けているものを対象にするか (default: any)")
    parser.add_argument("--prefecture", type=str, default=None,
                        help="都道府県でフィルタ（例: --prefecture 東京都）")
    parser.add_argument("--sleep", type=float, default=0.3,
                        help="1 リクエストごとの sleep 秒 (default: 0.3)")
    parser.add_argument("--dry-run", action="store_true",
                        help="書き込みせず件数・更新内容のサマリだけ出力")
    parser.add_argument("--log-level", type=str, default="INFO")
    args = parser.parse_args(argv)

    logging.basicConfig(
        level=getattr(logging, args.log_level.upper(), logging.INFO),
        format="%(asctime)s [%(levelname)s] %(message)s",
    )

    db = SessionLocal()
    try:
        q = _build_query(db, args.only_missing, args.prefecture, args.limit)
        spots = q.all()
        logger.info("target spots: %d (only_missing=%s, prefecture=%s, limit=%d)",
                    len(spots), args.only_missing, args.prefecture, args.limit)

        enriched = 0
        skipped_no_match = 0
        failed = 0
        field_counts: dict[str, int] = {}

        for spot in spots:
            try:
                status, changes = process_spot(spot, args.sleep)
            except Exception as e:
                failed += 1
                logger.exception("spot_id=%s failed: %s", spot.id, e)
                # 次へ進む
                try:
                    db.rollback()
                except Exception:
                    pass
                continue

            if status == "enriched":
                enriched += 1
                for k in changes:
                    field_counts[k] = field_counts.get(k, 0) + 1
                logger.info(
                    "spot_id=%s name=%r enriched fields=%s",
                    spot.id, spot.name, sorted(changes.keys()),
                )
                if not args.dry_run:
                    for k, v in changes.items():
                        setattr(spot, k, v)
                    try:
                        # 1 件ごとに commit（途中死んでもそこまで保存）
                        db.commit()
                    except Exception as e:
                        failed += 1
                        enriched -= 1  # 実書き込みに失敗したので enriched から戻す
                        logger.exception("spot_id=%s commit failed: %s", spot.id, e)
                        try:
                            db.rollback()
                        except Exception:
                            pass
            else:
                skipped_no_match += 1
                logger.debug("spot_id=%s name=%r skipped_no_match", spot.id, spot.name)

        logger.info(
            "DONE enriched=%d skipped_no_match=%d failed=%d (dry_run=%s)",
            enriched, skipped_no_match, failed, args.dry_run,
        )
        if field_counts:
            logger.info("field updates: %s",
                        ", ".join(f"{k}={v}" for k, v in sorted(field_counts.items())))
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())
