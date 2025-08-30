import { useEffect, useState } from "react";
import { useScoutingStore } from "../app/localDataStore";
import Navbar from "../components/NavBar";
import HotReloadButton from "../components/HotReload";
import SettingsButton from "../components/SettingsButton";
import { Ellipsis, Send } from "lucide-react";
import { getGenerativeModel } from "firebase/ai";
import { ai } from "../firebase";

interface Message {
    message: string;
    sender: 'ai' | 'you'
}

export default function CoScout() {

    const { loading, loadData, forms, tbaData, pitForms } = useScoutingStore();

    const [currentTextInput, setCurrentTextInput] = useState<string>('');
    const [messageThread, setMessageThread] = useState<Message[]>([{ message: 'Hi ai.', sender: 'you' }, { message: 'Hey human!', sender: 'ai' }]);

    const [thinking, setThinking] = useState<boolean>(false);

    // Create a `GenerativeModel` instance with a model that supports your use case
    const model = getGenerativeModel(ai, { model: "gemini-2.5-flash" });

    // Wrap in an async function so you can use await
    async function sendMessage(message: string) {
        // Provide a prompt that contains text
        const prompt = message;

        setThinking(true);
        setCurrentTextInput('');

        setMessageThread(prev => [...prev, { message: prompt, sender: 'you' }]);

        const context = [
            "We are team 3197, the hexhounds, competing in FRC",
            "For team names you can reference thebluealliance data supplied",
            "Getting rank points help you improve rank. 3 for winning, 1 for 14+ points in endgame, 1 for auto mobility + 1 or more coral, and one for 4 levels with 5+ coral",
            "Try to be as quick and concise as possible",
            "Scoring guide: auto : {l1: 3, l2: 4, l3: 6, l4: 7, leave: 3, algaenet:4, algaeProcessor:2}, tele : {l1: 2, l2:3, l3: 4, l4: 5, algaenet:4, algaeProcessor:2}, endgame: {deep climb: 12, park: 2, can only have one or the other}",
            "Use scoring rules, team roles, and match strategies",
            prompt,
            JSON.stringify(forms),
            JSON.stringify(pitForms),
            JSON.stringify(tbaData),
        ];

        // To generate text output, call generateContent with the text input
        const result = await model.generateContent(context);

        const response = result.response;
        const text = response.text();

        setThinking(false);

        setMessageThread(prev => [...prev, { message: text, sender: 'ai' }]);

        return text;
    }

    useEffect(() => {
        loadData();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="pt-20 px-4 md:px-6 h-screen flex flex-col items-center pb-10">
                {loading ? (
                    <div className="text-orange-500">Loading data...</div>
                ) : (
                    <div className="flex flex-col items-center w-full max-w-4xl h-full gap-4">

                        {/* Header */}
                        <div className="text-2xl px-5 py-2 md:px-10 md:py-5 bg-gray-100 shadow-lg rounded-lg text-center w-full">
                            CoScout, the scouting assistant.
                        </div>

                        {/* Chat container */}
                        <div className="flex-1 w-full bg-gray-50 border-2 border-gray-100 rounded-lg p-4 md:p-5 flex flex-col gap-2 md:gap-4 overflow-y-auto">
                            {messageThread.map((message, index) => {
                                const isYou = message.sender === 'you';

                                const renderMessage = (text: string) => {
                                    const lines = text.split(/\n/).flatMap((line) =>
                                        line.startsWith('* ') ? ['*', line.slice(2)] : [line]
                                    );

                                    return lines.map((line, i) => {
                                        if (line === '*') return <br key={i} />;

                                        const parts = line.split(/\*\*/);
                                        return (
                                            <div key={i} className={line.startsWith('*') ? 'flex gap-2' : ''}>
                                                {line.startsWith('*') && <span>•</span>}
                                                {parts.map((part, j) =>
                                                    j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                                                )}
                                            </div>
                                        );
                                    });
                                };

                                return (
                                    <div
                                        key={index}
                                        className={`px-3 py-2 rounded-md shadow-sm max-w-full sm:max-w-[80%] my-1 self-${isYou ? 'end' : 'start'} ${isYou ? 'bg-orange-300' : 'bg-gray-200'}`}
                                    >
                                        {renderMessage(message.message)}
                                    </div>
                                );
                            })}
                            {thinking && (
                                <div className="flex justify-start sm:justify-start">
                                    <Ellipsis size={28} className="animate-pulse" />
                                </div>
                            )}
                        </div>

                        {/* Input row */}
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-end w-full">
                            <textarea
                                value={currentTextInput}
                                onChange={(e) => setCurrentTextInput(e.target.value)}
                                placeholder="Send text here..."
                                rows={3}
                                className="border-2 border-gray-400 active:border-gray-500 resize-none text-md px-4 py-3 bg-gray-100 shadow-lg rounded-lg w-full sm:w-auto flex-1"
                            />
                            <button
                                onClick={() => { if (currentTextInput.length > 0) sendMessage(currentTextInput) }}
                                className="bg-orange-300 w-full sm:w-16 h-12 flex items-center justify-center rounded-lg cursor-pointer hover:shadow-lg hover:bg-orange-400 transition duration-200"
                            >
                                <Send size={28} />
                            </button>
                        </div>
                    </div>
                )}
            </main>

            <HotReloadButton />
            <SettingsButton />
        </div>
    );
}