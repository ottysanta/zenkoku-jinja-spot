#!/usr/bin/env python3
"""
第3パスジオコーディング
1. 同名スポットで既にジオコード済みのものから座標をコピー
2. addressフィールドから住所を抽出してジオコーディング
3. 店名で検索
"""
import sqlite3, sys, time, re
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut

sys.stdout.reconfigure(encoding='utf-8')
DB = 'backend/data/pineapple_paws.db'

JAPAN_LAT = (24, 46)
JAPAN_LNG = (123, 146)
DEFAULT_LAT, DEFAULT_LNG = 35.6762, 139.6503

# 住所フィールドから日本の住所部分を抽出
def extract_street_address(addr):
    if not addr: return None
    # 都道府県から始まる住所を抽出
    m = re.search(r'((?:東京都|大阪府|神奈川県|千葉県|埼玉県|愛知県|北海道|福岡県|京都府|静岡県|兵庫県|広島県|立川市|武蔵野市)[^\s【\n]*)', addr)
    if m:
        addr_part = m.group(1)
        # OCRゴミを除去
        addr_part = re.sub(r'[\]）\)][^\s]*', '', addr_part).strip()
        addr_part = re.sub(r'\s+$', '', addr_part)
        return addr_part if len(addr_part) > 5 else None
    return None

# 住所から丁目番地だけを抽出（より短くして検索精度を上げる）
def extract_chome(addr):
    """東京都港区六本木4-9-1 → 港区六本木4丁目9番1号 相当の短い住所"""
    m = re.search(r'((?:東京都|大阪府|神奈川県|千葉県|埼玉県|愛知県|北海道|福岡県|京都府|静岡県|兵庫県|広島県)[^\s]+(?:区|市|町|村)[^\s]+)', addr)
    if m:
        return m.group(1)
    return None

def is_valid(lat, lng):
    return JAPAN_LAT[0] <= lat <= JAPAN_LAT[1] and JAPAN_LNG[0] <= lng <= JAPAN_LNG[1]

def is_default(lat, lng):
    return abs(round(lat, 4) - DEFAULT_LAT) < 0.0001 and abs(round(lng, 4) - DEFAULT_LNG) < 0.0001

def try_geocode(geo, query, label=''):
    try:
        result = geo.geocode(query, language='ja')
        time.sleep(1.1)
        if result and is_valid(result.latitude, result.longitude):
            return result
    except GeocoderTimedOut:
        time.sleep(3)
    return None

def main():
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    geo = Nominatim(user_agent='pineapple_paws_geocode3', timeout=10)

    # デフォルト座標のスポットを取得
    c.execute('''SELECT id, name, address FROM spots
                 WHERE round(lat,4)=35.6762 AND round(lng,4)=139.6503
                 ORDER BY id''')
    rows = c.fetchall()
    print(f'デフォルト座標スポット: {len(rows)}件')

    geocoded = 0
    still_failed = []

    # ステップ1: 同名スポットで既に正しい座標を持つものからコピー
    print('\n=== ステップ1: 同名スポットから座標コピー ===')
    for sid, sname, addr in rows:
        # 同名で実座標を持つスポットを検索（グループ問わず）
        c.execute('''SELECT lat, lng FROM spots
                     WHERE name=? AND NOT (round(lat,4)=35.6762 AND round(lng,4)=139.6503)
                     LIMIT 1''', (sname,))
        row = c.fetchone()
        if row:
            lat, lng = row
            if is_valid(lat, lng):
                c.execute('UPDATE spots SET lat=?, lng=? WHERE id=?', (lat, lng, sid))
                print(f'  コピー id={sid} {sname[:30]}: ({lat:.4f},{lng:.4f})')
                geocoded += 1

    conn.commit()

    # ステップ2: addressから住所を抽出してジオコーディング
    print('\n=== ステップ2: 住所フィールドからジオコーディング ===')
    c.execute('''SELECT id, name, address FROM spots
                 WHERE round(lat,4)=35.6762 AND round(lng,4)=139.6503
                 ORDER BY id''')
    rows = c.fetchall()
    print(f'残り: {len(rows)}件')

    for sid, sname, addr in rows:
        result = None

        # 住所から抽出
        if addr:
            street = extract_street_address(addr)
            if street:
                result = try_geocode(geo, street)
                if not result:
                    # 短縮版で再試行
                    short = extract_chome(street)
                    if short and short != street:
                        result = try_geocode(geo, short)

        if result:
            lat, lng = result.latitude, result.longitude
            c.execute('UPDATE spots SET lat=?, lng=? WHERE id=?', (lat, lng, sid))
            print(f'  OK id={sid} {sname[:25]}: ({lat:.4f},{lng:.4f})')
            geocoded += 1
        else:
            still_failed.append((sid, sname, addr))

        if geocoded % 10 == 0 and geocoded > 0:
            conn.commit()

    conn.commit()

    # ステップ3: 名前で検索（最後の試み）
    print('\n=== ステップ3: 名前で検索 ===')
    NAME_SEARCHES = {
        521: ('トイザらス 錦糸町店', 'トイザらス 錦糸町 東京'),
        536: ('ミラノドルチェ トレ・スパーデ', 'Milano Dolce Tre Spade 東京'),
        565: ('ラップドクレープ コロット', 'ラップドクレープ コロット 東京'),
        586: ('TiCTAC 東京ソラマチ店', 'TiCTAC ソラマチ 押上'),
        587: ('go slow caravan', 'go slow caravan 東京ソラマチ'),
        594: ('Paul Bassett 新宿店', 'Paul Bassett 新宿'),
        596: ('ブラッスリー・サリュー', 'Brasserie Salyut 東京'),
        598: ('大衆焼肉 暴飲暴食', '大衆焼肉 暴飲暴食 東京'),
        599: ('大阪ホルモン ふたご', '大阪ホルモン ふたご 六本木'),
        601: ('焼肉きんぐ 駒沢公園店', '焼肉きんぐ 駒沢公園 世田谷'),
        602: ('アマンド 六本木店', 'アマンド 六本木'),
        506: ('JAM17 GELATERIA', 'JAM17 GELATERIA 東京'),
        355: ('目黒川沿い', '目黒川 東京 中目黒'),
        507: ('Paul Bassett 新宿店', 'Paul Bassett 新宿'),
        510: ('gelato pique cafe creperie', 'gelato pique 池袋'),
        560: ('目黒川沿い', '目黒川 東京 中目黒'),
        606: ('JAM17 GELATERIA', 'JAM17 GELATERIA 歌舞伎町'),
        830: ('焼肉ホルモン 龍の巣', '焼肉ホルモン 龍の巣 東京'),
        832: ('Catering Den Den', 'Catering Den Den Tokyo'),
        839: ('TruffleBAKERY 表参道', 'TruffleBAKERY 表参道 東京'),
        890: ('レモンサワー専門店', 'レモンサワー 東京 渋谷'),
        897: ('オレンジワイン専門店', 'オレンジワイン 東京'),
        404: ('ITAMAE SUSHI 愛宕店', 'ITAMAE SUSHI 愛宕 東京'),
    }

    still_failed2 = []
    for sid, sname, addr in still_failed:
        if sid in NAME_SEARCHES:
            display_name, query = NAME_SEARCHES[sid]
            result = try_geocode(geo, query)
            if result:
                lat, lng = result.latitude, result.longitude
                c.execute('UPDATE spots SET lat=?, lng=? WHERE id=?', (lat, lng, sid))
                print(f'  OK id={sid} {sname[:25]}: ({lat:.4f},{lng:.4f}) ← {query}')
                geocoded += 1
                continue
        still_failed2.append((sid, sname))

    conn.commit()

    print(f'\n合計: {geocoded}件ジオコーディング成功')
    print(f'残りデフォルト座標: {len(still_failed2)}件')
    for sid, sname in still_failed2:
        print(f'  id={sid}: {sname}')

    c.execute('SELECT COUNT(*) FROM spots WHERE round(lat,4)=35.6762 AND round(lng,4)=139.6503')
    print(f'\n最終デフォルト座標件数: {c.fetchone()[0]}')
    conn.close()

if __name__ == '__main__':
    main()
