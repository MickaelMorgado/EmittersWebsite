"use client";

import { useState, DragEvent, useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Play, Square, RotateCcw, Music2, Shuffle, Trash2, GripVertical, Loader2, Volume2, VolumeX, Sparkles, Zap, Waves, Code2 } from "lucide-react";

declare global {
  interface Window {
    Tone?: {
      started: boolean;
      Transport?: unknown;
    };
  }
}

interface CategoryPattern {
  name: string;
  code: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
  patterns: CategoryPattern[];
}

const CATEGORIES: Category[] = [
  {
    id: "kick",
    name: "Kick",
    color: "from-red-500 to-red-700",
    patterns: [
      { name: "Basic 4/4", code: "bd*4" },
      { name: "Deep Kick", code: "bd*2 ~ bd" },
      { name: "Rolling", code: "bd*8" },
      { name: "Syncopated", code: "bd ~ bd ~ bd*2" },
      { name: "Accent", code: "bd*3 ~ bd" },
    ],
  },
  {
    id: "snare",
    name: "Snare/Clap",
    color: "from-yellow-500 to-yellow-700",
    patterns: [
      { name: "Backbeat", code: "~ sd ~ sd" },
      { name: "Clap Loop", code: "~ cp ~ cp" },
      { name: "Rimshot", code: "~ sid ~ sid" },
      { name: "Brushes", code: "~ sd*2 ~ sd" },
      { name: "Trap", code: "~ sd ~ sd*3" },
    ],
  },
  {
    id: "hihat",
    name: "Hi-Hat",
    color: "from-purple-500 to-purple-700",
    patterns: [
      { name: "Steady", code: "hh*8" },
      { name: "Offbeat", code: "~ hh*7" },
      { name: "Ghost", code: "hh*8" },
      { name: "16th", code: "hh*16" },
      { name: "Break", code: "hh ~ hh ~ hh*3" },
    ],
  },
  {
    id: "bass",
    name: "Bass",
    color: "from-amber-500 to-amber-700",
    patterns: [
      { name: "Reese", code: "c2 f2 c2 f2" },
      { name: "Wobble", code: "c2 f2 g2 a2" },
      { name: "Pluck", code: "c2 e2 g2 b2 c2 e2 g2 b2" },
      { name: "Acid", code: "c2 d2 e2 f2" },
      { name: "808", code: "c2 ~ c2 ~ f2 ~" },
    ],
  },
  {
    id: "lead",
    name: "Lead",
    color: "from-green-500 to-green-700",
    patterns: [
      { name: "Pluck", code: "c4 e4 g4 b4 c4 e4 g4 b4" },
      { name: "Stab", code: "c3 f3 g3 a3 c3 f3 g3 a3" },
      { name: "Arp", code: "c4 e4 g4 c5 e4 g4 c5 e4" },
      { name: "Sweep", code: "c3 e3 g3 c4" },
      { name: "Sequence", code: "c4 d4 e4 f4 g4 a4 b4 c5 c4 d4 e4 f4 g4 a4 b4 c5" },
    ],
  },
];

const EXAMPLE_PATTERNS = [
  { id: "techno", name: "Techno", code: `bd: "bd*4"
sd: "~ sd ~ sd"
hh: "hh*8"`, genre: "Electronic" },
  { id: "house", name: "House", code: `bd: "bd*4"
cp: "~ cp ~ cp"
hh: "~ hh*7"`, genre: "Electronic" },
  { id: "breakbeat", name: "Breakbeat", code: `bd: "bd*2 ~ bd*2"
sd: "~ sd*2 ~ sd*3"
hh: "hh*16"`, genre: "Electronic" },
  { id: "trap", name: "Trap", code: `bd: "bd*4"
sd: "~ sd ~ sd*3"
hh: "~ hh*4 ~ hh*2 ~ hh"`, genre: "Hip Hop" },
  { id: "ambient", name: "Ambient Pad", code: `bass: "c2 f2 g2 a2 c2 f2 g2 a2"
lead: "c4 e4 g4 c5 e4 g4 c5 e4"`, genre: "Ambient" },
  { id: "acid", name: "Acid Bass", code: `bass: "c2 d2 e2 f2 c2 d2 e2 f2"
hh: "hh*8"`, genre: "Electronic" },
  { id: "arpeggio", name: "Arpeggio", code: `lead: "c4 e4 g4 c5 e4 g4 c5 e4"
bass: "c2 ~ c2 ~ f2 ~"`, genre: "Electronic" },
  { id: "drumfill", name: "Drum Fill", code: `bd: "bd*2 ~ bd ~ bd*3"
sd: "~ sd*2 ~ sd ~ sd*3"
hh: "hh ~ hh ~ hh*3"`, genre: "Drums" },
  { id: "reese", name: "Reese Bass", code: `bass: "c2 f2 c2 f2"
hh: "hh*8"`, genre: "Dubstep" },
  { id: "chords", name: "Chord Stab", code: `lead: "c3 f3 g3 a3 c3 f3 g3 a3"
bass: "c2 ~ f2 ~ c2 ~"`, genre: "House" },
  { id: "offbeat", name: "Offbeat Hat", code: `bd: "bd*4"
sd: "~ sd ~ sd"
hh: "~ hh*7"`, genre: "Reggae" },
  { id: "rolling", name: "Rolling Bass", code: `bass: "c2 c2 d2 e2 f2 g2 a2 b2"
hh: "hh*16"`, genre: "Drum & Bass" },
];

const AUTOCOMPLETE_ITEMS = [
  { label: "bd", category: "sound", description: "Kick drum" },
  { label: "sd", category: "sound", description: "Snare drum" },
  { label: "hh", category: "sound", description: "Hi-hat" },
  { label: "cp", category: "sound", description: "Clap" },
  { label: "sid", category: "sound", description: "Rimshot" },
  { label: "oh", category: "sound", description: "Open hi-hat" },
  { label: "lt", category: "sound", description: "Low tom" },
  { label: "mt", category: "sound", description: "Mid tom" },
  { label: "ht", category: "sound", description: "High tom" },
  { label: "c2", category: "note", description: "Note C2 (65.41Hz)" },
  { label: "d2", category: "note", description: "Note D2 (73.42Hz)" },
  { label: "e2", category: "note", description: "Note E2 (82.41Hz)" },
  { label: "f2", category: "note", description: "Note F2 (87.31Hz)" },
  { label: "g2", category: "note", description: "Note G2 (98.00Hz)" },
  { label: "a2", category: "note", description: "Note A2 (110.00Hz)" },
  { label: "b2", category: "note", description: "Note B2 (123.47Hz)" },
  { label: "c3", category: "note", description: "Note C3 (130.81Hz)" },
  { label: "d3", category: "note", description: "Note D3 (146.83Hz)" },
  { label: "e3", category: "note", description: "Note E3 (164.81Hz)" },
  { label: "f3", category: "note", description: "Note F3 (174.61Hz)" },
  { label: "g3", category: "note", description: "Note G3 (196.00Hz)" },
  { label: "a3", category: "note", description: "Note A3 (220.00Hz)" },
  { label: "b3", category: "note", description: "Note B3 (246.94Hz)" },
  { label: "c4", category: "note", description: "Note C4 (261.63Hz)" },
  { label: "d4", category: "note", description: "Note D4 (293.66Hz)" },
  { label: "e4", category: "note", description: "Note E4 (329.63Hz)" },
  { label: "f4", category: "note", description: "Note F4 (349.23Hz)" },
  { label: "g4", category: "note", description: "Note G4 (392.00Hz)" },
  { label: "a4", category: "note", description: "Note A4 (440.00Hz)" },
  { label: "b4", category: "note", description: "Note B4 (493.88Hz)" },
  { label: "c5", category: "note", description: "Note C5 (523.25Hz)" },
  { label: "~", category: "symbol", description: "Rest/silence" },
  { label: "*", category: "operator", description: "Repeat pattern (e.g. bd*4)" },
  { label: ":", category: "operator", description: "Layer separator (sound: \"pattern\")" },
  { label: "\"", category: "operator", description: "Pattern string delimiters" },
  { label: "slow", category: "effect", description: "Slow down pattern (slow 2)" },
  { label: "fast", category: "effect", description: "Speed up pattern (fast 2)" },
  { label: "rev", category: "effect", description: "Reverse pattern" },
  { label: "room", category: "effect", description: "Add room reverb" },
  { label: "delay", category: "effect", description: "Add delay effect" },
  { label: "crush", category: "effect", description: "Bitcrush effect" },
  { label: "gain", category: "effect", description: "Adjust gain (gain 0.5)" },
  { label: "pan", category: "effect", description: "Panning (pan 0.5)" },
  { label: "vowel", category: "effect", description: "Vowel filter (vowel \"a e\")" },
  { label: "lpf", category: "effect", description: "Low-pass filter" },
  { label: "hpf", category: "effect", description: "High-pass filter" },
  { label: "bp", category: "effect", description: "Band-pass filter" },
  { label: "echo", category: "effect", description: "Echo effect" },
  { label: "coarse", category: "effect", description: "Coarse pitch shift" },
  { label: "chop", category: "effect", description: "Chop samples" },
  { label: "stut", category: "effect", description: "Stutter effect" },
  { label: "cloud", category: "effect", description: "Granular cloud" },
  { label: "slice", category: "effect", description: "Slice samples" },
  { label: "jux", category: "effect", description: "Juxtapose patterns" },
  { label: "ply", category: "effect", description: "Ply - layer with original" },
  { label: "gap", category: "effect", description: "Add gap of silence" },
  { label: "legato", category: "effect", description: "Legato notes" },
  { label: "metronome", category: "pattern", description: "Metronome click" },
  { label: "sound", category: "pattern", description: "Select sound" },
  { label: "s", category: "pattern", description: "Sound shorthand" },
];

const NOTE_TO_FREQ: Record<string, string> = {
  c2: "65.41", d2: "73.42", e2: "82.41", f2: "87.31", g2: "98.00", a2: "110.00", b2: "123.47",
  c3: "130.81", d3: "146.83", e3: "164.81", f3: "174.61", g3: "196.00", a3: "220.00", b3: "246.94",
  c4: "261.63", d4: "293.66", e4: "329.63", f4: "349.23", g4: "392.00", a4: "440.00", b4: "493.88",
  c5: "523.25", d5: "587.33", e5: "659.25", f5: "698.46", g5: "783.99", a5: "880.00", b5: "987.77",
};

interface DroppedItem {
  id: string;
  category: Category;
  patternIndex: number;
}

interface KeyEffect {
  id: number;
  x: number;
  y: number;
  color: string;
  timestamp: number;
}

function getRandomPattern(category: Category): number {
  return Math.floor(Math.random() * category.patterns.length);
}

function StrudelLive() {
  const [code, setCode] = useState("");
  const [droppedItems, setDroppedItems] = useState<DroppedItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [volume, setVolume] = useState(0.85);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });
  const [autocompleteFilter, setAutocompleteFilter] = useState("");
  const [selectedAutocompleteIndex, setSelectedAutocompleteIndex] = useState(0);
  const [keyEffects, setKeyEffects] = useState<KeyEffect[]>([]);
  const [isEditorFocused, setIsEditorFocused] = useState(false);
  const [editorGlow, setEditorGlow] = useState(0);
  
  const synthsRef = useRef<any[]>([]);
  const sequenceRef = useRef<any>(null);
  const isInitializedRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const autoPlayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const filteredAutocomplete = useMemo(() => {
    if (!autocompleteFilter) return AUTOCOMPLETE_ITEMS.slice(0, 15);
    const filter = autocompleteFilter.toLowerCase();
    return AUTOCOMPLETE_ITEMS.filter(item => 
      item.label.toLowerCase().includes(filter) ||
      item.description.toLowerCase().includes(filter)
    ).slice(0, 15);
  }, [autocompleteFilter]);

  useEffect(() => {
    setSelectedAutocompleteIndex(0);
  }, [filteredAutocomplete]);

  const parseCodeFromTextarea = (codeText: string): { id: string; pattern: string }[] => {
    const lines = codeText.trim().split("\n").filter(line => line.trim() && !line.trim().startsWith("#"));
    const parsed: { id: string; pattern: string }[] = [];
    
    for (const line of lines) {
      const match = line.match(/^(\w+):\s*["'](.*)["']/);
      if (match) {
        parsed.push({ id: match[1], pattern: match[2] });
      }
    }
    
    return parsed;
  };

  const SOUND_MAP: Record<string, string> = {
    bd: "kick",
    sd: "snare",
    hh: "hihat",
    cp: "snare",
    ht: "snare",
    lt: "snare",
    mt: "snare",
    oh: "hihat",
    sn: "snare",
    k: "kick",
    s: "snare",
    h: "hihat",
  };

  const mapSoundToLayer = (soundId: string): string => {
    return SOUND_MAP[soundId] || soundId;
  };

  const isValidCode = (codeText: string): boolean => {
    return parseCodeFromTextarea(codeText).length > 0;
  };

  const initializeTone = useCallback(async () => {
    console.log("Initializing Tone.js...");
    
    if ((window.Tone as any)?.started) {
      console.log("Tone already started");
      isInitializedRef.current = true;
      return;
    }
    
    if (isInitializedRef.current && (window.Tone as any)?.Transport) {
      console.log("Tone already initialized");
      return;
    }
    
    setIsLoading(true);
    setStatus("Loading Tone.js...");
    
    try {
      if (!(window.Tone as any)) {
        console.log("Loading Tone.js from CDN...");
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js";
        document.head.appendChild(script);
        
        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Tone.js"));
        });
      }

      if (!(window.Tone as any).started) {
        await (window.Tone as any).start();
      }
      await (window.Tone as any).getContext().resume();
      
      console.log("Tone.js started successfully");
      isInitializedRef.current = true;
      setStatus("");
    } catch (err) {
      console.error("Tone.js load error:", err);
      setStatus("Failed to load audio");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const parsePattern = (patternStr: string): string[] => {
    const result: string[] = [];
    const parts = patternStr.split(" ");
    
    for (const part of parts) {
      if (part === "~") {
        result.push("~");
      } else if (part === "") {
        result.push("~");
      } else {
        const match = part.match(/^([a-z]+)(\d*)$/);
        if (match) {
          const [, sound, repeat] = match;
          const count = repeat ? parseInt(repeat) : 1;
          for (let i = 0; i < count; i++) {
            result.push(sound);
          }
        } else {
          result.push(part);
        }
      }
    }
    
    return result;
  };

  const startPlayback = async (_codeToPlay?: string) => {
    const parsedFromCode = parseCodeFromTextarea(code || "");
    const useCodeInput = code.trim().length > 0 && parsedFromCode.length > 0;
    
    console.log("Code:", code);
    console.log("Parsed:", parsedFromCode);
    console.log("UseCodeInput:", useCodeInput);
    console.log("DroppedItems:", droppedItems.length);
    
    if (!useCodeInput && droppedItems.length === 0) {
      console.log("No valid input to play");
      return;
    }
    
    await initializeTone();
    
    if (!(window.Tone as any)?.Transport) {
      console.error("Tone.Transport not available");
      setStatus("Audio not ready");
      return;
    }
    
    const ctx = (window.Tone as any).getContext();
    if (ctx.state !== "running") {
      await ctx.resume();
    }
    
    try {
      (window.Tone as any).Transport.stop();
      (window.Tone as any).Transport.cancel();
      
      synthsRef.current.forEach(s => s.dispose?.());
      synthsRef.current = [];
      
      const bpm = 128;
      (window.Tone as any).Transport.bpm.value = bpm;
      
      const kick = new (window.Tone as any).MembraneSynth({
        pitchDecay: 0.05,
        octaves: 10,
        oscillator: { type: "sine" },
        envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4, attackCurve: "exponential" },
      }).toDestination();
      kick.volume.value = (volume - 1) * 20;
      synthsRef.current.push(kick);
      
      const snare = new (window.Tone as any).NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 },
      }).toDestination();
      snare.volume.value = (volume - 1) * 20;
      synthsRef.current.push(snare);
      
      const hihat = new (window.Tone as any).MetalSynth({
        frequency: 200,
        envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5,
      }).toDestination();
      hihat.volume.value = (volume - 1) * 20 - 10;
      synthsRef.current.push(hihat);
      
      const bass = new (window.Tone as any).MonoSynth({
        oscillator: { type: "sawtooth" },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.3 },
        filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.3, baseFrequency: 200, octaves: 4 },
      }).toDestination();
      bass.volume.value = (volume - 1) * 20;
      const bassDist = new (window.Tone as any).Distortion(0.4).toDestination();
      bass.connect(bassDist);
      synthsRef.current.push(bass, bassDist);
      
      const lead = new (window.Tone as any).PolySynth((window.Tone as any).Synth, {
        oscillator: { type: "fatsawtooth" },
        envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.8 },
      }).toDestination();
      lead.volume.value = (volume - 1) * 20;
      const leadReverb = new (window.Tone as any).Reverb({ decay: 2, wet: 0.3 }).toDestination();
      lead.connect(leadReverb);
      synthsRef.current.push(lead, leadReverb);
      
      const sequence: { time: string; note: string | null; sound: string; layer: string }[][] = [];
      
      let layers: { id: string; pattern: string }[] = [];
      
      if (useCodeInput) {
        layers = parsedFromCode;
      } else {
        layers = droppedItems.map(item => ({
          id: item.category.id,
          pattern: item.category.patterns[item.patternIndex].code,
        }));
      }
      
      for (const layer of layers) {
        const tokens = parsePattern(layer.pattern);
        const mappedLayerId = mapSoundToLayer(layer.id);
        
        const layerSequence = tokens.map((sound, step) => {
          let note: string | null = null;
          
          if (["bass", "lead", "c2", "d2", "e2", "f2", "g2", "a2", "b2", "c3", "d3", "e3", "f3", "g3", "a3", "b3", "c4", "d4", "e4", "f4", "g4", "a4", "b4", "c5"].includes(sound)) {
            note = NOTE_TO_FREQ[sound] || sound;
          }
          
          return {
            time: `${step * (4 / tokens.length)}i`,
            note,
            sound,
            layer: mappedLayerId,
          };
        });
        
        sequence.push(layerSequence);
      }
      
      const stepDuration = 60 / bpm / 4;
      
      let stepIndex = 0;
      const maxSteps = Math.max(...sequence.map(s => s.length));
      
      console.log("Sequence built:", sequence.length, "layers");
      console.log("Layers:", JSON.stringify(sequence));
      
      const loop = new (window.Tone as any).Loop((time: unknown) => {
        for (let layerIdx = 0; layerIdx < sequence.length; layerIdx++) {
          const layer = sequence[layerIdx];
          if (stepIndex < layer.length) {
            const { sound, layer: layerId, note } = layer[stepIndex];
            if (sound === "~" || sound === "") continue;
            
            const mappedId = mapSoundToLayer(layerId);
            const isNote = NOTE_TO_FREQ[sound] !== undefined;
            
            console.log("Trigger:", sound, "layer:", mappedId, "note:", note);
            
            if (mappedId === "kick" || sound === "bd" || sound === "k") {
              kick.triggerAttackRelease("C1", "8n", time);
            } else if (mappedId === "snare" || sound === "sd" || sound === "s" || sound === "cp") {
              snare.triggerAttackRelease("8n", time);
            } else if (mappedId === "hihat" || sound === "hh" || sound === "h" || sound === "oh") {
              hihat.triggerAttackRelease("32n", time, 0.5);
            } else if (isNote && note) {
              if (parseInt(sound.replace(/\D/g, "")) <= 3) {
                bass.triggerAttackRelease(note, "16n", time);
              } else {
                lead.triggerAttackRelease(note, "16n", time);
              }
            }
          }
        }
        stepIndex = (stepIndex + 1) % maxSteps;
      }, `${stepDuration}m`);
      
      loop.start(0);
      sequenceRef.current = loop;
      
      (window.Tone as any).Transport.start();
      
      setIsPlaying(true);
      setStatus("Playing");
    } catch (err) {
      console.error("Playback error:", err);
      setStatus("Playback error");
    }
  };

  const handlePlay = async () => {
    if (!isPlaying) {
      await startPlayback(code);
    } else {
      await startPlayback(code);
    }
  };

  const handleStop = () => {
    try {
      (window.Tone as any)?.Transport.stop();
      (window.Tone as any)?.Transport.cancel();
      if (sequenceRef.current) {
        sequenceRef.current.cancel?.();
        sequenceRef.current = null;
      }
    } catch {}
    setIsPlaying(false);
    setStatus("Stopped");
  };

  const handleReset = () => {
    handleStop();
    setCode("");
    setDroppedItems([]);
    setStatus("");
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    synthsRef.current.forEach(s => {
      if (s.volume) s.volume.value = (newVolume - 1) * 20;
    });
  };

  const handleDragStart = (e: DragEvent, category: Category) => {
    e.dataTransfer.setData("category", JSON.stringify(category));
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const categoryData = e.dataTransfer.getData("category");
    if (categoryData) {
      const category: Category = JSON.parse(categoryData);
      const newItem: DroppedItem = {
        id: `${category.id}-${Date.now()}`,
        category,
        patternIndex: getRandomPattern(category),
      };
      setDroppedItems(prev => [...prev, newItem]);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const handlePatternChange = (itemId: string, patternIndex: number) => {
    setDroppedItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, patternIndex } : item
      )
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setDroppedItems(prev => prev.filter(item => item.id !== itemId));
  };

  const generateRandomMusic = () => {
    const numCategories = Math.floor(Math.random() * 3) + 3;
    const shuffled = [...CATEGORIES].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, numCategories);
    
    const newItems: DroppedItem[] = selected.map((category) => ({
      id: `${category.id}-${Date.now()}-${Math.random()}`,
      category,
      patternIndex: getRandomPattern(category),
    }));
    
    setDroppedItems(newItems);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const colors = ["#ff6b6b", "#4ecdc4", "#ffe66d", "#95e1d3", "#f38181", "#aa96da", "#fcbad3", "#a8d8ea"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const newEffect: KeyEffect = {
      id: Date.now(),
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: randomColor,
      timestamp: Date.now(),
    };
    
    setKeyEffects(prev => [...prev, newEffect]);
    setEditorGlow(prev => Math.min(prev + 15, 100));
    
    setTimeout(() => {
      setKeyEffects(prev => prev.filter(e => e.timestamp !== newEffect.timestamp));
    }, 600);
    
    setTimeout(() => {
      setEditorGlow(prev => Math.max(prev - 20, 0));
    }, 150);
    
    if (showAutocomplete) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedAutocompleteIndex(prev => 
          prev < filteredAutocomplete.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedAutocompleteIndex(prev => 
          prev > 0 ? prev - 1 : filteredAutocomplete.length - 1
        );
        return;
      }
      if (e.key === "Tab" || e.key === "Enter") {
        e.preventDefault();
        if (filteredAutocomplete[selectedAutocompleteIndex]) {
          insertAutocomplete(filteredAutocomplete[selectedAutocompleteIndex].label);
        }
        return;
      }
      if (e.key === "Escape") {
        setShowAutocomplete(false);
        return;
      }
    }
    
    if (e.key === "Tab" && !showAutocomplete) {
      e.preventDefault();
      showAutocompleteAtCursor();
    }
  };

  const showAutocompleteAtCursor = () => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const text = textarea.value;
    const pos = textarea.selectionStart;
    
    const textBeforeCursor = text.slice(0, pos);
    const lastWordMatch = textBeforeCursor.match(/[\w~*:."]+$/);
    const filter = lastWordMatch ? lastWordMatch[0] : "";
    
    setAutocompleteFilter(filter);
    
    const rect = textarea.getBoundingClientRect();
    const lineHeight = 24;
    const lines = textBeforeCursor.split("\n");
    const currentLine = lines.length;
    const currentChar = lines[lines.length - 1].length;
    
    const charWidth = 8.4;
    const top = rect.top + window.scrollY + (currentLine * lineHeight) - textarea.scrollTop + 30;
    const left = rect.left + window.scrollX + (currentChar * charWidth);
    
    setAutocompletePosition({ top, left });
    setShowAutocomplete(true);
    setSelectedAutocompleteIndex(0);
  };

  const insertAutocomplete = (label: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const text = textarea.value;
    const pos = textarea.selectionStart;
    
    const textBeforeCursor = text.slice(0, pos);
    const textAfterCursor = text.slice(pos);
    
    const lastWordMatch = textBeforeCursor.match(/[\w~*:."]+$/);
    const beforeWord = lastWordMatch ? textBeforeCursor.slice(0, -lastWordMatch[0].length) : textBeforeCursor;
    
    const newText = beforeWord + label + textAfterCursor;
    setCode(newText);
    
    setTimeout(() => {
      const newPos = beforeWord.length + label.length;
      textarea.selectionStart = textarea.selectionEnd = newPos;
      textarea.focus();
    }, 0);
    
    setShowAutocomplete(false);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
    
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const pos = textarea.selectionStart;
    const textBeforeCursor = newCode.slice(0, pos);
    const lastWordMatch = textBeforeCursor.match(/[\w~*:."]+$/);
    const filter = lastWordMatch ? lastWordMatch[0] : "";
    
    if (filter.length >= 1) {
      setAutocompleteFilter(filter);
      const rect = textarea.getBoundingClientRect();
      const lineHeight = 24;
      const lines = textBeforeCursor.split("\n");
      const currentLine = lines.length;
      const currentChar = lines[lines.length - 1].length;
      const charWidth = 8.4;
      
      const top = rect.top + window.scrollY + (currentLine * lineHeight) - textarea.scrollTop + 30;
      const left = rect.left + window.scrollX + (currentChar * charWidth);
      
      setAutocompletePosition({ top, left });
      
      if (!showAutocomplete) {
        setShowAutocomplete(true);
      }
    } else {
      setShowAutocomplete(false);
    }
  };

  useEffect(() => {
    return () => {
      handleStop();
    };
  }, []);

  useEffect(() => {
    if (isPlaying && isValidCode(code)) {
      if (autoPlayTimeoutRef.current) {
        clearTimeout(autoPlayTimeoutRef.current);
      }
      autoPlayTimeoutRef.current = setTimeout(() => {
        startPlayback(code);
      }, 300);
    }
    return () => {
      if (autoPlayTimeoutRef.current) {
        clearTimeout(autoPlayTimeoutRef.current);
      }
    };
  }, [code, isPlaying, isValidCode, startPlayback]);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      note: "text-green-400",
      sound: "text-red-400",
      effect: "text-purple-400",
      pattern: "text-blue-400",
      symbol: "text-yellow-400",
      operator: "text-cyan-400",
    };
    return colors[category] || "text-white";
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <Music2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Live Code Music</h1>
              <p className="text-sm text-white/50">Type code or drag & drop patterns</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {status && (
              <span className={`text-xs px-3 py-1 rounded-full ${
                status === "Playing" ? "bg-green-500/20 text-green-400" :
                status.includes("Loading") ? "bg-yellow-500/20 text-yellow-400" :
                status.includes("Error") || status.includes("error") ? "bg-red-500/20 text-red-400" :
                "bg-white/10 text-white/60"
              }`}>
                {isLoading && <Loader2 className="w-3 h-3 inline animate-spin mr-1" />}
                {status}
              </span>
            )}
            <div className="flex items-center gap-1 bg-white/10 rounded-lg px-2">
              <button onClick={() => handleVolumeChange(Math.max(0, volume - 0.1))} className="p-1 hover:text-purple-400">
                <VolumeX className="w-4 h-4" />
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
              />
              <button onClick={() => handleVolumeChange(Math.min(1, volume + 0.1))} className="p-1 hover:text-purple-400">
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
            <Button
              onClick={generateRandomMusic}
              variant="outline"
              className="border-purple-500/50 text-purple-400 hover:bg-purple-500/20 gap-2"
            >
              <Shuffle className="w-4 h-4" />
              Generate Random
            </Button>
            <Button
              onClick={handlePlay}
              disabled={isLoading || (droppedItems.length === 0 && !isValidCode(code))}
              className="bg-green-600 hover:bg-green-700 text-white gap-2"
            >
              <Play className="w-4 h-4" />
              {isPlaying ? "Update" : "Play"}
            </Button>
            <Button
              onClick={handleStop}
              variant="destructive"
              className="gap-2"
            >
              <Square className="w-4 h-4" />
              Stop
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-white/70 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                Drag Categories
              </h3>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <div
                    key={cat.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, cat)}
                    onDragEnd={handleDragEnd}
                    className={`px-3 py-1.5 rounded-full bg-gradient-to-r ${cat.color} text-white text-xs font-medium cursor-grab hover:opacity-90 transition-opacity flex items-center gap-1.5`}
                  >
                    <GripVertical className="w-3 h-3 opacity-60" />
                    {cat.name}
                  </div>
                ))}
              </div>
            </div>

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className={`min-h-[180px] rounded-lg border-2 border-dashed p-4 transition-colors ${
                isDragging ? "border-purple-500 bg-purple-500/10" : "border-white/20 bg-white/5"
              }`}
            >
              <h3 className="text-sm font-medium text-white/70 mb-3 flex items-center gap-2">
                <Waves className="w-4 h-4 text-purple-400" />
                Drop Zone ({droppedItems.length} layers)
              </h3>
              {droppedItems.length === 0 ? (
                <p className="text-white/30 text-xs text-center py-8">
                  Drag categories here to build your track
                </p>
              ) : (
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                  {droppedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 p-2 rounded bg-white/5 border border-white/10"
                    >
                      <div className={`w-2 h-6 rounded-full bg-gradient-to-r ${item.category.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white/80">{item.category.name}</div>
                        <select
                          value={item.patternIndex}
                          onChange={(e) => handlePatternChange(item.id, parseInt(e.target.value))}
                          className="w-full bg-black/30 text-white/60 text-xs rounded px-1 py-0.5 border border-white/10 focus:outline-none focus:border-purple-500"
                        >
                          {item.category.patterns.map((p, i) => (
                            <option key={i} value={i}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <button onClick={() => handleRemoveItem(item.id)} className="text-white/30 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-white/70 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-400" />
                Code Editor
                <span className="text-xs text-white/30">(Press Tab for autocomplete)</span>
              </label>
              <div className="flex items-center gap-2 text-xs text-white/40">
                <span>Notes</span>
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span>Sounds</span>
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span>Effects</span>
                <span className="w-2 h-2 rounded-full bg-purple-400" />
              </div>
            </div>
            
            <div 
              ref={editorContainerRef}
              className="relative"
              style={{
                filter: isEditorFocused ? `drop-shadow(0 0 ${editorGlow}px rgba(168, 85, 247, 0.5))` : "none",
                transition: "filter 0.15s ease-out",
              }}
            >
              {keyEffects.map((effect) => (
                <div
                  key={effect.id}
                  className="absolute pointer-events-none rounded-full animate-ping"
                  style={{
                    left: `${effect.x}%`,
                    top: `${effect.y}%`,
                    width: "20px",
                    height: "20px",
                    backgroundColor: effect.color,
                    opacity: 0.8,
                    transform: "translate(-50%, -50%)",
                  }}
                />
              ))}
              
              <textarea
                ref={textareaRef}
                value={code}
                onChange={handleCodeChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsEditorFocused(true)}
                onBlur={() => setTimeout(() => setIsEditorFocused(false), 200)}
                placeholder={`bd: "bd*4"~ sd: "~ sd ~ sd"\n\n# Press Tab to autocomplete\n# Notes: c2 c3 c4 c5\n# Sounds: bd sd hh cp\n# Effects: slow rev delay`}
                className="w-full h-[280px] rounded-lg bg-[#0a0a0f] border-2 border-white/10 p-4 font-mono text-sm text-green-400 resize-none focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 placeholder:text-white/20 transition-all"
                spellCheck={false}
              />
              
              <div className="absolute bottom-4 right-4 flex items-center gap-2 text-xs text-white/30">
                <span className="px-2 py-1 rounded bg-white/5 border border-white/10">Tab</span>
                <span>autocomplete</span>
              </div>
            </div>
            
            {showAutocomplete && filteredAutocomplete.length > 0 && (
              <div 
                className="absolute z-50 w-72 max-h-64 overflow-auto rounded-lg bg-[#12121a] border border-purple-500/30 shadow-2xl shadow-purple-500/10"
                style={{ 
                  top: autocompletePosition.top, 
                  left: autocompletePosition.left,
                }}
              >
                {filteredAutocomplete.map((item, index) => (
                  <div
                    key={item.label}
                    onClick={() => insertAutocomplete(item.label)}
                    className={`px-3 py-2 cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                      index === selectedAutocompleteIndex 
                        ? "bg-purple-500/30 text-white" 
                        : "text-white/70 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-sm ${getCategoryColor(item.category)}`}>
                        {item.label}
                      </span>
                      <span className="text-xs text-white/40">{item.description}</span>
                    </div>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      item.category === "note" ? "bg-green-500/20 text-green-400" :
                      item.category === "sound" ? "bg-red-500/20 text-red-400" :
                      item.category === "effect" ? "bg-purple-500/20 text-purple-400" :
                      item.category === "pattern" ? "bg-blue-500/20 text-blue-400" :
                      "bg-white/10 text-white/50"
                    }`}>
                      {item.category}
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <h3 className="text-sm font-medium text-white/70 mb-3 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-blue-400" />
                Example Patterns - Click to Insert
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {EXAMPLE_PATTERNS.map((example) => (
                  <button
                    key={example.id}
                    onClick={() => {
                      setCode(prev => prev ? prev + "\n\n" + example.code : example.code);
                      if (textareaRef.current) {
                        textareaRef.current.focus();
                      }
                    }}
                    className="text-left p-2 rounded bg-white/5 border border-white/10 hover:bg-purple-500/20 hover:border-purple-500/50 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-white/80 group-hover:text-white">{example.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/50 group-hover:bg-purple-500/30 group-hover:text-purple-300">
                        {example.genre}
                      </span>
                    </div>
                    <div className="text-[10px] text-white/40 font-mono truncate">
                      {example.code.split("\n")[0]}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <h3 className="text-sm font-medium text-white/70 mb-3">Quick Reference</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <div className="text-white/50 mb-1">Sounds</div>
                  <div className="space-y-0.5 font-mono">
                    <div><span className="text-red-400">bd</span> - kick</div>
                    <div><span className="text-yellow-400">sd</span> - snare</div>
                    <div><span className="text-purple-400">hh</span> - hi-hat</div>
                    <div><span className="text-pink-400">cp</span> - clap</div>
                  </div>
                </div>
                <div>
                  <div className="text-white/50 mb-1">Notes</div>
                  <div className="space-y-0.5 font-mono">
                    <div><span className="text-green-400">c2-c5</span> - bass to lead</div>
                    <div><span className="text-green-400">d2</span> - d2</div>
                    <div><span className="text-green-400">e2</span> - e2</div>
                    <div><span className="text-green-400">f2</span> - f2</div>
                  </div>
                </div>
                <div>
                  <div className="text-white/50 mb-1">Effects</div>
                  <div className="space-y-0.5 font-mono">
                    <div><span className="text-purple-400">slow 2</span> - slow</div>
                    <div><span className="text-purple-400">fast 2</span> - fast</div>
                    <div><span className="text-purple-400">rev</span> - reverse</div>
                    <div><span className="text-purple-400">room</span> - reverb</div>
                  </div>
                </div>
                <div>
                  <div className="text-white/50 mb-1">Symbols</div>
                  <div className="space-y-0.5 font-mono">
                    <div><span className="text-yellow-400">~</span> - rest</div>
                    <div><span className="text-cyan-400">*</span> - repeat</div>
                    <div><span className="text-cyan-400">:</span> - layer</div>
                    <div><span className="text-cyan-400">"</span> - string</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StrudelLive;
