from typing import Any, Dict, List, Optional


# =========================================================
# HELPER FUNCTIONS
# =========================================================

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


# =========================================================
# HEALTH STATUS
# =========================================================

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


# =========================================================
# FUTURE RISK LEVEL
# =========================================================

def get_risk_level(
    predictions: Optional[Dict]
) -> str:

    if not predictions:
        return "Unknown"


    current_soh = _safe_float(
        predictions.get("current_soh")
    )

    soh_3m = _safe_float(
        predictions.get("soh_3m")
    )

    soh_6m = _safe_float(
        predictions.get("soh_6m")
    )

    soh_12m = _safe_float(
        predictions.get("soh_12m")
    )


    # Use the longest available forecast
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

        degradation = max(
            0.0,
            current_soh - future_soh
        )


    # Critical future SOH
    if future_soh < 70:
        return "Critical"

    # High risk
    if future_soh < 80:
        return "High"

    if degradation >= 5:
        return "High"

    # Medium risk
    if future_soh < 85:
        return "Medium"

    if degradation >= 3:
        return "Medium"

    return "Low"


# =========================================================
# ADD RECOMMENDATION
# =========================================================

def _add_recommendation(
    recommendations: List[Dict],
    priority: str,
    title: str,
    message: str
):

    recommendations.append({
        "priority": priority,
        "title": title,
        "message": message
    })


# =========================================================
# PERSONALIZED RECOMMENDATIONS
# =========================================================

def generate_recommendations(
    data: Any,
    predictions: Optional[Dict] = None
) -> List[Dict]:

    user_data = _to_dict(data)

    predictions = (
        predictions
        if predictions is not None
        else {}
    )


    recommendations: List[Dict] = []


    # =====================================================
    # READ USER VALUES
    # =====================================================

    current_soh = _safe_float(
        user_data.get("current_soh")
    )

    battery_age_months = _safe_float(
        user_data.get("battery_age_months")
    )

    avg_temperature = _safe_float(
        user_data.get("avg_temperature")
    )

    avg_soc_change = _safe_float(
        user_data.get("avg_soc_change")
    )

    avg_charge_duration = _safe_float(
        user_data.get("avg_charge_duration")
    )

    charging_sessions = _safe_float(
        user_data.get("charging_sessions")
    )


    driving_style = _normalize(
        user_data.get("driving_style")
    )

    avg_daily_distance = _normalize(
        user_data.get("avg_daily_distance")
    )

    charging_frequency = _normalize(
        user_data.get("charging_frequency")
    )

    fast_charging_usage = _normalize(
        user_data.get("fast_charging_usage")
    )

    charging_habit = _normalize(
        user_data.get("charging_habit")
    )

    temperature_exposure = _normalize(
        user_data.get("temperature_exposure")
    )


    # =====================================================
    # READ MODEL PREDICTIONS
    # =====================================================

    soh_3m = _safe_float(
        predictions.get("soh_3m")
    )

    soh_6m = _safe_float(
        predictions.get("soh_6m")
    )

    soh_12m = _safe_float(
        predictions.get("soh_12m")
    )


    degradation_3m = _safe_float(
        predictions.get("degradation_3m"),
        0.0
    )

    degradation_6m = _safe_float(
        predictions.get("degradation_6m"),
        0.0
    )

    degradation_12m = _safe_float(
        predictions.get("degradation_12m"),
        0.0
    )


    # =====================================================
    # 0. REPLACEMENT / PROFESSIONAL EVALUATION
    # =====================================================

    replacement_reasons: List[str] = []

    if (
        current_soh is not None
        and current_soh < 70
    ):
        replacement_reasons.append(
            f"current SOH is {current_soh:.1f}%, below the "
            f"70% replacement-evaluation threshold used by this project"
        )

    if (
        battery_age_months is not None
        and battery_age_months >= 96
    ):
        replacement_reasons.append(
            f"battery age is {battery_age_months:.0f} months (8 years or more)"
        )

    if (
        soh_12m is not None
        and soh_12m < 70
    ):
        replacement_reasons.append(
            f"the 12-month forecast falls to {soh_12m:.1f}% SOH"
        )

    if replacement_reasons:

        _add_recommendation(
            recommendations,
            "High",
            "Battery replacement evaluation recommended",
            (
                "A professional EV battery inspection and replacement "
                "evaluation are recommended because "
                + "; ".join(replacement_reasons)
                + ". Battery age or SOH alone does not prove that the pack "
                "must be replaced, so confirm the decision with the vehicle "
                "manufacturer or a qualified EV service centre."
            )
        )


    # =====================================================
    # 1. FUTURE SOH / DEGRADATION
    # =====================================================

    if (
        soh_12m is not None
        and 70 <= soh_12m < 80
    ):

        _add_recommendation(
            recommendations,
            "High",
            "Battery health may require attention",
            (
                f"The 12-month forecast estimates "
                f"battery SOH at approximately "
                f"{soh_12m:.1f}%. Consider scheduling "
                f"a professional battery inspection and reviewing "
                f"charging habits."
            )
        )


    elif (
        soh_12m is not None
        and 80 <= soh_12m < 85
    ):

        _add_recommendation(
            recommendations,
            "Medium",
            "Monitor long-term battery health",
            (
                f"The predicted 12-month SOH is "
                f"{soh_12m:.1f}%. Monitor battery "
                f"condition regularly and avoid "
                f"unnecessary battery stress."
            )
        )


    if (
        degradation_12m is not None
        and degradation_12m >= 4
    ):

        _add_recommendation(
            recommendations,
            "High",
            "Higher predicted degradation",
            (
                f"The model estimates approximately "
                f"{degradation_12m:.1f}% SOH reduction "
                f"over 12 months. Reducing high-stress "
                f"charging and driving conditions may "
                f"help limit additional degradation."
            )
        )


    elif (
        degradation_12m is not None
        and degradation_12m >= 2
    ):

        _add_recommendation(
            recommendations,
            "Medium",
            "Moderate predicted degradation",
            (
                f"The estimated 12-month SOH reduction "
                f"is approximately "
                f"{degradation_12m:.1f}%. Continue "
                f"monitoring charging behaviour and "
                f"battery temperature."
            )
        )


    # =====================================================
    # 2. CURRENT BATTERY HEALTH
    # =====================================================

    if (
        current_soh is not None
        and 70 <= current_soh < 80
    ):

        _add_recommendation(
            recommendations,
            "High",
            "Current battery health is degraded",
            (
                f"The submitted current SOH is "
                f"{current_soh:.1f}%. Schedule a "
                f"professional battery diagnostic, "
                f"especially if range or charging "
                f"performance has noticeably changed."
            )
        )


    elif (
        current_soh is not None
        and 80 <= current_soh < 90
    ):

        _add_recommendation(
            recommendations,
            "Medium",
            "Continue monitoring battery health",
            (
                f"Current battery SOH is "
                f"{current_soh:.1f}%. Regular monitoring "
                f"can help identify unusual degradation "
                f"patterns early."
            )
        )


    # =====================================================
    # 3. FAST CHARGING
    # =====================================================

    if (
        "always" in fast_charging_usage
        or
        "often" in fast_charging_usage
        or
        "frequent" in fast_charging_usage
    ):

        _add_recommendation(
            recommendations,
            "High",
            "Reduce frequent fast charging",
            (
                "Frequent DC fast charging can expose "
                "the battery to higher thermal and "
                "charging stress. When practical, use "
                "slower AC charging for routine charging "
                "and reserve fast charging mainly for "
                "long trips or urgent situations."
            )
        )


    elif (
        "sometimes" in fast_charging_usage
        or
        "occasionally" in fast_charging_usage
    ):

        _add_recommendation(
            recommendations,
            "Low",
            "Use fast charging selectively",
            (
                "Your fast-charging usage appears "
                "moderate. Continue using fast charging "
                "when needed while relying on normal "
                "charging for routine use where possible."
            )
        )


    elif (
        "never" in fast_charging_usage
        or "rarely" in fast_charging_usage
    ):

        _add_recommendation(
            recommendations,
            "Low",
            "Prefer AC or Level 1/Level 2 for routine charging",
            (
                "Continue using normal AC or Level 1/Level 2 charging for "
                "routine use when practical, and reserve DC fast charging "
                "for situations where faster charging is needed."
            )
        )


    # =====================================================
    # 4. CHARGING HABIT / SOC RANGE
    # =====================================================

    full_charge_keywords = [
        "frequent full",
        "charge to 100",
        "often 100",
        "near 100",
        "0-100",
        "0 to 100"
    ]

    low_soc_keywords = [
        "below 20",
        "deep discharge",
        "very low",
        "near 0"
    ]

    extreme_soc_keywords = [
        "near 0% or 100%",
        "extreme soc"
    ]

    if (
        any(keyword in charging_habit for keyword in full_charge_keywords)
        or any(keyword in charging_habit for keyword in low_soc_keywords)
        or any(keyword in charging_habit for keyword in extreme_soc_keywords)
    ):

        _add_recommendation(
            recommendations,
            "High",
            "Improve routine charging range",
            (
                "Avoid leaving the battery near 0% or 100% for prolonged "
                "periods when possible. For routine use, aim for a moderate "
                "SOC window such as roughly 20-80% when that matches your "
                "vehicle manufacturer's guidance, and always follow the "
                "vehicle-specific daily charge limit."
            )
        )


    elif (
        "20-80" in charging_habit
        or "20 to 80" in charging_habit
        or "manufacturer daily limit" in charging_habit
        or "oem daily limit" in charging_habit
    ):

        _add_recommendation(
            recommendations,
            "Low",
            "Good routine charging practice",
            (
                "Your selected charging habit follows a moderate SOC range "
                "or the manufacturer's daily charge limit. Continue avoiding "
                "prolonged time near 0% or 100%."
            )
        )


    # =====================================================
    # 5. TEMPERATURE EXPOSURE
    # =====================================================

    if (
        "high" in temperature_exposure
        or "hot" in temperature_exposure
        or "extreme" in temperature_exposure
    ):

        _add_recommendation(
            recommendations,
            "Medium",
            "Reduce prolonged heat exposure",
            (
                "Hot conditions can accelerate battery stress. Prefer shaded "
                "parking when practical and avoid unnecessary prolonged heat "
                "exposure. If the vehicle supports scheduled preconditioning, "
                "use it while plugged in when appropriate."
            )
        )


    # =====================================================
    # 6. DRIVING STYLE
    # =====================================================

    if (
        "aggressive" in driving_style
        or
        "sport" in driving_style
    ):

        _add_recommendation(
            recommendations,
            "Medium",
            "Use smoother acceleration",
            (
                "Aggressive acceleration and repeated "
                "high-power demand can increase battery "
                "load. Smoother acceleration and "
                "anticipatory braking can reduce "
                "unnecessary energy and thermal stress."
            )
        )


    elif (
        "smooth" in driving_style
        or
        "eco" in driving_style
    ):

        _add_recommendation(
            recommendations,
            "Low",
            "Maintain smooth driving",
            (
                "Your driving style is relatively "
                "battery-friendly. Continue using smooth "
                "acceleration and regenerative braking "
                "where appropriate."
            )
        )


    # =====================================================
    # 7. DAILY DISTANCE
    # =====================================================

    high_distance_keywords = [
        "100+",
        "100 +",
        "more than 100",
        "80-100",
        "80 - 100"
    ]


    if any(
        keyword in avg_daily_distance
        for keyword
        in high_distance_keywords
    ):

        _add_recommendation(
            recommendations,
            "Medium",
            "Plan charging for high daily usage",
            (
                "Your selected daily driving distance "
                "is relatively high. Plan charging "
                "sessions to avoid repeatedly reaching "
                "very low SOC and allow the battery "
                "to cool after demanding journeys "
                "when necessary."
            )
        )


    # =====================================================
    # 8. CHARGING FREQUENCY
    # =====================================================

    if (
        "1-2" in charging_frequency
        and (
            "below 20" in charging_habit
            or "deep discharge" in charging_habit
            or "very low" in charging_habit
        )
    ):

        _add_recommendation(
            recommendations,
            "Medium",
            "Charge before the battery becomes very low",
            (
                "Charge more regularly rather than routinely waiting until "
                "the battery reaches a very low state of charge. Follow the "
                "vehicle manufacturer's recommended daily charge limit."
            )
        )


    # =====================================================
    # 9. SOC CHANGE PER CHARGING SESSION
    # =====================================================

    if (
        avg_soc_change is not None
        and avg_soc_change >= 80
    ):

        _add_recommendation(
            recommendations,
            "Medium",
            "Large SOC swings detected",
            (
                f"The average SOC change per charging "
                f"session is approximately "
                f"{avg_soc_change:.1f}%. Repeated deep "
                f"charge/discharge swings may place "
                f"greater stress on the battery than "
                f"moderate routine cycling."
            )
        )


    # =====================================================
    # 10. LONG CHARGING DURATION
    # =====================================================

    if (
        avg_charge_duration is not None
        and avg_charge_duration >= 300
    ):

        _add_recommendation(
            recommendations,
            "Low",
            "Review long charging sessions",
            (
                f"The reported average charging duration "
                f"is approximately "
                f"{avg_charge_duration:.0f} minutes. "
                f"Check whether the vehicle remains "
                f"connected at a high SOC for long "
                f"periods unnecessarily."
            )
        )


    # =====================================================
    # 11. SHORT-TERM FORECAST WARNING
    # =====================================================

    if (
        soh_3m is not None
        and current_soh is not None
        and
        current_soh - soh_3m >= 2
    ):

        _add_recommendation(
            recommendations,
            "High",
            "Short-term degradation requires monitoring",
            (
                f"The 3-month prediction shows a "
                f"noticeable SOH reduction from "
                f"{current_soh:.1f}% to "
                f"{soh_3m:.1f}%. Review recent charging "
                f"and thermal conditions and continue "
                f"monitoring the trend."
            )
        )


    # =====================================================
    # DEFAULT MESSAGE
    # =====================================================

    if len(recommendations) == 0:

        _add_recommendation(
            recommendations,
            "Low",
            "Maintain current battery-care practices",
            (
                "No major risk condition was identified from the submitted "
                "profile and SOH forecast. Continue using routine AC/Level 1 "
                "or Level 2 charging when practical, follow your vehicle's "
                "recommended daily charge limit, avoid prolonged time near "
                "0% or 100% SOC, and reduce unnecessary heat exposure."
            )
        )


    # =====================================================
    # SORT PRIORITY
    # =====================================================

    priority_order = {
        "High": 0,
        "Medium": 1,
        "Low": 2
    }


    recommendations.sort(
        key=lambda item:
            priority_order.get(
                item["priority"],
                3
            )
    )


    # Avoid overwhelming the user
    return recommendations[:6]