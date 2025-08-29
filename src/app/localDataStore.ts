import { create } from "zustand";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { numericColumns } from "./types";

export const TBA_KEY: string =
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
  oprs: Record<string, number>;
  matches: any[];
}

interface ScoutingState {
  forms: ScoutingForm[];
  pitForms: PitScoutingForm[];
  teamStats: Record<number, TeamStats>;
  columnPercentiles: ColumnPercentiles;
  loading: boolean;
  usePracticeData: boolean;
  eventName: string;
  eventKeys: any[];
  tbaData: TbaData | null;
  statboticsTeams: StatboticsTeam;
  currentViewingTeam: number;
  teamInfo: Record<number, { name: string; nickname: string }>;
  teamImages: Record<number, string>;
  loadTeamImages: () => Promise<void>;
  setCurrentViewingTeam: (team: number) => void;
  loadStatbotics: () => Promise<void>;
  setEventName: (name: string) => void;
  setUsePracticeData: (value: boolean) => void;
  loadData: () => Promise<void>;
  hotRefresh: () => Promise<void>;
}

/* ---------------- Helpers ---------------- */


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

async function fetchScoutForms(): Promise<ScoutingForm[]> {
  const querySnapshot = await getDocs(collection(db, "scoutingForms"));
  return querySnapshot.docs
    .map((doc) => ({ id: doc.id, matchNumber: Number(doc.data().matchNumber), teamNumber: Number(doc.data().teamNumber), ...doc.data() }))
    .filter((f) => f.teamNumber !== -1)
    .sort((a, b) => (a.matchNumber || 0) - (b.matchNumber || 0));
}

async function fetchPitForms(): Promise<PitScoutingForm[]> {
  const querySnapshot = await getDocs(collection(db, "pitScout"));
  return querySnapshot.docs
    .map((doc) => ({ id: doc.id, teamNumber: Number(doc.data().teamNumber), algaeDetails: doc.data().algaeDetails, climbDetails: doc.data().climbDetails, recentChanges: doc.data().recentChanges, driverExperience: doc.data().driverExperience }))
    .filter((f) => f.teamNumber !== -1);
}

async function fetchTbaData(
  eventKey: string
): Promise<{ tbaData: TbaData; teamInfo: Record<number, { name: string; nickname: string }> } | null> {
  if (!eventKey || eventKey === "XX") return null;
  try {
    const [rankingsRes, oprsRes, matchesRes, teamsRes] = await Promise.all([
      fetch(
        `https://www.thebluealliance.com/api/v3/event/${eventKey}/rankings`,
        { headers: { "X-TBA-Auth-Key": TBA_KEY } }
      ),
      fetch(
        `https://www.thebluealliance.com/api/v3/event/${eventKey}/oprs`,
        { headers: { "X-TBA-Auth-Key": TBA_KEY } }
      ),
      fetch(
        `https://www.thebluealliance.com/api/v3/event/${eventKey}/matches`,
        { headers: { "X-TBA-Auth-Key": TBA_KEY } }
      ),
      fetch(
        `https://www.thebluealliance.com/api/v3/event/${eventKey}/teams`,
        { headers: { "X-TBA-Auth-Key": TBA_KEY } }
      ),
    ]);

    const rankings = await rankingsRes.json();
    const oprData = await oprsRes.json();
    const matches = await matchesRes.json();
    const teams = await teamsRes.json();

    const teamInfo: Record<number, { name: string; nickname: string }> = {};
    teams.forEach((t: any) => {
      teamInfo[t.team_number] = {
        name: t.name ?? `Team ${t.team_number}`,
        nickname: t.nickname ?? `Team ${t.team_number}`,
      };
    });

    return {
      tbaData: {
        rankings: rankings.rankings ?? [],
        oprs: oprData.oprs ?? {},
        matches,
      },
      teamInfo,
    };
  } catch (err) {
    console.error("TBA fetch error", err);
    return null;
  }
}

async function loadStatboticsTeam(
  team: number
): Promise<StatboticsTeam | null> {
  try {
    const year = new Date().getFullYear();
    const res = await fetch(
      `https://api.statbotics.io/v3/team_year/${String(team)}/${year}`
    );
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
  pitForms: [],
  teamStats: {},
  columnPercentiles: {},
  loading: true,
  eventKeys: [],
  tbaData: null,
  teamInfo: {},
  eventName: localStorage.getItem("eventName") || "XX",
  currentViewingTeam: Number(
    localStorage.getItem("currentViewingTeam") || 3197
  ),
  usePracticeData: localStorage.getItem("usePracticeData") === "true",
  statboticsTeams: [] as any,
  teamImages: {},

  loadTeamImages: async () => {
    try {
      const snapshot = await getDocs(collection(db, "robotImages"));
      const images: Record<number, string> = {};

      snapshot.forEach((doc) => {
        const data = doc.data();
        // assumes doc.id = "image_team1259"
        const match = doc.id.match(/image_team(\d+)/);
        if (match) {
          const teamNumber = parseInt(match[1], 10);
          images[teamNumber] = data.url; // Firestore field "url"
        }
      });

      set({ teamImages: images });
    } catch (error) {
      console.error("Error loading team images:", error);
    }
  },

  // What is this haha
  loadStatbotics: async () => {
    set({ loading: true });
    const statboticsData = await loadStatboticsTeam(get().currentViewingTeam);
    set({
      statboticsTeams: statboticsData ?? undefined,
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
    set({
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

    const [eventsData, formsData, pitFormsData, tbaWrapped] = await Promise.all([
      fetchEvents(year),
      fetchScoutForms(),
      fetchPitForms(),
      fetchTbaData(get().eventName),
    ]);

    const teamStats = computeTeamStats(formsData);

    // Inject OPR into teamStats
    if (tbaWrapped?.tbaData?.oprs) {
      Object.entries(tbaWrapped.tbaData.oprs).forEach(([teamStr, opr]) => {
        const team = Number(teamStr.replace('frc', ''));
        if (Object.keys(teamStats).includes(String(team))) {
          const roundedOPR = Math.round(opr * 10) / 10;
          if (!teamStats[team]) {
            teamStats[team] = {};
          }
          teamStats[team]["opr"] = {
            max: roundedOPR,
            min: roundedOPR,
            median: roundedOPR,
            mean: roundedOPR,
            q3: roundedOPR,
          };
        }
      });
    }

    Object.keys(teamStats).forEach((teamStr) => {
        const team = Number(teamStr);
        if (!teamStats[team]["opr"]) {
          teamStats[team]["opr"] = {
            max: 0,
            min: 0,
            median: 0,
            mean: 0,
            q3: 0,
          };
        }
      });

    const columnPercentiles = computeColumnPercentiles(teamStats);

    set({
      forms: formsData,
      pitForms: pitFormsData,
      teamStats,
      columnPercentiles,
      eventKeys: eventsData,
      tbaData: tbaWrapped?.tbaData ?? null,
      teamInfo: tbaWrapped?.teamInfo ?? {},
      loading: false,
    });
  },
}));
