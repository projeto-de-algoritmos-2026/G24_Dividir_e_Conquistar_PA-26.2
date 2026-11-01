import sqlite3
from pathlib import Path

DATABASE_PATH = Path(__file__).with_name("flight_routes.sqlite3")


def load_flight_plans():
    with sqlite3.connect(DATABASE_PATH) as database:
        return database.execute(
            "SELECT flight_id, carrier, origin, destination, altitude_ft, speed_kmh, initial_progress "
            "FROM flights ORDER BY flight_id"
        ).fetchall()
