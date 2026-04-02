from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

DB_PATH = DATA_DIR / "pineapple_paws.db"
DEFAULT_SEARCH_RADIUS_M = 5000
MAX_NEARBY_RESULTS = 50
