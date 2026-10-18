from typing import Any, Dict, List, Optional


def _to_dict(data: Any) -> Dict:
    if hasattr(data, "model_dump"):
        return data.model_dump()
    if isinstance(data, dict):
        return data
    return {}


def _normalize(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip().lower()


def _safe_float(
    value: Any,
    default: Optional[float] = None
) -> Optional[float]:
    try:
        if value is None:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def get_health_status(
    current_soh: Optional[float]
) -> str:
    if current_soh is None:
        return "Unknown"
    if current_soh >= 90:
        return "Excellent"
    if current_soh >= 80:
        return "Good"
    if current_soh >= 70:
        return "Degraded"
    return "Critical"



def get_risk_level(
    predictions: Optional[Dict]
) -> str:
    if not predictions:
        return "Unknown"

    current_soh = _safe_float(predictions.get("current_soh"))
    soh_3m = _safe_float(predictions.get("soh_3m"))
    soh_6m = _safe_float(predictions.get("soh_6m"))
    soh_12m = _safe_float(predictions.get("soh_12m"))

    future_soh = (
        soh_12m
        if soh_12m is not None
        else soh_6m
        if soh_6m is not None
        else soh_3m
    )

    if future_soh is None:
        return "Unknown"

    degradation = 0.0
    if current_soh is not None:
        degradation = max(0.0, current_soh - future_soh)

    if future_soh < 70:
        return "Critical"

    if future_soh < 80:
        return "High"
    if degradation >= 5:
        return "High"


    if future_soh < 85:
        return "Medium"
    if degradation >= 3:
        return "Medium"

    return "Low"


def _add_recommendation(
    recommendations: List[Dict],
    priority: str,
    title: str,
    message: str
):
    if any(r["title"].lower() == title.lower() for r in recommendations):
        return

    recommendations.append({
        "priority": priority,
        "title": title,
        "message": message
    })



def generate_recommendations(
    data: Any,
    predictions: Optional[Dict] = None
) -> List[Dict]:
    user_data = _to_dict(data)
    predictions = predictions if predictions is not None else {}
    recommendations: List[Dict] = []


    current_soh = _safe_float(
        user_data.get("soh_estimated_pct", user_data.get("current_soh"))
    )

    battery_age_years = _safe_float(user_data.get("battery_age_years"))
    battery_age_months = _safe_float(user_data.get("battery_age_months"))
    if battery_age_months is None and battery_age_years is not None:
        battery_age_months = battery_age_years * 12.0
    elif battery_age_years is None and battery_age_months is not None:
        battery_age_years = battery_age_months / 12.0

    avg_temperature = _safe_float(
        user_data.get("battery_temperature_c", user_data.get("avg_temperature"))
    )

    avg_soc_change = _safe_float(user_data.get("avg_soc_change"))
    soc_start = _safe_float(user_data.get("weekly_avg_soc_start_pct"))
    soc_end = _safe_float(user_data.get("weekly_avg_soc_end_pct"))
    if avg_soc_change is None and soc_start is not None and soc_end is not None:
        avg_soc_change = abs(soc_end - soc_start)

    avg_charge_duration = _safe_float(
        user_data.get("weekly_avg_charge_duration_min", user_data.get("avg_charge_duration"))
    )

    charging_sessions = _safe_float(
        user_data.get("weekly_charge_sessions", user_data.get("charging_sessions"))
    )

    fast_charge_fraction = _safe_float(
        user_data.get("weekly_fast_charge_fraction")
    )

    weekly_distance = _safe_float(
        user_data.get("weekly_driving_distance_km")
    )

    energy_consumption = _safe_float(
        user_data.get("weekly_energy_consumption_kwh_per_100km")
    )

    driving_style = _normalize(user_data.get("driving_mode") or user_data.get("driving_style"))
    charging_habit = _normalize(user_data.get("charging_habit"))


    soh_3m = _safe_float(predictions.get("soh_3m"))
    soh_6m = _safe_float(predictions.get("soh_6m"))
    soh_12m = _safe_float(predictions.get("soh_12m"))

    degradation_3m = _safe_float(predictions.get("degradation_3m"), 0.0)
    degradation_6m = _safe_float(predictions.get("degradation_6m"), 0.0)
    degradation_12m = _safe_float(predictions.get("degradation_12m"), 0.0)


    replacement_reasons: List[str] = []

    if current_soh is not None and current_soh < 70:
        replacement_reasons.append(
            f"current SOH is {current_soh:.1f}%, below the 70% replacement-evaluation threshold"
        )

    if battery_age_months is not None and battery_age_months >= 96:
        replacement_reasons.append(
            f"battery age is {battery_age_months:.0f} months (8 years or more)"
        )

    if soh_12m is not None and soh_12m < 70:
        replacement_reasons.append(
            f"the 12-month forecast falls to {soh_12m:.1f}% SOH"
        )

    if replacement_reasons:
        _add_recommendation(
            recommendations,
            "High",
            "Battery replacement evaluation recommended",
            (
                "A professional EV battery inspection and replacement evaluation are recommended because "
                + "; ".join(replacement_reasons)
                + ". Battery age or SOH alone does not prove that the pack must be replaced, "
                "so confirm the decision with the vehicle manufacturer or a qualified EV service centre."
            )
        )

    # =====================================================
    # 1. FUTURE SOH / DEGRADATION
    # =====================================================

    if soh_12m is not None and 70 <= soh_12m < 80:
        _add_recommendation(
            recommendations,
            "High",
            "Battery health may require attention",
            (
                f"The 12-month forecast estimates battery SOH at approximately {soh_12m:.1f}%. "
                "Consider scheduling a professional battery inspection and reviewing charging habits."
            )
        )
    elif soh_12m is not None and 80 <= soh_12m < 85:
        _add_recommendation(
            recommendations,
            "Medium",
            "Monitor long-term battery health",
            (
                f"The predicted 12-month SOH is {soh_12m:.1f}%. "
                "Monitor battery condition regularly and avoid unnecessary battery stress."
            )
        )

    if degradation_12m is not None and degradation_12m >= 4:
        _add_recommendation(
            recommendations,
            "High",
            "Higher predicted degradation",
            (
                f"The model estimates approximately {degradation_12m:.1f}% SOH reduction over 12 months. "
                "Reducing high-stress charging and driving conditions may help limit additional degradation."
            )
        )
    elif degradation_12m is not None and degradation_12m >= 2:
        _add_recommendation(
            recommendations,
            "Medium",
            "Moderate predicted degradation",
            (
                f"The estimated 12-month SOH reduction is approximately {degradation_12m:.1f}%. "
                "Continue monitoring charging behaviour and battery temperature."
            )
        )


    if current_soh is not None and 70 <= current_soh < 80:
        _add_recommendation(
            recommendations,
            "High",
            "Current battery health is degraded",
            (
                f"The submitted current SOH is {current_soh:.1f}%. Schedule a professional battery diagnostic, "
                "especially if range or charging performance has noticeably changed."
            )
        )
    elif current_soh is not None and 80 <= current_soh < 90:
        _add_recommendation(
            recommendations,
            "Medium",
            "Continue monitoring battery health",
            (
                f"Current battery SOH is {current_soh:.1f}%. Regular monitoring can help identify "
                "unusual degradation patterns early."
            )
        )


    if fast_charge_fraction is not None and fast_charge_fraction >= 0.40:
        _add_recommendation(
            recommendations,
            "High",
            "Reduce frequent fast charging",
            (
                f"High DC fast-charging fraction ({fast_charge_fraction * 100:.0f}%) exposes the battery to higher thermal and charging stress. "
                "When practical, use slower AC charging for routine charging and reserve fast charging "
                "mainly for long trips or urgent situations."
            )
        )
    elif fast_charge_fraction is not None and 0.15 <= fast_charge_fraction < 0.40:
        _add_recommendation(
            recommendations,
            "Low",
            "Use fast charging selectively",
            (
                f"Your fast-charging usage is moderate ({fast_charge_fraction * 100:.0f}%). Continue using fast charging when needed "
                "while relying on normal AC charging for routine use where possible."
            )
        )
    elif fast_charge_fraction is not None and fast_charge_fraction < 0.15:
        _add_recommendation(
            recommendations,
            "Low",
            "Prefer AC or Level 1/Level 2 for routine charging",
            (
                "Continue using normal AC or Level 1/Level 2 charging for routine use when practical, "
                "and reserve DC fast charging for situations where faster charging is needed."
            )
        )


    full_charge_keywords = ["frequent full", "charge to 100", "often 100", "near 100", "0-100", "0 to 100"]
    low_soc_keywords = ["below 20", "deep discharge", "very low", "near 0"]
    extreme_soc_keywords = ["near 0% or 100%", "extreme soc"]

    has_extreme_soc_measurement = (
        (soc_start is not None and soc_start <= 10.0)
        or (soc_end is not None and soc_end >= 98.0)
    )

    if (
        any(keyword in charging_habit for keyword in full_charge_keywords)
        or any(keyword in charging_habit for keyword in low_soc_keywords)
        or any(keyword in charging_habit for keyword in extreme_soc_keywords)
        or has_extreme_soc_measurement
    ):
        _add_recommendation(
            recommendations,
            "High",
            "Improve routine charging range",
            (
                "Avoid leaving the battery near 0% or 100% for prolonged periods when possible. "
                "For routine use, aim for a moderate SOC window such as roughly 20-80% when that "
                "matches your vehicle manufacturer's guidance, and always follow the vehicle-specific daily charge limit."
            )
        )
    elif (
        "20-80" in charging_habit
        or "20 to 80" in charging_habit
        or "manufacturer daily limit" in charging_habit
        or "oem daily limit" in charging_habit
        or (soc_start is not None and soc_start >= 15 and soc_end is not None and soc_end <= 85)
    ):
        _add_recommendation(
            recommendations,
            "Low",
            "Good routine charging practice",
            (
                "Your routine charging follows a moderate SOC range or the manufacturer's daily charge limit. "
                "Continue avoiding prolonged time near 0% or 100%."
            )
        )


    if avg_temperature is not None and avg_temperature >= 38.0:
        _add_recommendation(
            recommendations,
            "Medium",
            "Reduce high battery temperature exposure",
            (
                f"Elevated battery pack temperature ({avg_temperature:.1f} °C) can accelerate cell degradation. "
                "Prefer shaded parking when practical and avoid high-power DC fast charging immediately following heavy driving."
            )
        )
    elif avg_temperature is not None and avg_temperature <= 0.0:
        _add_recommendation(
            recommendations,
            "Low",
            "Cold temperature considerations",
            (
                f"Low battery temperature ({avg_temperature:.1f} °C) can temporarily reduce charging speed and available range. "
                "Preheat the pack or vehicle cabin while plugged in before departure."
            )
        )


    if "aggressive" in driving_style or "sport" in driving_style:
        _add_recommendation(
            recommendations,
            "Medium",
            "Use smoother acceleration",
            (
                "Aggressive acceleration and repeated high-power demand can increase battery load. "
                "Smoother acceleration and anticipatory braking can reduce unnecessary energy and thermal stress."
            )
        )
    elif "smooth" in driving_style or "eco" in driving_style:
        _add_recommendation(
            recommendations,
            "Low",
            "Maintain smooth driving",
            (
                "Your driving style is relatively battery-friendly. Continue using smooth acceleration "
                "and regenerative braking where appropriate."
            )
        )

    if energy_consumption is not None and energy_consumption >= 22.0:
        _add_recommendation(
            recommendations,
            "Medium",
            "High energy consumption observed",
            (
                f"Weekly average energy consumption is {energy_consumption:.1f} kWh/100km. "
                "High consumption from aggressive highway driving or intense HVAC heating/cooling increases "
                "pack cycling and continuous discharge stress."
            )
        )


    if weekly_distance is not None and weekly_distance >= 600.0:
        _add_recommendation(
            recommendations,
            "Medium",
            "Plan charging for high usage",
            (
                f"Your weekly driving distance is high ({weekly_distance:.0f} km/week). Plan charging sessions to avoid "
                "repeatedly reaching very low SOC and allow the battery to cool after demanding journeys."
            )
        )

    if charging_sessions is not None and charging_sessions >= 14.0:
        _add_recommendation(
            recommendations,
            "Low",
            "High weekly charging frequency",
            (
                f"You record {charging_sessions:.0f} charging sessions per week. Frequent charging sessions are safe with lithium EV packs, "
                "but keeping sessions within a moderate 20-80% SOC window avoids unnecessary battery cycling stress."
            )
        )


    if avg_soc_change is not None and avg_soc_change >= 80:
        _add_recommendation(
            recommendations,
            "Medium",
            "Large SOC swings detected",
            (
                f"The average SOC change per charging session is approximately {avg_soc_change:.1f}%. "
                "Repeated deep charge/discharge swings may place greater stress on the battery than moderate routine cycling."
            )
        )


    if avg_charge_duration is not None and avg_charge_duration >= 300:
        _add_recommendation(
            recommendations,
            "Low",
            "Review long charging sessions",
            (
                f"The reported average charging duration is approximately {avg_charge_duration:.0f} minutes. "
                "Check whether the vehicle remains connected at a high SOC for long periods unnecessarily."
            )
        )


    if (
        soh_3m is not None
        and current_soh is not None
        and current_soh - soh_3m >= 2
    ):
        _add_recommendation(
            recommendations,
            "High",
            "Short-term degradation requires monitoring",
            (
                f"The 3-month prediction shows a noticeable SOH reduction from {current_soh:.1f}% to {soh_3m:.1f}%. "
                "Review recent charging and thermal conditions and continue monitoring the trend."
            )
        )


    if len(recommendations) == 0:
        _add_recommendation(
            recommendations,
            "Low",
            "Maintain current battery-care practices",
            (
                "No major risk condition was identified from the submitted profile and SOH forecast. "
                "Continue using routine AC/Level 1 or Level 2 charging when practical, follow your vehicle's "
                "recommended daily charge limit, avoid prolonged time near 0% or 100% SOC, and reduce unnecessary heat exposure."
            )
        )


    priority_order = {"High": 0, "Medium": 1, "Low": 2}
    recommendations.sort(key=lambda item: priority_order.get(item["priority"], 3))

    return recommendations[:6]