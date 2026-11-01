from dataclasses import dataclass

GROUP_SIZE = 5


@dataclass
class SelectionResult:
    item: object
    comparisons: int


def identity(value):
    return value


def _validate_position(items, position):
    if not 0 <= position < len(items):
        raise ValueError(f"posição {position} fora do intervalo para {len(items)} itens")


def select_kth_smallest(items, position, key=identity):
    _validate_position(items, position)
    comparisons = 0

    def compare(first, second):
        nonlocal comparisons
        comparisons += 1
        first_key, second_key = key(first), key(second)
        return (first_key > second_key) - (first_key < second_key)

    def insertion_sort(group):
        ordered = list(group)
        for index in range(1, len(ordered)):
            current = ordered[index]
            slot = index - 1
            while slot >= 0 and compare(ordered[slot], current) > 0:
                ordered[slot + 1] = ordered[slot]
                slot -= 1
            ordered[slot + 1] = current
        return ordered

    def select(values, target):
        if len(values) <= GROUP_SIZE:
            return insertion_sort(values)[target]

        groups = [values[start : start + GROUP_SIZE] for start in range(0, len(values), GROUP_SIZE)]
        medians = [insertion_sort(group)[len(group) // 2] for group in groups]
        pivot = select(medians, len(medians) // 2)

        lower, equal, higher = [], [], []
        for value in values:
            relation = compare(value, pivot)
            if relation < 0:
                lower.append(value)
            elif relation > 0:
                higher.append(value)
            else:
                equal.append(value)

        if target < len(lower):
            return select(lower, target)
        if target < len(lower) + len(equal):
            return equal[0]
        return select(higher, target - len(lower) - len(equal))

    item = select(list(items), position)
    return SelectionResult(item, comparisons)


def select_kth_with_naive_pivot(items, position, key=identity):
    _validate_position(items, position)
    comparisons = 0
    values = list(items)
    target = position
    while True:
        pivot = values[0]
        pivot_key = key(pivot)
        lower, equal, higher = [], [], []
        for value in values:
            comparisons += 1
            value_key = key(value)
            if value_key < pivot_key:
                lower.append(value)
            elif value_key > pivot_key:
                higher.append(value)
            else:
                equal.append(value)
        if target < len(lower):
            values = lower
        elif target < len(lower) + len(equal):
            return SelectionResult(equal[0], comparisons)
        else:
            target -= len(lower) + len(equal)
            values = higher
