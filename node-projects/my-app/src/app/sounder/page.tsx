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
    isPlaying: boolean
) => {
    useEffect(() => {
        // 1. Cleanup before loading new player
        if (playerRef.current) {
            // Stop the loop before disposing for a clean transition
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
            onload: () => {
                setLoaded(true);
                console.log(`Player loaded: ${url.split('/').pop()}`);

                // FIX: If playback is active, start the new player immediately here.
                if (isPlaying) {
                    // Start the new player immediately, synced to the current Tone time
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
    }, [url, isPlaying, setLoaded, playerRef]); 
};


export default function SounderPage() {
    const [isPlaying, setIsPlaying] = useState(false);
    
    const [mainPlayerLoaded, setMainPlayerLoaded] = useState(true); // Set to true initially for first load
    const [drumPlayerLoaded, setDrumPlayerLoaded] = useState(true); // Set to true initially for first load
    const [clapPlayerLoaded, setClapPlayerLoaded] = useState(true); // Set to true initially for first load
    const [ghostPlayerLoaded, setGhostPlayerLoaded] = useState(true); // Set to true initially for first load

    const [currentMainUrl, setCurrentMainUrl] = useState(MAIN_LOOPS[0]);
    const [currentDrumUrl, setCurrentDrumUrl] = useState(DRUM_LOOPS[0]);
    const [currentClapUrl, setCurrentClapUrl] = useState(CLAP_LOOPS[0]);
    const [currentGhostUrl, setCurrentGhostUrl] = useState(GHOST_LOOPS[0]);
    
    const mainPlayerRef = useRef<Tone.Player | null>(null);
    const drumPlayerRef = useRef<Tone.Player | null>(null);
    const clapPlayerRef = useRef<Tone.Player | null>(null);
    const ghostPlayerRef = useRef<Tone.Player | null>(null);

    const allLoaded = mainPlayerLoaded && drumPlayerLoaded && clapPlayerLoaded && ghostPlayerLoaded;

    // Use a special state for the very first load check, as we initialize states to 'true'
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    // Initial load effect (run once)
    useEffect(() => {
        // We set to false here to force the first load checks
        setMainPlayerLoaded(false);
        setDrumPlayerLoaded(false);
        setClapPlayerLoaded(false);
        setGhostPlayerLoaded(false);
    }, []);

    // Effect to mark initial load as complete
    useEffect(() => {
        if (allLoaded && !initialLoadComplete) {
            setInitialLoadComplete(true);
        }
    }, [allLoaded, initialLoadComplete]);

    // Initialize and manage players for each track independently
    usePlayerEffect(currentMainUrl, mainPlayerRef, setMainPlayerLoaded, isPlaying);
    usePlayerEffect(currentDrumUrl, drumPlayerRef, setDrumPlayerLoaded, isPlaying);
    usePlayerEffect(currentClapUrl, clapPlayerRef, setClapPlayerLoaded, isPlaying);
    usePlayerEffect(currentGhostUrl, ghostPlayerRef, setGhostPlayerLoaded, isPlaying);


    // === INITIAL START/STOP LOGIC ===
    useEffect(() => {
        const players = [mainPlayerRef.current, drumPlayerRef.current, clapPlayerRef.current, ghostPlayerRef.current].filter(p => p !== null) as Tone.Player[];
        
        // This handles the initial 'Start' button press.
        if (isPlaying) {
            // Only proceed if all players are loaded (for the initial start)
            if (!allLoaded) return;
            
            // Start all players simultaneously
            players.forEach(player => {
                if (player.loaded && player.state !== "started") {
                    // Use Tone.now() to synchronize starting the players to the current time
                    player.start(Tone.now()); 
                }
            });
            console.log(`Initial Start: Started ${players.length} active players.`);
        } else {
            // Stop all active players
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
    
    // The previous Randomize function for convenience
    const randomizePicks = () => {
        // This triggers the usePlayerEffect hooks to run and load new files
        setCurrentMainUrl(pickRandom(MAIN_LOOPS));
        setCurrentDrumUrl(pickRandom(DRUM_LOOPS));
        setCurrentClapUrl(pickRandom(CLAP_LOOPS));
        setCurrentGhostUrl(pickRandom(GHOST_LOOPS));
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

    // Calculate how many of the four players are loaded for the UI
    const loadedCount = [mainPlayerLoaded, drumPlayerLoaded, clapPlayerLoaded, ghostPlayerLoaded].filter(Boolean).length;
    const totalPlayers = 4;


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
                // Only disable selection if the system is currently loading
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
            <h1 className="text-3xl mb-4">Tone.js Real-Time Loop Changer</h1>
            
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
            </div>

            {/* Inform the user about loading status */}
            {!allLoaded && (
                <p className="text-yellow-400 mb-4">
                    Loading current audio selection... ({loadedCount}/{totalPlayers})
                </p>
            )}

            <div className="mb-4 flex space-x-4">
                <button
                    onClick={randomizePicks}
                    // FIX: Always allow randomize if we are loaded. If loading is slow, it will be disabled.
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