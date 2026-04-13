#!/usr/bin/env python3
"""
Fix entries where media_title='パイナップルネキ' and media_type='SNS'.
Strategy:
  1. If same source_url has spots with correct media info → copy from there
  2. Otherwise → fetch video title from YouTube oEmbed API
"""
import sqlite3, sys, time, json, urllib.request, urllib.parse
sys.stdout.reconfigure(encoding='utf-8')

DB = 'backend/data/pineapple_paws.db'

def oembed_title(youtube_url: str) -> str | None:
    api = f"https://www.youtube.com/oembed?url={urllib.parse.quote(youtube_url)}&format=json"
    try:
        with urllib.request.urlopen(api, timeout=8) as resp:
            data = json.loads(resp.read())
            return data.get('title')
    except Exception as e:
        print(f"    oEmbed error for {youtube_url}: {e}")
        return None

def fix():
    conn = sqlite3.connect(DB)
    c = conn.cursor()

    c.execute("SELECT COUNT(*) FROM spots WHERE media_title='パイナップルネキ'")
    print(f"Before: {c.fetchone()[0]} パイナップルネキ entries")

    # Get all source_urls that have bad entries
    c.execute("SELECT DISTINCT source_url FROM spots WHERE media_title='パイナップルネキ' ORDER BY source_url")
    urls = [r[0] for r in c.fetchall()]

    fixed = 0
    for url in urls:
        # Try to get correct info from same URL
        c.execute("""SELECT DISTINCT media_title, media_type FROM spots
                     WHERE source_url=? AND media_title!='パイナップルネキ'
                     LIMIT 1""", (url,))
        row = c.fetchone()

        if row:
            title, mtype = row
        else:
            # Fetch from oEmbed
            print(f"  oEmbed: {url.split('/')[-1]} ...", end='', flush=True)
            title = oembed_title(url)
            if title:
                mtype = 'YouTube'
                print(f" → {title[:60]}")
            else:
                print(" → FAILED, skipping")
                continue
            time.sleep(0.5)

        # Apply update
        c.execute("""UPDATE spots SET media_title=?, media_type=?
                     WHERE source_url=? AND media_title='パイナップルネキ'""",
                  (title, mtype, url))
        n = c.rowcount
        fixed += n
        if n:
            print(f"  Fixed {n} spots [{url.split('/')[-1]}]: {title[:55]}")

    conn.commit()

    c.execute("SELECT COUNT(*) FROM spots WHERE media_title='パイナップルネキ'")
    remaining = c.fetchone()[0]
    print(f"\nFixed: {fixed} spots")
    print(f"After: {remaining} パイナップルネキ entries remaining")

    if remaining:
        c.execute("SELECT id, name, source_url FROM spots WHERE media_title='パイナップルネキ' LIMIT 5")
        for r in c.fetchall():
            print(f"  {r}")

    conn.close()

if __name__ == '__main__':
    fix()
