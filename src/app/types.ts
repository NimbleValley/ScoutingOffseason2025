export interface ScoutingForm {
  id?: string;
  teamNumber: number;
  matchNumber: number;
  [key: string]: any;
}

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