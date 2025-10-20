import { create } from "zustand";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { numericColumns, type ColumnPercentiles, type LiveDataNumberKeysWithOPR, type LiveDataRowWithOPR, type PitScoutDataRow, type StatboticsTeam, type StatRecord, type TbaData, type TeamStats } from "./types";
import { supabase } from "../supabase";
import type { Database } from "../supabasetypes";

export const TBA_KEY: string =
  "sBluV8DKQA0hTvJ2ABC9U3VDZunUGUSehxuDPvtNC8SQ3Q5XHvQVt0nm3X7cvP7j";

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

function computeTeamStats(
  forms: LiveDataRowWithOPR[]
): Record<number, TeamStats> {
  // Group rows by team_number
  const grouped = forms.reduce<Record<number, LiveDataRowWithOPR[]>>((acc, row) => {
    if (!acc[row.team_number]) acc[row.team_number] = [];
    acc[row.team_number].push(row);
    return acc;
  }, {});

  const stats: Record<number, TeamStats> = {};

  for (const [teamStr, rows] of Object.entries(grouped)) {
    const team = Number(teamStr);
    const teamStats = {} as TeamStats;

    (Object.keys(rows[0]) as (keyof LiveDataRowWithOPR)[])
      .filter((key): key is LiveDataNumberKeysWithOPR => {
        const val = rows[0][key];
        return typeof val === "number" || val === null;
      })
      .forEach((col) => {
        const values = rows
          .map((r) => (typeof r[col] === "number" ? (r[col] as number) : 0))
          .filter((v) => !isNaN(v));

        teamStats[col] = computeStats(values);
      });

    stats[team] = teamStats;
  }

  return stats;
}

function computeColumnPercentiles(
  teamStats: Record<number, TeamStats>
): ColumnPercentiles {
  //console.error(teamStats)
  function getPercentile(values: number[], p: number): number {
    if (!values.length) return 0;
    const idx = (p / 100) * (values.length - 1);
    const lower = Math.floor(idx);
    const upper = Math.ceil(idx);
    if (lower === upper) return values[lower];
    return values[lower] + (values[upper] - values[lower]) * (idx - lower);
  }

  const result: ColumnPercentiles = {};

  for (const col of numericColumns) {
    // Skip columns that don't exist on any team
    const hasValues = Object.values(teamStats).some(
      (team) => team[col] !== undefined
    );
    if (!hasValues) continue;

    result[col] = {
      min: { p10: 0, p25: 0, p75: 0, p90: 0 },
      max: { p10: 0, p25: 0, p75: 0, p90: 0 },
      median: { p10: 0, p25: 0, p75: 0, p90: 0 },
      mean: { p10: 0, p25: 0, p75: 0, p90: 0 },
      q3: { p10: 0, p25: 0, p75: 0, p90: 0 },
    };

    const statTypes = ["min", "max", "median", "mean", "q3"] as const;

    for (const statType of statTypes) {
      const values = Object.values(teamStats)
        .map((team) => team[col]?.[statType] ?? 0)
        .filter((v) => typeof v === "number" && !isNaN(v))
        .sort((a, b) => a - b);

      result[col][statType] = {
        p10: getPercentile(values, 10),
        p25: getPercentile(values, 25),
        p75: getPercentile(values, 75),
        p90: getPercentile(values, 90),
      };
    }
  }

  //console.log(result)

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

async function fetchPitFormsSupabase(): Promise<PitScoutDataRow[]> {
  const { data, error } = await supabase
    .from("Pit Scouting")
    .select("*");

  if (!data) return [];

  return data.filter((item) => item.team_number > 0);
}

async function fetchTbaData(
  eventKey: string, formsData: LiveDataRowWithOPR[]
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

    let unsearchedTeams = [...new Set(formsData.map((r) => r.team_number).filter((item) =>
      !teams.map((t) => t.team_number).includes(item)
    ))];

    //console.warn(unsearchedTeams);

    const teamInfo: Record<number, { name: string; nickname: string }> = {};
    teams.forEach((t: any) => {
      teamInfo[t.team_number] = {
        name: t.name ?? `Team ${t.team_number}`,
        nickname: t.nickname ?? `Team ${t.team_number}`,
      };
    });

    await Promise.all(
      unsearchedTeams.map(async (t) => {
        const tempTeamData = await fetch(
          `https://www.thebluealliance.com/api/v3/team/frc${t}`,
          { headers: { "X-TBA-Auth-Key": TBA_KEY } }
        );
        const data = await tempTeamData.json();
        //console.error(data);
        teamInfo[data.team_number] = {
          name: data.name ?? `Team ${data.team_number}`,
          nickname: data.nickname ?? `Team ${data.team_number}`,
        };
      })
    );

    console.log(teamInfo);

    return {
      tbaData: {
        rankings: rankings?.rankings ?? [],
        oprs: oprData?.oprs ?? {},
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

async function fetchAiOverviews(): Promise<Record<number, string>> {
  const docRef = doc(db, "aiOverview", "overview");
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    console.warn("No AI overviews found");
    return {};
  }

  const data = docSnap.data(); // { "1091": "...", "1228": "..." }
  const overviews: Record<number, string> = {};

  Object.entries(data).forEach(([teamStr, overview]) => {
    const team = Number(teamStr);
    if (!isNaN(team)) {
      overviews[team] = overview;
    }
  });

  return overviews;
}

async function fetchAiMatches(): Promise<Record<string, string>> {
  const docRef = doc(db, "aiOverview", "match");
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    console.warn("No AI matches found");
    return {};
  }

  const data = docSnap.data();
  const overviews: Record<string, string> = {};

  Object.entries(data).forEach(([matchStr, overview]) => {
    const number = String(matchStr);
    if (typeof overview === "string") {
      overviews[number] = overview;
    }
  });

  return overviews;
}


interface ScoutingState {
  forms: LiveDataRowWithOPR[];
  pitForms: PitScoutDataRow[];
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
  teamImage: string[];
  aiOverviews: Record<number, string>;
  aiMatches: Record<string, string>;
  loadTeamImage: () => Promise<void>;
  setCurrentViewingTeam: (team: number) => void;
  loadStatbotics: () => Promise<void>;
  setEventName: (name: string) => void;
  setUsePracticeData: (value: boolean) => void;
  loadData: () => Promise<void>;
  hotRefresh: () => Promise<void>;
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
  aiOverviews: {},
  aiMatches: {},
  eventName: localStorage.getItem("eventName") || "XX",
  currentViewingTeam: Number(
    localStorage.getItem("currentViewingTeam") || 3197
  ),
  usePracticeData: localStorage.getItem("usePracticeData") === "true",
  statboticsTeams: [] as any,
  teamImage: [],

  loadTeamImage: async () => {
    try {
      const ourURL = await supabase.storage.from('robot-images').getPublicUrl(`${get().eventName}/team${get().currentViewingTeam}`).data.publicUrl;
      console.log(ourURL);
      const ourImageExists = await checkImageExists(ourURL);

      const tbaImages = await fetch(
        `https://www.thebluealliance.com/api/v3/team/frc${get().currentViewingTeam}/media/${new Date().getFullYear()}`,
        { headers: { "X-TBA-Auth-Key": TBA_KEY } }
      );
      const tbaImageBody = await tbaImages.json();
      const finalTBAImages = tbaImageBody.filter((a) => a.type != "avatar").map((i) => i.direct_url);

      ourImageExists ? set({ teamImage: [ourURL, ...finalTBAImages] }) : set({ teamImage: finalTBAImages });
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

    get().loadTeamImage();

    const [eventsData, formsData, pitFormsData, aiOverviews, aiMatches] = await Promise.all([
      fetchEvents(year),
      fetchRowsSupabase(),
      fetchPitFormsSupabase(),
      fetchAiOverviews(),
      fetchAiMatches(),
    ]);

    const tbaWrapped = await fetchTbaData(get().eventName, formsData);

    console.log(formsData);

    const teamStats = computeTeamStats(formsData as LiveDataRowWithOPR[]);
    console.log(teamStats);

    // Inject OPR into teamStats
    if (tbaWrapped?.tbaData?.oprs) {
      Object.entries(tbaWrapped.tbaData.oprs).forEach(([teamStr, opr]) => {
        const team = Number(teamStr.replace('frc', ''));
        if (Object.keys(teamStats).includes(String(team))) {
          const roundedOPR = Math.round(opr * 10) / 10;
          if (!teamStats[team]) {
            //teamStats[team] = {};
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

    //console.warn(columnPercentiles)

    set({
      forms: formsData,
      pitForms: pitFormsData,
      teamStats,
      columnPercentiles,
      aiOverviews,
      aiMatches,
      eventKeys: eventsData,
      tbaData: tbaWrapped?.tbaData ?? null,
      teamInfo: tbaWrapped?.teamInfo ?? {},
      loading: false,
    });
  },
}));

const fetchRowsSupabase = async (): Promise<LiveDataRowWithOPR[]> => {

  var matchTypes: Database['public']['Enums']['matchscouttype'][] = ['match'];

  if (useScoutingStore.getState().usePracticeData) {
    matchTypes.push('practice');
    matchTypes.push('pre');
  }

  const { data, error } = await supabase
    .from("Live Data")
    .select("*")
    .in('match_type', matchTypes);

  if (!data) return [];

  // Add default OPR (could come from TBA / statbotics later)
  return data.map((row) => ({
    ...row,
    opr: 0,
  }));
};

async function checkImageExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok; // true if 200–299
  } catch {
    return false;
  }
}