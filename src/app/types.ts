export type StatRecord = {
  max: number;
  min: number;
  median: number;
  mean: number;
  q3: number;
};

export type TeamStats = {
  [column: string]: StatRecord;
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

export interface PitScoutingForm {
  id?: string;
  teamNumber: number;
  algaeDetails: string;
  climbDetails: string;
  driverExperience: string;
  recentChanges: string;
  [key: string]: any;
}

export interface ScoutingForm {
  id?: string;
  teamNumber: number;
  matchNumber: number;
  [key: string]: any;
}

export interface TbaData {
  rankings: any[];
  oprs: Record<string, number>;
  matches: any[];
}

export const numericColumns = [
    "teamNumber",
    "opr",
    "totalPoints",
    "autoPoints",
    "telePoints",
    "endgamePoints",
    "autoCoral",
    "teleCoral",
    "totalCoral",
    "totalAlgae",
    "totalGamepieces",
    "autoNetCount",
    "autoMissNetCount",
    "autoProcessorCount",
    "autoL4Count",
    "autoL3Count",
    "autoL2Count",
    "autoL1Count",
    "autoMissCoralCount",
    "teleNetCount",
    "teleMissNetCount",
    "teleProcessorCount",
    "teleL4Count",
    "teleL3Count",
    "teleL2Count",
    "teleL1Count",
    "teleMissCoralCount",
];