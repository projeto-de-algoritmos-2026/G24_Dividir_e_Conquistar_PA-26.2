import random

from app.divide_and_conquer.inversions import count_inversions, count_inversions_brute_force


def test_counts_and_lists_the_known_inversions():
    result = count_inversions([2, 4, 1, 3, 5], collect_pairs=True)
    assert result.count == 3
    assert sorted(result.inverted_pairs) == [(2, 1), (4, 1), (4, 3)]


def test_sorted_sequence_has_no_inversions():
    assert count_inversions(list(range(50))).count == 0


def test_reversed_sequence_has_every_pair_inverted():
    size = 60
    assert count_inversions(list(range(size, 0, -1))).count == size * (size - 1) // 2


def test_equal_values_are_not_inversions():
    assert count_inversions([3, 3, 3, 1]).count == 3


def test_matches_brute_force_on_random_inputs():
    generator = random.Random(11)
    for size in [0, 1, 2, 7, 50, 300]:
        values = [generator.randint(0, 40) for _ in range(size)]
        divide_and_conquer = count_inversions(values, collect_pairs=True)
        brute_force = count_inversions_brute_force(values)
        assert divide_and_conquer.count == brute_force.count
        assert len(divide_and_conquer.inverted_pairs) == divide_and_conquer.count


def test_works_with_a_key_function():
    flights = [{"id": "A", "eta": 30}, {"id": "B", "eta": 10}, {"id": "C", "eta": 20}]
    result = count_inversions(flights, key=lambda flight: flight["eta"], collect_pairs=True)
    assert result.count == 2
    assert {(ahead["id"], behind["id"]) for ahead, behind in result.inverted_pairs} == {("A", "B"), ("A", "C")}


def test_uses_fewer_comparisons_than_brute_force():
    generator = random.Random(2)
    values = [generator.random() for _ in range(1000)]
    assert count_inversions(values).comparisons * 20 < count_inversions_brute_force(values).comparisons
