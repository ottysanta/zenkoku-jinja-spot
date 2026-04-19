from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from config import DATABASE_URL

# SQLite はマルチスレッド対応のため connect_args が必要。
# Postgres などでは不要なので URL に応じて切り替える。
_connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=_connect_args, future=True)


# SQLite は接続ごとに foreign_keys をオンにしないと FK CASCADE が効かない。
if DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def _enable_sqlite_fk(dbapi_conn, _conn_record):  # pragma: no cover
        cur = dbapi_conn.cursor()
        cur.execute("PRAGMA foreign_keys=ON")
        cur.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def init_db():
    from models import (  # noqa: F401
        Spot, UserPost, SpotSubmission, Checkin,
        User, AuthIdentity, Session,
        Review, ReviewPhoto, Reaction, Follow, Notification, Report,
        OfferingItem, Offering, Campaign, CampaignContribution,
        ShrineBookmark,
    )
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
