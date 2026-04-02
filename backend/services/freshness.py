from datetime import date, datetime


def calc_pineapple(broadcast_date_str: str) -> tuple[int, str]:
    """
    情報の鮮度からパイナップルスコアと見た目フラグを計算する。

    Returns:
        (score: int 0-100, visual: "fresh" | "ripe" | "dry")
    """
    try:
        bd = datetime.strptime(broadcast_date_str, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return 50, "ripe"

    days = (date.today() - bd).days
    if days < 0:
        days = 0

    if days <= 30:
        # 新鮮（緑の葉がピンと立っている）
        score = max(95, 100 - days)
        return score, "fresh"
    elif days <= 365:
        # 完熟（黄色くて甘そう）
        progress = (days - 30) / 335   # 0.0 ~ 1.0
        score = int(94 - progress * 44)  # 94 → 50
        return max(50, score), "ripe"
    else:
        # ドライパイン（アーカイブ）
        excess = days - 365
        score = max(10, int(49 - excess / 50))
        return score, "dry"
