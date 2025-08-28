import { create } from "zustand";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const TBA_KEY: string =
  "sBluV8DKQA0hTvJ2ABC9U3VDZunUGUSehxuDPvtNC8SQ3Q5XHvQVt0nm3X7cvP7j";

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
    [key: string]: any; // allows other nested stats to exist
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
  [key: string]: any; // allows additional top-level fields
}


export interface ScoutingForm {
  id?: string;
  teamNumber: number;
  matchNumber: number;
  [key: string]: any;
}

export interface StatRecord {
  max: number;
  min: number;
  median: number;
  mean: number;
  q3: number;
}

export interface TeamStats {
  [column: string]: StatRecord;
}

export interface PercentileRecord {
  p10: number;
  p25: number;
  p75: number;
  p90: number;
}

export interface ColumnPercentiles {
  [column: string]: {
    min: PercentileRecord;
    max: PercentileRecord;
    median: PercentileRecord;
    mean: PercentileRecord;
    q3: PercentileRecord;
  };
}

interface TbaData {
  rankings: any[];
  oprs: Record<string, number>; // keyed by team key
  matches: any[];
}

interface ScoutingState {
  forms: ScoutingForm[];
  teamStats: Record<number, TeamStats>;
  columnPercentiles: ColumnPercentiles;
  loading: boolean;
  usePracticeData: boolean;
  eventName: string;
  eventKeys: any[];
  tbaData: TbaData | null;
  statboticsTeams: StatboticsTeam;
  currentViewingTeam: number;
  setCurrentViewingTeam: (team: number) => void;
  loadStatbotics: () => Promise<void>;
  setEventName: (name: string) => void;
  setUsePracticeData: (value: boolean) => void;
  loadData: () => Promise<void>;
  hotRefresh: () => Promise<void>;
}

/* ---------------- Helpers ---------------- */

const numericColumns = [
  "teamNumber",
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

function computeStats(values: number[]): StatRecord {
  if (!values.length) return { max: 0, min: 0, median: 0, mean: 0, q3: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const max = sorted.at(-1) ?? 0;
  const min = sorted[0];
  const median =
    sorted.length % 2 === 0
      ? Math.round(
        ((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2) * 10
      ) / 10
      : sorted[Math.floor(sorted.length / 2)];
  const mean =
    Math.round(
      (sorted.reduce((a, b) => a + b, 0) / sorted.length) * 10
    ) / 10;
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  return { max, min, median, mean, q3 };
}

function computeTeamStats(forms: ScoutingForm[]): Record<number, TeamStats> {
  const grouped: Record<number, ScoutingForm[]> = {};
  forms.forEach((f) => {
    if (!grouped[f.teamNumber]) grouped[f.teamNumber] = [];
    grouped[f.teamNumber].push(f);
  });

  const stats: Record<number, TeamStats> = {};
  Object.entries(grouped).forEach(([team, data]) => {
    stats[+team] = {};
    numericColumns.forEach((col) => {
      const vals = data.map((d) => Number(d[col] ?? 0));
      stats[+team][col] = computeStats(vals);
    });
  });
  return stats;
}

function computeColumnPercentiles(
  teamStats: Record<number, TeamStats>
): ColumnPercentiles {
  function getPercentile(values: number[], p: number) {
    if (!values.length) return 0;
    const idx = (p / 100) * (values.length - 1);
    const lower = Math.floor(idx);
    const upper = Math.ceil(idx);
    if (lower === upper) return values[lower];
    return values[lower] + (values[upper] - values[lower]) * (idx - lower);
  }

  const result: ColumnPercentiles = {};
  numericColumns.forEach((col) => {
    result[col] = {} as any;
    (["min", "max", "median", "mean", "q3"] as const).forEach((statType) => {
      const values = Object.values(teamStats).map((s) => s[col][statType]);
      values.sort((a, b) => a - b);
      result[col][statType] = {
        p10: getPercentile(values, 10),
        p25: getPercentile(values, 25),
        p75: getPercentile(values, 75),
        p90: getPercentile(values, 90),
      };
    });
  });
  return result;
}

async function fetchEvents(year: number) {
  try {
    const res = await fetch(
      `https://www.thebluealliance.com/api/v3/events/${year}/keys`,
      {
        headers: { "X-TBA-Auth-Key": TBA_KEY },
      }
    );
    return res.ok ? res.json() : [];
  } catch (err) {
    console.error("Failed fetching events", err);
    return [];
  }
}

async function fetchForms(): Promise<ScoutingForm[]> {
  const querySnapshot = await getDocs(collection(db, "scoutingForms"));
  return querySnapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((f) => f.teamNumber !== -1)
    .sort((a, b) => (a.matchNumber || 0) - (b.matchNumber || 0));
}

async function fetchTbaData(eventKey: string): Promise<TbaData | null> {
  if (!eventKey || eventKey === "XX") return null;
  try {
    const [rankingsRes, oprsRes, matchesRes] = await Promise.all([
      fetch(
        `https://www.thebluealliance.com/api/v3/event/${eventKey}/rankings`,
        { headers: { "X-TBA-Auth-Key": TBA_KEY } }
      ),
      fetch(`https://www.thebluealliance.com/api/v3/event/${eventKey}/oprs`, {
        headers: { "X-TBA-Auth-Key": TBA_KEY },
      }),
      fetch(
        `https://www.thebluealliance.com/api/v3/event/${eventKey}/matches`,
        { headers: { "X-TBA-Auth-Key": TBA_KEY } }
      ),
    ]);

    const rankings = await rankingsRes.json();
    const oprData = await oprsRes.json();
    const matches = await matchesRes.json();

    return {
      rankings: rankings.rankings ?? [],
      oprs: oprData.oprs ?? {},
      matches,
    };
  } catch (err) {
    console.error("TBA fetch error", err);
    return null;
  }
}

async function loadStatboticsTeam(team: number): Promise<StatboticsTeam | null> {
  try {
    const year = new Date().getFullYear();
    const res = await fetch(`https://api.statbotics.io/v3/team_year/${String(team)}/${year}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Statbotics fetch error", err);
    return null;
  }
}

/* ---------------- Store ---------------- */

export const useScoutingStore = create<ScoutingState>((set, get) => ({
  forms: [],
  teamStats: {},
  columnPercentiles: {},
  loading: true,
  eventKeys: [],
  tbaData: null,
  eventName: localStorage.getItem("eventName") || "XX",
  currentViewingTeam: Number(localStorage.getItem("currentViewingTeam") || 3197),
  usePracticeData: localStorage.getItem("usePracticeData") === "true",
  statboticsTeams: [],
  loadStatbotics: async () => {
    set({ loading: true });

    const statboticsData = await (loadStatboticsTeam(get().currentViewingTeam));

    set({
      statboticsTeams: statboticsData,
      loading: false,
    });
  },
  setEventName: (name) => {
    localStorage.setItem("eventName", name);
    set({ eventName: name });
  },
  setCurrentViewingTeam: async (team) => {
    set({ loading: true });
    localStorage.setItem("currentViewingTeam", String(team));

    //const statboticsData = await (loadStatboticsTeam(String(team)));

    set({
      //statboticsTeams: statboticsData,
      currentViewingTeam: team,
      loading: false,
    });
  },
  setUsePracticeData: (value) => {
    localStorage.setItem("usePracticeData", String(value));
    set({ usePracticeData: value });
  },
  loadData: async () => {
    if (get().forms.length > 0) return;
    await get().hotRefresh();
  },

  hotRefresh: async () => {
    set({ loading: true });
    const year = new Date().getFullYear();

    const [eventsData, formsData, tbaData] = await Promise.all([
      fetchEvents(year),
      fetchForms(),
      fetchTbaData(get().eventName),
    ]);

    const teamStats = computeTeamStats(formsData);
    const columnPercentiles = computeColumnPercentiles(teamStats);

    set({
      forms: formsData,
      teamStats,
      columnPercentiles,
      eventKeys: eventsData,
      tbaData,
      loading: false,
    });
  },
}));
