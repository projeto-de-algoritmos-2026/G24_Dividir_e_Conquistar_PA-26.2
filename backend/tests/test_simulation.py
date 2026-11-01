from app.airspace.simulation import FLIGHT_PLANS, Simulation


def test_aircraft_move_and_reset():
    simulation = Simulation()
    before = simulation.snapshot()
    after = simulation.advance(3)
    assert after["elapsed_seconds"] == 3
    assert any(abs(old["lat"] - new["lat"]) > 1e-6 for old, new in zip(before["aircraft"], after["aircraft"]))
    assert simulation.reset()["elapsed_seconds"] == 0


def test_live_results_match_brute_force():
    snapshot = Simulation().snapshot()
    assert snapshot["closest"]["matches_brute_force"]
    assert snapshot["candidate_search"]["matches_brute_force"]
    assert all(sequence["matches_brute_force"] for sequence in snapshot["landing_sequences"])


def test_live_divide_and_conquer_uses_fewer_checks():
    closest = Simulation().snapshot()["closest"]
    size = len(FLIGHT_PLANS)
    assert closest["brute_force_checks"] == size * (size - 1) // 2
    assert closest["distance_checks"] < closest["brute_force_checks"]


def test_routes_have_ends_and_eta():
    aircraft = Simulation().snapshot()["aircraft"]
    assert all(len(plane["route"]) == 2 and plane["eta_minutes"] >= 0 for plane in aircraft)


def test_database_contains_diverse_routes():
    assert len(FLIGHT_PLANS) >= 60
    assert len({(plan[2], plan[3]) for plan in FLIGHT_PLANS}) >= 35
    assert not any(plan[0].startswith("SIM ") for plan in FLIGHT_PLANS)


def test_reset_reproduces_traffic():
    simulation = Simulation()
    initial = simulation.snapshot()
    simulation.advance(10)
    restored = simulation.reset()
    assert restored["closest"] == initial["closest"]
    assert restored["conflicts"] == initial["conflicts"]
    assert restored["landing_sequences"] == initial["landing_sequences"]


def test_geographic_distribution_across_brazil():
    aircraft = Simulation().snapshot()["aircraft"]
    assert min(plane["lat"] for plane in aircraft) < -25
    assert max(plane["lat"] for plane in aircraft) > -5
    assert min(plane["lon"] for plane in aircraft) < -65
    assert max(plane["lon"] for plane in aircraft) > -40


def test_existing_proximity_cases_remain_detectable():
    detected = {frozenset((conflict["a"], conflict["b"])) for conflict in Simulation().snapshot()["conflicts"]}
    assert frozenset(("AZU 3139", "TAM 3105")) in detected
    assert frozenset(("GLO 3161", "AZU 3154")) in detected


def test_each_landing_inversion_is_a_later_departure_landing_first():
    sequences = Simulation().snapshot()["landing_sequences"]
    assert sum(sequence["inversions"] for sequence in sequences) > 0
    for sequence in sequences:
        flights = {flight["id"]: flight for flight in sequence["flights"]}
        assert len(sequence["inverted_pairs"]) == sequence["inversions"] <= sequence["total_pairs"]
        for pair in sequence["inverted_pairs"]:
            departed_first, lands_first = flights[pair["departed_first"]], flights[pair["lands_first"]]
            assert departed_first["departure_position"] < lands_first["departure_position"]
            assert lands_first["landing_position"] < departed_first["landing_position"]


def test_analysis_exposes_the_recorded_steps():
    analysis = Simulation().analysis()
    assert len(analysis["points"]) == len(FLIGHT_PLANS)
    steps = analysis["closest_pair"]["steps"]
    assert steps[-1]["depth"] == 0
    assert {step["kind"] for step in steps} == {"base", "combine"}
    assert analysis["radius_search"]["splits"]
