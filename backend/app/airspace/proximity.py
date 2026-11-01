from dataclasses import dataclass, field
from math import hypot

from app.divide_and_conquer.median_of_medians import select_kth_smallest

SMALL_GROUP_SIZE = 8
CONFLICT_HORIZONTAL_KM = 30
CONFLICT_VERTICAL_FT = 1500
ATTENTION_HORIZONTAL_KM = 12
ATTENTION_VERTICAL_FT = 1000


@dataclass
class RadiusSearchResult:
    pairs: list[tuple[dict, dict, float]]
    distance_checks: int
    selection_comparisons: int = 0
    splits: list[dict] = field(default_factory=list)


def _horizontal_key(aircraft):
    return (aircraft["x"], aircraft["id"])


def find_pairs_within_radius(aircraft, radius_km):
    distance_checks = 0
    selection_comparisons = 0
    splits = []

    def measure(first, second):
        nonlocal distance_checks
        distance_checks += 1
        return hypot(first["x"] - second["x"], first["y"] - second["y"])

    def compare_all(group):
        found = []
        for index, first in enumerate(group):
            for second in group[index + 1 :]:
                distance = measure(first, second)
                if distance <= radius_km:
                    found.append((first, second, distance))
        return found

    def search(group, depth):
        nonlocal selection_comparisons
        if len(group) <= SMALL_GROUP_SIZE:
            return compare_all(group)

        median = select_kth_smallest(group, len(group) // 2, key=_horizontal_key)
        selection_comparisons += median.comparisons
        median_key = _horizontal_key(median.item)
        split_x = median.item["x"]
        splits.append({"depth": depth, "split_x": split_x, "size": len(group), "comparisons": median.comparisons})

        left = [plane for plane in group if _horizontal_key(plane) < median_key]
        right = [plane for plane in group if _horizontal_key(plane) >= median_key]
        found = search(left, depth + 1) + search(right, depth + 1)

        left_band = [plane for plane in left if split_x - plane["x"] <= radius_km]
        right_band = [plane for plane in right if plane["x"] - split_x <= radius_km]
        for first in left_band:
            for second in right_band:
                if abs(first["y"] - second["y"]) <= radius_km:
                    distance = measure(first, second)
                    if distance <= radius_km:
                        found.append((first, second, distance))
        return found

    pairs = search(list(aircraft), 0)
    return RadiusSearchResult(pairs, distance_checks, selection_comparisons, splits)


def find_pairs_within_radius_brute_force(aircraft, radius_km):
    pairs = []
    distance_checks = 0
    for index, first in enumerate(aircraft):
        for second in aircraft[index + 1 :]:
            distance_checks += 1
            distance = hypot(first["x"] - second["x"], first["y"] - second["y"])
            if distance <= radius_km:
                pairs.append((first, second, distance))
    return RadiusSearchResult(pairs, distance_checks)


def pair_ids(pairs):
    return {frozenset((first["id"], second["id"])) for first, second, _ in pairs}


def closest_point_of_approach(first, second, horizon_minutes=15):
    relative_x = second["x"] - first["x"]
    relative_y = second["y"] - first["y"]
    velocity_x = second["vx"] - first["vx"]
    velocity_y = second["vy"] - first["vy"]
    speed_squared = velocity_x * velocity_x + velocity_y * velocity_y
    if speed_squared:
        unbounded_hours = -(relative_x * velocity_x + relative_y * velocity_y) / speed_squared
        hours = max(0, min(horizon_minutes / 60, unbounded_hours))
    else:
        hours = 0
    return {
        "minutes": round(hours * 60, 2),
        "horizontal_km": round(hypot(relative_x + velocity_x * hours, relative_y + velocity_y * hours), 2),
        "vertical_ft": abs(first["alt_ft"] - second["alt_ft"]),
    }


def classify_conflicts(pairs, horizon_minutes):
    conflicts = []
    for first, second, current_distance in pairs:
        prediction = closest_point_of_approach(first, second, horizon_minutes)
        if prediction["horizontal_km"] < CONFLICT_HORIZONTAL_KM and prediction["vertical_ft"] < CONFLICT_VERTICAL_FT:
            needs_attention = (
                prediction["horizontal_km"] < ATTENTION_HORIZONTAL_KM
                and prediction["vertical_ft"] < ATTENTION_VERTICAL_FT
            )
            conflicts.append(
                {
                    "a": first["id"],
                    "b": second["id"],
                    "now_km": round(current_distance, 2),
                    **prediction,
                    "level": "attention" if needs_attention else "watch",
                    "a_cpa_x": round(first["x"] + first["vx"] * prediction["minutes"] / 60, 3),
                    "a_cpa_y": round(first["y"] + first["vy"] * prediction["minutes"] / 60, 3),
                    "b_cpa_x": round(second["x"] + second["vx"] * prediction["minutes"] / 60, 3),
                    "b_cpa_y": round(second["y"] + second["vy"] * prediction["minutes"] / 60, 3),
                }
            )
    conflicts.sort(key=lambda conflict: (conflict["horizontal_km"], conflict["vertical_ft"], conflict["a"], conflict["b"]))
    return conflicts
