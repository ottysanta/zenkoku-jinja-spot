#!/usr/bin/env python3
"""
データ品質総合修正スクリプト
Phase 1: menu_items / talent_name の矛盾からグループ・タレント修正
Phase 2: 同一グループ × 同名スポットの重複削除
Phase 3: デフォルト座標スポットのジオコーディング
"""
import sqlite3, sys, time, re, json
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut

sys.stdout.reconfigure(encoding='utf-8')
DB = 'backend/data/pineapple_paws.db'

MEMBER_GROUP = {
    '渡辺翔太':'Snow Man','深澤辰哉':'Snow Man','阿部亮平':'Snow Man','向井康二':'Snow Man',
    '目黒蓮':'Snow Man','ラウール':'Snow Man','岩本照':'Snow Man','宮舘涼太':'Snow Man','佐久間大介':'Snow Man',
    '森本慎太郎':'SixTONES','田中樹':'SixTONES','京本大我':'SixTONES','髙地優吾':'SixTONES',
    'ジェシー':'SixTONES','松村北斗':'SixTONES',
    '大橋和也':'なにわ男子','藤原丈一郎':'なにわ男子','長尾謙杜':'なにわ男子',
    '大西流星':'なにわ男子','西畑大吾':'なにわ男子','道枝駿佑':'なにわ男子','高橋恭平':'なにわ男子',
    '小島健':'Aぇ! group','末澤誠也':'Aぇ! group','佐野晶哉':'Aぇ! group','福本大晴':'Aぇ! group','正門良規':'Aぇ! group',
    '草間リチャード敬太':'Aぇ! group',
    '相葉雅紀':'嵐','大野智':'嵐','櫻井翔':'嵐','二宮和也':'嵐','松本潤':'嵐',
    '重岡大毅':'WEST.','神山智洋':'WEST.','小瀧望':'WEST.','濱田崇裕':'WEST.','桐山照史':'WEST.','中間淳太':'WEST.',
    '永瀬廉':'King & Prince','高橋海人':'King & Prince',
    '山田涼介':'Hey! Say! JUMP','知念侑李':'Hey! Say! JUMP','岡本圭人':'Hey! Say! JUMP',
    '中島裕翔':'Hey! Say! JUMP','有岡大貴':'Hey! Say! JUMP','薮宏太':'Hey! Say! JUMP',
    '八乙女光':'Hey! Say! JUMP','伊野尾慧':'Hey! Say! JUMP','髙木雄也':'Hey! Say! JUMP',
    '松田元太':'Travis Japan','川島如恵留':'Travis Japan','中村海人':'Travis Japan',
    '七五三掛龍也':'Travis Japan','吉澤閑也':'Travis Japan','宮近海斗':'Travis Japan','カラニ・アキナ':'Travis Japan',
    '丸山隆平':'SUPER EIGHT','安田章大':'SUPER EIGHT','大倉忠義':'SUPER EIGHT',
    '村上信五':'SUPER EIGHT','横山裕':'SUPER EIGHT','錦戸亮':'SUPER EIGHT',
    '手越祐也':'NEWS','増田貴久':'NEWS','加藤シゲアキ':'NEWS','小山慶一郎':'NEWS',
    '堂本光一':'KinKi Kids','堂本剛':'KinKi Kids',
    '中島健人':'中島健人','上田竜也':'上田竜也','内博貴':'内博貴',
    '木村拓哉':'木村拓哉',
}

def detect_member_in_text(text):
    """テキストから最初に見つかったメンバー名を返す"""
    if not text: return None, None
    for member, group in MEMBER_GROUP.items():
        if member in text:
            return member, group
    return None, None

# ===== PHASE 1: グループ・タレント修正 =====
def phase1_fix_group_talent(conn):
    c = conn.cursor()
    fixed = 0

    # 1a: menu_items に含まれるメンバー名でグループが矛盾するもの
    c.execute('SELECT id, name, talent_name, group_name, menu_items FROM spots WHERE menu_items IS NOT NULL')
    for row in c.fetchall():
        sid, sname, talent, group, menu = row
        member, correct_group = detect_member_in_text(menu)
        if member and correct_group != group:
            # talent_nameが未設定またはメンバーではない場合にも更新
            new_talent = talent if talent and talent in MEMBER_GROUP else member
            c.execute('UPDATE spots SET group_name=?, talent_name=? WHERE id=?',
                      (correct_group, new_talent, sid))
            print(f'  [1a] id={sid} {sname[:20]}: {group}→{correct_group}, talent={new_talent}')
            fixed += 1

    # 1b: talent_nameがMEMBER_GROUPにあってgroup_nameと矛盾するもの
    c.execute('SELECT id, name, talent_name, group_name FROM spots WHERE talent_name IS NOT NULL')
    for row in c.fetchall():
        sid, sname, talent, group = row
        correct_group = MEMBER_GROUP.get(talent)
        if correct_group and correct_group != group:
            c.execute('UPDATE spots SET group_name=? WHERE id=?', (correct_group, sid))
            print(f'  [1b] id={sid} {sname[:20]}: talent={talent} → group {group}→{correct_group}')
            fixed += 1

    conn.commit()
    print(f'Phase 1 完了: {fixed}件修正')
    return fixed

# ===== PHASE 2: 重複削除 =====
def phase2_dedup(conn):
    c = conn.cursor()
    deleted = 0

    # 同名×同グループのグループ → 最も情報量の多いものを残す
    c.execute('''
        SELECT name, group_name, COUNT(*) cnt, GROUP_CONCAT(id) ids
        FROM spots
        GROUP BY name, group_name
        HAVING cnt > 1
        ORDER BY cnt DESC
    ''')
    dup_groups = c.fetchall()

    for name, group, cnt, ids_str in dup_groups:
        ids = [int(x) for x in ids_str.split(',')]

        # 各idのスコアを計算（情報の豊富さ）
        scores = {}
        for sid in ids:
            c.execute('''SELECT lat, lng, address, talent_name, media_title,
                                access_info, menu_items FROM spots WHERE id=?''', (sid,))
            row = c.fetchone()
            lat, lng, addr, talent, media, access, menu = row
            score = 0
            # デフォルト座標でなければ +3
            if not (round(lat,4)==35.6762 and round(lng,4)==139.6503): score += 3
            if addr: score += 2
            if talent: score += 1
            if media and media != 'パイナップルネキ': score += 1
            if access: score += 1
            if menu: score += 1
            scores[sid] = score

        # 最高スコアのものを残す（同点なら最小ID）
        keep_id = max(scores.keys(), key=lambda x: (scores[x], -x))
        delete_ids = [sid for sid in ids if sid != keep_id]

        for did in delete_ids:
            c.execute('DELETE FROM spots WHERE id=?', (did,))
            deleted += 1
        print(f'  [2] "{name[:20]}"[{group}]: {len(ids)}件→1件 (keep={keep_id}, del={delete_ids})')

    conn.commit()
    print(f'Phase 2 完了: {deleted}件削除')
    return deleted

# ===== PHASE 3: ジオコーディング =====
def phase3_geocode(conn):
    c = conn.cursor()
    geo = Nominatim(user_agent='pineapple_paws_fix_v2', timeout=10)
    geocoded = 0
    failed = []

    c.execute('''SELECT id, name, address FROM spots
                 WHERE round(lat,4)=35.6762 AND round(lng,4)=139.6503
                 ORDER BY id''')
    rows = c.fetchall()
    print(f'ジオコーディング対象: {len(rows)}件')

    for sid, sname, addr in rows:
        # 試行1: 住所から
        result = None
        if addr:
            try:
                result = geo.geocode(addr, language='ja')
                time.sleep(1.1)
            except GeocoderTimedOut:
                time.sleep(2)

        # 試行2: 店名 + 日本 から
        if not result:
            try:
                result = geo.geocode(f'{sname} 日本', language='ja')
                time.sleep(1.1)
            except GeocoderTimedOut:
                time.sleep(2)

        if result:
            lat, lng = result.latitude, result.longitude
            # 日本国内の座標のみ受け入れ（24-46N, 123-146E）
            if 24 <= lat <= 46 and 123 <= lng <= 146:
                c.execute('UPDATE spots SET lat=?, lng=? WHERE id=?', (lat, lng, sid))
                print(f'  [3] id={sid} {sname[:20]}: ({lat:.4f},{lng:.4f})')
                geocoded += 1
                continue

        print(f'  [3] FAIL id={sid} {sname[:20]}')
        failed.append((sid, sname))

        # 20件ごとにコミット
        if geocoded % 20 == 0:
            conn.commit()

    conn.commit()
    print(f'Phase 3 完了: {geocoded}件ジオコーディング成功, {len(failed)}件失敗')
    if failed:
        print('失敗したスポット:')
        for sid, sname in failed:
            print(f'  id={sid}: {sname}')
    return geocoded

def main():
    conn = sqlite3.connect(DB)
    c = conn.cursor()

    c.execute('SELECT COUNT(*) FROM spots')
    print(f'開始時スポット数: {c.fetchone()[0]}')

    print('\n===== Phase 1: グループ・タレント修正 =====')
    phase1_fix_group_talent(conn)

    print('\n===== Phase 2: 重複削除 =====')
    phase2_dedup(conn)

    print('\n===== Phase 3: ジオコーディング =====')
    phase3_geocode(conn)

    c.execute('SELECT COUNT(*) FROM spots')
    print(f'\n完了時スポット数: {c.fetchone()[0]}')

    print('\n=== グループ別スポット数 ===')
    c.execute('SELECT group_name, COUNT(*) FROM spots GROUP BY group_name ORDER BY COUNT(*) DESC')
    for row in c.fetchall():
        print(f'  {row[0]}: {row[1]}')

    conn.close()

if __name__ == '__main__':
    main()
