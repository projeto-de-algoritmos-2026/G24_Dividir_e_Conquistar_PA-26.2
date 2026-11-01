import random

import pytest

from app.divide_and_conquer.median_of_medians import select_kth_smallest, select_kth_with_naive_pivot


def test_selects_every_position_like_sorting():
    generator = random.Random(23)
    for size in [1, 2, 5, 6, 13, 64, 257]:
        values = [generator.randint(0, 30) for _ in range(size)]
        ordered = sorted(values)
        for position in range(size):
            assert select_kth_smallest(values, position).item == ordered[position]
            assert select_kth_with_naive_pivot(values, position).item == ordered[position]


def test_supports_a_key_function():
    flights = [{"id": name, "eta": eta} for name, eta in [("A", 40), ("B", 5), ("C", 25), ("D", 15), ("E", 35)]]
    assert select_kth_smallest(flights, 2, key=lambda flight: flight["eta"]).item["id"] == "C"


def test_rejects_positions_outside_the_list():
    with pytest.raises(ValueError):
        select_kth_smallest([1, 2, 3], 3)
    with pytest.raises(ValueError):
        select_kth_smallest([], 0)


def test_comparisons_grow_linearly():
    generator = random.Random(8)
    ratios = []
    for size in [500, 1000, 2000, 4000]:
        values = [generator.random() for _ in range(size)]
        ratios.append(select_kth_smallest(values, size // 2).comparisons / size)
    assert max(ratios) < 30
    assert max(ratios) - min(ratios) < 5


def test_guarantees_linear_work_where_the_naive_pivot_degrades():
    sorted_values = list(range(2000))
    median_of_medians = select_kth_smallest(sorted_values, 1000)
    naive_pivot = select_kth_with_naive_pivot(sorted_values, 1000)
    assert median_of_medians.item == naive_pivot.item == 1000
    assert naive_pivot.comparisons > 10 * median_of_medians.comparisons
