from math import atan2, degrees, hypot

from app.airspace.flight_repository import load_flight_plans
from app.airspace.geography import airport_name, airport_position, to_geographic
from app.airspace.landing_sequence import build_landing_sequences
from app.airspace.proximity import (
    classify_conflicts,
    find_pairs_within_radius,
    find_pairs_within_radius_brute_force,
    pair_ids,
)
from app.divide_and_conquer.closest_pair import find_closest_pair, find_closest_pair_brute_force

PREDICTION_HORIZON_MINUTES = 15
MINIMUM_ROUTE_KM = 0.001
FLIGHT_PLANS = load_flight_plans()


def predictive_search_radius(aircraft):
    """Conservative spatial prefilter for the whole CPA horizon.

    If a pair can be within CONFLICT_HORIZONTAL_KM at any instant t <= H,
    its current distance is at most threshold + (speed_a + speed_b)*H.
    The global maximum speed gives a safe upper bound for all pairs.
    """
    from app.airspace.proximity import CONFLICT_HORIZONTAL_KM
    if not aircraft:
        return CONFLICT_HORIZONTAL_KM
    maximum_speed = max(hypot(plane["vx"], plane["vy"]) for plane in aircraft)
    return CONFLICT_HORIZONTAL_KM + 2 * maximum_speed * PREDICTION_HORIZON_MINUTES / 60


def create_flight(plan):
    flight_id, carrier, origin, destination, altitude_ft, speed_kmh, initial_progress = plan
    start = airport_position(origin)
    end = airport_position(destination)
    delta_x = end[0] - start[0]
    delta_y = end[1] - start[1]
    return {
        "id": flight_id,
        "carrier": carrier,
        "origin": origin,
        "destination": destination,
        "origin_name": airport_name(origin),
        "destination_name": airport_name(destination),
        "alt_ft": altitude_ft,
        "speed_kmh": speed_kmh,
        "progress": initial_progress,
        "length_km": hypot(delta_x, delta_y),
        "start": start,
        "end": end,
        "x": start[0] + delta_x * initial_progress,
        "y": start[1] + delta_y * initial_progress,
    }


def describe_flight(flight):
    delta_x = flight["end"][0] - flight["start"][0]
    delta_y = flight["end"][1] - flight["start"][1]
    route_length = max(flight["length_km"], MINIMUM_ROUTE_KM)
    velocity_x = flight["speed_kmh"] * delta_x / route_length
    velocity_y = flight["speed_kmh"] * delta_y / route_length
    latitude, longitude = to_geographic(flight["x"], flight["y"])
    origin_latitude, origin_longitude = to_geographic(*flight["start"])
    destination_latitude, destination_longitude = to_geographic(*flight["end"])
    remaining_km = (1 - flight["progress"]) * flight["length_km"]
    minutes_since_departure = flight["progress"] * flight["length_km"] / flight["speed_kmh"] * 60
    public_fields = {key: value for key, value in flight.items() if key not in ("start", "end")}
    return {
        **public_fields,
        "lat": latitude,
        "lon": longitude,
        "heading": (degrees(atan2(velocity_x, velocity_y)) + 360) % 360,
        "vx": velocity_x,
        "vy": velocity_y,
        "route": [
            {"lat": origin_latitude, "lon": origin_longitude},
            {"lat": destination_latitude, "lon": destination_longitude},
        ],
        "remaining_km": remaining_km,
        "minutes_since_departure": minutes_since_departure,
        "eta_minutes": max(0, remaining_km / flight["speed_kmh"] * 60),
    }


def pairs_as_ids(pairs):
    return [
        {"a": first["id"], "b": second["id"], "distance_km": round(distance, 2)}
        for first, second, distance in pairs
    ]


class Simulation:
    def __init__(self):
        self.reset()

    def reset(self):
        self.flights = [create_flight(plan) for plan in FLIGHT_PLANS]
        self.elapsed = 0.0
        self.speed = 1
        return self.snapshot()

    def advance(self, seconds=1):
        simulated_seconds = seconds * self.speed
        self.elapsed += simulated_seconds
        for flight in self.flights:
            route_length = max(flight["length_km"], MINIMUM_ROUTE_KM)
            flight["progress"] = (flight["progress"] + flight["speed_kmh"] * simulated_seconds / 3600 / route_length) % 1
            flight["x"] = flight["start"][0] + (flight["end"][0] - flight["start"][0]) * flight["progress"]
            flight["y"] = flight["start"][1] + (flight["end"][1] - flight["start"][1]) * flight["progress"]
        return self.snapshot()

    def aircraft(self):
        return [describe_flight(flight) for flight in self.flights]

    def snapshot(self):
        aircraft = self.aircraft()
        closest = find_closest_pair(aircraft)
        closest_brute_force = find_closest_pair_brute_force(aircraft)
        search_radius = predictive_search_radius(aircraft)
        radius_search = find_pairs_within_radius(aircraft, search_radius)
        radius_brute_force = find_pairs_within_radius_brute_force(aircraft, search_radius)

        return {
            "elapsed_seconds": round(self.elapsed, 2),
            "speed": self.speed,
            "aircraft": aircraft,
            "closest": None
            if closest.first is None
            else {
                "a": closest.first["id"],
                "b": closest.second["id"],
                "distance_km": round(closest.distance, 2),
                "distance_checks": closest.distance_checks,
                "brute_force_checks": closest_brute_force.distance_checks,
                "matches_brute_force": abs(closest.distance - closest_brute_force.distance) < 1e-9,
            },
            "candidates_count": len(radius_search.pairs),
            "candidate_search": {
                "radius_km": round(search_radius, 1),
                "distance_checks": radius_search.distance_checks,
                "median_comparisons": radius_search.selection_comparisons,
                "median_splits": len(radius_search.splits),
                "brute_force_checks": radius_brute_force.distance_checks,
                "matches_brute_force": pair_ids(radius_search.pairs) == pair_ids(radius_brute_force.pairs),
            },
            "conflicts": classify_conflicts(radius_search.pairs, PREDICTION_HORIZON_MINUTES),
            "landing_sequences": build_landing_sequences(aircraft),
            "algorithm": "par mais próximo O(n log n) + busca por raio com divisão pela mediana das medianas",
            "scenario": "Tráfego regional",
        }

    def analysis(self):
        aircraft = self.aircraft()
        closest = find_closest_pair(aircraft, record_steps=True)
        closest_brute_force = find_closest_pair_brute_force(aircraft)
        search_radius = predictive_search_radius(aircraft)
        radius_search = find_pairs_within_radius(aircraft, search_radius)
        radius_brute_force = find_pairs_within_radius_brute_force(aircraft, search_radius)
        return {
            "elapsed_seconds": round(self.elapsed, 2),
            "points": [
                {"id": plane["id"], "x": round(plane["x"], 2), "y": round(plane["y"], 2), "destination": plane["destination"]}
                for plane in aircraft
            ],
            "closest_pair": {
                "a": closest.first["id"],
                "b": closest.second["id"],
                "distance_km": round(closest.distance, 2),
                "distance_checks": closest.distance_checks,
                "brute_force_checks": closest_brute_force.distance_checks,
                "matches_brute_force": abs(closest.distance - closest_brute_force.distance) < 1e-9,
                "steps": closest.steps,
            },
            "radius_search": {
                "radius_km": round(search_radius, 1),
                "pairs": pairs_as_ids(radius_search.pairs),
                "splits": radius_search.splits,
                "distance_checks": radius_search.distance_checks,
                "median_comparisons": radius_search.selection_comparisons,
                "brute_force_checks": radius_brute_force.distance_checks,
                "matches_brute_force": pair_ids(radius_search.pairs) == pair_ids(radius_brute_force.pairs),
            },
        }
