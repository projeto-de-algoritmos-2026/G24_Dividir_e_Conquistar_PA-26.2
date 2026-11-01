import random
from time import perf_counter

from app.divide_and_conquer.closest_pair import find_closest_pair, find_closest_pair_brute_force
from app.divide_and_conquer.inversions import count_inversions, count_inversions_brute_force
from app.divide_and_conquer.median_of_medians import select_kth_smallest, select_kth_with_naive_pivot

SECTOR_SIDE_KM = 4000
MAXIMUM_ARRIVAL_MINUTES = 600
BASE_SEED = 2026


def _timed(function, *arguments, **keyword_arguments):
    started = perf_counter()
    result = function(*arguments, **keyword_arguments)
    return result, round((perf_counter() - started) * 1000, 3)


def _measurement(operations, milliseconds):
    return {"operations": operations, "milliseconds": milliseconds}


def _synthetic_traffic(size, pattern):
    generator = random.Random(BASE_SEED + size)
    positions = [
        {"id": f"SIM{index:04d}", "x": generator.uniform(0, SECTOR_SIDE_KM), "y": generator.uniform(0, SECTOR_SIDE_KM)}
        for index in range(size)
    ]
    arrival_minutes = [generator.uniform(0, MAXIMUM_ARRIVAL_MINUTES) for _ in range(size)]
    if pattern == "sorted":
        arrival_minutes.sort()
    return positions, arrival_minutes


def compare_closest_pair(positions):
    divide_and_conquer, fast_ms = _timed(find_closest_pair, positions)
    brute_force, slow_ms = _timed(find_closest_pair_brute_force, positions)
    return {
        "divide_and_conquer": _measurement(divide_and_conquer.distance_checks, fast_ms),
        "baseline": _measurement(brute_force.distance_checks, slow_ms),
        "result": round(divide_and_conquer.distance, 3),
        "same_result": abs(divide_and_conquer.distance - brute_force.distance) < 1e-9,
    }


def compare_inversions(arrival_minutes):
    divide_and_conquer, fast_ms = _timed(count_inversions, arrival_minutes)
    brute_force, slow_ms = _timed(count_inversions_brute_force, arrival_minutes)
    return {
        "divide_and_conquer": _measurement(divide_and_conquer.comparisons, fast_ms),
        "baseline": _measurement(brute_force.comparisons, slow_ms),
        "result": divide_and_conquer.count,
        "same_result": divide_and_conquer.count == brute_force.count,
    }


def compare_median(arrival_minutes):
    middle = len(arrival_minutes) // 2
    divide_and_conquer, fast_ms = _timed(select_kth_smallest, arrival_minutes, middle)
    naive, slow_ms = _timed(select_kth_with_naive_pivot, arrival_minutes, middle)
    return {
        "divide_and_conquer": _measurement(divide_and_conquer.comparisons, fast_ms),
        "baseline": _measurement(naive.comparisons, slow_ms),
        "result": round(divide_and_conquer.item, 3),
        "same_result": divide_and_conquer.item == naive.item,
    }


def run_laboratory(sizes, pattern):
    rows = []
    for size in sizes:
        positions, arrival_minutes = _synthetic_traffic(size, pattern)
        rows.append(
            {
                "size": size,
                "closest_pair": compare_closest_pair(positions),
                "inversions": compare_inversions(arrival_minutes),
                "median": compare_median(arrival_minutes),
            }
        )
    return {"pattern": pattern, "rows": rows}
