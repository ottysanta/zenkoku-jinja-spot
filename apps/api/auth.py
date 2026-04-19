"""認証ユーティリティ。

- API セッショントークンは Next.js (Auth.js) との橋渡しにのみ使う短命トークン。
- 平文トークンは発行時に 1 度だけクライアントへ返却。DB には sha256 ハッシュのみ保存。
- 認可は Authorization: Bearer <token> ヘッダ経由。
- セッション有効期限は AUTH_SESSION_TTL_SEC（既定 30 日）。
"""
from __future__ import annotations

import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session as DbSession

from database import get_db
from models import Session as SessionModel, User


# === 設定 ===
AUTH_SESSION_TTL_SEC = int(os.getenv("AUTH_SESSION_TTL_SEC", str(30 * 24 * 60 * 60)))
# Auth.js (Next.js) → FastAPI /auth/sessions 呼び出しを認可するための共有シークレット。
# 本番では必ず強いランダム値を .env に設定する。
AUTH_BRIDGE_SECRET = os.getenv("AUTH_BRIDGE_SECRET", "")


# === トークンユーティリティ ===

def _now_utc() -> datetime:
    return datetime.now(tz=timezone.utc)


def _iso(dt: datetime) -> str:
    return dt.isoformat()


def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def issue_token() -> tuple[str, str]:
    """(平文, ハッシュ) を返す。平文は発行時のみ扱う。"""
    raw = secrets.token_urlsafe(48)
    return raw, hash_token(raw)


def create_session(db: DbSession, user: User, *, ttl_sec: Optional[int] = None) -> tuple[str, SessionModel]:
    raw, h = issue_token()
    ttl = ttl_sec if ttl_sec is not None else AUTH_SESSION_TTL_SEC
    now = _now_utc()
    sess = SessionModel(
        user_id=user.id,
        token_hash=h,
        expires_at=_iso(now + timedelta(seconds=ttl)),
        created_at=_iso(now),
        last_seen_at=_iso(now),
    )
    db.add(sess)
    db.commit()
    db.refresh(sess)
    return raw, sess


def revoke_session_by_token(db: DbSession, raw: str) -> bool:
    h = hash_token(raw)
    row = db.query(SessionModel).filter(SessionModel.token_hash == h).first()
    if not row:
        return False
    db.delete(row)
    db.commit()
    return True


# === 依存関数 ===

def _extract_bearer(authorization: Optional[str]) -> Optional[str]:
    if not authorization:
        return None
    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    token = parts[1].strip()
    return token or None


def get_current_user_optional(
    authorization: Optional[str] = Header(default=None),
    db: DbSession = Depends(get_db),
) -> Optional[User]:
    """Authorization ヘッダがあれば User を返す。無効なら None。例外は投げない。"""
    raw = _extract_bearer(authorization)
    if not raw:
        return None
    h = hash_token(raw)
    sess = db.query(SessionModel).filter(SessionModel.token_hash == h).first()
    if not sess:
        return None
    # 有効期限チェック（文字列比較で OK: ISO8601 は辞書順 = 時刻順）
    if sess.expires_at <= _iso(_now_utc()):
        return None
    user = db.query(User).filter(User.id == sess.user_id).first()
    if not user or user.is_suspended:
        return None
    # last_seen_at を軽く更新（最小コストで）
    sess.last_seen_at = _iso(_now_utc())
    db.commit()
    return user


def get_current_user(
    user: Optional[User] = Depends(get_current_user_optional),
) -> User:
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_bridge_secret(
    x_auth_bridge: Optional[str] = Header(default=None, alias="X-Auth-Bridge"),
) -> None:
    """Next.js (Auth.js) からのセッション発行リクエストを認可するための共有シークレット検証。"""
    if not AUTH_BRIDGE_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AUTH_BRIDGE_SECRET not configured",
        )
    if not x_auth_bridge or not secrets.compare_digest(x_auth_bridge, AUTH_BRIDGE_SECRET):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid bridge secret",
        )
