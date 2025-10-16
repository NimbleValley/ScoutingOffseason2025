import type { Database } from "../supabasetypes";

export type StatRecord = {
  max: number;
  min: number;
  median: number;
  mean: number;
  q3: number;
};

export type TeamStats = {
  [K in LiveDataNumberKeysWithOPR]: StatRecord;
};

export type PercentileRecord = {
  p10: number;
  p25: number;
  p75: number;
  p90: number;
};

export type ColumnPercentiles = {
  [column: string]: {
    min: PercentileRecord;
    max: PercentileRecord;
    median: PercentileRecord;
    mean: PercentileRecord;
    q3: PercentileRecord;
  };
};

export interface StatboticsTeam {
  team: number;
  year: number;
  name: string;
  country: string;
  state: string;
  district?: string | null;
  rookie_year?: number;
  epa?: {
    total_points?: { [key: string]: number };
    [key: string]: any;
  };
  record?: {
    wins?: number;
    losses?: number;
    ties?: number;
    count?: number;
    winrate?: number;
    [key: string]: any;
  };
  district_points?: number | null;
  district_rank?: number | null;
  competing?: {
    [key: string]: any;
  };
  [key: string]: any;
}

export interface TbaData {
  rankings: any[];
  oprs: Record<string, number>;
  matches: any[];
}

export type PitScoutDataRow = Database["public"]["Tables"]["Pit Scouting"]["Row"];

export type LiveDataRow = Database["public"]["Tables"]["Live Data"]["Row"];

export type LiveDataRowWithOPR = Database["public"]["Tables"]["Live Data"]["Row"] & {
  opr: number;
};

export type NumericKeys<T> = {
  [K in keyof T]: NonNullable<T[K]> extends number ? K : never
}[keyof T];

export type LiveDataNumberKeys = NumericKeys<LiveDataRow>;
export type LiveDataNumberKeysWithOPR = NumericKeys<LiveDataRowWithOPR>;

export type LiveDataKey = keyof LiveDataRow;
export type LiveDataKeyWithOPR = keyof LiveDataRowWithOPR;

export const numericColumns: LiveDataNumberKeysWithOPR[] = [
  "team_number",
  "opr",
  "total_points",
  "auto_points",
  "tele_points",
  "endgame_points",
  "total_coral",
  "total_algae",
  "total_gamepieces",
  "auto_made_net",
  "auto_missed_net",
  "auto_made_processor",
  "auto_l4",
  "auto_l3",
  "auto_l2",
  "auto_l1",
  "auto_missed_coral",
  "tele_made_net",
  "tele_missed_net",
  "tele_processor",
  "tele_l4",
  "tele_l3",
  "tele_l2",
  "tele_l1",
  "tele_missed_coral",
  "driver_rating",
];

export const columnOrder: LiveDataKeyWithOPR[] = [
    "opr",
    "team_number",
    "match_number",
    "driver_station",
    "total_points",
    "auto_points",
    "tele_points",
    "endgame_points",
    "total_coral",
    "total_algae",
    "total_gamepieces",
    "auto_mobility",
    "auto_made_net",
    "auto_missed_net",
    "auto_made_processor",
    "auto_l4",
    "auto_l3",
    "auto_l2",
    "auto_l1",
    "auto_missed_coral",
    "tele_made_net",
    "tele_missed_net",
    "tele_processor",
    "tele_l4",
    "tele_l3",
    "tele_l2",
    "tele_l1",
    "tele_missed_coral",
    "endgame_type",
    "comments",
    "lost_comms",
    "auto_start_position",
    "driver_rating",
    "disabled",
];

export function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    return sorted[mid];
  }
}

export function q3(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const upperHalf = sorted.slice(Math.ceil(sorted.length / 2));
  return median(upperHalf);
}

export const mean = (arr: number[]): number => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;