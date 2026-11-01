import random
from math import hypot

from app.divide_and_conquer.closest_pair import find_closest_pair, find_closest_pair_brute_force


def make_points(coordinates):
    return [{"id": str(index), "x": x, "y": y} for index, (x, y) in enumerate(coordinates)]


def brute_force_distance(points):
    return min(
        hypot(first["x"] - second["x"], first["y"] - second["y"])
        for index, first in enumerate(points)
        for second in points[index + 1 :]
    )


def test_finds_the_known_closest_pair():
    points = make_points([(0, 0), (100, 100), (1, 1), (9, 3)])
    result = find_closest_pair(points)
    assert {result.first["id"], result.second["id"]} == {"0", "2"}


def test_matches_brute_force_on_random_inputs():
    generator = random.Random(17)
    for size in [2, 3, 4, 5, 10, 40, 120, 500]:
        points = make_points([(generator.random() * 100, generator.random() * 100) for _ in range(size)])
        assert abs(find_closest_pair(points).distance - brute_force_distance(points)) < 1e-9


def test_handles_vertical_lines_and_repeated_coordinates():
    vertical = make_points([(5, y * 3) for y in range(30)])
    assert abs(find_closest_pair(vertical).distance - 3) < 1e-9
    repeated = make_points([(1, 1), (4, 4), (1, 1), (9, 9)])
    assert find_closest_pair(repeated).distance == 0


def test_returns_nothing_for_fewer_than_two_points():
    assert find_closest_pair(make_points([(1, 1)])).first is None


def test_uses_far_fewer_distance_checks_than_brute_force():
    generator = random.Random(5)
    points = make_points([(generator.random() * 1000, generator.random() * 1000) for _ in range(400)])
    divide_and_conquer = find_closest_pair(points)
    brute_force = find_closest_pair_brute_force(points)
    assert brute_force.distance_checks == 400 * 399 // 2
    assert divide_and_conquer.distance_checks * 10 < brute_force.distance_checks


def test_recorded_steps_end_at_the_root_with_the_final_answer():
    generator = random.Random(3)
    points = make_points([(generator.random() * 50, generator.random() * 50) for _ in range(30)])
    result = find_closest_pair(points, record_steps=True)
    root = result.steps[-1]
    assert root["kind"] == "combine" and root["depth"] == 0
    assert len(root["region_ids"]) == 30
    assert set(root["best_pair"]) == {result.first["id"], result.second["id"]}
    assert all(step["best_distance"] >= result.distance for step in result.steps)
