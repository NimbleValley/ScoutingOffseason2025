import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useScoutingStore } from "../app/localDataStore";
import { useNavigate } from "react-router";
import { useState } from "react";
import TeamCommentsModal from "./TeamCommentModal";

interface ChartRow {
  team: string;
  value: number;
}


export default function TableWithChart({ data, category, show }: { data: ChartRow[], category: string, show: boolean }) {

  // Sort descending by default
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  const [isCommentModalOpen, setIsCommentModalOpen] = useState<boolean>(false);
  const [selectedTeamNumber, setSelectedTeamNumber] = useState<number>(-1);

  const navigate = useNavigate();

  const { setCurrentViewingTeam, forms, teamInfo } = useScoutingStore();

  return (
    <div className="flex flex-row gap-0 w-full mb-10 justify-center">
      <TeamCommentsModal
                      isOpen={isCommentModalOpen}
                      onClose={() => setIsCommentModalOpen(false)}
                      forms={forms}
                      teamNumber={selectedTeamNumber}
                      teamInfo={teamInfo}
                  />
      {/* Table */}
      <div className="flex flex-col gap-1 flex-1 max-w-xl min-w-50">
        <div className="grid grid-cols-3 bg-gray-700 text-white font-bold px-0 py-1 rounded grid-cols-[25%_25%_auto]">
          <div className="text-center cursor-pointer">Rank</div>
          <div className="text-center cursor-pointer">Team</div>
          <div className="text-center cursor-pointer truncate" >{category}</div>
        </div>
        {sortedData.map((row, idx) => (
          <div
            key={row.team}
            className={`grid grid-cols-3 px-0 py-1 border-b border-gray-300 grid-cols-[25%_25%_auto] ${idx % 2 === 0 ? "bg-gray-100" : "bg-gray-200"}`}
          >
            <div className="text-center">{idx + 1}</div>
            <div className="text-center cursor-pointer hover:text-orange-500 hover:font-bold transition duartion-250" onClick={() => {
              setSelectedTeamNumber(Number(row.team));
              setIsCommentModalOpen(true);
            }} >{row.team}</div>
            <div className="text-center">{row.value}</div>
          </div>
        ))}
      </div>

      {/* Horizontal Bar Chart */}
      {show &&
        <div className="flex-3 h-[50px * data.length] pt-8">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sortedData} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" hide={true} />
              <YAxis
                type="category"
                dataKey="team"
                hide={true}
                interval={0}
              />
              <Tooltip isAnimationActive={false} />
              <Bar dataKey="value" fill="#FF7F50" label={{ position: "insideRight", fill: 'white', }} />
            </BarChart>
          </ResponsiveContainer>
        </div>}
    </div>
  );
}
