#!/usr/bin/env python3
"""デフォルト座標残りのジオコーディング第2パス（名前クリーニング後）"""
import sqlite3, sys, time, re
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut

sys.stdout.reconfigure(encoding='utf-8')
DB = 'backend/data/pineapple_paws.db'

# 正しい店名への手動マッピング（OCRエラー修正）
NAME_CORRECTIONS = {
    '目黒川治い TravisJapan': '目黒川沿い',
    '浅草 船細工 アメシン': '飴細工 アメシン 浅草',
    '浅草 船細工アメシン': '飴細工 アメシン 浅草',
    '武蔵野アブラ国会 早稲田別館': '武蔵野アブラ学会 早稲田別館',
    '武蔵野アブラ撃会 早稲田別館': '武蔵野アブラ学会 早稲田別館',
    '東陽町 大衆焼肉 暴飲暴食': '大衆焼肉 暴飲暴食 東陽町',
    '大阪ホルモン ふたご 六本木店': '大阪ホルモン ふたご 六本木',
    'ITAMAE SUSHI 愛宏店': '東京寿司 ITAMAE SUSHI 愛宕店',
    '東京寿司 ITAMAE SUSHI 愛宏店': 'ITAMAE SUSHI 愛宕店',
    '東京寿司 ITAMAE SUSHI 愛容店': 'ITAMAE SUSHI 愛宕店',
    '品川学雲高等学校 (SUPER ElGHT': '品川区立小山台高等学校',
    '菓匠 千鳥屋宗家 (WEST': '千鳥屋宗家',
    '浅草たい焼き工房 求楽 亀梨和也': '浅草たい焼き工房 求楽',
    '三一ト矢澤': 'ミート矢澤',
    'Meat Garage (Kis-My-FtZ': 'Meat Garage 渋谷',
    '火村 (ファチョン': '火村',
    '野爽館 (スーソウカン) 職安店': '野爽館 職安通り',
    'lC coffee 井の頭公園店': 'IC coffee 井の頭公園',
    '博多元気一林川': '博多元気一杯',
    'go slow caravan ソラマチ店': 'go slow caravan 東京スカイツリータウン',
    'TiCTAC 東京ソラマチ店': 'TiCTAC スカイツリータウン店',
    'P匠の心つくし つるとんたん 羽田空港店': 'つるとんたん 羽田空港店',
    'スターバックス リザーブ回 ロースタリー 東京': 'スターバックス リザーブ ロースタリー 東京',
    'スターバックス リザーブ回 ロースタリー': 'スターバックス リザーブ ロースタリー 東京',
    'あて鮎 喜重朗': 'あて鮨 喜重朗',
    'ラーメン荘 歴史を刻め 世田谷': 'ラーメン荘 歴史を刻め',
    'ブレッツカフェ クレープリー 表参道店': 'ブレッツカフェ 表参道',
    'マルキュウ越食堂': 'まるきゅう食堂',
    '博多元気一林川': '博多元気一杯!!',
    '博多ラーメン・ちゃんぽん ひるとよる': '博多ラーメン 昼と夜 博多',
    'エキマルシェ新大阪他': 'エキマルシェ新大阪',
    'Donish Coffee Company 神楽坂コーヒースタンド': 'Donish Coffee Company 神楽坂',
    'ガリバーズデッキ': 'GULLIVER S DECK 東京',
    '純奥茶 ローヤル': 'ローヤル珈琲店 東京',
    'oERumPJPt1g': '',
    'ブラッスリー・サリュー': 'ブラッスリー・サリュー 東京',
    'ブラッスリー・サリュ': 'ブラッスリー サリュ 東京',
    '茜屋珈琲店': '茜屋珈琲店 京都',
    'レモンサワ': 'Lemon Sour Tokyo',
    'オレンジワイン': 'Orange Wine Bar Tokyo',
}

def clean_name(name):
    """OCRエラーを修正した店名を返す"""
    if name in NAME_CORRECTIONS:
        return NAME_CORRECTIONS[name]
    # 末尾の括弧内のゴミを除去
    cleaned = re.sub(r'\s*[\(（].{0,20}$', '', name).strip()
    # グループ名を除去
    groups = ['Snow Man', 'SixTONES', 'なにわ男子', 'Aぇ! group', '嵐', 'WEST.',
              'King & Prince', 'Hey! Say! JUMP', 'Travis Japan', 'SUPER EIGHT',
              'Kis-My-Ft2', 'NEWS', 'timelesz', 'TravisJapan', 'ストチューブ']
    for g in groups:
        cleaned = cleaned.replace(g, '').strip()
    return cleaned if cleaned else name

def try_geocode(geo, query):
    try:
        result = geo.geocode(query, language='ja')
        time.sleep(1.1)
        if result and 24 <= result.latitude <= 46 and 123 <= result.longitude <= 146:
            return result
    except GeocoderTimedOut:
        time.sleep(2)
    return None

def main():
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    geo = Nominatim(user_agent='pineapple_paws_fix_v3', timeout=10)

    c.execute('''SELECT id, name, address FROM spots
                 WHERE round(lat,4)=35.6762 AND round(lng,4)=139.6503
                 ORDER BY id''')
    rows = c.fetchall()
    print(f'残りデフォルト座標: {len(rows)}件')

    geocoded = 0
    still_failed = []

    for sid, sname, addr in rows:
        result = None

        # 試行1: 住所
        if addr:
            result = try_geocode(geo, addr)

        # 試行2: 修正済み名前
        if not result:
            cleaned = clean_name(sname)
            if cleaned and cleaned != sname:
                result = try_geocode(geo, cleaned + ' 日本')
            elif cleaned:
                result = try_geocode(geo, cleaned + ' 日本')

        if result:
            lat, lng = result.latitude, result.longitude
            c.execute('UPDATE spots SET lat=?, lng=? WHERE id=?', (lat, lng, sid))
            print(f'  OK id={sid} {sname[:25]}: ({lat:.4f},{lng:.4f}) ← {clean_name(sname)[:25]}')
            geocoded += 1
        else:
            still_failed.append((sid, sname))

        if geocoded % 10 == 0:
            conn.commit()

    conn.commit()
    print(f'\n成功: {geocoded}件 / 失敗: {len(still_failed)}件')
    print('\n=== まだデフォルト座標のスポット（手動対応必要）===')
    for sid, sname in still_failed:
        print(f'  id={sid}: {sname}')

    c.execute('SELECT COUNT(*) FROM spots WHERE round(lat,4)=35.6762 AND round(lng,4)=139.6503')
    print(f'\n残りデフォルト座標: {c.fetchone()[0]}件')
    conn.close()

if __name__ == '__main__':
    main()
