"use client";

import { useState, DragEvent, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Play, Square, RotateCcw, Music2, Shuffle, Trash2, GripVertical, Loader2, Volume2, VolumeX } from "lucide-react";

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
  const [volume, setVolume] = useState(0.7);
  
  const synthsRef = useRef<any[]>([]);
  const samplesRef = useRef<Record<string, any>>({});
  const sequenceRef = useRef<any>(null);
  const isInitializedRef = useRef(false);

  const generateCode = () => {
    return droppedItems.map((item) => {
      const pattern = item.category.patterns[item.patternIndex];
      return `${item.category.id}: "${pattern.code}"`;
    }).join("\n");
  };

  const initializeTone = useCallback(async () => {
    if (isInitializedRef.current) return;
    
    setIsLoading(true);
    setStatus("Loading Tone.js...");
    
    try {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js";
      document.head.appendChild(script);
      
      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Tone.js"));
      });

      await (window.Tone as any).start();
      await (window.Tone as any).getContext().resume();
      
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

  const startPlayback = async () => {
    if (droppedItems.length === 0) return;
    
    await initializeTone();
    
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
      
      for (const item of droppedItems) {
        const pattern = item.category.patterns[item.patternIndex];
        const tokens = parsePattern(pattern.code);
        
        const layerSequence = tokens.map((sound, step) => {
          let note: string | null = null;
          
          if (["bass", "lead"].includes(item.category.id)) {
            note = NOTE_TO_FREQ[sound] || sound;
          }
          
          return {
            time: `${step * (4 / tokens.length)}i`,
            note,
            sound,
            layer: item.category.id,
          };
        });
        
        sequence.push(layerSequence);
      }
      
      const stepDuration = 60 / bpm / 4;
      
      let stepIndex = 0;
      const maxSteps = Math.max(...sequence.map(s => s.length));
      
      const loop = new (window.Tone as any).Loop((time) => {
        for (let layerIdx = 0; layerIdx < sequence.length; layerIdx++) {
          const layer = sequence[layerIdx];
          if (stepIndex < layer.length) {
            const { sound, layer: layerId, note } = layer[stepIndex];
            if (sound === "~") continue;
            
            if (layerId === "kick") {
              kick.triggerAttackRelease("C1", "8n", time);
            } else if (layerId === "snare") {
              snare.triggerAttackRelease("8n", time);
            } else if (layerId === "hihat") {
              hihat.triggerAttackRelease("32n", time, 0.5);
            } else if (layerId === "bass" && note) {
              bass.triggerAttackRelease(note, "16n", time);
            } else if (layerId === "lead" && note) {
              lead.triggerAttackRelease(note, "16n", time);
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
      await startPlayback();
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

  useEffect(() => {
    return () => {
      handleStop();
    };
  }, []);

  const currentCode = code || generateCode();

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <Music2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Live Code Music</h1>
              <p className="text-sm text-white/50">Drag & drop pattern generator</p>
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
              disabled={isLoading || droppedItems.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white gap-2"
            >
              <Play className="w-4 h-4" />
              Play
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

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-white/70 mb-3">
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
              <h3 className="text-sm font-medium text-white/70 mb-3">
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

          <div className="space-y-4">
            <label className="text-sm font-medium text-white/70">
              Generated Pattern
            </label>
            <div className="h-[350px] rounded-lg bg-[#1a1a2e] border border-white/10 p-4 overflow-auto font-mono text-sm text-green-400">
              <pre>{currentCode || "// Drag categories or click Generate Random"}</pre>
            </div>
            
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <h3 className="text-sm font-medium text-white/70 mb-2">Categories</h3>
              <div className="grid grid-cols-2 gap-2 text-xs text-white/50">
                <div><span className="text-red-400">Kick</span> - bd</div>
                <div><span className="text-yellow-400">Snare</span> - sd</div>
                <div><span className="text-purple-400">Hi-Hat</span> - hh</div>
                <div><span className="text-amber-400">Bass</span> - notes</div>
                <div><span className="text-green-400">Lead</span> - notes</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StrudelLive;
