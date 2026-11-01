import random

from app.airspace.proximity import (
    classify_conflicts,
    closest_point_of_approach,
    find_pairs_within_radius,
    find_pairs_within_radius_brute_force,
    pair_ids,
)
from app.airspace.simulation import PREDICTION_HORIZON_MINUTES, Simulation, predictive_search_radius


def random_aircraft(size, seed):
    generator = random.Random(seed)
    return [{"id": f"P{index}", "x": generator.uniform(0, 600), "y": generator.uniform(0, 600)} for index in range(size)]


def test_radius_search_matches_brute_force_on_the_live_traffic():
    aircraft = Simulation().aircraft()
    for radius in [50, 85, 200]:
        divide_and_conquer = find_pairs_within_radius(aircraft, radius)
        brute_force = find_pairs_within_radius_brute_force(aircraft, radius)
        assert pair_ids(divide_and_conquer.pairs) == pair_ids(brute_force.pairs)


def test_radius_search_matches_brute_force_on_random_traffic():
    for size, seed in [(9, 1), (40, 2), (300, 3)]:
        aircraft = random_aircraft(size, seed)
        assert pair_ids(find_pairs_within_radius(aircraft, 60).pairs) == pair_ids(
            find_pairs_within_radius_brute_force(aircraft, 60).pairs
        )


def test_radius_search_splits_on_the_median():
    aircraft = random_aircraft(200, 4)
    result = find_pairs_within_radius(aircraft, 30)
    root = next(split for split in result.splits if split["depth"] == 0)
    assert root["size"] == 200
    assert sum(1 for plane in aircraft if plane["x"] < root["split_x"]) == 100
    assert result.selection_comparisons > 0


def test_closest_point_of_approach_head_on():
    first = {"x": 0, "y": 0, "vx": 100, "vy": 0, "alt_ft": 35000}
    second = {"x": 20, "y": 0, "vx": -100, "vy": 0, "alt_ft": 35000}
    prediction = closest_point_of_approach(first, second, 15)
    assert prediction["minutes"] == 6 and prediction["horizontal_km"] == 0


def test_closest_point_of_approach_parallel():
    first = {"x": 0, "y": 0, "vx": 100, "vy": 0, "alt_ft": 35000}
    second = {"x": 0, "y": 10, "vx": 100, "vy": 0, "alt_ft": 37000}
    assert closest_point_of_approach(first, second)["horizontal_km"] == 10


def test_alerts_come_from_the_algorithm_not_from_marked_flights():
    snapshot = Simulation().snapshot()
    aircraft = snapshot["aircraft"]
    pairs = find_pairs_within_radius_brute_force(aircraft, predictive_search_radius(aircraft)).pairs
    expected = {frozenset((conflict["a"], conflict["b"])) for conflict in classify_conflicts(pairs, PREDICTION_HORIZON_MINUTES)}
    actual = {frozenset((conflict["a"], conflict["b"])) for conflict in snapshot["conflicts"]}
    assert actual == expected


def test_distant_converging_aircraft_are_not_excluded_from_prediction():
    first = {"id": "A", "x": 0, "y": 0, "vx": 700, "vy": 0, "alt_ft": 35000}
    second = {"id": "B", "x": 200, "y": 0, "vx": -700, "vy": 0, "alt_ft": 35000}
    aircraft = [first, second]
    radius = predictive_search_radius(aircraft)
    assert radius >= 200
    candidates = find_pairs_within_radius(aircraft, radius).pairs
    conflicts = classify_conflicts(candidates, 15)
    assert len(conflicts) == 1
    assert conflicts[0]["horizontal_km"] == 0
