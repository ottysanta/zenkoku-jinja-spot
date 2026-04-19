"""Stripe Checkout wrapper.

- 秘匿情報 (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET) は環境変数のみ。
- 小額 (integer JPY) を前提 (Stripe の JPY は zero-decimal currency)。
- main.py からは `create_checkout_session` / `construct_event` のみを呼ぶ。
"""
from __future__ import annotations

import os
from typing import Optional

try:
    import stripe  # type: ignore
except Exception:  # pragma: no cover - dev 環境で未インストールの場合
    stripe = None  # type: ignore


STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
# Next.js 側の成功/キャンセル遷移先 (絶対URL)
STRIPE_SUCCESS_URL = os.getenv(
    "STRIPE_SUCCESS_URL",
    "http://localhost:3030/offerings/success?offering_id={OFFERING_ID}&session_id={CHECKOUT_SESSION_ID}",
)
STRIPE_CANCEL_URL = os.getenv(
    "STRIPE_CANCEL_URL",
    "http://localhost:3030/offerings/cancel",
)


def _require_stripe():
    if stripe is None:
        raise RuntimeError("stripe package is not installed")
    if not STRIPE_SECRET_KEY:
        raise RuntimeError("STRIPE_SECRET_KEY is not configured")
    stripe.api_key = STRIPE_SECRET_KEY
    return stripe


def create_checkout_session(
    *,
    amount_jpy: int,
    product_name: str,
    description: Optional[str],
    offering_id: int,
    customer_email: Optional[str] = None,
):
    """Stripe Checkout セッションを発行する。

    metadata.offering_id に自前の Offering.id を紐付け、Webhook 側で参照する。
    """
    s = _require_stripe()
    # {OFFERING_ID} は自前テンプレ、{CHECKOUT_SESSION_ID} は Stripe 側のプレースホルダ
    success_url = STRIPE_SUCCESS_URL.replace("{OFFERING_ID}", str(offering_id))
    session = s.checkout.Session.create(
        mode="payment",
        payment_method_types=["card"],
        line_items=[
            {
                "price_data": {
                    "currency": "jpy",
                    "unit_amount": int(amount_jpy),
                    "product_data": {
                        "name": product_name,
                        **({"description": description} if description else {}),
                    },
                },
                "quantity": 1,
            }
        ],
        metadata={"offering_id": str(offering_id)},
        success_url=success_url,
        cancel_url=STRIPE_CANCEL_URL,
        customer_email=customer_email,
    )
    return session


def construct_event(payload: bytes, sig_header: str):
    """Webhook 署名検証つきイベント構築。失敗時は例外。"""
    s = _require_stripe()
    if not STRIPE_WEBHOOK_SECRET:
        raise RuntimeError("STRIPE_WEBHOOK_SECRET is not configured")
    return s.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
