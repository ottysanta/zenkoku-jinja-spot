"""
パイナップルネキ YouTube ShortsデータをDBにインポートするスクリプト。

Usage:
    python import_pineapple.py [--dry_run]
"""
import sys
import re
import json
import time
import argparse
import urllib.request
import urllib.parse
from pathlib import Path

if sys.stdout.encoding and sys.stdout.encoding.lower() not in ('utf-8', 'utf_8'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

sys.path.insert(0, str(Path(__file__).parent))
from database import init_db, SessionLocal
from models import Spot
from services.freshness import calc_pineapple

# ===== グループ・メンバー辞書 =====

GROUP_ALIASES = {
    "Snow Man": ["Snow Man", "SnowMan", "スノーマン"],
    "SixTONES": ["SixTONES", "ストーンズ", "スト"],
    "Aぇ! group": ["Aぇ! group", "Aぇgroup", "Aぇ", "Aぇ!"],
    "なにわ男子": ["なにわ男子", "なにわ"],
    "WEST.": ["WEST.", "WEST", "ウエスト", "ジャニーズWEST"],
    "Kis-My-Ft2": ["Kis-My-Ft2", "キスマイ", "KisMyFt2"],
    "King & Prince": ["King & Prince", "キンプリ", "KingandPrince"],
    "Hey! Say! JUMP": ["Hey! Say! JUMP", "JUMP", "Hey!Say!JUMP"],
    "timelesz": ["timelesz", "タイムレス"],
    "A.B.C-Z": ["A.B.C-Z", "ABCZ"],
    "Travis Japan": ["Travis Japan", "トラジャ", "TJ"],
    "嵐": ["嵐", "ARASHI"],
    "よにのちゃんねる": ["よにのちゃんねる", "よにの"],
    "SUPER EIGHT": ["SUPER EIGHT", "スーパーエイト", "エイト", "関ジャニ"],
    "KinKi Kids": ["KinKi Kids", "KinKi"],
    "ふぉ～ゆ～": ["ふぉ～ゆ～"],
}

MEMBER_TO_GROUP = {
    # Snow Man
    "岩本照": "Snow Man", "深澤辰哉": "Snow Man", "渡辺翔太": "Snow Man",
    "阿部亮平": "Snow Man", "宮舘涼太": "Snow Man", "佐久間大介": "Snow Man",
    "向井康二": "Snow Man", "目黒蓮": "Snow Man", "ラウール": "Snow Man",
    # SixTONES
    "ジェシー": "SixTONES", "京本大我": "SixTONES", "田中樹": "SixTONES",
    "髙地優吾": "SixTONES", "松村北斗": "SixTONES", "森本慎太郎": "SixTONES",
    # Aぇ! group
    "正門良規": "Aぇ! group", "末澤誠也": "Aぇ! group", "小島健": "Aぇ! group",
    "福本大晴": "Aぇ! group", "佐野晶哉": "Aぇ! group",
    # なにわ男子
    "道枝駿佑": "なにわ男子", "高橋恭平": "なにわ男子", "西畑大吾": "なにわ男子",
    "大橋和也": "なにわ男子", "藤原丈一郎": "なにわ男子", "長尾謙杜": "なにわ男子",
    "我那覇友己": "なにわ男子",
    # WEST.
    "重岡大毅": "WEST.", "桐山照史": "WEST.", "中間淳太": "WEST.",
    "小瀧望": "WEST.", "濱田崇裕": "WEST.", "神山智洋": "WEST.",
    # Kis-My-Ft2
    "藤ヶ谷太輔": "Kis-My-Ft2", "玉森裕太": "Kis-My-Ft2", "千賀健永": "Kis-My-Ft2",
    "宮田俊哉": "Kis-My-Ft2", "北山宏光": "Kis-My-Ft2", "横尾渉": "Kis-My-Ft2",
    "二階堂高嗣": "Kis-My-Ft2",
    # King & Prince
    "永瀬廉": "King & Prince", "髙橋海人": "King & Prince", "岸優太": "King & Prince",
    "神宮寺勇太": "King & Prince", "岩橋玄樹": "King & Prince",
    # Hey! Say! JUMP
    "山田涼介": "Hey! Say! JUMP", "知念侑李": "Hey! Say! JUMP", "岡本圭人": "Hey! Say! JUMP",
    "中島裕翔": "Hey! Say! JUMP", "有岡大貴": "Hey! Say! JUMP", "髙木雄也": "Hey! Say! JUMP",
    "八乙女光": "Hey! Say! JUMP", "伊野尾慧": "Hey! Say! JUMP", "薮宏太": "Hey! Say! JUMP",
    # timelesz
    "菊池風磨": "timelesz", "中島健人": "timelesz", "松島聡": "timelesz",
    "佐藤勝利": "timelesz", "吉澤閑也": "timelesz",
    # Travis Japan
    "松倉海斗": "Travis Japan", "中村海人": "Travis Japan", "宮近海斗": "Travis Japan",
    "七五三掛龍也": "Travis Japan", "川島如恵留": "Travis Japan",
    "吉澤閑也": "Travis Japan", "元井嘉人": "Travis Japan",
    # A.B.C-Z
    "河合郁人": "A.B.C-Z", "塚田僚一": "A.B.C-Z", "橋本良亮": "A.B.C-Z",
    "戸塚祥太": "A.B.C-Z", "五関晃一": "A.B.C-Z",
    # SUPER EIGHT
    "村上信五": "SUPER EIGHT", "丸山隆平": "SUPER EIGHT", "安田章大": "SUPER EIGHT",
    "錦戸亮": "SUPER EIGHT", "大倉忠義": "SUPER EIGHT", "横山裕": "SUPER EIGHT",
    "渋谷すばる": "SUPER EIGHT",
    # 嵐
    "大野智": "嵐", "相葉雅紀": "嵐", "二宮和也": "嵐",
    "松本潤": "嵐", "櫻井翔": "嵐",
    # KinKi Kids
    "堂本光一": "KinKi Kids", "堂本剛": "KinKi Kids",
    # ふぉ～ゆ～
    "福田悠太": "ふぉ～ゆ～", "越岡裕貴": "ふぉ～ゆ～",
    "清水昭博": "ふぉ～ゆ～", "辰巳雄大": "ふぉ～ゆ～",
}

# 呼び名→フルネームのマッピング（愛称・苗字のみ）
NICKNAME_TO_FULL = {
    "相葉くん": "相葉雅紀", "相葉": "相葉雅紀",
    "正門くん": "正門良規", "正門": "正門良規",
    "佐野くん": "佐野晶哉", "佐野": "佐野晶哉",
    "西畑くん": "西畑大吾", "西畑": "西畑大吾",
    "大橋くん": "大橋和也", "大橋": "大橋和也",
    "長尾くん": "長尾謙杜", "長尾": "長尾謙杜",
    "道枝くん": "道枝駿佑", "道枝": "道枝駿佑",
    "永瀬廉くん": "永瀬廉", "廉くん": "永瀬廉", "廉": "永瀬廉",
    "重岡くん": "重岡大毅", "重岡": "重岡大毅",
    "桐山": "桐山照史", "照史くん": "桐山照史",
    "濱田": "濱田崇裕", "濱田崇裕くん": "濱田崇裕",
    "神山くん": "神山智洋", "神山": "神山智洋",
    "松村くん": "松村北斗", "松村": "松村北斗", "北斗": "松村北斗",
    "岩本": "岩本照", "目黒くん": "目黒蓮", "目黒": "目黒蓮",
    "向井くん": "向井康二", "康二": "向井康二",
    "阿部くん": "阿部亮平", "阿部": "阿部亮平",
    "佐久間くん": "佐久間大介", "佐久間": "佐久間大介",
    "宮舘": "宮舘涼太",
    "ジェシー": "ジェシー",
    "京本": "京本大我",
    "田中": "田中樹",
    "髙地": "髙地優吾",
    "森本": "森本慎太郎",
    "山田くん": "山田涼介", "山田": "山田涼介",
    "菊池": "菊池風磨",
    "二宮くん": "二宮和也", "二宮": "二宮和也",
    "中丸": "中丸雄一",
}


def extract_group_from_text(text: str) -> str:
    """テキストからグループ名を抽出"""
    for group, aliases in GROUP_ALIASES.items():
        for alias in aliases:
            if alias in text:
                return group
    # メンバー名から逆引き
    for member, group in MEMBER_TO_GROUP.items():
        if member in text:
            return group
    for nickname, full in NICKNAME_TO_FULL.items():
        if nickname in text:
            group = MEMBER_TO_GROUP.get(full, "")
            if group:
                return group
    return ""


def extract_talent_from_text(text: str) -> str:
    """テキストからタレント名を抽出"""
    found = set()
    # フルネームを先に
    for member in MEMBER_TO_GROUP:
        if member in text:
            found.add(member)
    # 愛称
    for nickname, full in NICKNAME_TO_FULL.items():
        if nickname in text and full not in found:
            found.add(full)
    if found:
        return "・".join(sorted(found, key=lambda x: text.find(x) if x in text else 999))
    return ""


def parse_upload_date(d: str) -> str:
    """'20260329' → '2026-03-29'"""
    if d and len(d) == 8:
        return f"{d[:4]}-{d[4:6]}-{d[6:]}"
    return "2026-01-01"


# ===== ジオコーディング =====

_geo_cache: dict[str, tuple[float, float] | None] = {}

AREA_KEYWORDS = {
    "東京": "東京都", "渋谷": "東京都渋谷区", "新宿": "東京都新宿区",
    "池袋": "東京都豊島区", "銀座": "東京都中央区", "浅草": "東京都台東区",
    "原宿": "東京都渋谷区", "六本木": "東京都港区", "恵比寿": "東京都渋谷区",
    "目黒": "東京都目黒区", "品川": "東京都品川区", "代官山": "東京都渋谷区",
    "中目黒": "東京都目黒区", "上野": "東京都台東区", "秋葉原": "東京都千代田区",
    "吉祥寺": "東京都武蔵野市", "下北沢": "東京都世田谷区",
    "横浜": "神奈川県横浜市", "川崎": "神奈川県川崎市",
    "大阪": "大阪府大阪市", "難波": "大阪府大阪市", "心斎橋": "大阪府大阪市",
    "梅田": "大阪府大阪市", "天王寺": "大阪府大阪市",
    "京都": "京都府京都市", "奈良": "奈良県",
    "神戸": "兵庫県神戸市", "兵庫": "兵庫県",
    "名古屋": "愛知県名古屋市", "愛知": "愛知県",
    "福岡": "福岡県福岡市", "博多": "福岡県福岡市",
    "仙台": "宮城県仙台市", "北海道": "北海道", "札幌": "北海道札幌市",
    "千葉": "千葉県", "埼玉": "埼玉県",
    "新大阪": "大阪府大阪市", "京セラドーム": "大阪府大阪市",
    "東京ドーム": "東京都文京区", "東京グローブ座": "東京都新宿区",
    "羽田": "東京都大田区", "ソラマチ": "東京都墨田区",
    "多摩": "東京都", "川越": "埼玉県川越市",
    "浅草": "東京都台東区", "松竹座": "大阪府大阪市",
    "東京駅": "東京都千代田区", "新大阪駅": "大阪府大阪市",
}

def extract_area(title: str) -> str:
    """動画タイトルからエリア名を抽出"""
    for key, pref in AREA_KEYWORDS.items():
        if key in title:
            return key
    return ""


def geocode_nominatim(name: str, area: str = "") -> tuple[float, float] | None:
    """OpenStreetMap Nominatim APIで店名＋エリアをジオコーディング"""
    queries = []
    if area:
        queries.append(f"{name} {area} 日本")
        queries.append(f"{area} {name}")
    queries.append(f"{name} 日本")
    queries.append(name)

    headers = {"User-Agent": "PrincessPineapplePaws/1.0 (seichi-map)"}

    for q in queries:
        params = urllib.parse.urlencode({"q": q, "format": "json", "limit": "1", "countrycodes": "jp"})
        url = f"https://nominatim.openstreetmap.org/search?{params}"
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read())
            if data:
                lat = float(data[0]["lat"])
                lng = float(data[0]["lon"])
                if 24 <= lat <= 46 and 122 <= lng <= 154:
                    return lat, lng
        except Exception:
            pass
        time.sleep(1.0)  # Nominatim rate limit: 1 req/sec

    return None


def geocode_gsi(name: str, area: str = "") -> tuple[float, float] | None:
    """国土地理院APIで住所検索（住所が分かる場合のフォールバック）"""
    queries = []
    if area:
        queries.append(f"{area} {name}")
    queries.append(name)

    for q in queries:
        params = urllib.parse.urlencode({"q": q})
        url = f"https://msearch.gsi.go.jp/address-search/AddressSearch?{params}"
        req = urllib.request.Request(url, headers={"User-Agent": "PrincessPineapplePaws/1.0"})
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read())
            if data:
                coords = data[0]["geometry"]["coordinates"]
                lng_val, lat_val = float(coords[0]), float(coords[1])
                if 24 <= lat_val <= 46 and 122 <= lng_val <= 154:
                    return lat_val, lng_val
        except Exception:
            pass
    return None


def geocode_name(name: str, area: str = "") -> tuple[float, float] | None:
    cache_key = f"{name}|{area}"
    if cache_key in _geo_cache:
        return _geo_cache[cache_key]

    # Try Nominatim first (works with shop names)
    result = geocode_nominatim(name, area)
    if result:
        _geo_cache[cache_key] = result
        return result

    _geo_cache[cache_key] = None
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry_run", action="store_true")
    ap.add_argument("--input", default="C:/Users/chirai/Desktop/deb/03johnny/pineapple_seichi_parsed.json")
    args = ap.parse_args()

    data_path = Path(args.input)
    if not data_path.exists():
        print(f"ERROR: {data_path} not found")
        sys.exit(1)

    with open(data_path, encoding="utf-8") as f:
        entries = json.load(f)

    print(f"読み込み: {len(entries)}件")

    init_db()
    db = SessionLocal()

    try:
        added = skipped = failed = 0

        for entry in entries:
            shop_name = entry.get("shop_name", "").strip()
            member_info = entry.get("member_info", "")
            context = entry.get("context", "")
            source_url = entry.get("source_url", "")
            video_title = entry.get("video_title", "")
            upload_date_raw = entry.get("upload_date", "")
            upload_date = parse_upload_date(upload_date_raw)

            if not shop_name:
                continue

            # グループ・タレント名抽出
            combined_text = f"{member_info} {context} {video_title}"
            group_name = extract_group_from_text(combined_text)
            talent_name = extract_talent_from_text(combined_text)

            # グループ名が取れなかった場合、video_titleから補完
            if not group_name:
                group_name = "STARTO"

            # メニュー情報
            menu_items = member_info if member_info else None

            # 重複チェック
            existing = db.query(Spot).filter(
                Spot.name == shop_name,
                Spot.source_url == source_url
            ).first()
            if existing:
                skipped += 1
                continue

            print(f"  [{upload_date}] {shop_name[:25]:<25} {group_name[:15]:<15}", end=" ", flush=True)
            time.sleep(0.2)

            # Use pre-computed area coords as primary fallback
            area_lat = entry.get("area_lat")
            area_lng = entry.get("area_lng")

            area = extract_area(video_title)
            geo = geocode_name(shop_name, area)
            if geo is None and area_lat and area_lng:
                # Use area centroid as approximate location
                geo = (area_lat, area_lng)
                print(f"  ↳ area fallback: ({area_lat:.4f}, {area_lng:.4f})")
            if geo is None:
                print("→ 座標取得失敗 スキップ")
                failed += 1
                continue

            lat, lng = geo
            print(f"→ ({lat:.4f}, {lng:.4f})")

            score, visual = calc_pineapple(upload_date)

            if not args.dry_run:
                db.add(Spot(
                    name=shop_name,
                    address="",
                    lat=lat,
                    lng=lng,
                    talent_name=talent_name or group_name,
                    group_name=group_name,
                    media_type="SNS",
                    media_title="パイナップルネキ",
                    broadcast_date=upload_date,
                    menu_items=menu_items,
                    access_info=None,
                    source_url=source_url,
                    pineapple_score=score,
                    freshness_visual=visual,
                ))
            added += 1

        if not args.dry_run:
            db.commit()

        print(f"\n{'[DRY RUN] ' if args.dry_run else ''}完了: {added}件追加, {skipped}件スキップ(既存), {failed}件座標取得失敗")

    finally:
        db.close()


if __name__ == "__main__":
    main()
