import { mean, median, q3, type LiveDataKeyWithOPR, type LiveDataRowWithOPR } from "./app/types";

export interface ScorePrediction {
    maximumScore: number;
    minimumScore: number;
    rankPointScore: number;
    rankPointLikelihood: number;
    defendedScores: number;
    meanScore: number;
    medianScore: number;
    q3Score: number;
    percentageCoralNormalRP: number;
    percentageCoralCoopRP: number;
    percentageBargeRP: number;
}

interface AllianceWinPercentageUnderConditions {
    description: string;
    allianceWinningPercentageA: number;
    allianceWinningPercentageB: number;
}

export interface ScorePredictionDouble {
    allianceScorePredictionA: ScorePrediction;
    allianceScorePredictionB: ScorePrediction;
    winningPercentages: AllianceWinPercentageUnderConditions[]
}

type Level = 'tele_l4' | 'tele_l3' | 'tele_l2' | 'tele_l1';
type GPSpot = 'tele_l4' | 'tele_l3' | 'tele_l2' | 'tele_l1' | 'tele_made_net';

function percentageOfMatchesCoralNormalRP(
    selectForms: LiveDataRowWithOPR[][],
    allForms: LiveDataRowWithOPR[]
): number {
    const LEVELS: Level[] = ['tele_l4', 'tele_l3', 'tele_l2', 'tele_l1'];
    const THRESHOLD = 5;

    let totalSuccesses = 0;

    for (const matchOutcome of selectForms) {
        // Initialize each level’s coral count
        const coralTotals: Record<Level, number> = {
            tele_l4: 0,
            tele_l3: 0,
            tele_l2: 0,
            tele_l1: 0,
        };

        // Allocate coral from each team
        matchOutcome.forEach((teamOutcome) => {
            let remainingCoral = teamOutcome.total_coral ?? 0;

            for (const level of LEVELS) {
                // Only allocate if team is capable of this level
                const canDoLevel = searchForTeamAttribute({
                    forms: allForms,
                    team: teamOutcome.team_number,
                    key: level,
                    matchPercentageThresh: level === 'tele_l1' ? 0.25 : 0.1,
                });

                if (!canDoLevel) console.error(teamOutcome.team_number + ' CANNOT DO ' + level);

                if (!canDoLevel) continue; // skip this level

                if (coralTotals[level] >= THRESHOLD) continue; // level full

                const needed = THRESHOLD - coralTotals[level];
                const toAdd = Math.min(remainingCoral, needed);

                coralTotals[level] += toAdd;
                remainingCoral -= toAdd;

                if (remainingCoral <= 0) break; // all coral used
            }
        });

        // Check if all levels reached threshold
        const allLevelsMet = LEVELS.every((level) => coralTotals[level] >= THRESHOLD);
        if (allLevelsMet) totalSuccesses++;
    }

    console.warn(totalSuccesses)

    return Math.round(totalSuccesses / selectForms.length * 100 * 10) / 10;
}

function percentageOfMatchesCoralCoopRP(
    selectForms: LiveDataRowWithOPR[][],
    allForms: LiveDataRowWithOPR[]
): number {
    const LEVELS: Level[] = ['tele_l4', 'tele_l3', 'tele_l2', 'tele_l1'];

    // Bump up to simulate processor
    const THRESHOLD = 5;

    let totalSuccesses = 0;

    for (const matchOutcome of selectForms) {
        // Initialize each level’s coral count
        const coralTotals: Record<Level, number> = {
            tele_l4: 0,
            tele_l3: 0,
            tele_l2: 0,
            tele_l1: 0,
        };

        // Allocate coral from each team
        matchOutcome.forEach((teamOutcome) => {
            let remainingCoral = teamOutcome.total_coral ?? 0;

            for (const level of LEVELS) {
                // Only allocate if team is capable of this level
                const canDoLevel = searchForTeamAttribute({
                    forms: allForms,
                    team: teamOutcome.team_number,
                    key: level,
                    matchPercentageThresh: level === 'tele_l1' ? 0.25 : 0.1,
                });

                if (!canDoLevel) console.error(teamOutcome.team_number + ' CANNOT DO ' + level);

                if (!canDoLevel) continue; // skip this level

                if (coralTotals[level] >= THRESHOLD) continue; // level full

                const needed = THRESHOLD - coralTotals[level];
                const toAdd = Math.min(remainingCoral, needed);

                coralTotals[level] += toAdd;
                remainingCoral -= toAdd;

                if (remainingCoral <= 0) break; // all coral used
            }
        });

        // Check if all levels reached threshold
        const levelsMetCount = LEVELS.filter((level) => coralTotals[level] >= THRESHOLD).length;
        const threeOrMoreMet = levelsMetCount >= 3;
        if (threeOrMoreMet) totalSuccesses++;
    }

    console.warn(totalSuccesses)

    return Math.round(totalSuccesses / selectForms.length * 100 * 10) / 10;
}

function percentageBargeRankPoint(forms: LiveDataRowWithOPR[][]): number {
    return Math.round(forms.map((match) => match.map((t) => t.endgame_points).reduce((sum, points) => sum + points, 0)).filter((s) => s >= 14).length / forms.length * 100 * 10) / 10;
}

// See if the number of matches a team fulfilled objective of key is greater than a percentage of matches (ie. did they do L4 in at least 25% of matches, return true if so)
function searchForTeamAttribute({ forms, team, key, matchPercentageThresh }: { forms: LiveDataRowWithOPR[], team: number, key: LiveDataKeyWithOPR, matchPercentageThresh: number }): boolean {
    let teamMatches = forms.filter((f) => f.team_number == team);

    return (teamMatches.filter((m) => m[key]).length / teamMatches.length) > matchPercentageThresh;
}

function generateAllPossibleScores(forms: LiveDataRowWithOPR[][], allForms: LiveDataRowWithOPR[]): number[] {
    var values: number[] = [];
    const LEVELS: GPSpot[] = ['tele_l4', 'tele_l3', 'tele_l2', 'tele_l1', 'tele_made_net'];

    const THRESHOLD = 12;
    const priorityOrder: GPSpot[] = ['tele_l4', 'tele_l3', 'tele_made_net', 'tele_l2', 'tele_l1'];

    for (const matchOutcome of forms) {
        const gpTotals: Record<GPSpot, number> = {
            tele_l4: 0,
            tele_l3: 0,
            tele_made_net: 0,
            tele_l2: 0,
            tele_l1: 0,
        };
        let matchScore: number = matchOutcome.map((m) => m.auto_points + m.endgame_points).reduce((sum, points) => sum + points, 0);

        matchOutcome.forEach((teamOutcome) => {
            let remainingCoral = teamOutcome.tele_l4 ?? 0 + teamOutcome.tele_l3 ?? 0 + teamOutcome.tele_l2 ?? 0 + teamOutcome.tele_l1 ?? 0;
            let remainingNet = teamOutcome.tele_made_net ?? 0;

            for (const level of priorityOrder) {
                // Only allocate if team is capable of this level
                const canDoLevel = searchForTeamAttribute({
                    forms: allForms,
                    team: teamOutcome.team_number,
                    key: level,
                    matchPercentageThresh: level === 'tele_l1' ? 0.25 : 0.1,
                });

                if (!canDoLevel) console.error(teamOutcome.team_number + ' CANNOT DO ' + level);

                if (!canDoLevel) continue; // skip this level

                if (gpTotals[level] >= THRESHOLD) continue; // level full

                const needed = THRESHOLD - gpTotals[level];

                var toAdd;
                if (level == 'tele_made_net')
                    toAdd = Math.min(remainingNet, needed);
                else
                    toAdd = Math.min(remainingCoral, needed);

                gpTotals[level] += toAdd;

                if (level == 'tele_made_net')
                    remainingNet -= toAdd;
                else
                    remainingCoral -= toAdd;

                if (remainingCoral <= 0) break; // all coral used
            }
        });

        matchScore += (gpTotals.tele_l4 * 5);
        matchScore += (gpTotals.tele_l3 * 4);
        matchScore += (gpTotals.tele_made_net * 4);
        matchScore += (gpTotals.tele_l2 * 3);
        matchScore += (gpTotals.tele_l1 * 2);

        values.push(matchScore);
    }

    return values.sort((a, b) => a - b);
}

export function predictScoreFromTeams({ teams, forms }: { teams: number[], forms: LiveDataRowWithOPR[] }): ScorePrediction {
    let maximumScore: number = 0;
    let minimumScore: number = 0;
    let rankPointScore: number = 0;
    let rankPointLikelihood: number = 0;
    let defendedScores: number = 0;
    let meanScore: number = 0;
    let medianScore: number = 0;
    let q3Score: number = 0;

    console.log('Running predictions...');

    // Collect forms per team
    const relevantTeamForms = teams.map(
        (team) => forms.filter((f) => f.team_number === team)
    );
    console.log(relevantTeamForms)

    let allPossibleMatches: LiveDataRowWithOPR[][] = [];

    function cartesianProduct<T>(arrays: T[][]): T[][] {
        if (arrays.length === 0) return [];
        return arrays.reduce<T[][]>(
            (acc, curr) =>
                acc.flatMap(a => curr.map(b => [...a, b])),
            [[]]
        );
    }

    // usage
    allPossibleMatches = cartesianProduct(relevantTeamForms);

    const allPossibleScores = generateAllPossibleScores(allPossibleMatches, forms);

    maximumScore = allPossibleScores[allPossibleScores.length - 1];
    minimumScore = allPossibleScores[0];
    meanScore = mean(allPossibleScores);
    medianScore = median(allPossibleScores);
    q3Score = q3(allPossibleScores);

    return {
        maximumScore: Math.round(10 * maximumScore) / 10,
        minimumScore: Math.round(10 * minimumScore) / 10,
        rankPointScore: Math.round(10 * rankPointScore) / 10,
        rankPointLikelihood: Math.round(10 * rankPointLikelihood) / 10,
        defendedScores: Math.round(10 * defendedScores) / 10,
        meanScore: Math.round(10 * meanScore) / 10,
        medianScore: Math.round(10 * medianScore) / 10,
        q3Score: Math.round(10 * q3Score) / 10,
        percentageCoralCoopRP: percentageOfMatchesCoralCoopRP(allPossibleMatches, forms),
        percentageCoralNormalRP: percentageOfMatchesCoralNormalRP(allPossibleMatches, forms),
        percentageBargeRP: percentageBargeRankPoint(allPossibleMatches)
    }
}

export function predictHeadToHead({ allianceA, allianceB, forms }: { allianceA: number[], allianceB: number[], forms: LiveDataRowWithOPR[] }): ScorePredictionDouble {
    const alliancePredictionA = predictScoreFromTeams({ teams: allianceA, forms });
    const alliancePredictionB = predictScoreFromTeams({ teams: allianceB, forms });

    return {
        allianceScorePredictionA: alliancePredictionA,
        allianceScorePredictionB: alliancePredictionB,
        winningPercentages: [
        ]
    }
}