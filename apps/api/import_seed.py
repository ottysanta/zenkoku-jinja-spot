"""Day-1 用：flagship_shrines.json を DB に投入する最小スクリプト。

実行:
    cd backend && python import_seed.py
"""
import json
from pathlib import Path

from database import SessionLocal, init_db
from models import Spot

SEED_FILE = Path(__file__).parent / "shrine_data" / "seed" / "flagship_shrines.json"


def run() -> None:
    init_db()
    with SEED_FILE.open("r", encoding="utf-8") as f:
        entries = json.load(f)

    session = SessionLocal()
    try:
        inserted = 0
        updated = 0
        for entry in entries:
            external_id = entry["external_id"]
            benefits = entry.get("benefits")
            benefits_json = json.dumps(benefits, ensure_ascii=False) if benefits else None

            payload = dict(
                name=entry["name"],
                address=entry.get("address"),
                lat=entry["lat"],
                lng=entry["lng"],
                shrine_type=entry.get("shrine_type"),
                deity=entry.get("deity"),
                benefits=benefits_json,
                shrine_rank=entry.get("shrine_rank"),
                founded=entry.get("founded"),
                goshuin_available=entry.get("goshuin_available"),
                goshuin_info=entry.get("goshuin_info"),
                juyohin_info=entry.get("juyohin_info"),
                prefecture=entry.get("prefecture"),
                website=entry.get("website"),
                external_id=external_id,
                source_layer="manual",
                access_info=entry.get("access_info"),
                source_url=entry.get("source_url"),
            )

            existing = session.query(Spot).filter(Spot.external_id == external_id).first()
            if existing:
                for k, v in payload.items():
                    setattr(existing, k, v)
                updated += 1
            else:
                session.add(Spot(**payload))
                inserted += 1

        session.commit()
        print(f"[import_seed] inserted={inserted}, updated={updated}, total={inserted + updated}")
    finally:
        session.close()


if __name__ == "__main__":
    run()
