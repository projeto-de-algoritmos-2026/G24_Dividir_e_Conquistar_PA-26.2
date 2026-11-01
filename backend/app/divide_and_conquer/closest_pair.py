from dataclasses import dataclass, field
from math import hypot, inf

STRIP_NEIGHBOURS_TO_CHECK = 7


@dataclass
class ClosestPairResult:
    first: dict | None
    second: dict | None
    distance: float
    distance_checks: int
    steps: list[dict] = field(default_factory=list)


def planar_distance(first, second):
    return hypot(first["x"] - second["x"], first["y"] - second["y"])


def find_closest_pair(points, record_steps=False):
    if len(points) < 2:
        return ClosestPairResult(None, None, inf, 0)

    distance_checks = 0
    steps = []

    def measure(first, second):
        nonlocal distance_checks
        distance_checks += 1
        return planar_distance(first, second)

    def register_step(kind, depth, region, split_x, halves_distance, strip, best):
        steps.append(
            {
                "order": len(steps),
                "kind": kind,
                "depth": depth,
                "region_ids": [point["id"] for point in region],
                "min_x": min(point["x"] for point in region),
                "max_x": max(point["x"] for point in region),
                "split_x": split_x,
                "halves_distance": halves_distance,
                "strip_ids": [point["id"] for point in strip],
                "best_pair": [best[0]["id"], best[1]["id"]],
                "best_distance": best[2],
            }
        )

    def solve_by_brute_force(region, depth):
        best = (None, None, inf)
        for index, first in enumerate(region):
            for second in region[index + 1 :]:
                distance = measure(first, second)
                if distance < best[2]:
                    best = (first, second, distance)
        if record_steps:
            register_step("base", depth, region, None, None, [], best)
        return best

    def solve(sorted_by_x, sorted_by_y, depth):
        if len(sorted_by_x) <= 3:
            return solve_by_brute_force(sorted_by_x, depth)

        middle = len(sorted_by_x) // 2
        split_x = sorted_by_x[middle]["x"]
        left_ids = {point["id"] for point in sorted_by_x[:middle]}
        left_by_y = [point for point in sorted_by_y if point["id"] in left_ids]
        right_by_y = [point for point in sorted_by_y if point["id"] not in left_ids]

        best_left = solve(sorted_by_x[:middle], left_by_y, depth + 1)
        best_right = solve(sorted_by_x[middle:], right_by_y, depth + 1)
        best = best_left if best_left[2] <= best_right[2] else best_right
        halves_distance = best[2]

        strip = [point for point in sorted_by_y if abs(point["x"] - split_x) < halves_distance]
        for index, first in enumerate(strip):
            for second in strip[index + 1 : index + 1 + STRIP_NEIGHBOURS_TO_CHECK]:
                if second["y"] - first["y"] >= best[2]:
                    break
                distance = measure(first, second)
                if distance < best[2]:
                    best = (first, second, distance)

        if record_steps:
            register_step("combine", depth, sorted_by_x, split_x, halves_distance, strip, best)
        return best

    sorted_by_x = sorted(points, key=lambda point: (point["x"], point["y"], point["id"]))
    sorted_by_y = sorted(points, key=lambda point: (point["y"], point["x"], point["id"]))
    first, second, distance = solve(sorted_by_x, sorted_by_y, 0)
    return ClosestPairResult(first, second, distance, distance_checks, steps)


def find_closest_pair_brute_force(points):
    best = (None, None, inf)
    distance_checks = 0
    for index, first in enumerate(points):
        for second in points[index + 1 :]:
            distance_checks += 1
            distance = planar_distance(first, second)
            if distance < best[2]:
                best = (first, second, distance)
    return ClosestPairResult(best[0], best[1], best[2], distance_checks)
