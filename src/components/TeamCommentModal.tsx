import { useState } from "react";
import { X, Search } from "lucide-react";
import type { LiveDataRowWithOPR } from "../app/types";
import { useScoutingStore } from "../app/localDataStore";
import { useNavigate } from "react-router-dom";

export default function TeamCommentsModal({
  isOpen,
  onClose,
  forms,
  teamNumber,
  teamInfo,
  teamImages
}: { isOpen: boolean, onClose: VoidFunction, forms: LiveDataRowWithOPR[], teamNumber: number, teamInfo: Record<number, { name: string; nickname: string }> }) {

  const { setCurrentViewingTeam, tbaData, teamStats } = useScoutingStore();

  const navigate = useNavigate();

  const teamForms = teamNumber
    ? forms
      .filter(f => Number(f.team_number) === teamNumber)
      .sort((a, b) => (a.match_number ?? 0) - (b.match_number ?? 0))
    : [];

  const teamComments = teamForms.filter(f => f.comments);
  //const imageUrl = selectedTeam ? teamImages[selectedTeam] : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-706 flex items-center justify-center bg-black/67" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[75vh] overflow-hidden flex flex-col m-4 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Quick Team Overview</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition cursor-pointer"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto p-6">
          {teamNumber ? (
            <div className="space-y-6">
              {/* Team Header */}
              <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                {/* imageUrl && (
                  <img
                    src={imageUrl}
                    alt={`Team ${selectedTeam}`}
                    className="w-24 h-24 object-contain rounded-lg border border-gray-200"
                  />
                ) */}
                <div className="w-full">

                  <div className="p-4 flex justify-between w-full gap-4">
                    <h3 className="text-3xl font-bold text-gray-800">
                      Team {teamNumber} - {teamInfo && teamInfo[teamNumber]?.nickname || "Unknown Team"}
                    </h3>
                    <button
                      onClick={() => {
                        setCurrentViewingTeam(teamNumber);
                        navigate('/teams');
                      }}
                      className="px-5 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium cursor-pointer"
                    >
                      View Team Page
                    </button>
                  </div>

                  <div className="text-base text-gray-800 mb-1 flex flex-row flex-wrap gap-2">
                    {/* Rank */}
                    <div className="bg-gray-50 p-3 rounded-lg text-center shadow-md">
                      <p className="text-gray-500 text-xs">Rank</p>
                      <p className="text-md font-semibold">{tbaData?.rankings?.find(r => r.team_key === `frc${teamNumber}`)?.rank ?? 'N/A'}</p>
                    </div>

                    {/* OPR */}
                    <div className="bg-gray-50 p-3 flex flex-col justify-center rounded-lg text-center shadow-md">
                      <p className="text-gray-500 text-xs">OPR</p>
                      <p className="text-md font-semibold">
                        {Math.round((Number(tbaData?.oprs[`frc${teamNumber}`] ?? 0)) * 10) / 10}
                      </p>
                    </div>

                    {/* Q3 Points */}
                    <div className="bg-gray-50 p-3 flex flex-col justify-center rounded-lg text-center shadow-md">
                      <p className="text-gray-500 text-xs">Total Points</p>
                      <p className="text-md font-semibold">
                        {teamStats[teamNumber]?.total_points?.q3 ?? 0}
                      </p>
                    </div>

                    {/* Other stats (optional) */}
                    <div className="bg-gray-50 p-3 flex flex-col justify-center rounded-lg text-center shadow-md">
                      <p className="text-gray-500 text-xs">Auto Points</p>
                      <p className="text-md font-semibold">
                        {teamStats[teamNumber]?.auto_points?.q3 ?? 0}
                      </p>
                    </div>

                    <div className="bg-gray-50 p-3 flex flex-col justify-center rounded-lg text-center shadow-md">
                      <p className="text-gray-500 text-xs">Tele Points</p>
                      <p className="text-md font-semibold">
                        {teamStats[teamNumber]?.tele_points?.q3 ?? 0}
                      </p>
                    </div>

                    <div className="bg-gray-50 p-3 flex flex-col justify-center rounded-lg text-center shadow-md">
                      <p className="text-gray-500 text-xs">Endgame Points</p>
                      <p className="text-md font-semibold">
                        {teamStats[teamNumber]?.endgame_points?.q3 ?? 0}
                      </p>
                    </div>

                    <div className="bg-gray-50 p-3 flex flex-col justify-center rounded-lg text-center shadow-md">
                      <p className="text-gray-500 text-xs">Total Gamepieces</p>
                      <p className="text-md font-semibold">
                        {teamStats[teamNumber]?.total_gamepieces?.q3 ?? 0}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 mt-1">
                    {teamComments.length} comment{teamComments.length !== 1 ? "s" : ""} found
                  </p>
                </div>
              </div>

              {/* Comments List */}
              {teamComments.length > 0 ? (
                <div className="space-y-3">
                  {teamComments.map((form) => (
                    <div
                      key={form.id}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-orange-600">
                          {form.match_type == 'match' ? "Match " + (form.match_number) : capitalizeFirstLetter(form.match_type) + ' Match'}
                        </span>
                        {form.scout_name && (
                          <span className="text-xs text-gray-500">
                            by {form.scout_name}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-800 leading-relaxed">
                        {form.comments}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-2">
                    <svg
                      className="w-16 h-16 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-lg">
                    No comments available for Team {teamNumber}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-gray-400 mb-4">
                <Search className="w-20 h-20 mx-auto" />
              </div>
              <p className="text-gray-500 text-lg">
                Enter a team number to view their comments
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function capitalizeFirstLetter(str: string) {
  if (typeof str !== 'string' || str.length === 0) {
    return str; // Handle non-string or empty input
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}