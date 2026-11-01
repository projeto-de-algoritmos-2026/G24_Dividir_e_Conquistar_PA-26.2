from collections import defaultdict

from app.airspace.geography import airport_name
from app.divide_and_conquer.inversions import count_inversions, count_inversions_brute_force


def _estimated_arrival(flight):
    return flight["eta_minutes"]


def build_landing_sequence(airport, inbound):
    departure_order = sorted(inbound, key=lambda flight: (-flight["minutes_since_departure"], flight["id"]))
    divide_and_conquer = count_inversions(departure_order, key=_estimated_arrival, collect_pairs=True)
    brute_force = count_inversions_brute_force(departure_order, key=_estimated_arrival)
    landing_order = sorted(departure_order, key=lambda flight: (flight["eta_minutes"], flight["id"]))
    landing_position = {flight["id"]: position for position, flight in enumerate(landing_order, start=1)}
    total_pairs = len(departure_order) * (len(departure_order) - 1) // 2

    return {
        "airport": airport,
        "airport_name": airport_name(airport),
        "flights": [
            {
                "id": flight["id"],
                "carrier": flight["carrier"],
                "origin": flight["origin"],
                "origin_name": flight["origin_name"],
                "speed_kmh": flight["speed_kmh"],
                "remaining_km": round(flight["remaining_km"], 1),
                "minutes_since_departure": round(flight["minutes_since_departure"], 1),
                "eta_minutes": round(flight["eta_minutes"], 1),
                "departure_position": position,
                "landing_position": landing_position[flight["id"]],
            }
            for position, flight in enumerate(departure_order, start=1)
        ],
        "inversions": divide_and_conquer.count,
        "total_pairs": total_pairs,
        "inverted_pairs": [
            {"departed_first": earlier["id"], "lands_first": later["id"]}
            for earlier, later in divide_and_conquer.inverted_pairs
        ],
        "comparisons": divide_and_conquer.comparisons,
        "brute_force_comparisons": brute_force.comparisons,
        "matches_brute_force": divide_and_conquer.count == brute_force.count,
    }


def build_landing_sequences(aircraft):
    inbound_by_airport = defaultdict(list)
    for flight in aircraft:
        inbound_by_airport[flight["destination"]].append(flight)

    sequences = [
        build_landing_sequence(airport, inbound)
        for airport, inbound in inbound_by_airport.items()
        if len(inbound) >= 2
    ]
    sequences.sort(key=lambda sequence: (-sequence["inversions"], -len(sequence["flights"]), sequence["airport"]))
    return sequences
