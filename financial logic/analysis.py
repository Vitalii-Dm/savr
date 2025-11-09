"""Comprehensive spending analysis: trends, patterns, recurring outflows, and suggestions."""
from __future__ import annotations

import calendar
import json
import os
from collections import Counter, OrderedDict, defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta
from statistics import mean, median, stdev
from typing import Any, Callable, Dict, Iterable, List, MutableMapping, Optional, Sequence, Tuple

DISPLAY_CURRENCY = "GBP"

CATEGORY_ALIASES: Dict[str, str] = {
    "uber": "transport.ridehail",
    "bolt": "transport.ridehail",
    "lyft": "transport.ridehail",
    "tfl": "transport.public",
    "national rail": "transport.public",
    "tesco": "groceries",
    "sainsburys": "groceries",
    "sainsbury's": "groceries",
    "waitrose": "groceries",
    "aldi": "groceries",
    "lidl": "groceries",
    "deliveroo": "eating_out",
    "just eat": "eating_out",
    "starbucks": "dining.coffee",
    "pret": "dining.coffee",
    "hmrc": "taxes",
    "salary": "income.salary",
}

NECESSITY_CATEGORIES = {
    "groceries",
    "housing.rent",
    "rent",
    "utilities",
    "transport.public",
    "taxes",
}

SWAP_ELIGIBLE_CATEGORIES = {"groceries", "dining.coffee"}
LATE_NIGHT_CATEGORIES = {"eating_out", "dining.delivery"}
RIDEHAIL_CATEGORIES = {"transport.ridehail"}
RENT_CATEGORIES = {"housing.rent", "rent"}

CONFIG = {
    "winsorise_percentile": 0.99,
    "hhi_window_weeks": 8,
    "hhi_high_threshold": 0.4,
    "small_tx_threshold": 5.0,
    "small_tx_week_limit": 6,
    "drip_rise_min_delta": 0.15,
    "late_hours_start": 21,
    "recurring_cv_threshold": 0.15,
    "recurring_interval_tolerance": 2,
    "recurring_min_occurrences": 3,
    "anomaly_window_weeks": 6,
    "anomaly_z_threshold": 2.0,
    "anomaly_week_delta": 0.30,
    "opportunity_cap_ratio": 0.2,
    "rising_mom_threshold": 0.10,
}

DOW_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
TIME_BUCKETS = ["morning", "afternoon", "evening", "late"]


@dataclass(frozen=True)
class MonthlySeries:
    months: List[str]
    values: List[float]


# ---------------------------------------------------------------------------
# Pre-processing
# ---------------------------------------------------------------------------

def preprocess(transactions: Sequence[MutableMapping[str, Any]]) -> List[Dict[str, Any]]:
    """Public API wrapper aligning with module layout."""
    return preprocess_transactions(transactions)


def preprocess_transactions(transactions: Sequence[MutableMapping[str, Any]]) -> List[Dict[str, Any]]:
    cleaned: List[Dict[str, Any]] = []
    for row in transactions:
        amount = float(row.get("amount", 0))
        currency = row.get("currency", DISPLAY_CURRENCY)
        if currency != DISPLAY_CURRENCY:
            raise ValueError(
                f"Unsupported currency '{currency}'. Expected {DISPLAY_CURRENCY} for this analyser."
            )
        ts = row.get("ts")
        if not ts:
            raise ValueError("Missing timestamp field 'ts'.")
        dt = parse_iso_ts(ts)
        iso_year, iso_week, iso_weekday = dt.isocalendar()
        category = normalise_category(row.get("category"))
        merchant = (row.get("merchant") or "unknown").strip()
        enriched = dict(row)
        week_key = f"{iso_year}-W{iso_week:02d}"
        enriched.update(
            {
                "amount": amount,
                "amount_abs": abs(amount),
                "ts": ts,
                "dt": dt,
                "date": dt.date(),
                "dow": dt.weekday(),
                "hour": dt.hour,
                "week": iso_week,
                "week_year": iso_year,
                "week_key": week_key,
                "week_start": start_of_week(dt),
                "month": dt.strftime("%Y-%m"),
                "month_key": dt.strftime("%Y-%m"),
                "month_start": dt.replace(day=1).date(),
                "is_spend": amount < 0,
                "is_income": amount > 0,
                "category": category,
                "merchant": merchant,
                "merchant_normalised": merchant.lower(),
                "time_bucket": time_of_day_bucket(dt.hour),
                "iso_weekday": iso_weekday,
            }
        )
        cleaned.append(enriched)

    winsorise_spend_amounts(cleaned, CONFIG["winsorise_percentile"])
    return cleaned


def parse_iso_ts(value: str) -> datetime:
    if value.endswith("Z"):
        value = value[:-1] + "+00:00"
    return datetime.fromisoformat(value)


def normalise_category(raw: Optional[str]) -> str:
    raw_norm = (raw or "uncategorised").strip().lower()
    return CATEGORY_ALIASES.get(raw_norm, raw_norm or "uncategorised")


def time_of_day_bucket(hour: int) -> str:
    if 6 <= hour <= 11:
        return "morning"
    if 12 <= hour <= 17:
        return "afternoon"
    if 18 <= hour <= 22:
        return "evening"
    return "late"


def start_of_week(dt: datetime) -> datetime.date:
    return (dt - timedelta(days=dt.weekday())).date()


def winsorise_spend_amounts(rows: Sequence[MutableMapping[str, Any]], percentile: float) -> None:
    per_category_values: Dict[str, List[float]] = defaultdict(list)
    for row in rows:
        if row.get("is_spend"):
            per_category_values[row["category"]].append(abs(row["amount"]))
    caps = {cat: percentile_value(values, percentile) for cat, values in per_category_values.items()}
    for row in rows:
        amount = row["amount"]
        if row.get("is_spend"):
            cap = caps.get(row["category"], abs(amount))
            clipped = -min(abs(amount), cap)
        else:
            clipped = amount
        row["amount_winsorised"] = clipped


# ---------------------------------------------------------------------------
# Monthly trends & forecast
# ---------------------------------------------------------------------------

def monthly_trends(rows: Sequence[MutableMapping[str, Any]]) -> Dict[str, Any]:
    metrics = compute_monthly_trends(rows)
    metrics["forecast"] = forecast_next_month(metrics["monthly_spend"])
    return metrics


def compute_monthly_trends(rows: Sequence[MutableMapping[str, Any]]) -> Dict[str, Any]:
    spend_totals: Dict[str, float] = defaultdict(float)
    income_totals: Dict[str, float] = defaultdict(float)
    category_totals: Dict[str, Dict[str, float]] = defaultdict(lambda: defaultdict(float))

    for row in rows:
        month = row["month_key"]
        amount = row.get("amount_winsorised", row["amount"])
        if row.get("is_spend"):
            spend_totals[month] += abs(amount)
            category_totals[row["category"]][month] += abs(amount)
        elif row.get("is_income"):
            income_totals[month] += amount

    months = ordered_months({*spend_totals.keys(), *income_totals.keys()})
    monthly_spend = OrderedDict((month, spend_totals.get(month, 0.0)) for month in months)
    monthly_income = OrderedDict((month, income_totals.get(month, 0.0)) for month in months)

    spend_series = MonthlySeries(months=list(monthly_spend.keys()), values=list(monthly_spend.values()))
    income_series = MonthlySeries(months=list(monthly_income.keys()), values=list(monthly_income.values()))

    spend_mavg = OrderedDict(
        (month, avg) for month, avg in zip(spend_series.months, rolling_mean(spend_series.values, window=3))
    )
    income_mavg = OrderedDict(
        (month, avg) for month, avg in zip(income_series.months, rolling_mean(income_series.values, window=3))
    )

    spend_mom = month_over_month(spend_series)
    income_mom = month_over_month(income_series)

    category_spend = {
        category: OrderedDict((month, months_map.get(month, 0.0)) for month in months)
        for category, months_map in category_totals.items()
    }

    category_share = compute_category_share(monthly_spend, category_spend)

    trend_slopes = {
        "total_spend": linear_trend(spend_series.values),
        "total_income": linear_trend(income_series.values),
        "categories": {
            category: linear_trend(list(series.values())) for category, series in category_spend.items()
        },
    }

    return {
        "monthly_spend": monthly_spend,
        "monthly_income": monthly_income,
        "spend_moving_average": spend_mavg,
        "income_moving_average": income_mavg,
        "spend_mom_pct": spend_mom,
        "income_mom_pct": income_mom,
        "category_spend": category_spend,
        "category_share": category_share,
        "trend_slopes": trend_slopes,
    }


def ordered_months(months: Iterable[str]) -> List[str]:
    return sorted(months, key=lambda m: datetime.strptime(m, "%Y-%m"))


def month_over_month(series: MonthlySeries) -> Dict[str, Optional[float]]:
    deltas: Dict[str, Optional[float]] = {}
    for idx in range(1, len(series.months)):
        curr = series.values[idx]
        prev = series.values[idx - 1]
        deltas[series.months[idx]] = pct_change(curr, prev)
    if series.months:
        deltas.setdefault(series.months[0], None)
    return deltas


def compute_category_share(total_spend: OrderedDict, category_spend: Dict[str, OrderedDict]) -> Dict[str, Dict[str, float]]:
    share: Dict[str, Dict[str, float]] = defaultdict(dict)
    for month, total in total_spend.items():
        if not total:
            continue
        for category, series in category_spend.items():
            value = series.get(month, 0.0)
            if value:
                share[month][category] = value / total
    return share


def forecast_next_month(monthly_spend: OrderedDict) -> Optional[Dict[str, Any]]:
    if not monthly_spend:
        return None
    months = list(monthly_spend.keys())
    values = list(monthly_spend.values())
    last_month = months[-1]
    last_dt = datetime.strptime(last_month, "%Y-%m")
    next_dt = add_months(last_dt, 1)
    next_month_key = next_dt.strftime("%Y-%m")

    seasonal_key = add_months(next_dt, -12).strftime("%Y-%m")
    seasonal = monthly_spend.get(seasonal_key)
    if seasonal is None and values:
        seasonal = values[-1]
    moving_avg_value = None
    if len(values) >= 3:
        moving_avg_value = sum(values[-3:]) / 3

    primary_model = "seasonal_naive" if seasonal is not None else "moving_average"
    primary_value = seasonal if seasonal is not None else moving_avg_value
    backstop_model = "moving_average" if primary_model == "seasonal_naive" else "seasonal_naive"
    backstop_value = moving_avg_value if primary_model == "seasonal_naive" else seasonal

    if primary_value is None and backstop_value is None:
        return None

    return {
        "month": next_month_key,
        "primary_model": primary_model,
        "primary_value": primary_value,
        "backstop_model": backstop_model,
        "backstop_value": backstop_value,
    }


# ---------------------------------------------------------------------------
# Pattern mining utilities
# ---------------------------------------------------------------------------

def pattern_mining(rows: Sequence[MutableMapping[str, Any]]) -> Dict[str, Any]:
    spend_rows = [row for row in rows if row.get("is_spend")]
    if not spend_rows:
        return {
            "dow_peaks": {},
            "time_buckets": {},
            "merchant_hhi": {},
            "merchant_hhi_details": {},
            "small_leaks": [],
            "cashflow": {"weekly_net": {}, "squeezes": []},
            "late_night": {},
            "ridehail_usage": {},
            "category_30d_spend": {},
        }

    category_totals: Dict[str, float] = defaultdict(float)
    category_dow: Dict[str, Dict[int, float]] = defaultdict(lambda: defaultdict(float))
    category_time: Dict[str, Dict[str, float]] = defaultdict(lambda: defaultdict(float))

    latest_dt = max(row["dt"] for row in rows)
    cutoff_8w = latest_dt - timedelta(weeks=CONFIG["hhi_window_weeks"])
    cutoff_30d = latest_dt - timedelta(days=30)

    merchant_window: Dict[str, Dict[str, float]] = defaultdict(lambda: defaultdict(float))
    category_30d_spend: Dict[str, float] = defaultdict(float)

    for row in spend_rows:
        cat = row["category"]
        amt = abs(row["amount"])
        category_totals[cat] += amt
        category_dow[cat][row["dow"]] += amt
        category_time[cat][row["time_bucket"]] += amt
        if row["dt"] >= cutoff_8w:
            merchant_window[cat][row["merchant_normalised"]] += amt
        if row["dt"] >= cutoff_30d:
            category_30d_spend[cat] += amt

    dow_peaks: Dict[str, List[str]] = {}
    time_bucket_shares: Dict[str, Dict[str, float]] = {}
    late_night: Dict[str, Dict[str, float]] = {}
    for cat, total in category_totals.items():
        if not total:
            continue
        dow_shares = {DOW_NAMES[dow]: value / total for dow, value in category_dow[cat].items()}
        if dow_shares:
            max_share = max(dow_shares.values())
            peaks = [dow for dow, share in dow_shares.items() if share >= max_share - 0.05 and share >= 0.2]
            if peaks:
                dow_peaks[cat] = peaks
        bucket_shares = {}
        for bucket in TIME_BUCKETS:
            bucket_total = category_time[cat].get(bucket, 0.0)
            if total:
                bucket_shares[bucket] = bucket_total / total
        if bucket_shares:
            time_bucket_shares[cat] = bucket_shares
        late_share = bucket_shares.get("evening", 0.0) + bucket_shares.get("late", 0.0)
        late_amount = category_time[cat].get("evening", 0.0) + category_time[cat].get("late", 0.0)
        if late_share:
            late_night[cat] = {"share": late_share, "amount": late_amount}

    merchant_hhi: Dict[str, float] = {}
    merchant_hhi_details: Dict[str, Dict[str, Any]] = {}
    for cat, merchants in merchant_window.items():
        total = sum(merchants.values())
        if not total:
            continue
        shares = {merchant: value / total for merchant, value in merchants.items() if value}
        hhi = sum(share ** 2 for share in shares.values())
        merchant_hhi[cat] = hhi
        top_merchant, top_share = max(shares.items(), key=lambda item: item[1])
        merchant_hhi_details[cat] = {
            "hhi": hhi,
            "top_merchant": top_merchant,
            "top_share": top_share,
            "total": total,
        }

    small_leaks = compute_small_leaks(spend_rows)
    cashflow = compute_cashflow(rows)
    ridehail_usage = compute_ridehail_usage(spend_rows)

    return {
        "dow_peaks": dow_peaks,
        "time_buckets": time_bucket_shares,
        "merchant_hhi": merchant_hhi,
        "merchant_hhi_details": merchant_hhi_details,
        "small_leaks": small_leaks,
        "cashflow": cashflow,
        "late_night": late_night,
        "ridehail_usage": ridehail_usage,
        "category_30d_spend": category_30d_spend,
    }


def compute_small_leaks(spend_rows: Sequence[MutableMapping[str, Any]]) -> List[Dict[str, Any]]:
    limit = CONFIG["small_tx_week_limit"]
    threshold = CONFIG["small_tx_threshold"]
    leaks: Dict[str, Dict[str, float]] = defaultdict(lambda: {"count": 0, "total": 0.0})
    for row in spend_rows:
        if abs(row["amount"]) < threshold and row["category"] not in NECESSITY_CATEGORIES:
            entry = leaks[row["week_key"]]
            entry["count"] += 1
            entry["total"] += abs(row["amount"])

    leak_weeks: List[Dict[str, Any]] = []
    sorted_weeks = sorted(leaks.keys(), key=week_key_to_date)
    prev_count = None
    for week in sorted_weeks:
        data = leaks[week]
        count = data["count"]
        avg = data["total"] / count if count else 0.0
        rising = False
        if prev_count is not None and prev_count > 0:
            rising = count > prev_count * (1 + CONFIG["drip_rise_min_delta"])
        prev_count = count
        if count > limit:
            leak_weeks.append(
                {
                    "week": week,
                    "count": count,
                    "avg_amount": avg,
                    "total": data["total"],
                    "rising": rising,
                }
            )
    return leak_weeks


def compute_cashflow(rows: Sequence[MutableMapping[str, Any]]) -> Dict[str, Any]:
    weekly_net: Dict[str, float] = defaultdict(float)
    for row in rows:
        weekly_net[row["week_key"]] += row["amount"]
    ordered_weeks = sorted(weekly_net.keys(), key=week_key_to_date)
    ordered = OrderedDict((week, weekly_net[week]) for week in ordered_weeks)

    squeezes: List[Dict[str, Any]] = []
    for idx in range(len(ordered_weeks) - 1):
        curr_key = ordered_weeks[idx]
        next_key = ordered_weeks[idx + 1]
        if ordered[curr_key] < 0 and ordered[next_key] > 0:
            squeezes.append(
                {
                    "week": curr_key,
                    "net": ordered[curr_key],
                    "following_week": next_key,
                }
            )

    return {"weekly_net": ordered, "squeezes": squeezes}


def compute_ridehail_usage(spend_rows: Sequence[MutableMapping[str, Any]]) -> Dict[str, Any]:
    ridehail_rows = [row for row in spend_rows if row["category"] in RIDEHAIL_CATEGORIES]
    if not ridehail_rows:
        return {}
    current_month = max(row["month_key"] for row in ridehail_rows)
    current_rows = [row for row in ridehail_rows if row["month_key"] == current_month]
    count = len(current_rows)
    spend = sum(abs(row["amount"]) for row in current_rows)
    avg = spend / count if count else 0.0
    return {
        "month": current_month,
        "trip_count": count,
        "spend": spend,
        "avg_ticket": avg,
    }


def week_key_to_date(week_key: str) -> datetime:
    year_str, week_part = week_key.split("-W")
    year = int(year_str)
    week = int(week_part)
    return datetime.fromisocalendar(year, week, 1)


# ---------------------------------------------------------------------------
# Recurring / subscriptions
# ---------------------------------------------------------------------------

def detect_recurring(rows: Sequence[MutableMapping[str, Any]]) -> List[Dict[str, Any]]:
    spend_rows = [row for row in rows if row.get("is_spend")]
    if not spend_rows:
        return []

    latest_dt = max(row["dt"] for row in rows)
    cutoff_60 = latest_dt - timedelta(days=60)
    category_merchants_last60: Dict[str, set] = defaultdict(set)
    for row in rows:
        if row["dt"] >= cutoff_60:
            category_merchants_last60[row["category"]].add(row["merchant_normalised"])

    by_merchant: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for row in spend_rows:
        by_merchant[row["merchant_normalised"]].append(row)

    recurring: List[Dict[str, Any]] = []
    for merchant_key, txs in by_merchant.items():
        if len(txs) < CONFIG["recurring_min_occurrences"]:
            continue
        txs.sort(key=lambda r: r["dt"])
        amounts = [abs(t["amount"]) for t in txs]
        avg_amount = sum(amounts) / len(amounts)
        if avg_amount == 0:
            continue
        if len(amounts) > 1:
            std_amount = stdev(amounts)
        else:
            std_amount = 0.0
        cv = std_amount / avg_amount if avg_amount else 0.0
        if cv > CONFIG["recurring_cv_threshold"]:
            continue
        intervals = [max((txs[i]["dt"].date() - txs[i - 1]["dt"].date()).days, 1) for i in range(1, len(txs))]
        if not intervals:
            continue
        med_interval = median(intervals)
        interval = match_interval(med_interval)
        if interval is None:
            continue
        pay_day = int(round(median([tx["dt"].day for tx in txs])))
        category = Counter(tx["category"] for tx in txs).most_common(1)[0][0]
        display_name = Counter(tx["merchant"] for tx in txs).most_common(1)[0][0]
        median_amount = -median(amounts)
        ghost = False
        merchants_in_category = category_merchants_last60.get(category, set())
        if interval == 30 and len(merchants_in_category - {merchant_key}) == 0:
            ghost = True
        recurring_type = "subscription"
        if abs(median_amount) > 200 and (interval == 30 or category in RENT_CATEGORIES):
            recurring_type = "rent"
        entry = {
            "merchant": display_name,
            "merchant_key": merchant_key,
            "category": category,
            "interval_days": interval,
            "median_amount": median_amount,
            "pay_day_of_month": pay_day,
            "occurrences": len(txs),
            "ghost_subscription": ghost,
            "type": recurring_type,
            "cv": cv,
        }
        recurring.append(entry)

    recurring.sort(key=lambda r: abs(r["median_amount"]), reverse=True)
    return recurring


def match_interval(value: float) -> Optional[int]:
    candidates = [7, 14, 30]
    for candidate in candidates:
        if abs(value - candidate) <= CONFIG["recurring_interval_tolerance"]:
            return candidate
    return None


# ---------------------------------------------------------------------------
# Anomaly detection
# ---------------------------------------------------------------------------

def detect_anomalies(rows: Sequence[MutableMapping[str, Any]]) -> List[Dict[str, Any]]:
    spend_rows = [row for row in rows if row.get("is_spend")]
    anomalies: List[Dict[str, Any]] = []
    if not spend_rows:
        return anomalies

    weekly_category: Dict[str, Dict[str, float]] = defaultdict(lambda: defaultdict(float))
    for row in spend_rows:
        weekly_category[row["category"]][row["week_key"]] += abs(row["amount"])

    for category, week_map in weekly_category.items():
        weeks = sorted(week_map.keys(), key=week_key_to_date)
        for idx in range(1, len(weeks)):
            window_start = max(0, idx - CONFIG["anomaly_window_weeks"])
            history = [week_map[weeks[j]] for j in range(window_start, idx)]
            if len(history) < 2:
                continue
            curr_week = weeks[idx]
            curr_value = week_map[curr_week]
            mean_history = mean(history)
            std_history = stdev(history)
            prev_week = weeks[idx - 1]
            prev_value = week_map[prev_week]
            if std_history == 0:
                continue
            z_score = (curr_value - mean_history) / std_history
            pct_delta = pct_change(curr_value, prev_value)
            if z_score > CONFIG["anomaly_z_threshold"] and (pct_delta or 0) > CONFIG["anomaly_week_delta"]:
                anomalies.append(
                    {
                        "category": category,
                        "period": curr_week,
                        "amount": curr_value,
                        "z": z_score,
                        "reason": "spike_vs_rolling",
                    }
                )

    non_rent_values = [abs(row["amount"]) for row in spend_rows if row["category"] not in RENT_CATEGORIES]
    percentile = percentile_value(non_rent_values, 0.99) if non_rent_values else 0.0
    if percentile:
        for row in spend_rows:
            value = abs(row["amount"])
            if row["category"] in RENT_CATEGORIES:
                continue
            if value >= percentile and value > 0:
                anomalies.append(
                    {
                        "category": row["category"],
                        "period": row["ts"],
                        "amount": value,
                        "reason": "single_day_spike",
                        "merchant": row["merchant"],
                    }
                )

    seen: Dict[Tuple[str, float], datetime] = {}
    for row in sorted(spend_rows, key=lambda r: r["dt"]):
        key = (row["merchant_normalised"], round(row["amount"], 2))
        previous = seen.get(key)
        if previous and abs((row["dt"] - previous).total_seconds()) <= 300:
            anomalies.append(
                {
                    "category": row["category"],
                    "period": row["ts"],
                    "amount": abs(row["amount"]),
                    "reason": "potential_duplicate",
                    "merchant": row["merchant"],
                }
            )
        seen[key] = row["dt"]

    return anomalies


# ---------------------------------------------------------------------------
# Variance & opportunity sizing
# ---------------------------------------------------------------------------

def compute_variances(rows: Sequence[MutableMapping[str, Any]], baselines: Optional[Dict[str, float]] = None) -> Dict[str, Any]:
    spend_rows = [row for row in rows if row.get("is_spend")]
    if not spend_rows:
        return {
            "per_category": {},
            "current_month": None,
            "total_projection": 0.0,
            "total_baseline": 0.0,
        }

    months = ordered_months({row["month_key"] for row in spend_rows})
    if not months:
        return {
            "per_category": {},
            "current_month": None,
            "total_projection": 0.0,
            "total_baseline": 0.0,
        }
    current_month = months[-1]
    previous_months = months[:-1][-3:]

    category_monthly: Dict[str, Dict[str, float]] = defaultdict(lambda: defaultdict(float))
    for row in spend_rows:
        category_monthly[row["category"]][row["month_key"]] += abs(row["amount"])

    per_category: Dict[str, Dict[str, Any]] = {}
    total_projection = 0.0
    total_baseline = 0.0
    days_in_current = month_days(current_month)
    day_of_month = max(
        (row["date"].day for row in spend_rows if row["month_key"] == current_month),
        default=0,
    )
    for category, month_map in category_monthly.items():
        baseline = None
        if baselines and category in baselines:
            baseline = baselines[category]
        else:
            history = [month_map.get(m, 0.0) for m in previous_months if month_map.get(m, 0.0) > 0]
            if history:
                baseline = median(history)
            elif previous_months:
                baseline = month_map.get(previous_months[-1], 0.0)
            else:
                baseline = 0.0
        spent_so_far = month_map.get(current_month, 0.0)
        projection = spent_so_far
        if day_of_month and day_of_month < days_in_current:
            projection = spent_so_far / max(day_of_month, 1) * days_in_current
        variance = projection - (baseline or 0.0)
        opportunity = 0.0
        if (baseline or 0.0) > 0 and variance > 0:
            opportunity = min(variance, baseline * CONFIG["opportunity_cap_ratio"])
        prev_month = previous_months[-1] if previous_months else None
        prev_value = month_map.get(prev_month, 0.0) if prev_month else 0.0
        mom_pct = pct_change(month_map.get(current_month, 0.0), prev_value) if prev_month else None
        per_category[category] = {
            "baseline": baseline or 0.0,
            "projection": projection,
            "variance": variance,
            "opportunity": opportunity,
            "spent_so_far": spent_so_far,
            "day_of_month": day_of_month,
            "mom_pct": mom_pct,
        }
        total_projection += projection
        total_baseline += baseline or 0.0

    return {
        "per_category": per_category,
        "current_month": current_month,
        "total_projection": total_projection,
        "total_baseline": total_baseline,
    }


def month_days(month_key: str) -> int:
    year_str, month_str = month_key.split("-")
    return calendar.monthrange(int(year_str), int(month_str))[1]


# ---------------------------------------------------------------------------
# Suggestions & Challenges
# ---------------------------------------------------------------------------

def build_suggestions(
    trends: Dict[str, Any],
    patterns: Dict[str, Any],
    recurring: List[Dict[str, Any]],
    anomalies: List[Dict[str, Any]],
    variances: Dict[str, Any],
) -> List[Dict[str, Any]]:
    suggestions: List[Dict[str, Any]] = []
    suggestions.extend(subscription_suggestions(recurring, patterns))
    suggestions.extend(merchant_swap_suggestions(patterns))
    suggestions.extend(drip_spend_suggestions(patterns))
    suggestions.extend(late_night_suggestions(patterns))
    suggestions.extend(ridehail_suggestions(patterns))
    suggestions.extend(cashflow_buffer_suggestions(patterns, recurring))
    return suggestions[:10]


def subscription_suggestions(recurring: List[Dict[str, Any]], patterns: Dict[str, Any]) -> List[Dict[str, Any]]:
    results: List[Dict[str, Any]] = []
    for entry in recurring:
        if entry["type"] != "subscription" and not entry.get("ghost_subscription"):
            continue
        if entry["interval_days"] != 30:
            continue
        expected_saving = abs(entry["median_amount"])
        results.append(
            {
                "title": f"Review {entry['merchant']} subscription",
                "insight": (
                    f"{entry['merchant']} charges {format_currency(abs(entry['median_amount']))} every {entry['interval_days']}d"
                    + (" and shows low surrounding activity" if entry.get("ghost_subscription") else "")
                ),
                "evidence": {
                    "interval_days": entry["interval_days"],
                    "median_amount": entry["median_amount"],
                    "pay_day": entry["pay_day_of_month"],
                    "ghost": entry.get("ghost_subscription", False),
                },
                "action": "Cancel or downgrade the plan if it's unused.",
                "expected_saving": expected_saving,
                "confidence": 0.75,
                "category": entry["category"],
                "type": "subscription",
            }
        )
    return results


def merchant_swap_suggestions(patterns: Dict[str, Any]) -> List[Dict[str, Any]]:
    details = patterns.get("merchant_hhi_details", {})
    results: List[Dict[str, Any]] = []
    for category, info in details.items():
        if category not in SWAP_ELIGIBLE_CATEGORIES:
            continue
        if info["hhi"] <= CONFIG["hhi_high_threshold"]:
            continue
        expected_saving = info["total"] * 0.1 * info["top_share"]
        results.append(
            {
                "title": f"Swap out pricey {humanise_category(category)} merchants",
                "insight": (
                    f"{humanise_category(category)} spend is {info['hhi']:.2f} HHI; {info['top_merchant'].title()} accounts for {info['top_share']*100:.0f}%"
                ),
                "evidence": {
                    "top_merchant": info["top_merchant"],
                    "top_share": info["top_share"],
                    "hhi": info["hhi"],
                },
                "action": "Shift at least half of orders to a lower-cost alternative or loyalty offer.",
                "expected_saving": expected_saving,
                "confidence": 0.6,
                "category": category,
                "type": "swap",
            }
        )
    return results


def drip_spend_suggestions(patterns: Dict[str, Any]) -> List[Dict[str, Any]]:
    leaks = patterns.get("small_leaks", [])
    if not leaks:
        return []
    latest = leaks[-1]
    limit = CONFIG["small_tx_week_limit"]
    expected_saving = max(0, latest["count"] - limit) * latest["avg_amount"] * 4
    return [
        {
            "title": "Cap sub-£5 drip spend",
            "insight": f"{latest['count']} small transactions last week (avg {format_currency(latest['avg_amount'])}).",
            "evidence": {
                "week": latest["week"],
                "count": latest["count"],
                "avg_small_tx": latest["avg_amount"],
            },
            "action": "Limit small discretionary taps to 3 per week and batch essentials.",
            "expected_saving": expected_saving,
            "confidence": 0.55,
            "category": "misc",
            "type": "behavioural_nudge",
        }
    ]


def late_night_suggestions(patterns: Dict[str, Any]) -> List[Dict[str, Any]]:
    results: List[Dict[str, Any]] = []
    late_night = patterns.get("late_night", {})
    category_spend = patterns.get("category_30d_spend", {})
    for category, stats in late_night.items():
        if category not in LATE_NIGHT_CATEGORIES:
            continue
        if stats["share"] < 0.35:
            continue
        projected = category_spend.get(category, 0.0) * 1.33
        expected_saving = stats["amount"] * 0.3
        results.append(
            {
                "title": f"Cut late-night {humanise_category(category)} by 30%",
                "insight": f"{humanise_category(category)} is {stats['share']*100:.0f}% after 18:00.",
                "evidence": {
                    "time_peak": "evening+late",
                    "last_30d_spend": category_spend.get(category, 0.0),
                    "projection": projected,
                },
                "action": "Pre-plan meals and limit post-21:00 orders to 1 night/week.",
                "expected_saving": expected_saving,
                "confidence": 0.6,
                "category": category,
                "type": "behavioural_nudge",
            }
        )
    return results


def ridehail_suggestions(patterns: Dict[str, Any]) -> List[Dict[str, Any]]:
    usage = patterns.get("ridehail_usage")
    if not usage or usage.get("trip_count", 0) <= 4:
        return []
    expected_saving = usage["spend"] * 0.5
    return [
        {
            "title": "Swap half of ride-hail trips to bus/walk",
            "insight": f"{usage['trip_count']} ride-hail trips this month averaging {format_currency(usage['avg_ticket'])}.",
            "evidence": {
                "month": usage["month"],
                "trip_count": usage["trip_count"],
                "avg_ticket": usage["avg_ticket"],
            },
            "action": "Plan errands to bundle journeys and default to transit when weather allows.",
            "expected_saving": expected_saving,
            "confidence": 0.5,
            "category": "transport.ridehail",
            "type": "behavioural_nudge",
        }
    ]


def cashflow_buffer_suggestions(patterns: Dict[str, Any], recurring: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    squeezes = patterns.get("cashflow", {}).get("squeezes", [])
    rent_entries = [entry for entry in recurring if entry.get("type") == "rent"]
    if not squeezes or not rent_entries:
        return []
    rent = rent_entries[0]
    return [
        {
            "title": "Build a rent buffer",
            "insight": "Recent negative cashflow weeks flip positive right after rent.",
            "evidence": {
                "rent_due_day": rent["pay_day_of_month"],
                "squeeze_week": squeezes[-1]["week"],
                "net": squeezes[-1]["net"],
            },
            "action": f"Auto-set aside {format_currency(abs(rent['median_amount'])/4)} weekly before rent hits.",
            "expected_saving": 0.0,
            "confidence": 0.65,
            "category": "housing.rent",
            "type": "cashflow",
        }
    ]


def build_challenges(
    suggestions: Sequence[Dict[str, Any]],
    patterns: Dict[str, Any],
    variances: Dict[str, Any],
) -> List[Dict[str, Any]]:
    candidates: List[Dict[str, Any]] = []
    grocery_variance = variances.get("per_category", {}).get("groceries")
    if grocery_variance and grocery_variance["baseline"] > 0:
        baseline = grocery_variance["baseline"]
        target_amount = round_to_nearest_5(baseline * 0.9 * (14 / 30))
        candidates.append(
            {
                "code": "GROCERY_TRIM_14D",
                "name": "Trim Groceries by 10%",
                "window_days": 14,
                "target_kind": "amount",
                "target": target_amount,
                "category_scope": ["groceries"],
                "context": {},
                "reward_points": 120,
                "expected_saving": baseline * 0.1 * (14 / 30),
                "success_criteria": "spend(groceries,14d) <= 0.9 * baseline",
            }
        )
    late_night = patterns.get("late_night", {}).get("eating_out")
    if late_night:
        candidates.append(
            {
                "code": "NO_LATE_NIGHT_7D",
                "name": "No Late-Night Orders",
                "window_days": 7,
                "target_kind": "amount",
                "target": 0,
                "category_scope": ["eating_out"],
                "context": {"after_hour": 21},
                "reward_points": 100,
                "expected_saving": late_night["amount"] / 4,
                "success_criteria": "sum(amount where cat=eating_out and hour>=21) == 0",
            }
        )
    ridehail = patterns.get("ridehail_usage")
    if ridehail and ridehail.get("trip_count", 0) >= 4:
        candidates.append(
            {
                "code": "RIDEHAIL_SWAP_14D",
                "name": "Swap 4 Ride-Hail Trips",
                "window_days": 14,
                "target_kind": "count",
                "target": max(0, ridehail["trip_count"] - 4),
                "category_scope": ["transport.ridehail"],
                "context": {"replace_with": "walk/bus"},
                "reward_points": 90,
                "expected_saving": ridehail["spend"] * 0.4,
                "success_criteria": "replace >=4 trips with non-ridehail options",
            }
        )
    subscription = next((s for s in suggestions if s["type"] == "subscription"), None)
    if subscription:
        candidates.append(
            {
                "code": "SUBSCRIPTION_AUDIT_30D",
                "name": "Cancel One Subscription",
                "window_days": 30,
                "target_kind": "count",
                "target": 1,
                "category_scope": [subscription["category"]],
                "context": {},
                "reward_points": 80,
                "expected_saving": subscription["expected_saving"],
                "success_criteria": "cancel_or_downgrade >=1 recurring charge",
            }
        )
    candidates.sort(key=lambda c: c.get("expected_saving", 0), reverse=True)
    return candidates[:3]


# ---------------------------------------------------------------------------
# Summary & orchestration
# ---------------------------------------------------------------------------

def summarise(
    rows: Sequence[MutableMapping[str, Any]],
    trends: Dict[str, Any],
    patterns: Dict[str, Any],
    recurring: List[Dict[str, Any]],
    anomalies: List[Dict[str, Any]],
    suggestions: List[Dict[str, Any]],
    challenges: List[Dict[str, Any]],
    variances: Dict[str, Any],
) -> Dict[str, Any]:
    months = ordered_months({row["month_key"] for row in rows})
    period = f"{months[0]} to {months[-1]}" if months else ""

    latest_dt = max((row["dt"] for row in rows), default=None)
    total_spend_30d = 0.0
    if latest_dt:
        cutoff = latest_dt - timedelta(days=30)
        total_spend_30d = sum(abs(row["amount"]) for row in rows if row.get("is_spend") and row["dt"] >= cutoff)

    projected_current = variances.get("total_projection", 0.0)

    top_rising_categories = compute_top_rising_categories(trends)
    top_saving = top_saving_opportunities(variances)

    summary = {
        "period": period,
        "total_spend_30d": total_spend_30d,
        "projected_spend_curr_month": projected_current,
        "top_rising_categories": top_rising_categories,
        "top_saving_opportunities": top_saving,
    }

    return {
        "summary": summary,
        "patterns": {
            "dow_peaks": patterns.get("dow_peaks", {}),
            "time_buckets": patterns.get("time_buckets", {}),
            "merchant_hhi": patterns.get("merchant_hhi", {}),
            "small_leaks": patterns.get("small_leaks", []),
            "cashflow_squeezes": patterns.get("cashflow", {}).get("squeezes", []),
        },
        "recurring": recurring,
        "anomalies": anomalies,
        "suggestions": suggestions,
        "challenges": challenges,
    }


def compute_top_rising_categories(trends: Dict[str, Any]) -> List[Dict[str, Any]]:
    category_spend = trends.get("category_spend", {})
    months = list(trends.get("monthly_spend", {}).keys())
    if len(months) < 2:
        return []
    current_month = months[-1]
    previous_month = months[-2]
    rising: List[Tuple[float, Dict[str, Any]]] = []
    for category, series in category_spend.items():
        curr = series.get(current_month, 0.0)
        prev = series.get(previous_month, 0.0)
        if curr < 15:
            continue
        change = pct_change(curr, prev)
        if change and change >= CONFIG["rising_mom_threshold"]:
            rising.append((change, {"category": category, "mom_pct": change}))
    rising.sort(key=lambda item: item[0], reverse=True)
    return [item[1] for item in rising[:3]]


def top_saving_opportunities(variances: Dict[str, Any]) -> List[Dict[str, Any]]:
    per_category = variances.get("per_category", {})
    candidates = [
        {"category": category, "amount": data["opportunity"]}
        for category, data in per_category.items()
        if data.get("opportunity")
    ]
    candidates.sort(key=lambda item: item["amount"], reverse=True)
    return candidates[:3]


# ---------------------------------------------------------------------------
# Data loading helpers
# ---------------------------------------------------------------------------


def load_transactions_from_json(path: str) -> List[Dict[str, Any]]:
    """
    Read a JSON file containing a list of transaction dicts.

    Args:
        path: File system path to the JSON document.

    Returns:
        Parsed list of transaction dictionaries.
    """
    file_path = os.path.expanduser(str(path))
    if not os.path.isabs(file_path):
        file_path = os.path.abspath(file_path)
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Transaction file not found: {file_path}")
    try:
        with open(file_path, "r", encoding="utf-8") as handle:
            data = json.load(handle)
    except json.JSONDecodeError as exc:  # pragma: no cover - depends on file contents
        raise ValueError(f"Invalid JSON in {file_path}: {exc}") from exc
    if not isinstance(data, list):
        raise ValueError(f"Expected list of transactions in {file_path}")
    transactions: List[Dict[str, Any]] = []
    for idx, item in enumerate(data):
        if not isinstance(item, dict):
            raise ValueError(f"Transaction at index {idx} is not an object.")
        transactions.append(item)
    return transactions


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def humanise_category(category: str) -> str:
    return category.replace(".", " ").replace("_", " ").title()


def format_currency(value: Optional[float]) -> str:
    if value is None:
        return "£0.00"
    sign = "-" if value < 0 else ""
    return f"{sign}£{abs(value):,.2f}"


def add_months(dt: datetime, months: int) -> datetime:
    year = dt.year + ((dt.month - 1 + months) // 12)
    month = ((dt.month - 1 + months) % 12) + 1
    return dt.replace(year=year, month=month, day=1)


def groupby_sum(rows: Iterable[MutableMapping[str, Any]], key_fn: Callable[[MutableMapping[str, Any]], str], amount_key: str = "amount") -> Dict[str, float]:
    totals: Dict[str, float] = defaultdict(float)
    for row in rows:
        totals[key_fn(row)] += float(row.get(amount_key, 0.0))
    return dict(totals)


def rolling_mean(series: Sequence[float], window: int = 3) -> List[Optional[float]]:
    if window <= 0:
        raise ValueError("Window must be positive")
    result: List[Optional[float]] = []
    for idx in range(len(series)):
        if idx + 1 < window:
            result.append(None)
            continue
        segment = series[idx + 1 - window : idx + 1]
        result.append(sum(segment) / window)
    return result


def pct_change(curr: float, prev: float) -> Optional[float]:
    if prev == 0:
        return None
    return (curr - prev) / prev


def linear_trend(values: Sequence[float]) -> float:
    n = len(values)
    if n < 2:
        return 0.0
    x = list(range(n))
    x_mean = sum(x) / n
    y_mean = sum(values) / n
    denom = sum((xi - x_mean) ** 2 for xi in x)
    if denom == 0:
        return 0.0
    numer = sum((x[i] - x_mean) * (values[i] - y_mean) for i in range(n))
    return numer / denom


def percentile_value(values: Sequence[float], q: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    if len(ordered) == 1:
        return ordered[0]
    pos = (len(ordered) - 1) * q
    lower = int(pos)
    upper = min(lower + 1, len(ordered) - 1)
    weight = pos - lower
    return ordered[lower] * (1 - weight) + ordered[upper] * weight


def round_to_nearest_5(value: float) -> float:
    return round(value / 5.0) * 5.0


# ---------------------------------------------------------------------------
# Orchestration entrypoints
# ---------------------------------------------------------------------------

def analyse_spending(transactions: Sequence[MutableMapping[str, Any]]) -> Dict[str, Any]:
    rows = preprocess(transactions)
    trends = monthly_trends(rows)
    patterns = pattern_mining(rows)
    recurring = detect_recurring(rows)
    anomalies = detect_anomalies(rows)
    variances = compute_variances(rows)
    suggestions = build_suggestions(trends, patterns, recurring, anomalies, variances)
    challenges = build_challenges(suggestions, patterns, variances)
    return summarise(rows, trends, patterns, recurring, anomalies, suggestions, challenges, variances)


def analyze_transactions(transactions: Sequence[MutableMapping[str, Any]]) -> Dict[str, Any]:
    """US spelling alias for compatibility."""
    return analyse_spending(transactions)


__all__ = [
    "analyse_spending",
    "analyze_transactions",
    "preprocess",
    "monthly_trends",
    "pattern_mining",
    "detect_recurring",
    "detect_anomalies",
    "compute_variances",
    "build_suggestions",
    "build_challenges",
    "load_transactions_from_json",
]


if __name__ == "__main__":
    default_file = os.path.join(os.path.dirname(__file__), "mock_transactions.json")
    fallback_transactions = [
        {
            "user_id": "demo",
            "ts": "2024-11-03T09:15:00Z",
            "amount": -42.13,
            "currency": "GBP",
            "merchant": "Tesco",
            "category": "groceries",
        },
        {
            "user_id": "demo",
            "ts": "2024-12-05T18:42:00Z",
            "amount": -17.40,
            "currency": "GBP",
            "merchant": "Uber",
            "category": "uber",
        },
        {
            "user_id": "demo",
            "ts": "2024-12-28T09:00:00Z",
            "amount": 2500.00,
            "currency": "GBP",
            "merchant": "Employer",
            "category": "salary",
        },
    ]
    try:
        transactions = load_transactions_from_json(default_file)
        print(f"Loaded {len(transactions)} transactions from {default_file}")
    except (FileNotFoundError, ValueError) as exc:
        print(f"[WARN] {exc}; falling back to built-in sample data.")
        transactions = fallback_transactions

    report = analyse_spending(transactions)
    print("Summary:")
    for key, value in report["summary"].items():
        print(f"  {key}: {value}")
    print("\nTop suggestions:")
    for suggestion in report["suggestions"][:3]:
        print(f" - {suggestion['title']}: {suggestion['insight']}")
