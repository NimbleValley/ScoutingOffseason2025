import { useEffect, useState } from "react";
import { useScoutingStore } from "../app/localDataStore";
import Navbar from "../components/NavBar";
import CustomSelect from "../components/Select";
import HotReloadButton from "../components/HotReload";
import { getGenerativeModel } from "firebase/ai";
import { ai, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

export default function Settings() {

    const { loading, loadData, eventName, setEventName, eventKeys, usePracticeData, setUsePracticeData, teamInfo, forms, tbaData, pitForms } = useScoutingStore();

    useEffect(() => {
        loadData();
    }, []);

    const generationConfig = {
        temperature: 0.6,
        topP: 0.1,
        topK: 16,
    };

    // Create a `GenerativeModel` instance with a model that supports your use case
    const model = getGenerativeModel(ai, { model: "gemini-2.5-flash", generationConfig, systemInstruction: "You are a scouting assistant on team 3197, the hexhounds, competing in FRC robotics. give helpful tips that will help our team win, use insights from our data to answer questions" });

    // Wrap in an async function so you can use await
    async function generateAIOverviewsTeamsJSON() {

        const context = [
            "Provide a team overview for each team. Make it a few sentences, specifically touch on any struggles, what their auto does, endgame capabilities, tele-operated scoring, algae/coral capabilities, and how good they are for picking",
            "Respond in a json format with the team's number as the key followed by the text.",
            JSON.stringify(teamInfo),
            JSON.stringify(forms),
            JSON.stringify(tbaData),
            JSON.stringify(pitForms),
        ];

        // To generate text output, call generateContent with the text input
        var result;
        try {
            result = await model.generateContent(context);

            alert('Successfully generated overviews... uploading now.');
        } catch (error) {
            alert('Error: ' + error);

        }

        const response = result?.response ?? null;
        const text = response?.text();

        return text ?? '{}';
    }

    // Wrap in an async function so you can use await
    async function generateAIOverviewsMatchesJSON() {

        const context = [
            "Provide match analysis for each match. If it is completed then analyze how each team performed in a sentence or two and why one alliance won. If it is upcoming provide ideas for how each alliance can win and your prediction.",
            "Respond in a json format with 'match' concatenated with the number as the key followed by the output.",
            "Make it concise, interesting to read as a quick overview for someone who missed the match and wants to know why one alliance won. you may add sarcastic humor or harsh criticism, be vocal but professional",
            "Scoring guide: auto : {l1: 3, l2: 4, l3: 6, l4: 7, leave: 3, algaenet:4, algaeProcessor:2}, tele : {l1: 2, l2:3, l3: 4, l4: 5, algaenet:4, algaeProcessor:2}, endgame: {deep climb: 12, park: 2, can only have one or the other}",
            "Only do qual matches, not playoff (f, sf, etc)",
            JSON.stringify(teamInfo),
            JSON.stringify(forms),
            JSON.stringify(tbaData),
            JSON.stringify(pitForms),
        ];

        // To generate text output, call generateContent with the text input
        var result;
        try {
            result = await model.generateContent(context);

            alert('Successfully generated overviews... uploading now.');
        } catch (error) {
            alert('Error: ' + error);

        }

        const response = result?.response ?? null;
        const text = response?.text();

        return text ?? '{}';
    }

    async function uploadTeamOverviews() {
        try {
            alert('Sending message to ai...');
            const data = await generateAIOverviewsTeamsJSON();
            console.warn(data);
            const cleaned = data.replace(/`/g, "").replace('json', '');
            console.warn(cleaned);
            const parsed = JSON.parse(cleaned);
            console.warn(parsed);

            const docRef = doc(db, "aiOverview", "overview");
            await setDoc(docRef, parsed, { merge: true });

            alert('All good! Finished fully.');
        } catch (error) {
            alert('Error: ' + error);
        }
    }

    async function uploadMatchOverviews() {
        try {
            alert('Sending message to ai...');
            const data = await generateAIOverviewsMatchesJSON();
            console.warn(data);
            const cleaned = data.replace(/`/g, "").replace('json', '');
            console.warn(cleaned);
            const parsed = JSON.parse(cleaned);
            console.warn(parsed);

            const docRef = doc(db, "aiOverview", "match");
            await setDoc(docRef, parsed, { merge: true });

            alert('All good! Finished fully.');
        } catch (error) {
            alert('Error: ' + error);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="pt-20 px-0 md:px-6 pr-10">
                {loading ? (
                    <div className="text-orange-500">Loading data...</div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <CustomSelect view={eventName} setView={setEventName} label={'Event Name: '} options={eventKeys}></CustomSelect>
                        <CustomSelect view={usePracticeData} setView={setUsePracticeData} label={'Use practice data '} options={[true, false]}></CustomSelect>
                        <button className="cursor-pointer border-2 border-orange-400 px-2 py-1 text-lg rounded-md hover:bg-orange-700 hover:text-white transition duration-500" onClick={() => {
                            if (prompt('Put in a password to prevent abuse:') === "TyTy77") {
                                alert('Generating ai overviews, play stay on the page until it either errors or succeeds... please close this dialogue.');
                                uploadTeamOverviews();
                            }
                        }}>Generate Team Overviews</button>
                        <button className="cursor-pointer border-2 border-orange-400 px-2 py-1 text-lg rounded-md hover:bg-orange-700 hover:text-white transition duration-500" onClick={() => {
                            if (prompt('Put in a password to prevent abuse:') === "TyTy77") {
                                alert('Generating ai overviews, play stay on the page until it either errors or succeeds... please close this dialogue.');
                                uploadMatchOverviews();
                            }
                        }}>Generate Match Overviews</button>
                    </div>
                )}
            </main>

            <HotReloadButton />
        </div>
    );
}