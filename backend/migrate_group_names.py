"""
group_names カラム追加 + データ移行スクリプト

- group_names (TEXT): JSON配列 例: '["Snow Man", "なにわ男子"]'
- よにのちゃんねる・横山会の複数グループを正しく設定
- 既存の group_name からデフォルト値を移行
"""
import sqlite3
import json
from pathlib import Path

DB_PATH = Path(__file__).parent / "data" / "pineapple_paws.db"

# よにのちゃんねる・横山会のグループマッピング
CHANNEL_GROUPS = {
    "よにのちゃんねる": ["嵐", "KAT-TUN", "Hey! Say! JUMP", "timelesz"],
    "横山会": ["SUPER EIGHT", "WEST.", "Aぇ! group", "なにわ男子"],
}

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# カラム追加（既存の場合はスキップ）
try:
    cur.execute("ALTER TABLE spots ADD COLUMN group_names TEXT")
    print("group_names カラムを追加しました")
except sqlite3.OperationalError:
    print("group_names カラムは既に存在します")

# 既存データを移行: group_name → group_names (JSON配列)
cur.execute("SELECT id, group_name, media_title FROM spots WHERE group_names IS NULL")
rows = cur.fetchall()
print(f"移行対象: {len(rows)} 件")

updated = 0
for spot_id, group_name, media_title in rows:
    # チャンネル名から複数グループを判定
    groups = None
    if media_title:
        for channel, channel_groups in CHANNEL_GROUPS.items():
            if channel in media_title:
                groups = channel_groups
                break

    # デフォルト: group_name を単一要素配列に
    if groups is None and group_name:
        groups = [group_name]
    elif groups is None:
        groups = []

    cur.execute(
        "UPDATE spots SET group_names = ? WHERE id = ?",
        (json.dumps(groups, ensure_ascii=False), spot_id)
    )
    updated += 1

conn.commit()
print(f"移行完了: {updated} 件")

# 確認
cur.execute("SELECT id, group_name, group_names, media_title FROM spots WHERE media_title IN ('よにのちゃんねる', '横山会') LIMIT 5")
print("\n=== よにのちゃんねる・横山会 確認 ===")
for row in cur.fetchall():
    print(row)

conn.close()
print("\nマイグレーション完了")
