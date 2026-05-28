"""
Wikipedia API バッチ取得スクリプト
wikipedia_title があるのに description が空の神社に説明文を補完する。

使い方:
  python scripts/fetch-wikipedia-descriptions.py
  python scripts/fetch-wikipedia-descriptions.py --dry-run   # DB書き込みなし
  python scripts/fetch-wikipedia-descriptions.py --limit 100 # 件数制限
"""

import sqlite3
import urllib.request
import urllib.parse
import json
import time
import argparse
import os
import sys
import io

# Windows コンソールの cp932 問題を回避
if sys.stdout.encoding and sys.stdout.encoding.lower() not in ("utf-8", "utf8"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

DB_CANDIDATES = [
    os.path.join(os.path.dirname(__file__), "../../api/data/shrine_spots.db"),
    os.path.join(os.path.dirname(__file__), "../../../apps/api/data/shrine_spots.db"),
]

def find_db() -> str:
    for p in DB_CANDIDATES:
        if os.path.exists(p):
            return os.path.abspath(p)
    # 引数から
    if len(sys.argv) > 1:
        for arg in sys.argv:
            if arg.endswith(".db") and os.path.exists(arg):
                return arg
    raise FileNotFoundError(f"shrine_spots.db が見つかりません。DB_CANDIDATES: {DB_CANDIDATES}")


def fetch_wikipedia_summary(title: str) -> dict | None:
    """
    Wikipedia REST API でページサマリーを取得。
    日本語タイトルは ja.wikipedia.org、英語タイトルは en.wikipedia.org を試みる。
    返り値: {"extract": str, "description": str} | None
    """
    # 日本語版を先に試す
    for lang in ("ja", "en"):
        encoded = urllib.parse.quote(title, safe="")
        url = f"https://{lang}.wikipedia.org/api/rest_v1/page/summary/{encoded}"
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0 (compatible; ZenkokuJinja/1.0)"},
        )
        try:
            import ssl
            ctx = ssl.create_default_context()
            with urllib.request.urlopen(req, timeout=10, context=ctx) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    extract = data.get("extract", "").strip()
                    if extract and len(extract) > 30:
                        return {
                            "extract": extract,
                            "lang": lang,
                            "page_url": data.get("content_urls", {}).get("desktop", {}).get("page", ""),
                        }
        except Exception:
            pass
    return None


def main():
    parser = argparse.ArgumentParser(description="Wikipedia API バッチ取得")
    parser.add_argument("--dry-run", action="store_true", help="DB書き込みなし（確認用）")
    parser.add_argument("--limit", type=int, default=0, help="処理件数上限（0=無制限）")
    parser.add_argument("--db", type=str, default="", help="DBパスを直接指定")
    parser.add_argument("--sleep", type=float, default=0.5, help="リクエスト間隔(秒)")
    args = parser.parse_args()

    db_path = args.db if args.db else find_db()
    print(f"DB: {db_path}")

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    # 対象: wikipedia_title あり・description なし
    query = """
        SELECT id, name, wikipedia_title, wikipedia_url
        FROM spots
        WHERE wikipedia_title IS NOT NULL AND wikipedia_title != ''
          AND (description IS NULL OR description = '')
        ORDER BY id
    """
    if args.limit > 0:
        query += f" LIMIT {args.limit}"

    rows = c.execute(query).fetchall()
    total = len(rows)
    print(f"対象: {total} 社")

    if args.dry_run:
        print("[DRY RUN] DB への書き込みは行いません")

    ok = 0
    skip = 0
    err = 0

    for i, row in enumerate(rows, 1):
        shrine_id = row["id"]
        name = row["name"]
        wiki_title = row["wikipedia_title"]

        print(f"[{i}/{total}] ({wiki_title})", end=" ... ", flush=True)

        result = fetch_wikipedia_summary(wiki_title)

        if not result:
            print("FAIL")
            err += 1
            time.sleep(args.sleep)
            continue

        extract = result["extract"]
        lang = result["lang"]
        page_url = result["page_url"]

        # 英語の場合は先頭300字だけ使う
        if lang == "en":
            extract = extract[:300]

        print(f"OK ({lang}, {len(extract)}chars)")

        if not args.dry_run:
            c.execute(
                """
                UPDATE spots SET
                    description = ?,
                    wikipedia_url = COALESCE(NULLIF(wikipedia_url, ''), ?)
                WHERE id = ?
                """,
                (extract, page_url, shrine_id),
            )
            if i % 50 == 0:
                conn.commit()
                print(f"  -> {i} committed")
        ok += 1

        time.sleep(args.sleep)

    if not args.dry_run:
        conn.commit()

    conn.close()
    print(f"\n完了: 成功={ok}, スキップ={skip}, 失敗={err} / 合計={total}")


if __name__ == "__main__":
    main()
