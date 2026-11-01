export type Waypoint = { lat: number; lon: number };

export type Aircraft = {
  id: string;
  carrier: string;
  origin: string;
  destination: string;
  origin_name: string;
  destination_name: string;
  lat: number;
  lon: number;
  alt_ft: number;
  speed_kmh: number;
  heading: number;
  progress: number;
  route: Waypoint[];
  remaining_km: number;
  minutes_since_departure: number;
  eta_minutes: number;
};

export type Conflict = {
  a: string;
  b: string;
  now_km: number;
  minutes: number;
  horizontal_km: number;
  vertical_ft: number;
  level: "attention" | "watch";
};

export type ClosestPairSummary = {
  a: string;
  b: string;
  distance_km: number;
  distance_checks: number;
  brute_force_checks: number;
  matches_brute_force: boolean;
};

export type CandidateSearch = {
  radius_km: number;
  distance_checks: number;
  median_comparisons: number;
  median_splits: number;
  brute_force_checks: number;
  matches_brute_force: boolean;
};

export type LandingFlight = {
  id: string;
  carrier: string;
  origin: string;
  origin_name: string;
  speed_kmh: number;
  remaining_km: number;
  minutes_since_departure: number;
  eta_minutes: number;
  departure_position: number;
  landing_position: number;
};

export type LandingSequence = {
  airport: string;
  airport_name: string;
  flights: LandingFlight[];
  inversions: number;
  total_pairs: number;
  inverted_pairs: { departed_first: string; lands_first: string }[];
  comparisons: number;
  brute_force_comparisons: number;
  matches_brute_force: boolean;
};

export type Snapshot = {
  elapsed_seconds: number;
  speed: number;
  aircraft: Aircraft[];
  closest: ClosestPairSummary | null;
  candidates_count: number;
  candidate_search: CandidateSearch;
  conflicts: Conflict[];
  landing_sequences: LandingSequence[];
};

export type PlanePoint = { id: string; x: number; y: number; destination: string };

export type ClosestPairStep = {
  order: number;
  kind: "base" | "combine";
  depth: number;
  region_ids: string[];
  min_x: number;
  max_x: number;
  split_x: number | null;
  halves_distance: number | null;
  strip_ids: string[];
  best_pair: [string, string];
  best_distance: number;
};

export type MedianSplit = { depth: number; split_x: number; size: number; comparisons: number };

export type Analysis = {
  elapsed_seconds: number;
  points: PlanePoint[];
  closest_pair: ClosestPairSummary & { steps: ClosestPairStep[] };
  radius_search: {
    radius_km: number;
    pairs: { a: string; b: string; distance_km: number }[];
    splits: MedianSplit[];
    distance_checks: number;
    median_comparisons: number;
    brute_force_checks: number;
    matches_brute_force: boolean;
  };
};

export type Measurement = { operations: number; milliseconds: number };

export type AlgorithmComparison = {
  divide_and_conquer: Measurement;
  baseline: Measurement;
  result: number;
  same_result: boolean;
};

export type LaboratoryPattern = "random" | "sorted";

export type LaboratoryRow = {
  size: number;
  closest_pair: AlgorithmComparison;
  inversions: AlgorithmComparison;
  median: AlgorithmComparison;
};

export type LaboratoryReport = { pattern: LaboratoryPattern; rows: LaboratoryRow[] };
