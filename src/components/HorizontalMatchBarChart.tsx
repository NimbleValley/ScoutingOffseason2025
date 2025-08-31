import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Legend } from "recharts";
import { useScoutingStore } from "../app/localDataStore";


const TeamPercentileBarChartHorizontalStacked = ({ matchObject }) => {
    const { forms } = useScoutingStore();

    // Fixed dummy values for stacking
    const blueTeamKeys = matchObject.alliances.blue.team_keys.map((key: string) => key.replace(/^frc/, ''));;
    const redTeamKeys = matchObject.alliances.red.team_keys.map((key: string) => key.replace(/^frc/, ''));;

    const bothKeys = [...blueTeamKeys, ...redTeamKeys];

    const redColors = ["#FF0000", "#FF4D4D", "#CC0000"];
    const blueColors = ["#3B82F6", "#60A5FA", "#1E40AF"];

    const dataCandidates = forms.filter((data) => data.matchNumber == matchObject.match_number && bothKeys.includes(data.teamNumber));

    var barData = {
        match: matchObject.match_number
    };

    dataCandidates.map((object) => {
        barData[`${blueTeamKeys.includes(String(object.teamNumber)) ? 'b' : 'R'}${String(object.teamNumber)}`] = object.totalPoints;
    });


    return (
        <div className="w-full h-35 bg-white rounded-xl p-1 shadow-md mt-5 flex flex-col">
            <h3 className="text-lg font-semibold mb-3">Scoring Distribution</h3>
            <ResponsiveContainer width="100%" height="100%" >
                <BarChart layout="vertical" data={[barData]}>
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v.toFixed(0)}%`} hide={true} />
                    <YAxis type="category" dataKey="match" width={10} hide={true} />
                    <Legend verticalAlign="top" height={36} formatter={(text) => text.replace('R', '').replace('b', '')} />
                    {
                        Object.keys(barData).sort().map((key, index) => {
                            if (key != 'match') {
                                return <Bar dataKey={key} key={index} stackId="stack" fill={key.includes('R') ? redColors.pop() : blueColors.pop()}>
                                    <LabelList
                                        dataKey={key}
                                        position="center" // "right" also works for horizontal bars
                                        formatter={(v) => `${v}`} // show actual value
                                        fill={'white'}
                                        offset={0}
                                    />
                                </Bar>
                            }
                        })
                    }
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default TeamPercentileBarChartHorizontalStacked;
