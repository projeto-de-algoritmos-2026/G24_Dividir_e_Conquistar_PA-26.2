from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_snapshot_and_reset():
    assert client.get("/api/health").json()["status"] == "ok"
    assert client.post("/api/reset").json()["elapsed_seconds"] == 0
    assert client.post("/api/advance", json={"seconds": 2}).json()["elapsed_seconds"] == 2


def test_analysis_endpoint():
    analysis = client.get("/api/analysis").json()
    assert analysis["closest_pair"]["matches_brute_force"]
    assert analysis["radius_search"]["matches_brute_force"]


def test_laboratory_compares_every_algorithm_with_its_baseline():
    response = client.post("/api/laboratory", json={"sizes": [50, 100], "pattern": "sorted"})
    assert response.status_code == 200
    rows = response.json()["rows"]
    assert [row["size"] for row in rows] == [50, 100]
    for row in rows:
        for algorithm in ("closest_pair", "inversions", "median"):
            assert row[algorithm]["same_result"]


def test_laboratory_rejects_sizes_out_of_range():
    assert client.post("/api/laboratory", json={"sizes": [5]}).status_code == 422
    assert client.post("/api/laboratory", json={"sizes": [3000]}).status_code == 422
    assert client.post("/api/laboratory", json={"pattern": "reversed"}).status_code == 422
