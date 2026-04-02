"""全ブログページを一括インポートするスクリプト"""
import subprocess, sys

configs = [
    ('sixtones_youtube.txt',   'SixTONES',    '',           'YouTube', 'SixTONES YouTubeチャンネル',       'https://fananablog.com/sixtones-seichi-youtube/'),
    ('ae_youtube.txt',         'Aぇ! group',  '',           'YouTube', 'Aぇちゅーぶ',                       'https://fananablog.com/agroup-youtube-seichi/'),
    ('ae_acchikocchi.txt',     'Aぇ! group',  '',           'TV',      'あっちこっちAぇ!',                  'https://fananablog.com/agroup-acchikocchi-seichi/'),
    ('ae_yamaguchi.txt',       'Aぇ! group',  '',           'TV',      'あっちこっちAぇ!（山口県）',         'https://fananablog.com/agroup-acchikocchi-seichi-yamaguchi/'),
    ('ae_tochigi.txt',         'Aぇ! group',  '',           'TV',      'あっちこっちAぇ!（栃木県）',         'https://fananablog.com/agroup-acchikocchi-seichi-tochigi/'),
    ('ae_ibaraki.txt',         'Aぇ! group',  '',           'TV',      'あっちこっちAぇ!（茨城県）',         'https://fananablog.com/agroup-acchikocchi-seichi-ibaraki/'),
    ('ae_qa.txt',              'Aぇ! group',  '',           'TV',      'Q＆Aぇ!',                           'https://fananablog.com/agroup-qa-seichi-kaiun/'),
    ('sekkaku_nagoya.txt',     'Snow Man',    '阿部亮平',   'TV',      'バナナマンのせかっくグルメ!!',       'https://fananablog.com/sekkaku-20260104-seichi/'),
    ('sekkaku_kawagoe.txt',    'Snow Man',    '佐久間大介', 'TV',      'バナナマンのせかっくグルメ!!',       'https://fananablog.com/sekkaku-20251123-seichi/'),
]

for fname, group, talent, mtype, mtitle, src in configs:
    cmd = [sys.executable, 'import_blog.py', fname,
           '--group', group, '--media_type', mtype,
           '--media_title', mtitle, '--source_url', src]
    if talent:
        cmd += ['--talent', talent]
    print(f'=== {fname} ({group}) ===', flush=True)
    result = subprocess.run(cmd, capture_output=False, text=True, encoding='utf-8', errors='replace')
