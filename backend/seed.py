"""
Princess Pineapple Paws — 初期データ投入スクリプト

グループ情報出典: https://starto.jp/s/p/search/artist (2026-03-30 時点)

スポットデータ出典:
  - YouTube公式チャンネル概要欄・MV
  - まっぷるウェブ 聖地巡礼まとめ記事
  - 聖地しおり帖 (seichi-shioricho.com)
  - 手賀沼フィルムコミッション
  - filminglocation-star.com
  - 各ファンブログ（閉店確認済みスポットは除外）

Usage:
    cd backend
    python seed.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from database import init_db, SessionLocal
from models import Spot
from services.freshness import calc_pineapple

SEED_SPOTS = [
    # ===== SixTONES =====
    {
        "name": "自由学園明日館",
        "address": "東京都豊島区西池袋2-31-3",
        "lat": 35.730, "lng": 139.710,
        "talent_name": "SixTONES", "group_name": "SixTONES",
        "media_type": "YouTube",
        "media_title": "Everlasting ~Good Times-Live with Choir ver.-（アルバム『CITY』初回盤特典映像）",
        "broadcast_date": "2021-01-01",
        "access_info": "フランク・ロイド・ライト設計の国指定重要文化財。講堂でMV特典映像撮影。見学・カフェ利用可。JR池袋駅西口から徒歩7分。",
        "source_url": "https://news.yahoo.co.jp/expert/articles/dddc2ccfbb5bfaf19520d357f4afa19bf09a8709",
    },
    {
        "name": "加藤学園御殿場キャンパス（旧富士フェニックス短期大学）",
        "address": "静岡県御殿場市水土野81-1",
        "lat": 35.297, "lng": 138.930,
        "talent_name": "SixTONES", "group_name": "SixTONES",
        "media_type": "YouTube",
        "media_title": "アンセム（Anthem）MV",
        "broadcast_date": "2024-01-01",
        "access_info": "廃校を利用した「University SixTONES」ロゴが随所に登場するMV撮影地。外観見学可（敷地内立入不可）。JR御殿場駅からバス。",
        "source_url": "https://kosodate-and.net/sixtones-ansemu-university/",
    },
    {
        "name": "ホテルニューアカオ跡地（昭和100年記念）",
        "address": "静岡県熱海市熱海1993-250",
        "lat": 35.099, "lng": 139.099,
        "talent_name": "SixTONES", "group_name": "SixTONES",
        "media_type": "YouTube",
        "media_title": "わたし（MV）",
        "broadcast_date": "2022-01-01",
        "access_info": "2021年閉館の熱海の老舗ホテル跡地。アートイベント開催時のみ入場可能。SixTONES公式カレンダー撮影地でもある。JR熱海駅からバス。",
        "source_url": "https://yuruyurutime.com/watasi-mv/",
    },

    # ===== Snow Man =====
    {
        "name": "若竹の杜 若山農場",
        "address": "栃木県宇都宮市宝木本町2018",
        "lat": 36.597, "lng": 139.862,
        "talent_name": "Snow Man", "group_name": "Snow Man",
        "media_type": "YouTube",
        "media_title": "One（MV）",
        "broadcast_date": "2024-01-01",
        "access_info": "TVアニメ「ブルーロック」エンディングテーマMVの竹林シーン撮影地。24ヘクタールの竹林。「るろうに剣心」「キングダム」ロケ地でもある。JR宇都宮駅からタクシー約20分。",
        "source_url": "https://filminglocation-star.com/snowman-one/",
    },
    {
        "name": "大谷資料館（大谷石地下採掘場跡）",
        "address": "栃木県宇都宮市大谷町909",
        "lat": 36.601, "lng": 139.831,
        "talent_name": "Snow Man", "group_name": "Snow Man",
        "media_type": "YouTube",
        "media_title": "EMPIRE（ダンスプラクティス映像）",
        "broadcast_date": "2023-01-01",
        "access_info": "大谷石地下採掘場跡でダンスプラクティス映像を撮影。幻想的な地下空間。JR宇都宮駅からバス「大谷・資料館前」下車すぐ。",
        "source_url": "https://filminglocation-star.com/snowman-empire/",
    },
    {
        "name": "はまぼうブリッジ（浜茄子橋）",
        "address": "静岡県下田市吉佐美1900-4",
        "lat": 34.645, "lng": 138.934,
        "talent_name": "Snow Man", "group_name": "Snow Man",
        "media_type": "YouTube",
        "media_title": "君は僕のもの（MV）",
        "broadcast_date": "2024-01-01",
        "access_info": "MV冒頭で目黒蓮・ラウールが渡る吊り橋シーン。伊豆下田の海沿いの橋。伊豆急行 伊豆急下田駅からバスまたはタクシー。",
        "source_url": "https://ha-hana.com/snowman-kimibokumv/",
    },
    {
        "name": "野沢温泉スキージャンプ台（シャンツェ）",
        "address": "長野県下高井郡野沢温泉村豊郷",
        "lat": 36.927, "lng": 138.444,
        "talent_name": "Snow Man", "group_name": "Snow Man",
        "media_type": "TV",
        "media_title": "STARS（MV）TBSスポーツ2026テーマ曲",
        "broadcast_date": "2025-01-01",
        "access_info": "野沢温泉ジュニアスキークラブの子供たちと共演したスキージャンプシーン撮影地。飯山駅からバス約30分。",
        "source_url": "https://seichi-shioricho.com/snowman-stars-mv/",
    },
    {
        "name": "日本大学文理学部 陸上競技場",
        "address": "東京都世田谷区桜上水3-25-40",
        "lat": 35.661, "lng": 139.630,
        "talent_name": "Snow Man", "group_name": "Snow Man",
        "media_type": "TV",
        "media_title": "STARS（MV）TBSスポーツ2026テーマ曲",
        "broadcast_date": "2025-01-01",
        "access_info": "陸上競技（トラック・フィールド）シーン撮影地。全天候型400mトラック。京王線桜上水駅から徒歩5分。",
        "source_url": "https://seichi-shioricho.com/snowman-stars-mv/",
    },

    # ===== Hey! Say! JUMP =====
    {
        "name": "ACAO FOREST（アカオフォレスト）",
        "address": "静岡県熱海市上多賀1027-8",
        "lat": 35.065, "lng": 139.103,
        "talent_name": "Hey! Say! JUMP", "group_name": "Hey! Say! JUMP",
        "media_type": "YouTube",
        "media_title": "Fate or Destiny（MV）",
        "broadcast_date": "2022-08-01",
        "access_info": "閉館したホテルニューアカオを再整備した13のテーマガーデン。MV撮影地。無休9:00〜17:00。JR熱海駅からバス約25分。",
        "source_url": "https://www.mapple.net/original/397248/",
    },
    {
        "name": "富津公園 明治百年記念展望塔",
        "address": "千葉県富津市富津2280",
        "lat": 35.297, "lng": 139.809,
        "talent_name": "Hey! Say! JUMP", "group_name": "Hey! Say! JUMP",
        "media_type": "YouTube",
        "media_title": "Fate or Destiny（MV）",
        "broadcast_date": "2022-08-01",
        "access_info": "五葉松の形をした高さ29mの展望塔。「Fate or Destiny」MV撮影地。富津公園内。JR君津駅からバス約20分。",
        "source_url": "https://www.mapple.net/original/397248/",
    },
    {
        "name": "富士急ハイランド",
        "address": "山梨県富士吉田市新西原5-6-1",
        "lat": 35.483, "lng": 138.786,
        "talent_name": "Hey! Say! JUMP", "group_name": "Hey! Say! JUMP",
        "media_type": "TV",
        "media_title": "いただきハイジャンプ（2022年12月放送）",
        "broadcast_date": "2022-12-01",
        "access_info": "クイズゲームを行いながら「FUJIYAMA」コースターに乗車。番組ロケ地。富士急行線 富士急ハイランド駅すぐ。",
        "source_url": "https://www.mapple.net/original/397248/",
    },
    {
        "name": "ホテルスプリングス幕張プレミア",
        "address": "千葉県千葉市美浜区ひび野1-11",
        "lat": 35.650, "lng": 140.035,
        "talent_name": "Hey! Say! JUMP", "group_name": "Hey! Say! JUMP",
        "media_type": "YouTube",
        "media_title": "群青ランナウェイ（MV）",
        "broadcast_date": "2021-07-01",
        "access_info": "地下駐車場や客室でホラーサスペンス仕立てのMVを撮影。2024年9月に「Premier」としてリニューアルオープン。JR海浜幕張駅から徒歩約15分。",
        "source_url": "https://www.mapple.net/original/397248/",
    },

    # ===== WEST. =====
    {
        "name": "那珂湊駅（ひたちなか海浜鉄道）",
        "address": "茨城県ひたちなか市釈迦町22-2",
        "lat": 36.385, "lng": 140.574,
        "talent_name": "WEST.", "group_name": "WEST.",
        "media_type": "YouTube",
        "media_title": "しあわせの花（MV）",
        "broadcast_date": "2023-01-01",
        "access_info": "ひたちなか海浜鉄道沿線で撮影されたMV。那珂湊駅の待合室・ホームシーン。ピンクのミキ300-103が特徴的。JR勝田駅からひたちなか海浜鉄道で約20分。",
        "source_url": "https://jwest.jp/mv_siawase-no-hana/",
    },
    {
        "name": "国営ひたち海浜公園",
        "address": "茨城県ひたちなか市馬渡字大沼605-4",
        "lat": 36.396, "lng": 140.594,
        "talent_name": "WEST.", "group_name": "WEST.",
        "media_type": "YouTube",
        "media_title": "しあわせの花（MV）",
        "broadcast_date": "2023-01-01",
        "access_info": "MV最後のガーベラクローズアップシーン撮影地。コキア（秋）やネモフィラ（春）で有名な国営公園。JR勝田駅からバス約15分。",
        "source_url": "https://jwest.jp/mv_siawase-no-hana/",
    },
    {
        "name": "ヘレナリゾートいわき（ヘレナ国際ホテル）",
        "address": "福島県いわき市添野町頭巾平66-3",
        "lat": 37.013, "lng": 140.890,
        "talent_name": "WEST.", "group_name": "WEST.",
        "media_type": "YouTube",
        "media_title": "しらんけど（MV）",
        "broadcast_date": "2022-01-01",
        "access_info": "廃墟風の会員制ホテルでMV撮影。King Gnu「白日」など多数のMV・映画ロケ地。ロケ撮影施設として現在も稼働中。JRいわき駅からタクシー約30分。",
        "source_url": "https://elpisiris.com/2092.html",
    },

    # ===== なにわ男子 =====
    {
        "name": "ロングウッドステーション（Long Wood Station）",
        "address": "千葉県長生郡長柄町山之郷67-1",
        "lat": 35.479, "lng": 140.183,
        "talent_name": "なにわ男子", "group_name": "なにわ男子",
        "media_type": "YouTube",
        "media_title": "初心LOVE（うぶらぶ）MV",
        "broadcast_date": "2021-11-03",
        "access_info": "ガソリンスタンドで働く7人が客に一目惚れする青春群像劇MV撮影地。Kis-My-Ft2・日向坂46などのロケ地でもある。JR茂原駅からタクシー約15分。",
        "source_url": "https://beko-diary417.com/naniwadanshi-mv-basho/",
    },
    {
        "name": "浅草花やしき",
        "address": "東京都台東区浅草2-28-1",
        "lat": 35.714, "lng": 139.795,
        "talent_name": "なにわ男子", "group_name": "なにわ男子",
        "media_type": "YouTube",
        "media_title": "なにわ男子の初めての東京観光！（公式YouTube）",
        "broadcast_date": "2021-01-01",
        "access_info": "なにわ男子が公式YouTubeで初めての東京観光を行ったアミューズメントパーク。ジェットコースターに挑戦。東京メトロ浅草駅から徒歩5分。",
        "source_url": "https://www.mapple.net/original/394823/",
    },
    {
        "name": "東京スカイツリー",
        "address": "東京都墨田区押上1-1-2",
        "lat": 35.710, "lng": 139.810,
        "talent_name": "なにわ男子", "group_name": "なにわ男子",
        "media_type": "YouTube",
        "media_title": "なにわ男子の初めての東京観光！（公式YouTube）",
        "broadcast_date": "2021-01-01",
        "access_info": "なにわ男子が公式YouTube東京観光動画で訪れたランドマーク。東京メトロ半蔵門線・押上駅 B3出口すぐ。",
        "source_url": "https://www.mapple.net/original/394823/",
    },
    {
        "name": "横浜八景島シーパラダイス",
        "address": "神奈川県横浜市金沢区八景島",
        "lat": 35.326, "lng": 139.633,
        "talent_name": "なにわ男子", "group_name": "なにわ男子",
        "media_type": "TV",
        "media_title": "俺のスカート、どこ行った？（ドラマ・2019年）",
        "broadcast_date": "2019-01-01",
        "access_info": "なにわ男子メンバーが出演した2019年ドラマのロケ地。シーサイドライン 八景島駅すぐ。",
        "source_url": "https://www.mapple.net/original/394823/",
    },

    # ===== King & Prince（エージェント契約）=====
    {
        "name": "恵比寿ガーデンプレイス",
        "address": "東京都渋谷区恵比寿4-20-3",
        "lat": 35.646, "lng": 139.716,
        "talent_name": "平野紫耀", "group_name": "King & Prince",
        "media_type": "TV",
        "media_title": "花のち晴れ〜花男 Next Season〜（ドラマ・2018年）",
        "broadcast_date": "2018-04-17",
        "access_info": "平野紫耀出演ドラマのロケ地。時計広場での待ち合わせシーン。「King & Princeる。」TV番組（2022年4月9日放送）でも訪問。JR恵比寿駅から徒歩5分。",
        "source_url": "https://www.mapple.net/original/376765/",
    },
    {
        "name": "水の広場公園",
        "address": "東京都江東区有明3-2",
        "lat": 35.628, "lng": 139.779,
        "talent_name": "King & Prince", "group_name": "King & Prince",
        "media_type": "雑誌",
        "media_title": "I Promise（シングルジャケット写真・通常盤）",
        "broadcast_date": "2020-01-01",
        "access_info": "観覧車を望む八角形モニュメントのある公園でジャケット写真撮影。ドラマ「受付のジョー」でも使用。りんかい線 国際展示場駅から徒歩5分。",
        "source_url": "https://www.mapple.net/original/376765/",
    },
    {
        "name": "渋谷サクラステージ",
        "address": "東京都渋谷区桜丘町1-1",
        "lat": 35.656, "lng": 139.697,
        "talent_name": "永瀬廉", "group_name": "King & Prince",
        "media_type": "雑誌",
        "media_title": "What We Got ～奇跡はきみと～ / I Know（初回限定盤ジャケット写真）",
        "broadcast_date": "2025-01-01",
        "access_info": "永瀬廉・高橋海人がエスカレーターで撮影したジャケット写真のロケ地。2024年7月全面開業の新複合施設。JR渋谷駅 新南口から徒歩1分。",
        "source_url": "https://kosodate-and.net/kinpri-iknow-escalator/",
    },
    {
        "name": "浅草寺（浅草エリア）",
        "address": "東京都台東区浅草2-3-1",
        "lat": 35.714, "lng": 139.796,
        "talent_name": "King & Prince", "group_name": "King & Prince",
        "media_type": "YouTube",
        "media_title": "King & Princeる。（TV番組・2022年4月9日放送）",
        "broadcast_date": "2022-04-09",
        "access_info": "TV番組「King & Princeる。」で浅草地下商店街・人力車ツアーなどを体験。東京メトロ浅草駅から徒歩5分。",
        "source_url": "https://www.mapple.net/original/376765/",
    },
    {
        "name": "モビリティリゾートもてぎ",
        "address": "栃木県芳賀郡茂木町桧山120-1",
        "lat": 36.529, "lng": 140.219,
        "talent_name": "King & Prince", "group_name": "King & Prince",
        "media_type": "YouTube",
        "media_title": "僕らのGreat Journey（YouTube企画）",
        "broadcast_date": "2022-01-01",
        "access_info": "King & PrinceがYouTube企画内でアトラクションを楽しんだロケ地。北関東自動車道 真岡ICから車で約40分。",
        "source_url": "https://tsuzuki-fam.com/kp-greatjourney-location/",
    },

    # ===== 嵐（エージェント契約）=====
    {
        "name": "SHIBUYA SKY（渋谷スカイ）",
        "address": "東京都渋谷区渋谷2-24-12 渋谷スクランブルスクエア46F・屋上",
        "lat": 35.658, "lng": 139.702,
        "talent_name": "嵐", "group_name": "嵐",
        "media_type": "YouTube",
        "media_title": "Turning Up（MV）",
        "broadcast_date": "2019-10-18",
        "access_info": "地上229mの展望施設。嵐がエスカレーターを駆け上がりダンスするシーン撮影。ファン聖地として人気。JR渋谷駅 B6出口直結。",
        "source_url": "https://kimamanidance.hatenablog.com/entry/2022/12/31/180000",
    },
    {
        "name": "宮地嶽神社",
        "address": "福岡県福津市宮司元町7-1",
        "lat": 33.763, "lng": 130.497,
        "talent_name": "嵐", "group_name": "嵐",
        "media_type": "TV",
        "media_title": "JAL「先得」CM（嵐出演）",
        "broadcast_date": "2016-01-01",
        "access_info": "嵐5人が出演したJALのCMロケ地。年2回（2月・10月）夕陽が参道と海を一直線につなぐ「光の道」が絶景。授与所9〜19時。JR福間駅からバスまたはタクシー。",
        "source_url": "https://www.jalan.net/news/article/319521/",
    },
    {
        "name": "大横川親水公園",
        "address": "東京都墨田区横川1丁目〜錦糸1丁目",
        "lat": 35.698, "lng": 139.806,
        "talent_name": "嵐", "group_name": "嵐",
        "media_type": "YouTube",
        "media_title": "君のうた（MV）",
        "broadcast_date": "2019-10-09",
        "access_info": "大野智が「町と公園をのんびり散策」するシーンを撮影した全長1.85kmの親水公園。JR錦糸町駅 北口から徒歩約10分。",
        "source_url": "https://sumida.goguynet.jp/2020/01/08/sasayakafe-arashi/",
    },
    {
        "name": "SASAYA CAFE（ささやカフェ）",
        "address": "東京都墨田区横川1-1-10",
        "lat": 35.699, "lng": 139.805,
        "talent_name": "嵐", "group_name": "嵐",
        "media_type": "YouTube",
        "media_title": "君のうた（MV）",
        "broadcast_date": "2019-10-09",
        "access_info": "大横川親水公園沿いのオーガニック＆ヴィーガンカフェ。嵐5人が揃って撮影されたシーン。2025年も営業中（8:30〜18:00）。JR錦糸町駅から徒歩約10分。",
        "source_url": "https://sumida.goguynet.jp/2020/01/08/sasayakafe-arashi/",
    },
    {
        "name": "喫茶ランドリー",
        "address": "東京都墨田区千歳2-6-9",
        "lat": 35.701, "lng": 139.810,
        "talent_name": "嵐", "group_name": "嵐",
        "media_type": "YouTube",
        "media_title": "君のうた（MV）",
        "broadcast_date": "2019-10-09",
        "access_info": "松本潤が撮影した、店内にランドリーが設置された喫茶店。2025年も営業中（11:00〜18:00）。JR錦糸町駅から徒歩約12分。",
        "source_url": "https://kimamanidance.hatenablog.com/entry/2023/01/01/180000",
    },

    # ===== Travis Japan =====
    {
        "name": "宮ノ森公園（手賀沼エリア）",
        "address": "千葉県我孫子市布佐",
        "lat": 35.868, "lng": 140.050,
        "talent_name": "Travis Japan", "group_name": "Travis Japan",
        "media_type": "YouTube",
        "media_title": "Say I do（MV）",
        "broadcast_date": "2025-03-01",
        "access_info": "手賀沼フィルムコミッション協力のもとMV撮影。桜並木の公園でシーン撮影。JR成田線 布佐駅から徒歩約15分。",
        "source_url": "https://teganumafilmcom.net/2025/03/14/travis-japan%E3%80%8Csay-i-do%E3%80%8D%E3%83%9F%E3%83%A5%E3%83%BC%E3%82%B8%E3%83%83%E3%82%AF%E3%83%93%E3%83%87%E3%82%AA%E3%83%AD%E3%82%B6%E5%8A%9B/",
    },
    {
        "name": "愛宕神社",
        "address": "東京都港区愛宕1-5-3",
        "lat": 35.667, "lng": 139.749,
        "talent_name": "Travis Japan", "group_name": "Travis Japan",
        "media_type": "YouTube",
        "media_title": "【初ドライブ】カーナビ禁止で開運スポット巡り（公式YouTube）",
        "broadcast_date": "2022-01-01",
        "access_info": "Travis JapanがYouTubeカーナビ禁止ドライブ企画で訪れた開運スポット。\"出世の石段\"として有名な急勾配の石段あり。東京メトロ神谷町駅から徒歩5分。",
        "source_url": "https://mim1log.com/oshi/travis-japan-tokyo/",
    },
]


def run():
    print("データベースを初期化中...")
    init_db()

    db = SessionLocal()
    try:
        existing = db.query(Spot).count()
        if existing > 0:
            print(f"既存データ {existing}件 を削除して再投入します...")
            db.query(Spot).delete()
            db.commit()

        print(f"{len(SEED_SPOTS)} スポットを投入中...")
        for i, data in enumerate(SEED_SPOTS):
            score, visual = calc_pineapple(data.get("broadcast_date", ""))
            spot = Spot(
                **data,
                pineapple_score=score,
                freshness_visual=visual,
            )
            db.add(spot)
            print(f"  [{i+1:02d}] {data['group_name']:20s} | {data['name']} ({visual}, score={score})")

        db.commit()
        print(f"\n完了！ {len(SEED_SPOTS)}件投入しました。")

    finally:
        db.close()


if __name__ == "__main__":
    run()
