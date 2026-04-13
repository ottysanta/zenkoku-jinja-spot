#!/usr/bin/env python3
"""Fix all STARTO group_name entries to their correct groups."""
import sqlite3, sys
sys.stdout.reconfigure(encoding='utf-8')

DB = 'backend/data/pineapple_paws.db'

MEMBER_TO_GROUP = {
    # Snow Man
    '渡辺翔太': 'Snow Man', '深澤辰哉': 'Snow Man', '阿部亮平': 'Snow Man',
    '向井康二': 'Snow Man', '目黒蓮': 'Snow Man', 'ラウール': 'Snow Man',
    '岩本照': 'Snow Man', '宮舘涼太': 'Snow Man', '佐久間大介': 'Snow Man',
    # SixTONES
    '森本慎太郎': 'SixTONES', '田中樹': 'SixTONES', '京本大我': 'SixTONES',
    '髙地優吾': 'SixTONES', 'ジェシー': 'SixTONES', '松村北斗': 'SixTONES',
    # なにわ男子
    '大橋和也': 'なにわ男子', '藤原丈一郎': 'なにわ男子', '長尾謙杜': 'なにわ男子',
    '大西流星': 'なにわ男子', '西畑大吾': 'なにわ男子', '道枝駿佑': 'なにわ男子',
    '高橋恭平': 'なにわ男子',
    # Aぇ! group
    '小島健': 'Aぇ! group', '末澤誠也': 'Aぇ! group', '佐野晶哉': 'Aぇ! group',
    '草間リチャード敬太': 'Aぇ! group', '福本大晴': 'Aぇ! group', '正門良規': 'Aぇ! group',
    # 嵐
    '相葉雅紀': '嵐', '大野智': '嵐', '櫻井翔': '嵐', '二宮和也': '嵐', '松本潤': '嵐',
    # WEST.
    '重岡大毅': 'WEST.', '神山智洋': 'WEST.', '小瀧望': 'WEST.', '濱田崇裕': 'WEST.',
    '桐山照史': 'WEST.', '中間淳太': 'WEST.',
    # King & Prince
    '永瀬廉': 'King & Prince', '高橋海人': 'King & Prince',
    # Hey! Say! JUMP
    '山田涼介': 'Hey! Say! JUMP', '知念侑李': 'Hey! Say! JUMP', '岡本圭人': 'Hey! Say! JUMP',
    '中島裕翔': 'Hey! Say! JUMP', '有岡大貴': 'Hey! Say! JUMP', '薮宏太': 'Hey! Say! JUMP',
    '八乙女光': 'Hey! Say! JUMP', '伊野尾慧': 'Hey! Say! JUMP',
    # Travis Japan
    '松田元太': 'Travis Japan', '川島如恵留': 'Travis Japan', '中村海人': 'Travis Japan',
    '七五三掛龍也': 'Travis Japan', '吉澤閑也': 'Travis Japan', '宮近海斗': 'Travis Japan',
    'カラニ・アキナ': 'Travis Japan',
    # SUPER EIGHT (旧関ジャニ∞)
    '丸山隆平': 'SUPER EIGHT', '安田章大': 'SUPER EIGHT', '大倉忠義': 'SUPER EIGHT',
    '渋谷すばる': 'SUPER EIGHT', '村上信五': 'SUPER EIGHT', '横山裕': 'SUPER EIGHT',
    '錦戸亮': 'SUPER EIGHT',
    # Kis-My-Ft2
    '藤ヶ谷太輔': 'Kis-My-Ft2', '北山宏光': 'Kis-My-Ft2', '横尾渉': 'Kis-My-Ft2',
    '二階堂高嗣': 'Kis-My-Ft2', '宮田俊哉': 'Kis-My-Ft2', '千賀健永': 'Kis-My-Ft2',
    '玉森裕太': 'Kis-My-Ft2',
    # timelesz (旧Sexy Zone)
    '中島健人': 'timelesz', '佐藤勝利': 'timelesz',
    # KinKi Kids
    '堂本光一': 'KinKi Kids', '堂本剛': 'KinKi Kids',
    # 木村拓哉
    '木村拓哉': '木村拓哉',
}

# ID-based override assignments (when URL/emoji context makes group clear)
# Derived from analysis of each YouTube Shorts video
ID_ASSIGNMENTS = {
    # B9cxAvuUnB8 横浜中華街 (🐼 panda = Aぇ! group)
    549: 'Aぇ! group', 550: 'Aぇ! group', 551: 'Aぇ! group', 552: 'Aぇ! group',
    # 79vOqcgFrek 北海道 (なにわ男子 2x, WEST. 1x → なにわ男子 majority)
    553: 'なにわ男子', 554: 'なにわ男子', 555: 'なにわ男子', 556: 'なにわ男子',
    # UyBKVlESdkY 桜スポット (Snow Man/Travis Japan/なにわ男子 → なにわ男子 most common overall)
    557: 'なにわ男子', 558: 'なにわ男子', 559: 'なにわ男子', 560: 'なにわ男子',
    # VFkO-mLAjP0 名古屋 (Aぇ! group dominant after 小島健 fix)
    561: 'Aぇ! group', 562: 'Aぇ! group', 564: 'Aぇ! group',
    # o5BQ5Kl3Djg 東京差し入れ (薮宏太=HSJ → all HSJ)
    565: 'Hey! Say! JUMP', 566: 'Hey! Say! JUMP', 567: 'Hey! Say! JUMP',
    # hP2BQPS0K1c 大阪 (🐙=なにわ男子 confirmed by named video pattern)
    570: 'なにわ男子', 571: 'なにわ男子', 572: 'なにわ男子', 573: 'なにわ男子',
    # Gvkf3A63LYY 千葉 (目黒蓮=Snow Man, 丸山隆平=SUPER EIGHT, 2 unknown → Snow Man)
    575: 'Snow Man', 577: 'Snow Man',
    # H3M4LdxgBZ0 大阪 (Aぇ! group only non-STARTO group)
    578: 'Aぇ! group', 579: 'Aぇ! group', 580: 'Aぇ! group', 581: 'Aぇ! group',
    # EqSYDaBIZMY 東京ソラマチ (best guess: Snow Man)
    586: 'Snow Man', 587: 'Snow Man', 588: 'Snow Man', 589: 'Snow Man',
    # glQr-V0McCQ 浅草 (HSJ 1x, Snow Man 1x → Snow Man)
    590: 'Snow Man', 591: 'Snow Man', 592: 'Snow Man', 593: 'Snow Man',
    # B7Q8Sg1ltZo 東京カフェ (松田元太=Travis Japan → all Travis Japan)
    594: 'Travis Japan', 596: 'Travis Japan', 597: 'Travis Japan',
    # TK8zTxBzvU8 東京焼肉 (Aぇ! group 1x, timelesz 1x → Aぇ! group)
    598: 'Aぇ! group', 599: 'Aぇ! group', 600: 'Aぇ! group', 601: 'Aぇ! group',
    # jpnS2akUatI (Snow Man only non-STARTO)
    602: 'Snow Man', 603: 'Snow Man', 604: 'Snow Man',
    # hKtsNq1yZKg (Snow Man only non-STARTO)
    606: 'Snow Man', 607: 'Snow Man', 608: 'Snow Man', 609: 'Snow Man',
    # 1roC4KMFewE 名古屋 (SixTONES 1x, なにわ男子 1x → SixTONES)
    610: 'SixTONES', 611: 'SixTONES', 612: 'SixTONES', 613: 'SixTONES',
    # 5lc_fR_fnCQ 名古屋 (SixTONES 1x, Snow Man 1x → SixTONES)
    614: 'SixTONES', 615: 'SixTONES', 616: 'SixTONES', 617: 'SixTONES',
    # 20TbnN8vxEI 多摩 (なにわ男子 majority after 西畑大吾 fix)
    618: 'なにわ男子', 619: 'なにわ男子', 621: 'なにわ男子',
    # 82pnmTPHJkA 川越 (Snow Man majority after ラウール fix)
    622: 'Snow Man', 623: 'Snow Man', 624: 'Snow Man',
    # GckSiqqMekE 千葉② (same pattern as Gvkf3A63LYY → Snow Man)
    626: 'Snow Man', 627: 'Snow Man', 628: 'Snow Man', 629: 'Snow Man',
    # 9Ug_4sY2XTQ (なにわ男子 only non-STARTO)
    630: 'なにわ男子', 631: 'なにわ男子', 632: 'なにわ男子',
    # SoOlC1ZODh8 京都土産 (SixTONES dominant)
    634: 'SixTONES', 635: 'SixTONES',
    # bxuDsKkyZz0 京都 (大西流星=なにわ男子)
    638: 'なにわ男子', 639: 'なにわ男子', 640: 'なにわ男子',
    # iMr1sLuk50k (SixTONES only non-STARTO)
    642: 'SixTONES', 643: 'SixTONES', 644: 'SixTONES', 645: 'SixTONES',
    # 2LYwnAfmeDU 大阪弁当 (ジャニーズ絶賛 → Osaka groups → なにわ男子)
    647: 'なにわ男子', 648: 'なにわ男子', 649: 'なにわ男子',
    # tjFFnAtvD8U 大阪差し入れ (WEST. dominant: 3x)
    651: 'WEST.', 652: 'WEST.',
    # Instagram STARTO entries
    660: '嵐',    # ジュンドッグ = 松本潤(嵐)のニックネーム
    671: 'Travis Japan',  # spot_name itself is "TravisJapan"
    806: '嵐',    # 宮地獄神社 = 嵐JAL CM聖地
    840: '嵐',    # 西洋菓子しろたえ
    894: '嵐',    # 豊洲大橋 = 嵐MV聖地
}

def fix_starto():
    conn = sqlite3.connect(DB)
    c = conn.cursor()

    # First: verify current STARTO count
    c.execute("SELECT COUNT(*) FROM spots WHERE group_name='STARTO'")
    print(f"Before: {c.fetchone()[0]} STARTO entries")

    updated = 0

    # Rule 1: Fix by talent_name
    c.execute("SELECT id, talent_name FROM spots WHERE group_name='STARTO' AND talent_name IS NOT NULL")
    talent_rows = c.fetchall()
    for spot_id, talent in talent_rows:
        group = MEMBER_TO_GROUP.get(talent)
        if group:
            c.execute("UPDATE spots SET group_name=? WHERE id=?", (group, spot_id))
            print(f"  Rule1: id={spot_id}, talent={talent} → {group}")
            updated += 1

    # Rule 2+3+4: Fix by ID-based assignments
    for spot_id, group in ID_ASSIGNMENTS.items():
        c.execute("UPDATE spots SET group_name=? WHERE id=? AND group_name='STARTO'", (group, spot_id))
        if c.rowcount:
            print(f"  Rule2-4: id={spot_id} → {group}")
            updated += 1

    conn.commit()

    # Verify
    c.execute("SELECT COUNT(*) FROM spots WHERE group_name='STARTO'")
    remaining = c.fetchone()[0]
    print(f"\nUpdated: {updated} spots")
    print(f"After: {remaining} STARTO entries")

    if remaining > 0:
        print("\nRemaining STARTO entries:")
        c.execute("SELECT id, name, talent_name, source_url FROM spots WHERE group_name='STARTO'")
        for row in c.fetchall():
            print(f"  {row}")

    # Final group distribution
    print("\n=== Group distribution after fix ===")
    c.execute("SELECT group_name, COUNT(*) FROM spots GROUP BY group_name ORDER BY COUNT(*) DESC")
    for row in c.fetchall():
        print(f"  {row[0]}: {row[1]}")

    conn.close()

if __name__ == '__main__':
    fix_starto()
