from typing import Dict, Any, List
from app.schemas.size import SizeRequest, SizeResponse

# Standard sizing charts (in cm)
STANDARD_TOPS_CHART = {
    "XS": {"chest": (78, 86), "waist": (68, 74)},
    "S": {"chest": (86, 94), "waist": (74, 82)},
    "M": {"chest": (94, 102), "waist": (82, 90)},
    "L": {"chest": (102, 110), "waist": (90, 98)},
    "XL": {"chest": (110, 118), "waist": (98, 108)},
    "XXL": {"chest": (118, 130), "waist": (108, 120)}
}

STANDARD_BOTTOMS_CHART = {
    "28": {"waist": (68, 73), "hips": (84, 89)},
    "30": {"waist": (74, 78), "hips": (90, 94)},
    "32": {"waist": (79, 84), "hips": (95, 100)},
    "34": {"waist": (85, 90), "hips": (101, 106)},
    "36": {"waist": (91, 98), "hips": (107, 114)},
    "38": {"waist": (99, 108), "hips": (115, 124)}
}

# Brand tolerance offsets (e.g. some brands run slimmer or roomier)
BRAND_OFFSETS = {
    "UrbanKnit": 0.0, # True to size
    "Aura Denim": -1.0, # Runs slightly slim
    "MetroTailor": 1.5, # Slightly relaxed tailored
    "Solace Active": 0.0
}

def calculate_size_recommendation(req: SizeRequest) -> SizeResponse:
    is_bottom = (req.category or "").lower() in ["jeans", "trousers", "shorts", "bottoms"]
    offset = BRAND_OFFSETS.get(req.brand or "", 0.0)

    # Adjust effective measurements based on preferred fit
    # If user prefers "Slim", compare against slightly higher bracket or keep tight
    fit_adjustment = 0.0
    if req.preferred_fit.lower() == "slim":
        fit_adjustment = -1.5
    elif req.preferred_fit.lower() in ["relaxed", "oversized"]:
        fit_adjustment = +2.5

    matched_chart: Dict[str, str] = {}
    recommended_size = "M"
    confidence = 0.90
    explanation = ""

    if is_bottom:
        effective_waist = req.waist_cm + offset + fit_adjustment
        best_size = "32"
        min_diff = 999.0
        
        for size_label, bounds in STANDARD_BOTTOMS_CHART.items():
            w_mid = (bounds["waist"][0] + bounds["waist"][1]) / 2.0
            diff = abs(effective_waist - w_mid)
            matched_chart[size_label] = f"Waist {bounds['waist'][0]}-{bounds['waist'][1]} cm"
            if diff < min_diff:
                min_diff = diff
                best_size = size_label
        
        recommended_size = best_size
        sizes_keys = list(STANDARD_BOTTOMS_CHART.keys())
        idx = sizes_keys.index(recommended_size)
        alternatives = []
        if idx > 0:
            alternatives.append(sizes_keys[idx - 1])
        if idx < len(sizes_keys) - 1:
            alternatives.append(sizes_keys[idx + 1])

        explanation = f"Based on waist measurement {req.waist_cm}cm with {req.preferred_fit} fit preference in {req.brand or 'Standard'} denim cut."
        confidence = round(max(0.70, 0.95 - (min_diff * 0.03)), 2)

    else:
        # Tops / Shirts / Jackets
        effective_chest = req.chest_cm + offset + fit_adjustment
        best_size = "M"
        min_diff = 999.0
        
        for size_label, bounds in STANDARD_TOPS_CHART.items():
            c_mid = (bounds["chest"][0] + bounds["chest"][1]) / 2.0
            diff = abs(effective_chest - c_mid)
            matched_chart[size_label] = f"Chest {bounds['chest'][0]}-{bounds['chest'][1]} cm"
            if diff < min_diff:
                min_diff = diff
                best_size = size_label

        recommended_size = best_size
        sizes_keys = list(STANDARD_TOPS_CHART.keys())
        idx = sizes_keys.index(recommended_size)
        alternatives = []
        if idx > 0:
            alternatives.append(sizes_keys[idx - 1])
        if idx < len(sizes_keys) - 1:
            alternatives.append(sizes_keys[idx + 1])

        explanation = f"Matched to chest measurement {req.chest_cm}cm and height {req.height_cm}cm for an optimal {req.preferred_fit} silhouette."
        confidence = round(max(0.72, 0.96 - (min_diff * 0.025)), 2)

    return SizeResponse(
        recommended_size=recommended_size,
        fit_category=f"{req.preferred_fit} True-Fit",
        confidence_score=confidence,
        explanation=explanation,
        size_chart_matched=matched_chart,
        alternative_sizes=alternatives,
        disclaimer="Transparent heuristic size recommendation based on body anthropometrics and brand-specific sizing curves. Does not guarantee physical bespoke fit."
    )
