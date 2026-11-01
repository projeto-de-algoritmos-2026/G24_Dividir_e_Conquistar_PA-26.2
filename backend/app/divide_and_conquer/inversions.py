from dataclasses import dataclass, field


@dataclass
class InversionCount:
    count: int
    comparisons: int
    inverted_pairs: list[tuple] = field(default_factory=list)


def identity(value):
    return value


def count_inversions(sequence, key=identity, collect_pairs=False):
    comparisons = 0
    inverted_pairs = []

    def sort_and_count(items):
        nonlocal comparisons
        if len(items) <= 1:
            return items, 0

        middle = len(items) // 2
        left, left_inversions = sort_and_count(items[:middle])
        right, right_inversions = sort_and_count(items[middle:])

        merged = []
        crossing_inversions = 0
        left_index = right_index = 0
        while left_index < len(left) and right_index < len(right):
            comparisons += 1
            if key(left[left_index]) <= key(right[right_index]):
                merged.append(left[left_index])
                left_index += 1
            else:
                crossing_inversions += len(left) - left_index
                if collect_pairs:
                    inverted_pairs.extend((earlier, right[right_index]) for earlier in left[left_index:])
                merged.append(right[right_index])
                right_index += 1
        merged.extend(left[left_index:])
        merged.extend(right[right_index:])
        return merged, left_inversions + right_inversions + crossing_inversions

    _, total = sort_and_count(list(sequence))
    return InversionCount(total, comparisons, inverted_pairs)


def count_inversions_brute_force(sequence, key=identity):
    items = list(sequence)
    count = 0
    comparisons = 0
    inverted_pairs = []
    for index, earlier in enumerate(items):
        for later in items[index + 1 :]:
            comparisons += 1
            if key(earlier) > key(later):
                count += 1
                inverted_pairs.append((earlier, later))
    return InversionCount(count, comparisons, inverted_pairs)
