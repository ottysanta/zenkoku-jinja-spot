from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

DB_PATH = DATA_DIR / "shrine_spots.db"
DEFAULT_SEARCH_RADIUS_M = 5000
MAX_NEARBY_RESULTS = 50

# === 参拝チェックイン ===
# 神社中心からの許容距離（m）。GPS誤差と境内サイズを考慮
CHECKIN_MAX_DISTANCE_M = 300
# 受け付ける GPS 精度上限（m）。これより粗い測位は拒否
CHECKIN_MIN_ACCURACY_M = 200
# 同一 client で同一神社への再チェックイン可能になる間隔（秒）
CHECKIN_COOLDOWN_SEC = 20 * 60 * 60   # 20h（同日内は実質1回）
