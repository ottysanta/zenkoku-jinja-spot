"""
パイナップルネキデータ再インポート

1. 既存のSTARTO/パイナップルネキエントリを削除（他ブログと重複があれば一方を削除）
2. video_titleからgroup_namesを正確に解析
3. member_infoをmenu_itemsとして活用
4. media_title = 実際の動画タイトル
5. media_type = "YouTube"
"""
import sqlite3
import json
from pathlib import Path
from datetime import datetime

DB_PATH = Path(__file__).parent / "data" / "pineapple_paws.db"
PARSED_JSON = Path(__file__).parent.parent / "pineapple_seichi_parsed.json"

# ======== グループ解析マッピング ========
# 動画タイトルに含まれるキーワード → グループ名リスト
TITLE_GROUP_MAP = [
    ("横山会",     ["SUPER EIGHT", "WEST.", "Aぇ! group", "なにわ男子"]),
    ("よにの",     ["嵐", "KAT-TUN", "Hey! Say! JUMP", "timelesz"]),
    ("Snow Man",   ["Snow Man"]),
    ("スノ",       ["Snow Man"]),
    ("SixTONES",   ["SixTONES"]),
    ("スト",       ["SixTONES"]),
    ("なにわ男子", ["なにわ男子"]),
    ("なにわ",     ["なにわ男子"]),
    ("Aぇ! group", ["Aぇ! group"]),
    ("Aぇ",        ["Aぇ! group"]),
    ("WEST.",      ["WEST."]),
    ("キスマイ",   ["Kis-My-Ft2"]),
    ("Kis-My-Ft2", ["Kis-My-Ft2"]),
    ("キンプリ",   ["King & Prince"]),
    ("King & Prince", ["King & Prince"]),
    ("トラジャ",   ["Travis Japan"]),
    ("Travis Japan", ["Travis Japan"]),
    ("SUPER EIGHT", ["SUPER EIGHT"]),
    ("エイト",     ["SUPER EIGHT"]),
    ("嵐",         ["嵐"]),
    ("timelesz",   ["timelesz"]),
    ("KAT-TUN",    ["KAT-TUN"]),
    ("Hey! Say! JUMP", ["Hey! Say! JUMP"]),
    ("JUMP",       ["Hey! Say! JUMP"]),
    ("永瀬廉",     ["King & Prince"]),
    ("大橋和也",   ["なにわ男子"]),
    ("長尾謙杜",   ["なにわ男子"]),
]

# メンバー名 → グループ名
MEMBER_GROUP_MAP = {
    # Snow Man
    "岩本照": "Snow Man", "深澤辰哉": "Snow Man", "ラウール": "Snow Man",
    "渡辺翔太": "Snow Man", "阿部亮平": "Snow Man", "宮舘涼太": "Snow Man",
    "目黒蓮": "Snow Man", "向井康二": "Snow Man", "佐久間大介": "Snow Man",
    # SixTONES
    "ジェシー": "SixTONES", "京本大我": "SixTONES", "松村北斗": "SixTONES",
    "田中樹": "SixTONES", "森本慎太郎": "SixTONES", "髙地優吾": "SixTONES",
    # なにわ男子
    "道枝駿佑": "なにわ男子", "高橋恭平": "なにわ男子", "西畑大吾": "なにわ男子",
    "大西流星": "なにわ男子", "藤原丈一郎": "なにわ男子", "長尾謙杜": "なにわ男子",
    "大橋和也": "なにわ男子",
    # Aぇ! group
    "末澤誠也": "Aぇ! group", "佐野晶哉": "Aぇ! group", "福本大晴": "Aぇ! group",
    "草間リチャード敬太": "Aぇ! group", "小島健": "Aぇ! group", "中島颯太": "Aぇ! group",
    # WEST.
    "桐山照史": "WEST.", "濵田崇裕": "WEST.", "小瀧望": "WEST.",
    "中間淳太": "WEST.", "藤井流星": "WEST.", "神山智洋": "WEST.",
    # King & Prince
    "永瀬廉": "King & Prince", "高橋海人": "King & Prince",
    # Kis-My-Ft2
    "藤ヶ谷太輔": "Kis-My-Ft2", "宮田俊哉": "Kis-My-Ft2", "玉森裕太": "Kis-My-Ft2",
    "千賀健永": "Kis-My-Ft2", "二階堂高嗣": "Kis-My-Ft2", "北山宏光": "Kis-My-Ft2",
    "横尾渉": "Kis-My-Ft2",
    # Travis Japan
    "松田元太": "Travis Japan", "吉澤閑也": "Travis Japan", "宮近海斗": "Travis Japan",
    "七五三掛龍也": "Travis Japan", "川島如恵留": "Travis Japan",
    "中村海人": "Travis Japan", "松倉海斗": "Travis Japan",
    # SUPER EIGHT
    "横山裕": "SUPER EIGHT", "渋谷すばる": "SUPER EIGHT", "村上信五": "SUPER EIGHT",
    "丸山隆平": "SUPER EIGHT", "安田章大": "SUPER EIGHT", "大倉忠義": "SUPER EIGHT",
    # timelesz
    "菊池風磨": "timelesz", "中島健人": "timelesz", "松島聡": "timelesz",
    "佐藤勝利": "timelesz", "吉沢亮": "timelesz",
    # 嵐
    "二宮和也": "嵐", "大野智": "嵐", "相葉雅紀": "嵐", "松本潤": "嵐", "櫻井翔": "嵐",
    # KAT-TUN
    "中丸雄一": "KAT-TUN", "亀梨和也": "KAT-TUN", "上田竜也": "KAT-TUN",
    # Hey! Say! JUMP
    "山田涼介": "Hey! Say! JUMP", "中島裕翔": "Hey! Say! JUMP", "知念侑李": "Hey! Say! JUMP",
    "有岡大貴": "Hey! Say! JUMP", "八乙女光": "Hey! Say! JUMP", "伊野尾慧": "Hey! Say! JUMP",
    "薮宏太": "Hey! Say! JUMP", "髙木雄也": "Hey! Say! JUMP",
    # KinKi Kids
    "堂本光一": "KinKi Kids", "堂本剛": "KinKi Kids",
}

# ニックネーム → フルネーム
NICKNAME_MAP = {
    "丈くん": "藤原丈一郎", "なにわ": "なにわ男子", "スノ": "Snow Man",
    "ラウ": "ラウール", "しょっぴー": "渡辺翔太", "めめ": "目黒蓮",
    "こじけん": "小島健", "りんたろー": "道枝駿佑",
}


def parse_groups_from_title(title: str) -> list[str]:
    """動画タイトルからグループ名リストを解析"""
    groups = []
    seen = set()
    for keyword, group_list in TITLE_GROUP_MAP:
        if keyword in title:
            for g in group_list:
                if g not in seen:
                    groups.append(g)
                    seen.add(g)
    return groups


def parse_members_from_text(text: str) -> list[str]:
    """テキストからメンバー名を抽出"""
    found = []
    for name in MEMBER_GROUP_MAP:
        if name in text:
            found.append(name)
    return found


def parse_upload_date(date_str: str) -> str:
    """YYYYMMDD → YYYY-MM-DD"""
    try:
        return datetime.strptime(str(date_str), "%Y%m%d").strftime("%Y-%m-%d")
    except Exception:
        return str(date_str)


def main():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    # ======== 1. 既存STARTOデータ削除 ========
    cur.execute("SELECT COUNT(*) FROM spots WHERE group_name='STARTO'")
    starto_count = cur.fetchone()[0]
    print(f"削除対象: {starto_count} 件 (group_name=STARTO)")

    cur.execute("DELETE FROM spots WHERE group_name='STARTO'")
    print(f"削除完了")

    # ======== 2. 他ブログデータとの重複チェック ========
    with open(PARSED_JSON, encoding="utf-8") as f:
        entries = json.load(f)

    # 既存の店名リストを取得
    cur.execute("SELECT id, name, group_name FROM spots")
    existing = {row["name"]: (row["id"], row["group_name"]) for row in cur.fetchall()}

    inserted = 0
    skipped_dup = 0

    for entry in entries:
        shop_name = entry.get("shop_name", "").strip()
        member_info = entry.get("member_info", "")
        video_title = entry.get("video_title", "")
        upload_date = parse_upload_date(entry.get("upload_date", ""))
        source_url = entry.get("source_url", "")
        area_lat = entry.get("area_lat")
        area_lng = entry.get("area_lng")

        if not shop_name:
            continue

        # グループ解析
        groups = parse_groups_from_title(video_title)
        if not groups:
            groups = ["STARTO"]  # 判定不能の場合

        primary_group = groups[0]

        # メンバー解析
        members_in_info = parse_members_from_text(member_info)
        members_in_title = parse_members_from_text(video_title)
        all_members = list(dict.fromkeys(members_in_title + members_in_info))
        talent_name = "・".join(all_members) if all_members else None

        # 重複チェック: 同じ店名 + 同じグループがすでにある場合はスキップ
        if shop_name in existing:
            existing_group = existing[shop_name][1]
            # 同じグループのデータがあれば重複とみなしてスキップ
            if existing_group in groups:
                skipped_dup += 1
                continue

        # menu_items: member_infoに食事・メニュー情報が含まれる
        menu_items = member_info if member_info else None

        # 座標が不明の場合はスキップ
        if area_lat is None or area_lng is None:
            continue

        cur.execute("""
            INSERT INTO spots
                (name, address, lat, lng, talent_name, group_name, group_names,
                 media_type, media_title, broadcast_date, menu_items,
                 source_url, pineapple_score, freshness_visual)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (
            shop_name,
            None,  # address は後で geocoding
            area_lat,
            area_lng,
            talent_name,
            primary_group,
            json.dumps(groups, ensure_ascii=False),
            "YouTube",
            video_title,
            upload_date,
            menu_items,
            source_url,
            60,
            "ripe",
        ))
        inserted += 1

    conn.commit()
    conn.close()

    print(f"\n再インポート完了")
    print(f"  追加: {inserted} 件")
    print(f"  重複スキップ: {skipped_dup} 件")


if __name__ == "__main__":
    main()
