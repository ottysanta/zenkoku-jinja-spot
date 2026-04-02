"""
Playwrightでスクレイプしたブログテキストを解析してDBに投入するスクリプト。

対応フォーマット:
  A) テーブル形式: 配信日→・場所名 の一覧表（すのちゅーぶ、SixTONES YouTube等）
  B) ナレーション形式: エピソード説明+住所+食べたもの（あっちこっちAぇ!等）

Usage:
    python import_blog.py <textfile> --group "Snow Man" --media_type YouTube --media_title "すのちゅーぶ" --source_url <url>
    python import_blog.py <textfile> --dry_run
"""
import sys
import re
import time
import json
import argparse
import urllib.request
import urllib.parse
from pathlib import Path

# Windowsでの文字化け・エンコードエラー防止
if sys.stdout.encoding and sys.stdout.encoding.lower() not in ('utf-8', 'utf_8'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

sys.path.insert(0, str(Path(__file__).parent))
from database import init_db, SessionLocal
from models import Spot
from services.freshness import calc_pineapple


# ===== メンバー名辞書 =====

MEMBERS = {
    "Snow Man":   ["岩本照","深澤辰哉","渡辺翔太","阿部亮平","宮舘涼太","佐久間大介","向井康二","目黒蓮","ラウール",
                   "岩本","深澤","渡辺","阿部","宮舘","佐久間","向井","目黒","Matt","ラウール","渡辺Matt"],
    "SixTONES":  ["ジェシー","京本大我","田中樹","髙地優吾","松村北斗","森本慎太郎",
                   "ジェシー","京本","田中","髙地","松村","森本"],
    "Aぇ! group":["正門良規","末澤誠也","小島健","福本大晴","佐野晶哉",
                   "正門","末澤","小島","福本","佐野"],
}

# 正式名（フルネーム）にマッピング
MEMBER_FULL = {
    "岩本":"岩本照","深澤":"深澤辰哉","渡辺":"渡辺翔太","渡辺Matt":"渡辺翔太",
    "阿部":"阿部亮平","宮舘":"宮舘涼太","佐久間":"佐久間大介","向井":"向井康二","目黒":"目黒蓮",
    "ジェシー":"ジェシー","京本":"京本大我","田中":"田中樹","髙地":"髙地優吾","松村":"松村北斗","森本":"森本慎太郎",
    "正門":"正門良規","末澤":"末澤誠也","小島":"小島健","福本":"福本大晴","佐野":"佐野晶哉",
}

def extract_members(text: str, group: str) -> str:
    """テキスト内に登場するメンバー名を抽出して「A・B・C」形式で返す。"""
    candidates = MEMBERS.get(group, [])
    found_full = set()
    for m in candidates:
        if m in text:
            full = MEMBER_FULL.get(m, m)
            found_full.add(full)
    if not found_full:
        return group
    # グループ内の登場順でソート
    order = [MEMBER_FULL.get(m, m) for m in candidates]
    sorted_members = sorted(found_full, key=lambda x: order.index(x) if x in order else 99)
    return "・".join(sorted_members)


# ===== フォーマット判定 =====

def detect_format(text: str) -> str:
    """'table' or 'narrative'"""
    # 「配信日」ヘッダーがあるか、YYYY/MM/DD\t・ パターンがあれば table 形式
    if '配信日' in text:
        return "table"
    date_bullet = re.compile(r'\d{4}/\d{1,2}/\d{1,2}\t・')
    if date_bullet.search(text):
        return "table"
    return "narrative"


# ===== A) テーブル形式パーサー =====

def parse_table(text: str) -> list[dict]:
    spots = []
    current_date = None
    date_pat = re.compile(r'(\d{4})[/．](\d{1,2})[/．](\d{1,2})')
    lines = text.splitlines()

    # 一覧表セクションのみ（最初の「目次」行まで）
    table_end = next((i for i, l in enumerate(lines) if l.strip() == '目次'), len(lines))
    lines = lines[:table_end]
    i = 0

    while i < len(lines):
        stripped = lines[i].strip()
        m = date_pat.search(stripped)
        if m:
            y, mo, d = m.group(1), m.group(2).zfill(2), m.group(3).zfill(2)
            current_date = f"{y}-{mo}-{d}"
            if '・' in stripped:
                stripped = re.sub(r'.*?・', '・', stripped, count=1)
            else:
                i += 1
                continue

        if stripped.startswith('・') and current_date:
            name = stripped.lstrip('・').strip()
            if '閉業' in name or '閉店' in name:
                i += 1
                continue

            # 継続行の結合
            while i + 1 < len(lines):
                nxt = lines[i + 1].strip()
                if (nxt and not nxt.startswith('・') and not date_pat.match(nxt)
                        and not any(kw in nxt for kw in ['閉業','閉店','住所','電話','営業','ホーム','プライバシー'])
                        and len(nxt) <= 20):
                    name = (name + nxt).strip()
                    i += 1
                else:
                    break

            name = re.sub(r'\s*※.*$', '', name).strip()
            name = re.sub(r'\s+ー\s*$', '', name).strip()
            name = re.sub(r'\s+(岩本|深澤|渡辺|阿部|宮舘|佐久間|向井|目黒|ラウール|康二|ジェシー|京本|田中|髙地|松村|森本|正門|末澤|小島|福本|佐野).*$', '', name)
            name = re.sub(r'\s+', ' ', name).strip()
            if name:
                spots.append({"name": name, "date": current_date})
        i += 1

    seen: dict[str, dict] = {}
    for s in spots:
        if s["name"] not in seen or s["date"] > seen[s["name"]]["date"]:
            seen[s["name"]] = s
    return list(seen.values())


# ===== B) ナレーション形式パーサー =====

def parse_narrative(text: str) -> list[dict]:
    """
    エピソード別詳細ページを解析。
    構造:
      [エピソードタイトル（日付含む）]
      ...
      [スポット名]
      [説明（メンバー名が含まれる）]
      住所\\t〒xxx
      [都道府県...]
      食べたもの（オプション）
      [member]: [dish]
    """
    spots = []
    pref_pat = re.compile(r'^(東京都|神奈川県|千葉県|埼玉県|大阪府|京都府|北海道|愛知県|福岡県|静岡県|栃木県|茨城県|長野県|山梨県|福島県|宮城県|広島県|山口県|岡山県|島根県|徳島県|香川県|愛媛県|高知県|福岡県|佐賀県|長崎県|熊本県|大分県|宮崎県|鹿児島県|沖縄県|兵庫県|奈良県|和歌山県|滋賀県|三重県|岐阜県|石川県|富山県|福井県|新潟県|山形県|秋田県|岩手県|青森県|宮城県|群馬県|栃木県|茨城県|千葉県|東京都|神奈川県|静岡県|愛知県|三重県|京都府|大阪府|兵庫県|奈良県|鳥取県|島根県|広島県|山口県|沖縄県)')
    date_pat = re.compile(r'(\d{4})[/．年](\d{1,2})[/．月](\d{1,2})')
    lines = text.splitlines()

    current_date = None
    i = 0

    while i < len(lines):
        line = lines[i].strip()

        # 日付抽出（エピソードタイトル行から）
        dm = date_pat.search(line)
        if dm and ('放送' in line or '配信' in line or '回' in line):
            y, mo, d = dm.group(1), dm.group(2).zfill(2), dm.group(3).zfill(2)
            current_date = f"{y}-{mo}-{d}"
            i += 1
            continue

        # 住所行を探す
        if line.startswith('住所') and i + 1 < len(lines):
            next1 = lines[i + 1].strip()
            addr = ""
            if next1.startswith('〒') and i + 2 < len(lines):
                next2 = lines[i + 2].strip()
                if pref_pat.match(next2):
                    addr = next2
            elif pref_pat.match(next1):
                addr = next1

            if not addr:
                i += 1
                continue

            # スポット名を逆探索（Snow Man説明行 or 短い単独行）
            spot_name = None
            context_lines = []
            for j in range(i - 1, max(i - 20, -1), -1):
                prev = lines[j].strip()
                if not prev:
                    continue
                context_lines.append(prev)
                if (2 <= len(prev) <= 50
                        and not prev.endswith('。')      # 文末が。の説明文を除外
                        and not prev.endswith('！')
                        and not prev.endswith('？')
                        and not prev.startswith('住所')
                        and not prev.startswith('電話')
                        and not prev.startswith('営業')
                        and not prev.startswith('アクセス')
                        and not prev.startswith('定休')
                        and not prev.startswith('食べ')
                        and not prev.startswith('http')
                        and not re.match(r'^\d{4}[/年]', prev)
                        and '配信' not in prev
                        and '放送' not in prev
                        and 'まとめ' not in prev):
                    spot_name = prev
                    break

            if not spot_name:
                i += 1
                continue

            # メンバー名をコンテキストから抽出
            context_text = "\n".join(context_lines)
            # 食べたもの セクションも取得
            menu_lines = []
            menu_members = []
            j = i + 1
            while j < min(i + 20, len(lines)):
                ml = lines[j].strip()
                if ml == '食べたもの' or ml.startswith('食べた'):
                    j += 1
                    while j < min(i + 30, len(lines)):
                        ml2 = lines[j].strip()
                        if not ml2 or ml2.startswith('住所') or ml2.startswith('アクセス'):
                            break
                        menu_lines.append(ml2)
                        j += 1
                    break
                j += 1

            # メンバー名を説明文+食べたものから抽出
            all_context = context_text + "\n" + "\n".join(menu_lines)

            spots.append({
                "name": spot_name,
                "date": current_date or "2020-01-01",
                "address": addr,
                "context": all_context,
                "menu": "\n".join(menu_lines) if menu_lines else "",
            })

        i += 1

    # 重複除去（同名は最新日付）
    seen: dict[str, dict] = {}
    for s in spots:
        key = s["name"]
        if key not in seen or s["date"] > seen[key]["date"]:
            seen[key] = s
    return list(seen.values())


# ===== 住所解析（テーブル形式用）=====

def parse_addresses(text: str) -> dict[str, str]:
    addr_map: dict[str, str] = {}
    pref_pat = re.compile(r'^(東京都|神奈川県|千葉県|埼玉県|大阪府|京都府|北海道|愛知県|福岡県|静岡県|栃木県|茨城県|長野県|山梨県|福島県|宮城県|広島県|山口県|岡山県|島根県|兵庫県|奈良県|三重県|石川県|富山県|福井県|新潟県|山形県|秋田県|岩手県|青森県|群馬県|鳥取県|愛媛県|香川県|徳島県|高知県|佐賀県|長崎県|熊本県|大分県|宮崎県|鹿児島県|沖縄県)')
    lines = text.splitlines()

    for i, line in enumerate(lines):
        if not line.strip().startswith('住所'):
            continue
        addr = ""
        if i + 1 < len(lines):
            next1 = lines[i + 1].strip()
            if next1.startswith('〒') and i + 2 < len(lines):
                next2 = lines[i + 2].strip()
                if pref_pat.match(next2):
                    addr = next2
            elif pref_pat.match(next1):
                addr = next1
        if not addr:
            continue

        spot_name = None
        for j in range(i - 1, max(i - 40, -1), -1):
            prev = lines[j].strip()
            if not prev:
                continue
            if prev.startswith('Snow Man') or prev.startswith('SnowMan') or prev.startswith('Aぇ') or prev.startswith('SixTONES'):
                for k in range(j - 1, max(j - 5, -1), -1):
                    candidate = lines[k].strip()
                    if candidate and 2 <= len(candidate) <= 60:
                        if not any(kw in candidate for kw in
                                   ['住所','電話','営業','アクセス','目次','まとめ','関東','神奈川',
                                    '埼玉','千葉','東京','一覧','ホーム','ロケ地','すのちゅ','Aぇちゅ']):
                            spot_name = candidate
                    break
                break

        if spot_name:
            addr_map[spot_name] = addr
    return addr_map


# ===== ジオコーディング（国土地理院API）=====

_geo_cache: dict[str, tuple[float, float] | None] = {}

def geocode_address(address: str) -> tuple[float, float] | None:
    if address in _geo_cache:
        return _geo_cache[address]
    normalized = address.translate(str.maketrans('０１２３４５６７８９－ー　', '0123456789--　'))
    params = urllib.parse.urlencode({"q": normalized})
    url = f"https://msearch.gsi.go.jp/address-search/AddressSearch?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": "PrincessPineapplePaws/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
        if data:
            coords = data[0]["geometry"]["coordinates"]
            lng, lat = float(coords[0]), float(coords[1])
            if 24 <= lat <= 46 and 122 <= lng <= 154:
                _geo_cache[address] = (lat, lng)
                return lat, lng
    except Exception as e:
        print(f"    [geocode error] {e}", file=sys.stderr)
    _geo_cache[address] = None
    return None

def geocode_name(name: str) -> tuple[float, float] | None:
    return geocode_address(name)


# ===== メイン =====

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("textfile")
    ap.add_argument("--group",       default="Snow Man")
    ap.add_argument("--talent",      default="")
    ap.add_argument("--media_type",  default="YouTube")
    ap.add_argument("--media_title", default="")
    ap.add_argument("--source_url",  default="https://fananablog.com/")
    ap.add_argument("--dry_run",     action="store_true")
    args = ap.parse_args()

    text = Path(args.textfile).read_text(encoding="utf-8", errors="replace")
    fmt = detect_format(text)
    print(f"フォーマット検出: {fmt}")

    if fmt == "table":
        spots_raw = parse_table(text)
        addr_map  = parse_addresses(text)

        def find_address(name):
            if name in addr_map:
                return addr_map[name]
            for k, v in addr_map.items():
                if k.startswith(name) or name.startswith(k):
                    return v
            return ""

        spots = [{"name": s["name"], "date": s["date"],
                  "address": find_address(s["name"]),
                  "context": "", "menu": ""}
                 for s in spots_raw]
    else:
        spots = parse_narrative(text)

    print(f"→ {len(spots)} スポット解析完了")

    init_db()
    db = SessionLocal()
    try:
        added = skipped = failed = 0
        for s in spots:
            name    = s["name"]
            date    = s["date"]
            address = s.get("address", "")
            context = s.get("context", "")
            menu    = s.get("menu", "")

            if db.query(Spot).filter(Spot.name == name, Spot.group_name == args.group).first():
                skipped += 1
                continue

            print(f"  [{date}] {name}", end=" ", flush=True)
            time.sleep(0.3)

            geo = geocode_address(address) if address else geocode_name(name)
            if geo is None:
                print("→ 座標取得失敗 スキップ")
                failed += 1
                continue

            lat, lng = geo
            print(f"→ ({lat:.4f}, {lng:.4f})")

            # メンバー名: 引数 > コンテキスト抽出 > グループ名
            if args.talent:
                talent = args.talent
            else:
                talent = extract_members(context + "\n" + menu, args.group)

            score, visual = calc_pineapple(date)

            if not args.dry_run:
                db.add(Spot(
                    name=name, address=address, lat=lat, lng=lng,
                    talent_name=talent, group_name=args.group,
                    media_type=args.media_type,
                    media_title=args.media_title or args.group,
                    broadcast_date=date,
                    menu_items=menu or None,
                    access_info=None,
                    source_url=args.source_url,
                    pineapple_score=score,
                    freshness_visual=visual,
                ))
            added += 1

        if not args.dry_run:
            db.commit()
        print(f"\n{'[DRY RUN] ' if args.dry_run else ''}完了: {added}件追加, {skipped}件スキップ(既存), {failed}件失敗")
    finally:
        db.close()


if __name__ == "__main__":
    main()
