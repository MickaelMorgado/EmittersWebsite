"use client";

import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";

// === CONSTANTS ===
const LOOP_DURATION = "5s";
const SILENCE_PLACEHOLDER = 'SILENCE';

// Arrays of potential URLs for each track type
const MAIN_LOOPS = [
    "/assets/sounder-audios/Emitters - BaseProject4 - PercusiveBass4.mp3",
    "/assets/sounder-audios/Emitters - BaseProject4 - BrutzelAgressive7.mp3",
    "/assets/sounder-audios/Emitters - BaseProject4 - BassAcidRev.mp3",
];

const DRUM_LOOPS = [
    "/assets/sounder-audios/Emitters - BaseProject4 - CrunchKick3.mp3",
    "/assets/sounder-audios/Emitters - BaseProject4 - LeWeekend1.mp3",
    "/assets/sounder-audios/Emitters - BaseProject4 - LeWeekend2.mp3",
];

const CLAP_LOOPS = [
    "/assets/sounder-audios/Emitters - BaseProject4 - Clap.mp3",
    SILENCE_PLACEHOLDER,
];

const GHOST_LOOPS = [
    SILENCE_PLACEHOLDER,
    "/assets/sounder-audios/Emitters - BaseProject4 - Ghost1.mp3",
];

const LEAD_LOOPS = [
    SILENCE_PLACEHOLDER,
    "/assets/sounder-audios/Emitters - BaseProject4 - Lead1.mp3",
    "/assets/sounder-audios/Emitters - BaseProject4 - Lead2.mp3",
];

const TAC_LOOPS = [
    SILENCE_PLACEHOLDER,
    "/assets/sounder-audios/Emitters - BaseProject4 - Tac1.mp3",
];


// Helper to display the name of the chosen URL, handling SILENCE
const getDisplayName = (url: string) => 
    url === SILENCE_PLACEHOLDER ? 'SILENCE' : url.split('/').pop();

/** Utility function to pick a random element from an array */
const pickRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];


// Custom hook to manage a single Tone.Player instance
const usePlayerEffect = (
    url: string, 
    playerRef: React.MutableRefObject<Tone.Player | null>, 
    setLoaded: (loaded: boolean) => void,
    isPlaying: boolean,
    playbackRate: number 
) => {
    // 1. Effect to initialize/swap the player (runs on URL change)
    useEffect(() => {
        // 1. Cleanup before loading new player
        if (playerRef.current) {
            playerRef.current.stop(); 
            playerRef.current.dispose();
            playerRef.current = null;
        }
        setLoaded(false);

        // 2. Handle SILENCE
        if (url === SILENCE_PLACEHOLDER) {
            setLoaded(true);
            return; 
        }

        // 3. Create and load new player
        const newPlayer = new Tone.Player({
            url: url,
            loop: true,
            playbackRate: playbackRate, // INITIALIZE with the current rate
            onload: () => {
                setLoaded(true);
                console.log(`Player loaded: ${url.split('/').pop()}`);

                if (isPlaying) {
                    newPlayer.start(Tone.now()); 
                    console.log(`New player (${url.split('/').pop()}) started immediately.`);
                }
            },
            onerror: (error) => {
                console.error(`Error loading ${url.split('/').pop()}:`, error);
                setLoaded(true);
            }
        }).toDestination();

        playerRef.current = newPlayer;

        // 4. Cleanup on unmount/re-run
        return () => {
            if (playerRef.current) playerRef.current.dispose();
            playerRef.current = null;
        };
    }, [url, isPlaying, setLoaded, playerRef, playbackRate]); 

    // 2. Effect to update the playbackRate on the existing player (runs on Rate change only)
    useEffect(() => {
        // Only run this if the URL is not SILENCE
        if (playerRef.current && url !== SILENCE_PLACEHOLDER) {
            // Direct assignment is fine for the global playbackRate
            playerRef.current.playbackRate = playbackRate;
            console.log(`Playback Rate updated to ${playbackRate.toFixed(2)} for ${url.split('/').pop()}`);
        }
    }, [playbackRate, url, playerRef]); 
};


export default function SounderPage() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1.0);
    
    // Track 6: TAC State and Ref
    const [tacPlayerLoaded, setTacPlayerLoaded] = useState(true);
    const [currentTacUrl, setCurrentTacUrl] = useState(TAC_LOOPS[0]);
    const tacPlayerRef = useRef<Tone.Player | null>(null);
    
    // Track 5: Lead State and Ref
    const [leadPlayerLoaded, setLeadPlayerLoaded] = useState(true);
    const [currentLeadUrl, setCurrentLeadUrl] = useState(LEAD_LOOPS[0]);
    const leadPlayerRef = useRef<Tone.Player | null>(null);
    
    // Track 1-4 States and Refs
    const [mainPlayerLoaded, setMainPlayerLoaded] = useState(true);
    const [drumPlayerLoaded, setDrumPlayerLoaded] = useState(true);
    const [clapPlayerLoaded, setClapPlayerLoaded] = useState(true);
    const [ghostPlayerLoaded, setGhostPlayerLoaded] = useState(true);

    const [currentMainUrl, setCurrentMainUrl] = useState(MAIN_LOOPS[0]);
    const [currentDrumUrl, setCurrentDrumUrl] = useState(DRUM_LOOPS[0]);
    const [currentClapUrl, setCurrentClapUrl] = useState(CLAP_LOOPS[0]);
    const [currentGhostUrl, setCurrentGhostUrl] = useState(GHOST_LOOPS[0]);
    
    const mainPlayerRef = useRef<Tone.Player | null>(null);
    const drumPlayerRef = useRef<Tone.Player | null>(null);
    const clapPlayerRef = useRef<Tone.Player | null>(null);
    const ghostPlayerRef = useRef<Tone.Player | null>(null);

    // --- UPDATED: All Loaded Check (6 tracks) ---
    const allLoaded = mainPlayerLoaded && drumPlayerLoaded && clapPlayerLoaded && ghostPlayerLoaded && leadPlayerLoaded && tacPlayerLoaded;
    const totalPlayers = 6;
    // ---------------------------------------------

    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    // Initial load effect (run once)
    useEffect(() => {
        setMainPlayerLoaded(false);
        setDrumPlayerLoaded(false);
        setClapPlayerLoaded(false);
        setGhostPlayerLoaded(false);
        setLeadPlayerLoaded(false);
        // --- ADDED: Tac Track Initial Load ---
        setTacPlayerLoaded(false);
        // -------------------------------------
    }, []);

    // Effect to mark initial load as complete
    useEffect(() => {
        if (allLoaded && !initialLoadComplete) {
            setInitialLoadComplete(true);
        }
    }, [allLoaded, initialLoadComplete]);

    // Initialize and manage players for each track independently
    usePlayerEffect(currentMainUrl, mainPlayerRef, setMainPlayerLoaded, isPlaying, playbackRate);
    usePlayerEffect(currentDrumUrl, drumPlayerRef, setDrumPlayerLoaded, isPlaying, playbackRate);
    usePlayerEffect(currentClapUrl, clapPlayerRef, setClapPlayerLoaded, isPlaying, playbackRate);
    usePlayerEffect(currentGhostUrl, ghostPlayerRef, setGhostPlayerLoaded, isPlaying, playbackRate);
    usePlayerEffect(currentLeadUrl, leadPlayerRef, setLeadPlayerLoaded, isPlaying, playbackRate);
    // --- ADDED: Tac Player Hook Call ---
    usePlayerEffect(currentTacUrl, tacPlayerRef, setTacPlayerLoaded, isPlaying, playbackRate);
    // -----------------------------------


    // === INITIAL START/STOP LOGIC ===
    useEffect(() => {
        // --- UPDATED: Player List (6 tracks) ---
        const players = [
            mainPlayerRef.current, 
            drumPlayerRef.current, 
            clapPlayerRef.current, 
            ghostPlayerRef.current,
            leadPlayerRef.current, 
            tacPlayerRef.current // ADDED
        ].filter(p => p !== null) as Tone.Player[];
        // ---------------------------------------
        
        if (isPlaying) {
            if (!allLoaded) return;
            
            players.forEach(player => {
                if (player.loaded && player.state !== "started") {
                    player.start(Tone.now()); 
                }
            });
            console.log(`Initial Start: Started ${players.length} active players.`);
        } else {
            players.forEach(player => {
                if (player.state === "started") {
                    player.stop();
                }
            });
            console.log("Stopped all players.");
        }
        
    }, [isPlaying, allLoaded]); 


    // === HANDLER FUNCTIONS for real-time URL selection ===
    const handleMainChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCurrentMainUrl(e.target.value);
    };
    const handleDrumChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCurrentDrumUrl(e.target.value);
    };
    const handleClapChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCurrentClapUrl(e.target.value);
    };
    const handleGhostChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCurrentGhostUrl(e.target.value);
    };
    const handleLeadChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCurrentLeadUrl(e.target.value);
    };
    // --- ADDED: Tac Track Change Handler ---
    const handleTacChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCurrentTacUrl(e.target.value);
    };
    // ---------------------------------------
    
    // The previous Randomize function for convenience
    const randomizePicks = () => {
        setCurrentMainUrl(pickRandom(MAIN_LOOPS));
        setCurrentDrumUrl(pickRandom(DRUM_LOOPS));
        setCurrentClapUrl(pickRandom(CLAP_LOOPS));
        setCurrentGhostUrl(pickRandom(GHOST_LOOPS));
        setCurrentLeadUrl(pickRandom(LEAD_LOOPS));
        // --- ADDED: Randomize Tac ---
        setCurrentTacUrl(pickRandom(TAC_LOOPS));
        // ----------------------------
    };

    const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newRate = parseFloat(e.target.value);
        setPlaybackRate(newRate);
    };


    // === UI HANDLERS ===
    const handleStart = async () => {
        if (Tone.context.state !== "running") {
            await Tone.start();
            console.log("Tone.js AudioContext resumed.");
        }
        setIsPlaying(true);
    };

    const handleStop = () => {
        setIsPlaying(false);
    };

    // --- UPDATED: Loaded Count (6 tracks) ---
    const loadedCount = [
        mainPlayerLoaded, 
        drumPlayerLoaded, 
        clapPlayerLoaded, 
        ghostPlayerLoaded,
        leadPlayerLoaded, 
        tacPlayerLoaded // ADDED
    ].filter(Boolean).length;
    // ----------------------------------------


    // Helper component to render a select field for a track
    const SelectTrack = ({ label, currentUrl, options, handleChange }: { 
        label: string, 
        currentUrl: string, 
        options: string[], 
        handleChange: (e: React.ChangeEvent<HTMLSelectElement>) => void 
    }) => (
        <div className="flex justify-between items-center mb-2">
            <label className="mr-4 w-16 text-left font-semibold">{label}:</label>
            <select
                value={currentUrl}
                onChange={handleChange}
                disabled={!allLoaded} 
                className="p-1 border bg-gray-700 text-white rounded w-full"
            >
                {options.map(url => (
                    <option key={url} value={url}>
                        {getDisplayName(url)}
                    </option>
                ))}
            </select>
        </div>
    );

    return (
        <main className="min-h-screen p-8  text-gray-200 flex flex-col items-center justify-center">
            <h1 className="text-3xl mb-4">Tone.js Real-Time Loop Changer (6 Tracks)</h1>
            
            <div className="w-full max-w-md mb-6 p-4 border rounded">
                <h2 className="text-xl mb-4">Select Tracks ({LOOP_DURATION} loops)</h2>
                
                <SelectTrack
                    label="Main"
                    currentUrl={currentMainUrl}
                    options={MAIN_LOOPS}
                    handleChange={handleMainChange}
                />
                <SelectTrack
                    label="Drum"
                    currentUrl={currentDrumUrl}
                    options={DRUM_LOOPS}
                    handleChange={handleDrumChange}
                />
                <SelectTrack
                    label="Clap"
                    currentUrl={currentClapUrl}
                    options={CLAP_LOOPS}
                    handleChange={handleClapChange}
                />
                <SelectTrack
                    label="Ghost"
                    currentUrl={currentGhostUrl}
                    options={GHOST_LOOPS}
                    handleChange={handleGhostChange}
                />
                <SelectTrack
                    label="Lead"
                    currentUrl={currentLeadUrl}
                    options={LEAD_LOOPS}
                    handleChange={handleLeadChange}
                />
                {/* --- ADDED: Tac Track Selector --- */}
                <SelectTrack
                    label="Tac"
                    currentUrl={currentTacUrl}
                    options={TAC_LOOPS}
                    handleChange={handleTacChange}
                />
                {/* --------------------------------- */}
            </div>

            <div className="w-full max-w-md mb-6 p-4 border rounded">
                <h2 className="text-xl mb-4">Global Playback Rate</h2>
                <div className="flex flex-col items-center">
                    <label htmlFor="playback-rate" className="mb-2 font-semibold">
                        Rate: {playbackRate.toFixed(2)}x
                    </label>
                    <input
                        type="range"
                        id="playback-rate"
                        min="0.5"
                        max="2.0"
                        step="0.01"
                        value={playbackRate}
                        onChange={handleRateChange}
                        disabled={!initialLoadComplete}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-lg"
                    />
                    <div className="flex justify-between w-full text-xs mt-1">
                        <span>0.5x (Slowest)</span>
                        <span>1.0x (Normal)</span>
                        <span>2.0x (Fastest)</span>
                    </div>
                </div>
            </div>

            {/* Inform the user about loading status (UPDATED TOTAL) */}
            {!allLoaded && (
                <p className="text-yellow-400 mb-4">
                    Loading current audio selection... ({loadedCount}/{totalPlayers})
                </p>
            )}

            <div className="mb-4 flex space-x-4">
                <button
                    onClick={randomizePicks}
                    disabled={!allLoaded} 
                    className="border text-white font-semibold py-2 px-6 rounded"
                >
                    Randomize Tracks
                </button>

                <button
                    onClick={handleStart}
                    disabled={isPlaying || !allLoaded} 
                    className="border text-white font-semibold py-2 px-6 rounded"
                >
                    Start
                </button>
                <button
                    onClick={handleStop}
                    disabled={!isPlaying}
                    className="border text-white font-semibold py-2 px-6 rounded"
                >
                    Stop
                </button>
            </div>
            
            <p className="text-sm mt-4">
                Status: {isPlaying ? 'Playing' : 'Stopped'} | 
                Audio: {allLoaded ? 'All Loaded' : `Loading (${loadedCount}/${totalPlayers})`}
            </p>
        </main>
    );
}