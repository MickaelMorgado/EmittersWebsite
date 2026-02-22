'use client';
import { AlertTriangle, ArrowLeft, ArrowRight, BarChart3, Camera, Check, ChevronDown, Eye, ImagePlus, LayoutGrid, Loader2, Minus, Plus, Settings, Trash2, X } from 'lucide-react';
import { VersionBadge } from "@/components/VersionBadge";
import { useEffect, useMemo, useRef, useState } from 'react';
import { AmmoVariant, STALKER_AMMO_DATA } from './data';
import './styles.css';

interface AmmoState {
  inventory: number;
  stash: number;
  inventoryThreshold: number;
  stashThreshold: number;
}

interface CarryingWeapon {
  instanceId: string;
  name: string;
  ammoFilter?: string[];
  minRounds?: number;
}

interface DetectedAmmo {
  matchedId: string | null;
  rawName: string;
  count: number;
  location: 'inventory' | 'loot' | 'unknown';
  confidence: 'high' | 'medium' | 'low';
}

interface ChatMessage {
  id: string;
  type: 'user-image' | 'ai-result' | 'ai-error' | 'system';
  content: string;
  image?: string;
  items?: DetectedAmmo[];
  notes?: string;
  timestamp: number;
}

interface AIDetectionResult {
  detectedScreen: 'inventory' | 'loot' | 'both' | 'unknown';
  items: Array<{
    name: string;
    count: number;
    location: 'inventory' | 'loot' | 'unknown';
  }>;
  confidence: 'high' | 'medium' | 'low';
  notes?: string;
}


const FocusedInput = ({ forceFocus, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { forceFocus?: boolean }) => {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current && forceFocus) {
      ref.current.focus();
      // Select text for easier editing
      ref.current.select();
    }
  }, [forceFocus]);
  return <input ref={ref} {...props} />;
};

const WarningIcon = ({ size = 12 }: { size?: number }) => (
  <span className="warning-icon">
    <AlertTriangle size={size} />
  </span>
);

// Global Audio Singleton with Lazy Initialization
// This bypasses browser autoplay/block issues by providing a manual "unlock" path
const GlobalAudio = {
  cache: {} as { [key: string]: HTMLAudioElement },
  isBlocked: false,
  onBlockChange: null as ((blocked: boolean) => void) | null,
  
  get(key: string, path: string) {
    if (typeof window === 'undefined') return null;
    if (!this.cache[key]) {
      console.log(`[Audio] Initializing: ${key}`);
      const audio = new Audio(path);
      audio.volume = key === 'ammo' ? 0.4 : (key === 'hover' ? 0.35 : (key === 'shell' ? 0.25 : 0.5));
      audio.preload = 'auto';
      this.cache[key] = audio;
    }
    return this.cache[key];
  },
  
  play(key: string, path: string) {
    const audio = this.get(key, path);
    if (audio) {
      audio.currentTime = 0;
      audio.play()
        .then(() => {
          if (this.isBlocked) {
            this.isBlocked = false;
            if (this.onBlockChange) this.onBlockChange(false);
          }
        })
        .catch(e => {
          console.warn(`[Audio] Blocked: ${key}.`, e);
          if (!this.isBlocked) {
            this.isBlocked = true;
            if (this.onBlockChange) this.onBlockChange(true);
          }
        });
    }
  },

  unlockAll() {
    console.log('[Audio] Massive unlock sequence initiated...');
    Object.values(this.cache).forEach(audio => {
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
      }).catch(() => {});
    });
    this.isBlocked = false;
    if (this.onBlockChange) this.onBlockChange(false);
  }
};

const playAmmoSound = () => GlobalAudio.play('ammo', '/assets/sounds/422688__niamhd00145229__ammo-reload.wav');
const playHoverSound = () => GlobalAudio.play('hover', '/assets/sounds/836201__matustrm__ui_hover.wav');
const playBoxSound = () => GlobalAudio.play('box', '/assets/sounds/415494__aiwha__opening-a-small-metal-box-2.wav');
const playPageSound = () => GlobalAudio.play('page', '/assets/sounds/389807__krnash__turning-book-page.wav');
const playGunSound = () => GlobalAudio.play('gun', '/assets/sounds/530225__magnuswaker__chik-chak-1-gun-slide.wav');
const playZipperSound = () => GlobalAudio.play('zipper', '/assets/sounds/315840__gneube__zipper.wav');
const playShellSound = () => GlobalAudio.play('shell', '/assets/sounds/647806__penguinpro3383__bullet-shell.m4a');

const fuzzyMatch = (target: string, query: string) => {
  if (!query) return true;
  
  // Support Regex mode if query starts/ends with /
  if (query.startsWith('/') && query.endsWith('/') && query.length > 2) {
    try {
      const regex = new RegExp(query.slice(1, -1), 'i');
      return regex.test(target);
    } catch (e) { /* fallback */ }
  }

  const cleanTarget = target.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanQuery = query.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Support OR terms with |
if (query.includes('|')) {
    const parts = query.split('|').map(p => p.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
    return parts.some(p => p && cleanTarget.includes(p));
  }

  return cleanTarget.includes(cleanQuery);
};

const AI_DETECTION_PROMPT = `You are analyzing a STALKER 2: Heart of Chornobyl game screenshot showing ammunition inventory.

Extract all ammunition items visible. For each item, provide:
- name: The ammo name as shown (e.g., "9x18mm Pst", "5.45x39mm PS", "12x70 Buckshot")
- count: The quantity/rounds shown (just the number)
- location: "inventory" if in Backpack section, "loot" if in Loot section, or "unknown"

The game UI shows:
- "Backpack" for items you're carrying
- "Loot" for storage/stash items

Return ONLY valid JSON with this exact structure:
{
  "detectedScreen": "inventory" | "loot" | "both" | "unknown",
  "items": [
    { "name": "9x18mm Pst", "count": 120, "location": "inventory" },
    { "name": "5.45x39mm PS", "count": 300, "location": "loot" }
  ],
  "confidence": "high" | "medium" | "low",
  "notes": "Brief notes about any unclear items"
}

Be accurate with counts. If uncertain about an item name, include your best guess and note it. Return empty items array if no ammo visible.`;

const matchAmmoName = (rawName: string): string | null => {
  const normalized = rawName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  for (const caliber of STALKER_AMMO_DATA) {
    for (const variant of caliber.variants) {
      const vNorm = variant.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (vNorm === normalized) return variant.id;
    }
  }
  
  for (const caliber of STALKER_AMMO_DATA) {
    for (const variant of caliber.variants) {
      const vNorm = variant.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (normalized.includes(vNorm) || vNorm.includes(normalized)) return variant.id;
    }
    
    const cNorm = caliber.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalized.includes(cNorm)) {
      const firstVariant = caliber.variants[0];
      if (firstVariant) return firstVariant.id;
    }
  }
  
  return null;
};

const getVariantById = (id: string): AmmoVariant | null => {
  for (const caliber of STALKER_AMMO_DATA) {
    const variant = caliber.variants.find(v => v.id === id);
    if (variant) return variant;
  }
  return null;
};

export default function StalkerAmmoPage() {
  const [data, setData] = useState<{ [key: string]: AmmoState }>({});
  const [mounted, setMounted] = useState(false);
  const [editingThreshold, setEditingThreshold] = useState<string | null>(null);
  const [hoveredAmmoId, setHoveredAmmoId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'graph'>('grid');
  const [hoveringWarningId, setHoveringWarningId] = useState<string | null>(null);
  const [activeAmmoId, setActiveAmmoId] = useState<string | null>(null);
  const [weaponFilterId, setWeaponFilterId] = useState<string | null>(null);
  const [quickAddTarget, setQuickAddTarget] = useState<'inventory' | 'stash' | null>(null);
  const [quickAddSearch, setQuickAddSearch] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [stashSearch, setStashSearch] = useState('');
  const [inventorySearch, setInventorySearch] = useState('');
  const [aiChatInput, setAiChatInput] = useState('');
  const [caliberThresholds, setCaliberThresholds] = useState<{ [key: string]: { inventory: number; stash: number } }>({});
  const [carriedWeapons, setCarriedWeapons] = useState<CarryingWeapon[]>([]);
  const [weaponSearch, setWeaponSearch] = useState('');
  const [confirmingDeleteWeapon, setConfirmingDeleteWeapon] = useState<string | null>(null);
  const [hoveredWeaponName, setHoveredWeaponName] = useState<string | null>(null);
  const [weaponSelectedIndex, setWeaponSelectedIndex] = useState(0);
  const [calibratingWeaponId, setCalibratingWeaponId] = useState<string | null>(null);
  const [calibSearch, setCalibSearch] = useState('');
  const [isShowcase, setIsShowcase] = useState(false);
  const [showcaseStep, setShowcaseStep] = useState(0);
  const [showcaseTarget, setShowcaseTarget] = useState<string | null>(null);
  const [dataBackup, setDataBackup] = useState<{ [key: string]: AmmoState } | null>(null);
  const [hwBackup, setHwBackup] = useState<CarryingWeapon[] | null>(null);
  const modalSearchRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

const [openaiKey, setOpenaiKey] = useState<string>('');
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [accordionLogistics, setAccordionLogistics] = useState(true);
  const [accordionAssistant, setAccordionAssistant] = useState(true);

  const ALL_WEAPONS = useMemo(() => {
    const ws = new Set<string>();
    STALKER_AMMO_DATA.forEach(c => {
      c.variants.forEach(v => {
        v.compatibleWeapons?.forEach(w => ws.add(w.replace(' (Mod)', '')));
      });
    });
    return Array.from(ws).sort();
  }, []);

  const WEAPON_POSSIBLE_AMMO = useMemo(() => {
    const map: { [weaponName: string]: string[] } = {};
    STALKER_AMMO_DATA.forEach(c => {
      c.variants.forEach(v => {
        v.compatibleWeapons?.forEach(w => {
          const cleanW = w.replace(' (Mod)', '');
          if (!map[cleanW]) map[cleanW] = [];
          map[cleanW].push(v.id);
        });
      });
    });
    return map;
  }, []);

  const filteredWeapons = useMemo(() => {
    if (!weaponSearch) return [];
    return ALL_WEAPONS.filter(w => fuzzyMatch(w, weaponSearch) && !carriedWeapons.some(cw => cw.name === w)).slice(0, 5);
  }, [weaponSearch, ALL_WEAPONS, carriedWeapons]);

  const hoveredAmmoCompatibleWeapons = useMemo(() => {
    if (!hoveredAmmoId) return [];
    const compatibleInstances: string[] = [];
    
    for (const hw of carriedWeapons) {
      if (hw.ammoFilter) {
        if (hw.ammoFilter.includes(hoveredAmmoId)) compatibleInstances.push(hw.instanceId);
      } else {
        // Fallback to global data
        const isCompatible = STALKER_AMMO_DATA.some(caliber => 
          caliber.variants.some(v => v.id === hoveredAmmoId && v.compatibleWeapons?.some(cw => cw.replace(' (Mod)', '') === hw.name))
        );
        if (isCompatible) compatibleInstances.push(hw.instanceId);
      }
    }
    return compatibleInstances;
  }, [hoveredAmmoId, carriedWeapons]);

  // No-op init since we moved to lazy get()
  useEffect(() => {
    console.log('[App] Tactical Terminal Mounted');
  }, []);

  const [audioUnlocked, setAudioUnlocked] = useState(false);
  
  useEffect(() => {
    const saved = sessionStorage.getItem('stalker_audio_unlocked_session');
    if (saved === 'true') {
      setAudioUnlocked(true);
      GlobalAudio.isBlocked = false;
    }

    GlobalAudio.onBlockChange = (blocked) => {
      setAudioUnlocked(!blocked);
    };

    // Initialize without playing to avoid the browser's mount-time block
    GlobalAudio.get('hover', '/assets/sounds/836201__matustrm__ui_hover.wav');
    GlobalAudio.get('ammo', '/assets/sounds/422688__niamhd00145229__ammo-reload.wav');
  }, []);

  const handleSoundCheck = () => {
    GlobalAudio.unlockAll();
    playHoverSound();
    setAudioUnlocked(true);
    sessionStorage.setItem('stalker_audio_unlocked_session', 'true');
  };

  useEffect(() => {
    setEditingThreshold(null);
  }, [activeAmmoId]);

  useEffect(() => {
    setWeaponSelectedIndex(0);
  }, [weaponSearch]);

  // Audio Effects for Advanced Interactions (Opening & Closing)
  const prevQuickAdd = useRef(quickAddTarget);
  const prevEditingThresh = useRef(editingThreshold);

  useEffect(() => {
    if (mounted && quickAddTarget !== prevQuickAdd.current) {
      playBoxSound();
      prevQuickAdd.current = quickAddTarget;
    }
}, [quickAddTarget, mounted]);

  useEffect(() => {
    if (mounted && editingThreshold !== prevEditingThresh.current) {
      playPageSound();
      prevEditingThresh.current = editingThreshold;
    }
  }, [editingThreshold, mounted]);

  useEffect(() => {
    const savedKey = localStorage.getItem('stalker_openai_key_v1');
    if (savedKey) setOpenaiKey(savedKey);
  }, []);

  const analyzeScreenshot = async (imageBase64: string): Promise<AIDetectionResult> => {
    if (!openaiKey) throw new Error('OpenAI API key not configured');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: AI_DETECTION_PROMPT },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` }}
          ]
        }],
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API request failed');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('No response from AI');

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Could not parse AI response');

    return JSON.parse(jsonMatch[0]);
  };

  const processDetectedItems = (result: AIDetectionResult): DetectedAmmo[] => {
    return result.items.map(item => ({
      matchedId: matchAmmoName(item.name),
      rawName: item.name,
      count: item.count,
      location: item.location,
      confidence: result.confidence
    }));
  };

  const applyDetectedItems = (items: DetectedAmmo[], target?: 'inventory' | 'stash') => {
    setData(prev => {
      const updated = { ...prev };
      items.forEach(item => {
        if (!item.matchedId) return;
        const loc = target || (item.location === 'loot' ? 'stash' : 'inventory');
        if (!updated[item.matchedId]) {
          updated[item.matchedId] = { inventory: 0, stash: 0, inventoryThreshold: 0, stashThreshold: 0 };
        }
        updated[item.matchedId] = {
          ...updated[item.matchedId],
          [loc]: item.count
        };
      });
      return updated;
    });
    playAmmoSound();
  };

  const handleImageUpload = (file: File) => {
    if (!openaiKey) {
      setShowApiSettings(true);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const base64 = result.split(',')[1];
      setUploadedImage(result);
      processImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (base64: string) => {
    setIsProcessing(true);
    const userMsgId = `user_${Date.now()}`;
    
    setChatMessages(prev => [...prev, {
      id: userMsgId,
      type: 'user-image',
      content: 'Scanning inventory screenshot...',
      image: `data:image/jpeg;base64,${base64}`,
      timestamp: Date.now()
    }]);

    try {
      const result = await analyzeScreenshot(base64);
      const processed = processDetectedItems(result);
      
      setChatMessages(prev => [...prev, {
        id: `ai_${Date.now()}`,
        type: 'ai-result',
        content: `Detected ${processed.length} ammunition types`,
        items: processed,
        notes: result.notes,
        timestamp: Date.now()
      }]);
    } catch (error) {
      setChatMessages(prev => [...prev, {
        id: `err_${Date.now()}`,
        type: 'ai-error',
        content: error instanceof Error ? error.message : 'Failed to analyze screenshot',
        timestamp: Date.now()
      }]);
} finally {
      setIsProcessing(false);
      setUploadedImage(null);
    }
  };

  const updateDetectedItemCount = (msgId: string, itemIdx: number, newCount: number) => {
    setChatMessages(prev => prev.map(msg => {
      if (msg.id !== msgId || !msg.items) return msg;
      const updated = [...msg.items];
      updated[itemIdx] = { ...updated[itemIdx], count: Math.max(0, newCount) };
      return { ...msg, items: updated };
    }));
    playShellSound();
  };

  const removeDetectedItem = (msgId: string, itemIdx: number) => {
    setChatMessages(prev => prev.map(msg => {
      if (msg.id !== msgId || !msg.items) return msg;
      return { ...msg, items: msg.items.filter((_, i) => i !== itemIdx) };
    }));
    playZipperSound();
  };

  const handlePaste = (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) handleImageUpload(file);
        break;
      }
    }
  };

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [openaiKey]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  };




  // Initialize data
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('stalker_ammo_data_v4');
    const savedCaliber = localStorage.getItem('stalker_caliber_thresh_v4');
    if (saved) {
      try {
        setData(JSON.parse(saved));
        if (savedCaliber) setCaliberThresholds(JSON.parse(savedCaliber));
        const savedWeapons = localStorage.getItem('stalker_carried_weapons_v2');
        if (savedWeapons) {
          setCarriedWeapons(JSON.parse(savedWeapons));
        } else {
          // Migration from v1
          const legacy = localStorage.getItem('stalker_carried_weapons_v1');
          if (legacy) {
            const parsed = JSON.parse(legacy) as string[];
            setCarriedWeapons(parsed.map(name => ({ instanceId: `hw_${Math.random().toString(36).substr(2, 9)}`, name })));
          }
        }
      } catch (e) {
        initializeDefaultData();
      }
    } else {
      initializeDefaultData();
    }
  }, []);
  const initializeDefaultData = () => {
    const initialState: { [key: string]: AmmoState } = {};
    const initialCaliberThresh: { [key: string]: { inventory: number; stash: number } } = {};
    
    STALKER_AMMO_DATA.forEach(c => {
      initialCaliberThresh[c.id] = { inventory: 150, stash: 500 };
      c.variants.forEach(v => {
        initialState[v.id] = {
          inventory: 0,
          stash: 0,
          inventoryThreshold: 60,
          stashThreshold: 400,
        };
      });
    });

    // Preset some inventory
    if (initialState['9x18_pst']) initialState['9x18_pst'].inventory = 120;
    if (initialState['545x39_ps']) initialState['545x39_ps'].inventory = 90;

    setData(initialState);
    setCaliberThresholds(initialCaliberThresh);
  };

  useEffect(() => {
    if (mounted && !isShowcase) {
      localStorage.setItem('stalker_ammo_data_v4', JSON.stringify(data));
      localStorage.setItem('stalker_caliber_thresh_v4', JSON.stringify(caliberThresholds));
      localStorage.setItem('stalker_carried_weapons_v2', JSON.stringify(carriedWeapons));
    }
  }, [data, caliberThresholds, carriedWeapons, mounted, isShowcase]);

  const addWeapon = (name: string) => {
    if (!name) return;
    const instance: CarryingWeapon = { 
      instanceId: `hw_${Math.random().toString(36).substr(2, 9)}`, 
      name 
    };
    setCarriedWeapons(prev => [...prev, instance]);
    setWeaponSearch('');
    playGunSound();
  };

  const removeWeapon = (id: string) => {
    setCarriedWeapons(prev => prev.filter(w => w.instanceId !== id));
    setConfirmingDeleteWeapon(null);
    playZipperSound();
  };

  const updateWeaponAmmoFilter = (id: string, ammoId: string) => {
    setCarriedWeapons(prev => prev.map(w => {
      if (w.instanceId !== id) return w;
      const current = w.ammoFilter || WEAPON_POSSIBLE_AMMO[w.name] || [];
      const updated = current.includes(ammoId) 
        ? current.filter(aid => aid !== ammoId)
        : [...current, ammoId];
      return { ...w, ammoFilter: updated };
    }));
  };

  const updateWeaponMinRounds = (id: string, value: number) => {
    setCarriedWeapons(prev => prev.map(w => {
      if (w.instanceId !== id) return w;
      return { ...w, minRounds: Math.max(0, value) };
    }));
    playShellSound();
  };

  const updateField = (id: string, field: keyof AmmoState, value: number) => {
    setData(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: Math.max(0, value) }
    }));
    if (field === 'inventory' || field === 'stash') {
      playAmmoSound();
    }
    playShellSound();
  };

  const moveAmmo = (id: string, from: 'inventory' | 'stash', to: 'inventory' | 'stash', amount: number) => {
    const currentFrom = data[id]?.[from] || 0;
    const currentTo = data[id]?.[to] || 0;
    const actualAmount = Math.min(amount, currentFrom);

    if (actualAmount > 0) {
      setData(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          [from]: currentFrom - actualAmount,
          [to]: currentTo + actualAmount
        }
      }));
      playAmmoSound();
    }
  };

  const purgeData = () => {
    if (confirm('Authorize factory reset? All local data will be purged.')) {
      initializeDefaultData();
    }
  };

  const allVariants = useMemo(() => STALKER_AMMO_DATA.flatMap(c => c.variants), []);

  const totalWeight = useMemo(() => {
    return Object.entries(data).reduce((acc, [id, state]) => {
      const variant = allVariants.find(v => v.id === id);
      return acc + (variant ? variant.weight * state.inventory : 0);
    }, 0);
  }, [data, allVariants]);

  const totalRounds = useMemo(() => {
    return Object.values(data).reduce((acc, state) => acc + state.inventory, 0);
  }, [data]);

  const stashRounds = useMemo(() => {
    return Object.values(data).reduce((acc, state) => acc + state.stash, 0);
  }, [data]);

  const getCaliberStats = (caliberId: string) => {
    const caliber = STALKER_AMMO_DATA.find(c => c.id === caliberId);
    if (!caliber) return { inventory: 0, stash: 0, inventoryThreshold: 0, stashThreshold: 0 };
    
    const totals = caliber.variants.reduce((acc, v) => {
      const state = data[v.id] || { inventory: 0, stash: 0 };
      acc.inventory += state.inventory;
      acc.stash += state.stash;
      return acc;
    }, { inventory: 0, stash: 0 });

    const thresh = caliberThresholds[caliberId] || { inventory: 0, stash: 0 };
    return { 
      inventory: totals.inventory, 
      stash: totals.stash, 
      inventoryThreshold: thresh.inventory, 
      stashThreshold: thresh.stash 
    };
  };

  const checkCompatibility = (ammoId: string, weaponInstanceId: string) => {
    const hw = carriedWeapons.find(w => w.instanceId === weaponInstanceId);
    if (!hw) return false;
    if (hw.ammoFilter) return hw.ammoFilter.includes(ammoId);
    const variant = allVariants.find(v => v.id === ammoId);
    return variant?.compatibleWeapons?.some(cw => cw.replace(' (Mod)', '') === hw.name) || false;
  };

  const updateCaliberThreshold = (caliberId: string, field: 'inventory' | 'stash', value: number) => {
    setCaliberThresholds(prev => ({
      ...prev,
      [caliberId]: { ...prev[caliberId], [field]: Math.max(0, value) }
    }));
    playShellSound();
  };

  const speak = (text: string) => {
    if (typeof window === 'undefined') return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    // Prefer a deeper voice if available
    const preferred = voices.find(v => v.name.includes('David') || v.name.includes('Male')) || voices[0];
    if (preferred) utterance.voice = preferred;
    utterance.rate = 1.15;
    utterance.pitch = 0.7;
    window.speechSynthesis.speak(utterance);
  };

  const SHOWCASE_STEPS = [
    {
      text: "Kuznetsov logic engaged. Loading Zone-Net Tutorial Protocol with training data.",
      action: null,
      target: null,
      setup: () => {
        setDataBackup({...data});
        setHwBackup([...carriedWeapons]);
        setShowcaseTarget(null);
        setData({
          '9x19_p': { inventory: 15, stash: 120, inventoryThreshold: 60, stashThreshold: 300 },
          '545x39_ps': { inventory: 30, stash: 300, inventoryThreshold: 90, stashThreshold: 200 },
          '545x39_pp': { inventory: 20, stash: 240, inventoryThreshold: 0, stashThreshold: 150 },
          '762x54_7n1': { inventory: 5, stash: 12, inventoryThreshold: 20, stashThreshold: 100 },
          '556x45_m885': { inventory: 150, stash: 60, inventoryThreshold: 45, stashThreshold: 0 },
          '45acp_fmj': { inventory: 0, stash: 400, inventoryThreshold: 0, stashThreshold: 200 },
          '12x70_buck': { inventory: 0, stash: 50, inventoryThreshold: 0, stashThreshold: 100 },
          '9x39_sp5': { inventory: 0, stash: 240, inventoryThreshold: 0, stashThreshold: 400 },
          '762x25_p': { inventory: 0, stash: 100, inventoryThreshold: 0, stashThreshold: 0 },
        });
        setCarriedWeapons([
          { instanceId: 'showcase_ak', name: 'AK-74', minRounds: 90 },
          { instanceId: 'showcase_fort', name: 'FORT-12', minRounds: 30 },
          { instanceId: 'showcase_ar', name: 'AR416', minRounds: 45 }
        ]);
        setViewMode('grid');
        setGlobalSearch('');
      }
    },
    {
      text: "This is your Field Inventory. Red slots mean critical shortage. Inspect one to see live stats.",
      action: "👆 Click on any red-flagged ammo slot to inspect it.",
      target: 'inventory',
      setup: () => {
        setViewMode('grid');
        setGlobalSearch('');
        setWeaponFilterId(null);
        setShowcaseTarget('inventory');
      }
    },
    {
      text: "Your Safe House Loot holds your reserves. Find the 9x19 and transfer rounds to your backpack.",
      action: "👆 In the LOOT panel, click on 9x19mm +P → then click TRANSFER to move rounds to Field Inventory.",
      target: 'stash',
      setup: () => {
        setViewMode('grid');
        setGlobalSearch('9x19');
        setWeaponFilterId(null);
        setShowcaseTarget('stash');
      }
    },
    {
      text: "Surplus detected. 150 rounds of 5.56mm in backpack — 3x above your tactical baseline of 45. The AI flags this.",
      action: "👆 Check the AI Logistics Scan panel on the left for the surplus alert. Click it to jump to that ammo.",
      target: 'sidebar',
      setup: () => {
        setGlobalSearch('');
        setWeaponFilterId(null);
        setShowcaseTarget('sidebar');
      }
    },
    {
      text: "Threshold calibration. Hover over a round count badge to see your warning baseline.",
      action: "👆 Hover over the round number on any ammo slot. The badge will reveal the set threshold. Click it to edit.",
      target: 'inventory',
      setup: () => {
        setGlobalSearch('');
        setShowcaseTarget('inventory');
      }
    },
    {
      text: "Hardware ID. Adding unloaded gear triggers an immediate supply mismatch in the AI scan.",
      action: "👆 Type 'TRs 301' in the Carrying Weapons field and press Enter. Watch the AI Scan react.",
      target: 'weapons',
      setup: () => {
        setGlobalSearch('');
        setShowcaseTarget('weapons');
      }
    },
    {
      text: "Caliber-wide monitoring. The AI tracks total rounds per caliber across all variants for your carried hardware.",
      action: "👆 Check the sidebar for caliber alerts — the AI sums all 5.45mm variants (PS + PP) against your AK-74's needs.",
      target: 'sidebar',
      setup: () => {
        setGlobalSearch('');
        setShowcaseTarget('sidebar');
      }
    },
    {
      text: "Tactical Calibration overrides. Use it for modded hardware with non-standard ammo feeds.",
      action: "👆 Click the gear icon on a weapon card to open Ammo Calibration and manually assign compatible rounds.",
      target: 'weapons',
      setup: () => {
        setShowcaseTarget('weapons');
      }
    },
    {
      text: "Switch to Graphical Telemetry to see stock versus baselines at a glance.",
      action: "👆 Click the bar chart icon in the header to switch to Graph View, then click any row to transfer.",
      target: 'header',
      setup: () => {
        setCalibratingWeaponId(null);
        setGlobalSearch('');
        setShowcaseTarget('header');
      }
    },
    {
      text: "Tutorial complete. Cache data will now be restored. Good hunting, Stalker.",
      action: null,
      target: null,
      setup: () => {
        setShowcaseTarget(null);
        endShowcase();
      }
    }
  ];

  const startShowcase = () => {
    setIsShowcase(true);
    setShowcaseStep(0);
    const step = SHOWCASE_STEPS[0];
    if (step) {
      step.setup();
      speak(step.text);
    }
  };

  const nextShowcaseStep = () => {
    if (showcaseStep < SHOWCASE_STEPS.length - 1) {
      const next = showcaseStep + 1;
      setShowcaseStep(next);
      const step = SHOWCASE_STEPS[next];
      if (step) {
        step.setup();
        speak(step.text);
      }
    } else {
      endShowcase();
    }
  };

  const endShowcase = () => {
    setIsShowcase(false);
    if (dataBackup) setData(dataBackup);
    if (hwBackup) setCarriedWeapons(hwBackup);
    setDataBackup(null);
    setHwBackup(null);
    setGlobalSearch('');
    setWeaponFilterId(null);
    setCalibratingWeaponId(null);
    window.speechSynthesis.cancel();
  };

  const renderAiSidebar = () => {
    // Hierarchical grouping structure
    const caliberGroups: { 
      [calId: string]: { 
        name: string, 
        variants: { 
          [vId: string]: { 
            name: string, 
            mainMessage: { type: 'critical' | 'warning' | 'info', text: string },
            subMessages: string[] 
          } 
        } 
      } 
    } = {};
    
    STALKER_AMMO_DATA.forEach(caliber => {
      const calStats = getCaliberStats(caliber.id);
      
      caliber.variants.forEach(v => {
        const state = data[v.id];
        if (!state) return;

        // SKIP LOGISTICS SCAN FOR CALIBER IF NO HARDWARE CARRIED OR COMPATIBLE
        const isAmmoCompatibleWithCarried = carriedWeapons.some(hw => {
          if (hw.ammoFilter) return hw.ammoFilter.includes(v.id);
          return v.compatibleWeapons?.some(cw => cw.replace(' (Mod)', '') === hw.name);
        });
        if (!isAmmoCompatibleWithCarried) return;

        const invShortage = Math.max(0, state.inventoryThreshold - state.inventory);
        const stashSurplus = Math.max(0, state.stash - state.stashThreshold);
        
        let mainMsg: { type: 'critical' | 'warning' | 'info', text: string } | null = null;
        const subMsgs: string[] = [];

        // 1. Inventory Alerts (Primary)
        if (state.inventory > 0 && state.inventory < state.inventoryThreshold) {
          if (calStats.inventory >= (calStats.inventoryThreshold || 150)) {
            mainMsg = { 
              type: 'warning', 
              text: `REASSURANCE: ${v.name} is low, but you have sufficient ${caliber.name} reserves overall to compensate.` 
            };
          } else {
            const carriedCompatible = carriedWeapons.filter(hw => {
              if (hw.ammoFilter) return hw.ammoFilter.includes(v.id);
              return v.compatibleWeapons?.some(cw => cw.replace(' (Mod)', '') === hw.name);
            });
            const weaponList = carriedCompatible.length > 0 ? ` (Required for: ${carriedCompatible.map(hw => hw.name).join(', ')})` : '';
            mainMsg = { 
              type: 'critical', 
              text: `BACKPACK ALERT: ${v.name} is critically low (${state.inventory}/${state.inventoryThreshold}, Shortage: ${invShortage}).${weaponList}` 
            };
          }
        }

        // 1.5 Surplus Check (Refined: Only if removing excess keeps caliber above threshold)
        if (state.inventoryThreshold > 0 && state.inventory >= state.inventoryThreshold * 3) {
          const excess = state.inventory - state.inventoryThreshold;
          const wouldStillMeetCaliberMin = (calStats.inventory - excess) >= (calStats.inventoryThreshold || 0);
          
          if (wouldStillMeetCaliberMin) {
            if (!mainMsg) {
              mainMsg = {
                 type: 'info',
                 text: `SURPLUS DETECTED: ${v.name} inventory is 3x above tactical baseline (Excess: ${excess}).`
              };
              subMsgs.push(`ADVICE: Secure surplus in Safe House or liquidate for Zone credits.`);
            } else {
              subMsgs.push(`NOTE: Massive surplus detected (${excess} units). Manage weight accordingly.`);
            }
          }
        }

        // 2. Strategic Transfer (Nested under Inventory Alert if exists, otherwise potentially a main message?)
        // User said: "loot messages could be nested inside any inventory warning messages"
        if (stashSurplus > 0 && invShortage > 0) {
          const transferAmt = Math.min(invShortage, stashSurplus);
          const msg = `STRATEGY: Transfer ${transferAmt} units from Loot to reach tactical baseline.`;
          if (mainMsg) subMsgs.push(msg);
          else mainMsg = { type: 'warning', text: `${v.name} Strategy: ${msg}` };
        }

        // 3. Loot Alerts (Nested under Inventory Alert if exists)
        if (state.stash > 0 && state.stash < state.stashThreshold) {
          const carriedCompatible = carriedWeapons.filter(hw => {
              if (hw.ammoFilter) return hw.ammoFilter.includes(v.id);
              return v.compatibleWeapons?.some(cw => cw.replace(' (Mod)', '') === hw.name);
          });
          const weaponList = carriedCompatible.length > 0 ? ` (Required for: ${carriedCompatible.map(hw => hw.name).join(', ')})` : '';
          const lootDeficit = state.stashThreshold - state.stash;
          const msg = `LOOT ALERT: Safe House stock below tactical reserve (${state.stash}/${state.stashThreshold}, Deficit: ${lootDeficit}).${weaponList}`;
          if (mainMsg) subMsgs.push(msg);
          else mainMsg = { type: 'critical', text: `${v.name} Loot: ${msg}` };
        }

        // 4. Missing Thresholds (Treated as warnings)
        if ((state.inventory > 0 && state.inventoryThreshold === 0) || (state.stash > 0 && state.stashThreshold === 0)) {
           if (state.inventoryThreshold === 0 && state.inventory > 0) {
             const msg = `Initialize threshold to enable tracking.`;
             if (mainMsg) subMsgs.push(msg);
             else mainMsg = { type: 'warning', text: `${v.name}: ${msg}` };
           }
        }

        if (mainMsg) {
          if (!caliberGroups[caliber.id]) caliberGroups[caliber.id] = { name: caliber.name, variants: {} };
          caliberGroups[caliber.id].variants[v.id] = {
            name: v.name,
            mainMessage: mainMsg,
            subMessages: subMsgs
          };
        }
      });
    });

    // 5. Hardware/Ammo Mismatch (Special Alerts)
    const hardwareWarnings: { type: 'critical' | 'warning' | 'info', text: string, subMessages: string[], instanceId?: string }[] = [];
    carriedWeapons.forEach(hw => {
      const compatAmmo = STALKER_AMMO_DATA.flatMap(c => c.variants).filter(v => {
        if (hw.ammoFilter) return hw.ammoFilter.includes(v.id);
        return v.compatibleWeapons?.some(cw => cw.replace(' (Mod)', '') === hw.name);
      });
      
      const hasAnyAmmoInInv = compatAmmo.some(v => (data[v.id]?.inventory || 0) > 0);
      const totalInvRounds = compatAmmo.reduce((sum, v) => sum + (data[v.id]?.inventory || 0), 0);
      const hwSubMsgs: string[] = [];

      if (!hasAnyAmmoInInv && compatAmmo.length > 0) {
        const totalStashRounds = compatAmmo.reduce((sum, v) => sum + (data[v.id]?.stash || 0), 0);
        if (totalStashRounds > 0) {
          hardwareWarnings.push({
            type: 'critical',
            text: `URGENT: ${hw.name} equipped but no compatible rounds in backpack.`,
            subMessages: [`ADVICE: Transfer from Loot (${totalStashRounds} available) immediately to restore combat baseline.`],
            instanceId: hw.instanceId
          });
        } else {
          hardwareWarnings.push({
            type: 'critical',
            text: `DEADLOCK: ${hw.name} equipped but zero compatible ammunition found in Zone caches.`,
            subMessages: [`ADVICE: Scavenge compatible weapons or trade for new ammunition baseline.`],
            instanceId: hw.instanceId
          });
        }
      } else if (hw.minRounds && totalInvRounds < hw.minRounds) {
        const totalStashRounds = compatAmmo.reduce((sum, v) => sum + (data[v.id]?.stash || 0), 0);
        if (totalStashRounds > 0) {
          hwSubMsgs.push(`ADVICE: Refill from Safe House stock (${totalStashRounds} available) to restore combat baseline.`);
        } else {
          hwSubMsgs.push(`ADVICE: Scavenge more or seek a trader to bridge the ${hw.minRounds - totalInvRounds} round gap.`);
        }

        // Specific tactical advice
        if (hw.name.includes('SVD') || hw.name.includes('SVU') || hw.name.includes('M701') || hw.name.includes('Lynx') || hw.name.includes('Vintar')) {
          hwSubMsgs.push(`TACTICAL: Conserve shots; prioritize critical target elimination only.`);
        } else if (hw.name.includes('AK') || hw.name.includes('M4') || hw.name.includes('Viper') || hw.name.includes('G36') || hw.name.includes('Fora')) {
          hwSubMsgs.push(`TACTICAL: Switch to semi-auto or secondary arm to avoid rapid exhaustion.`);
        }

        const hwShortage = hw.minRounds - totalInvRounds;
        hardwareWarnings.push({
          type: 'warning',
          text: `SUPPLY LOW: ${hw.name} total rounds (${totalInvRounds}) below target (${hw.minRounds}, Deficit: ${hwShortage}).`,
          subMessages: hwSubMsgs,
          instanceId: hw.instanceId
        });
      }
    });
    const hasSuggestions = Object.keys(caliberGroups).length > 0 || hardwareWarnings.length > 0;
    
    const getLogisticsSeverity = (): 'critical' | 'warning' | 'info' | null => {
      if (hardwareWarnings.some(w => w.type === 'critical')) return 'critical';
      if (Object.values(caliberGroups).some(g => Object.values(g.variants).some(v => v.mainMessage.type === 'critical'))) return 'critical';
      if (hardwareWarnings.some(w => w.type === 'warning')) return 'warning';
      if (Object.values(caliberGroups).some(g => Object.values(g.variants).some(v => v.mainMessage.type === 'warning'))) return 'warning';
      if (hasSuggestions) return 'info';
      return null;
    };
    
    const logisticsSeverity = getLogisticsSeverity();

return (
      <aside 
        className={`ai-sidebar ${isShowcase && showcaseTarget === 'sidebar' ? 'tutorial-spotlight' : ''} ${isDragOver ? 'is-drag-over' : ''} ${expandedImage ? 'has-expanded' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="sidebar-header">
          <div className="ai-pulse" />
          <h3 className="sidebar-title">KUZNETSOV AI</h3>
          <span className="sidebar-status">ONLINE</span>
          <button 
            className={`sidebar-settings-btn ${openaiKey ? 'configured' : ''}`}
            onClick={() => setShowApiSettings(true)}
            onMouseEnter={playHoverSound}
            title={openaiKey ? 'API Key Configured' : 'Configure OpenAI API Key'}
          >
            <Settings size={14} />
          </button>
        </div>
        
        <div className="sidebar-content">
          <div className="ai-chat-window">
              <div className={`ai-accordion ${logisticsSeverity || 'info'}`}>
                <div 
                  className="ai-accordion-header"
                  onClick={() => setAccordionLogistics(!accordionLogistics)}
                >
                  <ChevronDown 
                    size={14} 
                    className={`ai-accordion-chevron ${accordionLogistics ? 'expanded' : ''}`}
                  />
                  <span className="msg-tag">[LOGISTICS_SCAN]</span>
                  {logisticsSeverity === 'critical' && <span className="severity-badge critical">!</span>}
                  {logisticsSeverity === 'warning' && <span className="severity-badge warning">!</span>}
                </div>
                {accordionLogistics && (
                  <div className="ai-accordion-content">
                    {hasSuggestions ? (
                      <div className="suggestion-tree">
                        {hardwareWarnings.length > 0 && (
                          <div className="suggestion-caliber-block" style={{ borderColor: 'var(--accent-red)' }}>
                            <div className="suggestion-caliber-title" style={{ color: 'var(--accent-red)' }}>Hardware Alert</div>
                            <ul className="suggestion-list">
                              {hardwareWarnings.map((war, hi) => (
                                <li 
                                  key={hi} 
                                  className={war.type}
                                  onClick={() => {
                                    if (war.instanceId) {
                                      setWeaponFilterId(weaponFilterId === war.instanceId ? null : war.instanceId);
                                      playZipperSound();
                                    }
                                  }}
                                  style={{ cursor: 'pointer' }}
                                >
                                  <div className="suggestion-main-line">{war.text}</div>
                                  {war.subMessages.length > 0 && (
                                    <ul className="suggestion-sub-list">
                                      {war.subMessages.map((sub, si) => (
                                        <li key={si}>{sub}</li>
                                      ))}
                                    </ul>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {Object.entries(caliberGroups).map(([calId, calGroup]) => (
                          <div key={calId} className="suggestion-caliber-block">
                            <div className="suggestion-caliber-title" onClick={() => setGlobalSearch(calGroup.name)}>{calGroup.name}</div>
                            <ul className="suggestion-list">
                              {Object.entries(calGroup.variants).map(([vId, vGroup]) => (
                                <li 
                                  key={vId} 
                                  className={vGroup.mainMessage.type}
                                  onClick={() => {
                                    setGlobalSearch(vGroup.name);
                                    if (vGroup.mainMessage.type === 'info') setViewMode('graph');
                                    playZipperSound();
                                  }}
                                >
                                  <div className="suggestion-main-line">{vGroup.mainMessage.text}</div>
                                  {vGroup.subMessages.length > 0 && (
                                    <ul className="suggestion-sub-list">
                                      {vGroup.subMessages.map((sub, si) => (
                                        <li key={si}>{sub}</li>
                                      ))}
                                    </ul>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>All supply lines reported within tactical parameters. No critical shortages detected in the Zone.</p>
                    )}
                  </div>
                )}
              </div>
              
              <div className="ai-accordion assistant">
                <div 
                  className="ai-accordion-header"
                  onClick={() => setAccordionAssistant(!accordionAssistant)}
                >
                  <ChevronDown 
                    size={14} 
                    className={`ai-accordion-chevron ${accordionAssistant ? 'expanded' : ''}`}
                  />
                  <span className="msg-tag">[AI_ASSISTANT]</span>
                </div>
                {accordionAssistant && (
                  <div className="ai-accordion-content">
                    <p>Welcome back, Stalker. I am monitoring your caches in real-time. Upload an inventory screenshot or paste from clipboard to scan your ammunition.</p>
                  </div>
                )}
              </div>

{chatMessages.map(msg => (
                <div key={msg.id} className={`ai-message ${msg.type}`}>
                  <span className="msg-tag">[{msg.type === 'user-image' ? 'SCREENSHOT' : msg.type === 'ai-error' ? 'ERROR' : msg.type === 'system' ? 'APPLIED' : 'DETECTION'}]</span>
                  
                  {msg.type === 'user-image' && msg.image && (
                    <div 
                      className="chat-image-preview"
                      onClick={() => setExpandedImage(msg.image!)}
                    >
                      <img src={msg.image} alt="Uploaded screenshot" />
                      <div className="image-zoom-overlay">
                        <Eye size={24} />
                        <span>Zoom</span>
                      </div>
                    </div>
                  )}
                  
                  {msg.type === 'ai-error' && (
                    <p className="error-text">{msg.content}</p>
                  )}
                  
                  {msg.type === 'system' && (
                    <p className="success-text">{msg.content}</p>
                  )}
                  
                  {msg.type === 'ai-result' && msg.items && (
                    <>
                      <p>{msg.content}</p>
                      {msg.notes && <p className="detection-notes">{msg.notes}</p>}
                      <div className="detected-items-list">
                        {msg.items.map((item, idx) => {
                          const variant = item.matchedId ? getVariantById(item.matchedId) : null;
                          const boxSize = variant?.boxSize || 10;
                          return (
                            <div key={idx} className={`detected-item-row ${!item.matchedId ? 'unmatched' : ''}`}>
                              <div className="detected-item-image">
                                {variant?.imageUrl ? (
                                  <img src={variant.imageUrl} alt="" />
                                ) : (
                                  <div className="detected-item-placeholder">
                                    <span>?</span>
                                  </div>
                                )}
                              </div>
                              <div className="detected-item-right">
                                <div className="detected-item-header">
                                  <div className="detected-item-name">
                                    {variant?.name || item.rawName}
                                    {!item.matchedId && <span className="unmatched-badge">UNMATCHED</span>}
                                  </div>
                                  <div className="detected-item-location">
                                    {item.location === 'inventory' ? 'Backpack' : item.location === 'loot' ? 'Loot' : 'Unknown'}
                                  </div>
                                </div>
                                <div className="detected-item-controls">
                                  <div className="detected-qty-wrapper">
                                    <input
                                      type="number"
                                      className="detected-qty-input"
                                      value={item.count}
                                      onChange={(e) => updateDetectedItemCount(msg.id, idx, parseInt(e.target.value) || 0)}
                                    />
                                    <div className="detected-spinner-col">
                                      <button 
                                        className="btn-detected-qty"
                                        onClick={() => updateDetectedItemCount(msg.id, idx, item.count + boxSize)}
                                        onMouseEnter={playHoverSound}
                                      >
                                        <Plus size={10} />
                                      </button>
                                      <button 
                                        className="btn-detected-qty"
                                        onClick={() => updateDetectedItemCount(msg.id, idx, item.count - boxSize)}
                                        onMouseEnter={playHoverSound}
                                      >
                                        <Minus size={10} />
                                      </button>
                                    </div>
                                  </div>
                                  <button 
                                    className="btn-detected-remove"
                                    onClick={() => removeDetectedItem(msg.id, idx)}
                                    onMouseEnter={playHoverSound}
                                    title="Remove item"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {msg.items.length === 0 && (
                        <p className="no-items-msg">All items removed. Upload a new screenshot to scan again.</p>
                      )}
                      {msg.items.length > 0 && (
                        <div className="apply-actions">
                          <button 
                            className="btn-apply"
                            onClick={() => {
                              playAmmoSound();
                              const appliedCount = msg.items!.length;
                              const totalCount = msg.items!.reduce((sum, item) => sum + item.count, 0);
                              applyDetectedItems(msg.items!, 'inventory');
                              setChatMessages(prev => prev.map(m => 
                                m.id === msg.id 
                                  ? { ...m, type: 'system', content: `✓ Applied ${appliedCount} ammo types (${totalCount} rounds) to Backpack`, items: undefined }
                                  : m
                              ));
                            }}
                            onMouseEnter={playHoverSound}
                          >
                            Apply to Backpack
                          </button>
                          <button 
                            className="btn-apply stash"
                            onClick={() => {
                              playAmmoSound();
                              const appliedCount = msg.items!.length;
                              const totalCount = msg.items!.reduce((sum, item) => sum + item.count, 0);
                              applyDetectedItems(msg.items!, 'stash');
                              setChatMessages(prev => prev.map(m => 
                                m.id === msg.id 
                                  ? { ...m, type: 'system', content: `✓ Applied ${appliedCount} ammo types (${totalCount} rounds) to Loot`, items: undefined }
                                  : m
                              ));
                            }}
                            onMouseEnter={playHoverSound}
                          >
                            Apply to Loot
                          </button>
                          <button 
                            className="btn-apply both"
                            onClick={() => {
                              playAmmoSound();
                              const appliedCount = msg.items!.length;
                              const totalCount = msg.items!.reduce((sum, item) => sum + item.count, 0);
                              const lootItems = msg.items!.filter(i => i.location === 'loot');
                              const invItems = msg.items!.filter(i => i.location !== 'loot');
                              if (lootItems.length > 0) applyDetectedItems(lootItems, 'stash');
                              if (invItems.length > 0) applyDetectedItems(invItems, 'inventory');
                              setChatMessages(prev => prev.map(m => 
                                m.id === msg.id 
                                  ? { ...m, type: 'system', content: `✓ Applied ${appliedCount} ammo types (${totalCount} rounds) auto-detected`, items: undefined }
                                  : m
                              ));
                            }}
                            onMouseEnter={playHoverSound}
                          >
                            Auto-Detect
                          </button>
                        </div>
                      )}
                    </>
                  )}
               </div>
             ))}

             {isProcessing && (
               <div className="ai-message processing">
                 <span className="msg-tag">[PROCESSING]</span>
                 <div className="processing-indicator">
                   <Loader2 className="spin" size={16} />
                   <span>Analyzing screenshot...</span>
                 </div>
               </div>
             )}
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="ai-input-wrapper">
            <input 
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
                e.target.value = '';
              }}
            />
            <button 
              className="btn-upload-image"
              onClick={() => fileInputRef.current?.click()}
              onMouseEnter={playHoverSound}
              disabled={isProcessing}
              title="Upload inventory screenshot"
            >
              <ImagePlus size={16} />
            </button>
            <input 
              type="text" 
              className="ai-chat-input" 
              placeholder="Ask Kuznetsov..."
              value={aiChatInput}
              onChange={(e) => setAiChatInput(e.target.value)}
            />
            <button className="btn-ai-send" disabled>
              <ArrowRight size={14} />
            </button>
          </div>
          <div className="upload-hint">
            {openaiKey ? 'Paste or upload screenshot' : 'Configure API key to enable scan'}
          </div>
        </div>

{isDragOver && (
          <div className="drag-overlay">
            <Camera size={48} />
            <span>Drop screenshot to scan</span>
          </div>
        )}
      </aside>
    );
  };

  const renderExpandedImage = () => {
    if (!expandedImage) return null;
    return (
      <div className="expanded-image-overlay" onClick={() => setExpandedImage(null)}>
        <div className="expanded-backdrop" />
        <div className="expanded-image-panel" onClick={(e) => e.stopPropagation()}>
          <button 
            className="btn-close-expanded"
            onClick={() => setExpandedImage(null)}
            onMouseEnter={playHoverSound}
          >
            <X size={18} />
          </button>
          <img src={expandedImage} alt="Expanded screenshot" />
        </div>
      </div>
    );
  };

  if (!mounted) return <div className="stalker-container">Initializing System...</div>;

  const renderAmmoSlot = (variant: AmmoVariant, section: 'inventory' | 'stash') => {
    const state = data[variant.id] || { inventory: 0, stash: 0, inventoryThreshold: 0, stashThreshold: 0 };
    const count = state[section];
    const isInventory = section === 'inventory';
    const thresholdField = isInventory ? 'inventoryThreshold' : 'stashThreshold';
    const isBelowThreshold = count < (state[thresholdField] || 0);
    const isHighlighted = hoveredAmmoId === variant.id;
    const isActive = activeAmmoId === variant.id;
    const isWeaponCompatible = !!hoveredWeaponName && carriedWeapons.some(hw => {
      if (hw.instanceId !== hoveredWeaponName) return false;
      if (hw.ammoFilter) return hw.ammoFilter.includes(variant.id);
      return variant.compatibleWeapons?.some(cw => cw.replace(' (Mod)', '') === hw.name);
    });

    const typeClass = (variant.id === '762x54_7n1' || variant.type === 'Sniper' || variant.type === 'Match') ? 'type-purple' : 
                     (variant.type === 'AP' || variant.id === '9x19_p') ? 'type-green' : '';
    
    return (
      <div 
        key={variant.id} 
        className={`ammo-slot ${isBelowThreshold ? 'status-warning' : ''} ${isHighlighted ? 'is-highlighted' : ''} ${isActive ? 'is-active' : ''} ${isWeaponCompatible ? 'is-weapon-compatible' : ''} ${typeClass}`}
        onMouseEnter={() => {
          setHoveredAmmoId(variant.id);
          playHoverSound();
        }}
        onMouseLeave={() => setHoveredAmmoId(null)}
        onClick={(e) => {
          e.stopPropagation();
          setActiveAmmoId(isActive ? null : variant.id);
        }}
      >
        {variant.imageUrl && (
          <img src={variant.imageUrl} alt={variant.name} className="ammo-slot-img" />
        )}
        <div className="ammo-name-label">{variant.name}</div>
        <div 
          className="ammo-qty-badge" 
          style={{ 
            color: hoveringWarningId === variant.id ? (isBelowThreshold ? 'var(--accent-red)' : 'var(--accent-amber)') : '',
            cursor: 'help'
          }}
          onMouseEnter={() => setHoveringWarningId(variant.id)}
          onMouseLeave={() => setHoveringWarningId(null)}
        >
          {isBelowThreshold && <WarningIcon size={12} />}
          {hoveringWarningId === variant.id ? `> ${state[thresholdField]}` : count}
        </div>
        
{/* CLICK-TO-TOGGLE OVERLAY */}
        <div className="ammo-slot-tooltip" onClick={(e) => e.stopPropagation()}>
          {isActive && (
            <>
              <div className="tooltip-header">
                <div className="tooltip-name">{variant.name}</div>
                <button 
                  className={`btn-tooltip settings ${editingThreshold === variant.id ? 'active' : ''}`}
                  onMouseEnter={playHoverSound}
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingThreshold(editingThreshold === variant.id ? null : variant.id);
                  }}
                  title={editingThreshold === variant.id ? 'Back to Quantity' : 'Set Warning Threshold'}
                >
                  {editingThreshold === variant.id ? <ArrowLeft size={11} /> : <Settings size={11} />}
                </button>
              </div>
              
              {editingThreshold === variant.id ? (
                <div className="tooltip-threshold-edit">
                  <div className="tooltip-row-label danger">WARN THRESHOLD</div>
                  <div className="qty-input-wrapper threshold">
                    <input
                      type="number"
                      className="qty-input-main red"
                      value={state[thresholdField]}
                      onChange={(e) => updateField(variant.id, thresholdField, parseInt(e.target.value) || 0)}
                      onKeyDown={(e) => e.key === 'Enter' && setEditingThreshold(null)}
                      autoFocus
                    />
                    <div className="qty-spinner-col">
                      <button className="btn-qty-adj up" onMouseEnter={playHoverSound} onClick={(e) => {
                        e.stopPropagation();
                        updateField(variant.id, thresholdField, (state[thresholdField] || 1) + variant.boxSize);
                      }}>
                        <Plus size={10} />
                      </button>
                      <button className="btn-qty-adj down" onMouseEnter={playHoverSound} onClick={(e) => {
                        e.stopPropagation();
                        updateField(variant.id, thresholdField, (state[thresholdField] || 1) - variant.boxSize);
                      }}>
                        <Minus size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="tooltip-body">
                  {isInventory ? (
                    <>
                      <div className="tooltip-column left">
                        <button className="btn-tooltip transfer" onMouseEnter={playHoverSound} onClick={(e) => {
                          e.stopPropagation();
                          moveAmmo(variant.id, 'inventory', 'stash', 1);
                        }} title="Transfer 1 to Loot">
                          <span className="transfer-dot">.</span>
                        </button>
                        <button className="btn-tooltip transfer" onMouseEnter={playHoverSound} onClick={(e) => {
                          e.stopPropagation();
                          moveAmmo(variant.id, 'inventory', 'stash', variant.boxSize);
                        }} title={`Transfer ${variant.boxSize} to Loot`}>
                          <span className="transfer-dots">...</span>
                        </button>
                      </div>
                      <div className="tooltip-divider"></div>
                      <div className="tooltip-column right">
                        <div className="qty-input-wrapper">
                          <input
                            type="number"
                            className="qty-input-main"
                            value={count}
                            onChange={(e) => updateField(variant.id, section, parseInt(e.target.value) || 0)}
                            onKeyDown={(e) => e.key === 'Enter' && setActiveAmmoId(null)}
                          />
                          <div className="qty-spinner-col">
                            <button className="btn-qty-adj up" onMouseEnter={playHoverSound} onClick={(e) => {
                              e.stopPropagation();
                              updateField(variant.id, section, count + variant.boxSize);
                            }}>
                              <Plus size={10} />
                            </button>
                            <button className="btn-qty-adj down" onMouseEnter={playHoverSound} onClick={(e) => {
                              e.stopPropagation();
                              updateField(variant.id, section, count - variant.boxSize);
                            }}>
                              <Minus size={10} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="tooltip-column left">
                        <div className="qty-input-wrapper">
                          <input
                            type="number"
                            className="qty-input-main"
                            value={count}
                            onChange={(e) => updateField(variant.id, section, parseInt(e.target.value) || 0)}
                            onKeyDown={(e) => e.key === 'Enter' && setActiveAmmoId(null)}
                          />
                          <div className="qty-spinner-col">
                            <button className="btn-qty-adj up" onMouseEnter={playHoverSound} onClick={(e) => {
                              e.stopPropagation();
                              updateField(variant.id, section, count + variant.boxSize);
                            }}>
                              <Plus size={10} />
                            </button>
                            <button className="btn-qty-adj down" onMouseEnter={playHoverSound} onClick={(e) => {
                              e.stopPropagation();
                              updateField(variant.id, section, count - variant.boxSize);
                            }}>
                              <Minus size={10} />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="tooltip-divider"></div>
                      <div className="tooltip-column right">
                        <button className="btn-tooltip transfer" onMouseEnter={playHoverSound} onClick={(e) => {
                          e.stopPropagation();
                          moveAmmo(variant.id, 'stash', 'inventory', 1);
                        }} title="Transfer 1 to Backpack">
                          <span className="transfer-dot">.</span>
                        </button>
                        <button className="btn-tooltip transfer" onMouseEnter={playHoverSound} onClick={(e) => {
                          e.stopPropagation();
                          moveAmmo(variant.id, 'stash', 'inventory', variant.boxSize);
                        }} title={`Transfer ${variant.boxSize} to Backpack`}>
                          <span className="transfer-dots">...</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  const renderGraphicalView = (section: 'inventory' | 'stash', searchQuery: string) => {
    const searchLower = searchQuery.toLowerCase();
    const globalLower = globalSearch.toLowerCase();
    
    return (
      <div className="graph-container">
        {STALKER_AMMO_DATA.map(caliber => {
          const matchingVariants = caliber.variants.filter(v => {
            const matchesGlobal = fuzzyMatch(v.name, globalSearch) || fuzzyMatch(caliber.name, globalSearch);
            const matchesLocal = fuzzyMatch(v.name, searchQuery) || fuzzyMatch(caliber.name, searchQuery);
            const matchesWeapon = !weaponFilterId || checkCompatibility(v.id, weaponFilterId);
            
            if (!matchesGlobal || !matchesLocal || !matchesWeapon) return false;

            const state = data[v.id];
            return state && state[section] > 0;
          });

          if (matchingVariants.length === 0) return null;

          return (
            <div key={caliber.id} className="graph-section">
              <div className="modal-caliber-label">{caliber.name}</div>
              <div className="graph-list">
                {matchingVariants.map(v => {
                  const state = data[v.id] || { inventory: 0, stash: 0, inventoryThreshold: 60, stashThreshold: 500 };
                  const count = state[section];
                  const threshField = section === 'inventory' ? 'inventoryThreshold' : 'stashThreshold';
                  const threshold = state[threshField] || 0;
                  
                  const isInventory = section === 'inventory';
                  const isActive = activeAmmoId === v.id;
                  const isEditingThresh = editingThreshold === v.id;

                  // Calculate percentage for bar
                  const maxDisplay = Math.max(threshold * 1.5, count, 100);
                  const qtyPercent = (count / maxDisplay) * 100;
                  const threshPercent = (threshold / maxDisplay) * 100;
                  const isWarning = count < threshold;

                  return (
                    <div 
                      key={v.id} 
                      className={`graph-row ${isActive ? 'is-active' : ''}`} 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveAmmoId(isActive ? null : v.id);
                      }}
                    >
                      <div className="graph-item-info">
                        <div className="graph-item-main">
                          {v.imageUrl && (
                            <div className="graph-item-thumb-container">
                              <img src={v.imageUrl} alt="" className="graph-item-thumb" />
                            </div>
                          )}
                          <span className="graph-item-name">{v.name}</span>
                        </div>
                        <div className="graph-item-stat-block">
                          <span className={`graph-item-qty ${isWarning ? 'warning' : ''}`}>
                            {count} <span className="qty-divider">/</span> <span className="qty-thresh">{threshold}</span>
                          </span>
                        </div>
                      </div>
                      <div className="graph-bar-track">
                        <div 
                          className={`graph-bar-fill ${isWarning ? 'warning' : ''}`} 
                          style={{ width: `${Math.min(100, qtyPercent)}%` }}
                        />
                        {threshold > 0 && (
                          <div 
                            className="graph-threshold-line" 
                            style={{ left: `${Math.min(99, threshPercent)}%` }}
                          />
                        )}
                      </div>

                      {isActive && (
                        <div className="graph-row-actions" onClick={(e) => e.stopPropagation()}>
                           {isEditingThresh ? (
                             <div className="graph-inline-edit">
                               <button className="btn-qty-adj" onClick={() => updateField(v.id, threshField, threshold - v.boxSize)}>
                                 <Minus size={10} />
                               </button>
                               <div className="tooltip-input-wrapper threshold">
                                 <FocusedInput 
                                   type="number" 
                                   className="tooltip-input red"
                                   forceFocus={true}
                                   value={threshold} 
                                   onChange={(e) => updateField(v.id, threshField, parseInt(e.target.value) || 0)}
                                   onKeyDown={(e) => e.key === 'Enter' && setEditingThreshold(null)}
                                 />
                               </div>
                               <button className="btn-qty-adj" onClick={() => updateField(v.id, threshField, threshold + v.boxSize)}>
                                 <Plus size={10} />
                               </button>
                               <button className="btn-graph-action active" onClick={() => setEditingThreshold(null)}>
                                 DONE
                               </button>
                             </div>
                           ) : (
                             <div className="graph-action-buttons">
                               <button className="btn-graph-action" onClick={() => moveAmmo(v.id, section, isInventory ? 'stash' : 'inventory', v.boxSize)}>
                                 {isInventory ? <ArrowLeft size={10} /> : <ArrowRight size={10} />}
                                 TRANSFER {v.boxSize}
                               </button>
                               <button className="btn-graph-action" onClick={() => setEditingThreshold(v.id)}>
                                 <Settings size={10} />
                                 THRESHOLD
                               </button>
                             </div>
                           )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="stalker-container" onClick={() => setActiveAmmoId(null)}>
      <header className={`stalker-header ${isShowcase && showcaseTarget === 'header' ? 'tutorial-spotlight' : ''}`}>
        <div className="header-top">
            <div className="stalker-branding">
              <h1 className="stalker-title">Zone-Net <span>Munitions</span></h1>
              <div className="stalker-subtitle">Tactical Asset Management &rlm; &middot; V4.2.1</div>
            </div>
            {!audioUnlocked && (
              <button 
                className="btn-sound-check warning-pulse" 
                onClick={handleSoundCheck}
                title="Unlock tactical audio feedback"
              >
                UNMUTE PDA
              </button>
            )}
            {audioUnlocked && <div className="sound-active-pda">PDA VOICE ACTIVE</div>}
          <div className="header-controls">
            <div className="header-search-wrapper">
              <input 
                type="text" 
                className="header-search-input" 
                placeholder="Global Scan..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
              />
              {globalSearch && (
                <button 
                  className="btn-search-clear" 
                  onClick={() => setGlobalSearch('')}
                  onMouseEnter={playHoverSound}
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
            <button 
              className={`btn-showcase-toggle ${isShowcase ? 'active' : ''}`}
              onClick={isShowcase ? endShowcase : startShowcase}
              onMouseEnter={playHoverSound}
            >
              {isShowcase ? 'EXIT SHOWCASE' : 'SHOWCASE'}
            </button>
            <div className="view-toggle-group">
              <button 
                className={`btn-toggle ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                onMouseEnter={playHoverSound}
                title="Grid View"
              >
                <LayoutGrid size={16} />
              </button>
              <button 
                className={`btn-toggle ${viewMode === 'graph' ? 'active' : ''}`}
                onClick={() => setViewMode('graph')}
                onMouseEnter={playHoverSound}
                title="Graphical View"
              >
                <BarChart3 size={16} />
              </button>
            </div>
            <button 
              className="btn-purge" 
              onClick={purgeData}
              onMouseEnter={playHoverSound}
            >
              <Trash2 size={13} /> TERMINATE DATA
            </button>
          </div>
        </div>
      </header>

      <div className="main-layout-container">
        <div className="dual-panel-grid">
        {/* STASH PANEL */}
        <div className={`panel stash-panel ${isShowcase && showcaseTarget === 'stash' ? 'tutorial-spotlight' : ''}`}>
          <div className="panel-header">
            <div className="panel-header-top">
              <h2 className="panel-title">Loot</h2>
              <span className="panel-meta">(SAFE HOUSE STASH)</span>
            </div>
            
            <div className="panel-header-actions">
              <button 
                className="btn-header-action stash" 
                onClick={() => setQuickAddTarget('stash')}
                onMouseEnter={playHoverSound}
                title="Quick Add to Stash"
              >
                <Plus size={14} /> <span>QUICK ADD</span>
              </button>

              <div className="panel-search-wrapper">
                <input 
                  type="text" 
                  className="panel-search-input" 
                  placeholder="Filter Stash..."
                  value={stashSearch}
                  onChange={(e) => setStashSearch(e.target.value)}
                />
                {stashSearch && (
                  <button 
                    className="btn-search-clear" 
                    onClick={() => setStashSearch('')}
                    onMouseEnter={playHoverSound}
                  >
                    <Trash2 size={10} />
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="panel-content">
            {viewMode === 'grid' ? (
              STALKER_AMMO_DATA.map(caliber => {
                const searchLower = stashSearch.toLowerCase();
                const globalLower = globalSearch.toLowerCase();

                const filteredVariants = caliber.variants.filter(v => {
                  const hasStock = (data[v.id]?.stash || 0) > 0;
                  const matchesGlobal = fuzzyMatch(v.name, globalSearch) || fuzzyMatch(caliber.name, globalSearch);
                  const matchesLocal = fuzzyMatch(v.name, stashSearch) || fuzzyMatch(caliber.name, stashSearch);
                  const matchesWeapon = !weaponFilterId || checkCompatibility(v.id, weaponFilterId);
                  return hasStock && matchesGlobal && matchesLocal && matchesWeapon;
                });

                if (filteredVariants.length === 0) return null;

                const calStats = getCaliberStats(caliber.id);
                const sectionThresh = calStats.stashThreshold || 0;
                const isCaliberLow = calStats.stash < sectionThresh;

                return (
                  <div key={caliber.id} className="caliber-group">
                    <div className="caliber-header">
                      <h3 className="caliber-label">{caliber.name}</h3>
                      <div className={`caliber-summary ${isCaliberLow ? 'warning' : ''}`}>
                        {isCaliberLow && <WarningIcon size={12} />}
                        <span className="summary-total">{calStats.stash}</span>
                        <span className="summary-divider">/</span>
                        {editingThreshold === `cal_${caliber.id}_stash` ? (
                          <FocusedInput 
                            forceFocus
                            type="number"
                            className="caliber-thresh-input"
                            value={sectionThresh}
                            onChange={(e) => updateCaliberThreshold(caliber.id, 'stash', parseInt(e.target.value) || 0)}
                            onBlur={() => setEditingThreshold(null)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingThreshold(null)}
                          />
                        ) : (
                          <span 
                            className="summary-thresh"
                            onMouseEnter={playHoverSound}
                            onClick={() => {
                              setEditingThreshold(`cal_${caliber.id}_stash`);
                            }}
                          >
                            {sectionThresh || 'SET'}
                          </span>
                        )}
                        <span className="summary-unit">TOTAL</span>
                      </div>
                    </div>
                    <div className="ammo-grid">
                      {filteredVariants.map(v => renderAmmoSlot(v, 'stash'))}
                    </div>
                  </div>
                );
              })
            ) : (
              renderGraphicalView('stash', stashSearch)
            )}
            {stashRounds === 0 && (
              <div className="inventory-empty-msg">
                Stockpile empty. No munitions recorded in Loot.
              </div>
            )}
          </div>
        </div>

        {/* INVENTORY PANEL */}
        <div className={`panel inventory-panel ${isShowcase && showcaseTarget === 'inventory' ? 'tutorial-spotlight' : ''}`}>
          <div className="panel-header">
            <div className="panel-header-top">
              <h2 className="panel-title">Inventory</h2>
              <span className="panel-meta">(BACKPACK)</span>
            </div>

            <div className="panel-header-actions">
              <button 
                className="btn-header-action" 
                onClick={() => setQuickAddTarget('inventory')}
                onMouseEnter={playHoverSound}
                title="Quick Add to Backpack"
              >
                <Plus size={14} /> <span>QUICK ADD</span>
              </button>

              <div className="panel-search-wrapper">
                <input 
                  type="text" 
                  className="panel-search-input" 
                  placeholder="Filter Backpack..."
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                />
                {inventorySearch && (
                  <button 
                    className="btn-search-clear" 
                    onClick={() => setInventorySearch('')}
                    onMouseEnter={playHoverSound}
                  >
                    <Trash2 size={10} />
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="panel-content">
            {viewMode === 'grid' ? (
              STALKER_AMMO_DATA.map(caliber => {
                const searchLower = inventorySearch.toLowerCase();
                const globalLower = globalSearch.toLowerCase();

                const activeVariants = caliber.variants.filter(v => {
                  const hasStock = (data[v.id]?.inventory || 0) > 0;
                  const matchesGlobal = fuzzyMatch(v.name, globalSearch) || fuzzyMatch(caliber.name, globalSearch);
                  const matchesLocal = fuzzyMatch(v.name, inventorySearch) || fuzzyMatch(caliber.name, inventorySearch);
                  const matchesWeapon = !weaponFilterId || checkCompatibility(v.id, weaponFilterId);
                  return hasStock && matchesGlobal && matchesLocal && matchesWeapon;
                });

                if (activeVariants.length === 0) return null;
                const calStats = getCaliberStats(caliber.id);
                const sectionThresh = calStats.inventoryThreshold || 0;
                const isCaliberLow = calStats.inventory < sectionThresh;

                return (
                  <div key={caliber.id} className="caliber-group">
                    <div className="caliber-header">
                      <h3 className="caliber-label">{caliber.name}</h3>
                      <div className={`caliber-summary ${isCaliberLow ? 'warning' : ''}`}>
                        {isCaliberLow && <WarningIcon size={12} />}
                        <span className="summary-total">{calStats.inventory}</span>
                        <span className="summary-divider">/</span>
                        {editingThreshold === `cal_${caliber.id}_inv` ? (
                          <FocusedInput 
                            forceFocus
                            type="number"
                            className="caliber-thresh-input"
                            value={sectionThresh}
                            onChange={(e) => updateCaliberThreshold(caliber.id, 'inventory', parseInt(e.target.value) || 0)}
                            onBlur={() => setEditingThreshold(null)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingThreshold(null)}
                          />
                        ) : (
                          <span 
                            className="summary-thresh"
                            onMouseEnter={playHoverSound}
                            onClick={() => {
                              setEditingThreshold(`cal_${caliber.id}_inv`);
                            }}
                          >
                            {sectionThresh || 'SET'}
                          </span>
                        )}
                        <span className="summary-unit">TOTAL</span>
                      </div>
                    </div>
                    <div className="ammo-grid">
                      {activeVariants.map(v => renderAmmoSlot(v, 'inventory'))}
                    </div>
                  </div>
                );
              })
            ) : (
              renderGraphicalView('inventory', inventorySearch)
            )}
            {totalRounds === 0 && (
              <div className="inventory-empty-msg">
                Combat gear empty. Record inventory levels.
              </div>
            )}
          </div>

          {/* FIXED WEAPONS SECTION */}
          <div className={`weapons-section sticky-footer ${isShowcase && showcaseTarget === 'weapons' ? 'tutorial-spotlight' : ''}`}>
            <div className="section-header">
              <h4 className="section-label">Carrying Weapons</h4>
              <div className="weapon-selector-wrap">
                <input 
                  type="text"
                  className="weapon-select-input"
                  placeholder="+ EQUIP HARDWARE..."
                  value={weaponSearch}
                  onChange={(e) => {
                    setWeaponSearch(e.target.value);
                    setWeaponSelectedIndex(0); // Reset selection when search changes
                  }}
                  onKeyDown={(e) => {
                    const showManual = !ALL_WEAPONS.some(w => w.toLowerCase() === weaponSearch.toLowerCase()) && !carriedWeapons.some(cw => cw.name === weaponSearch.toUpperCase());
                    const totalItems = filteredWeapons.length + (showManual ? 1 : 0);

                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setWeaponSelectedIndex(prev => (prev + 1) % totalItems);
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setWeaponSelectedIndex(prev => (prev - 1 + totalItems) % totalItems);
                    } else if (e.key === 'Enter' && weaponSearch) {
                      if (weaponSelectedIndex < filteredWeapons.length) {
                        addWeapon(filteredWeapons[weaponSelectedIndex]);
                      } else if (showManual) {
                        addWeapon(weaponSearch.toUpperCase());
                      }
                      setWeaponSearch(''); // Clear search after selection
                      setWeaponSelectedIndex(0); // Reset selection
                    }
                  }}
                />
                {weaponSearch && (
                  <div className="weapon-results-popover">
                    {filteredWeapons.map((w, idx) => (
                      <div key={w} className={`weapon-result-item ${idx === weaponSelectedIndex ? 'is-selected' : ''}`} 
                        onMouseEnter={playHoverSound}
                        onClick={() => addWeapon(w)}
                      >
                        {w}
                      </div>
                    ))}
                    {/* Allow manual entry */}
                    {!ALL_WEAPONS.some(w => w.toLowerCase() === weaponSearch.toLowerCase()) && !carriedWeapons.some(cw => cw.name === weaponSearch.toUpperCase()) && (
                       <div className={`weapon-result-item manual-add ${weaponSelectedIndex === filteredWeapons.length ? 'is-selected' : ''}`} 
                         onMouseEnter={playHoverSound}
                         onClick={() => addWeapon(weaponSearch.toUpperCase())}
                       >
                         + REGISTER "{weaponSearch.toUpperCase()}"
                       </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="equipped-weapons-list">
              {carriedWeapons.map(hw => {
                const isAmmoCompatible = hoveredAmmoCompatibleWeapons.includes(hw.instanceId);
                const isActiveFilter = weaponFilterId === hw.instanceId;
                
                const totalInvRoundsForHw = allVariants.reduce((sum, v) => {
                  return sum + (checkCompatibility(v.id, hw.instanceId) ? (data[v.id]?.inventory || 0) : 0);
                }, 0);
                const isUnderThreshold = hw.minRounds && totalInvRoundsForHw < hw.minRounds;

                return (
                  <div 
                    key={hw.instanceId} 
                    className={`equipped-weapon-card ${confirmingDeleteWeapon === hw.instanceId ? 'is-confirming' : ''} ${isAmmoCompatible ? 'is-ammo-compatible' : ''} ${isActiveFilter ? 'is-active-filter' : ''}`}
                    onMouseEnter={() => {
                      setHoveredWeaponName(hw.instanceId);
                      playHoverSound();
                    }}
                    onMouseLeave={() => setHoveredWeaponName(null)}
                    onClick={() => {
                      setWeaponFilterId(isActiveFilter ? null : hw.instanceId);
                      playZipperSound();
                    }}
                  >
                    <div className="weapon-card-main">
                      <span className="weapon-name">
                        {hw.name}
                        {hw.ammoFilter && <span className="calib-tag">MOD</span>}
                      </span>
                      <div className={`weapon-supply-status ${isUnderThreshold ? 'warning' : ''}`}>
                         <span className="supply-count">{totalInvRoundsForHw}</span>
                         {hw.minRounds && <span className="supply-thresh">/ {hw.minRounds}</span>}
                      </div>
                    </div>
                    <div className="weapon-actions">
                      <button 
                        className="btn-calib-weapon"
                        onMouseEnter={playHoverSound}
                        onClick={(e) => {
                          e.stopPropagation();
                          playBoxSound();
                          setCalibratingWeaponId(hw.instanceId);
                        }}
                        title="Calibrate Ammo Compatibility"
                      >
                        <Settings size={10} />
                      </button>
                      {confirmingDeleteWeapon === hw.instanceId ? (
                        <div className="delete-confirm-wrap">
                          <button 
                            className="btn-confirm-delete" 
                            onClick={(e) => {
                              e.stopPropagation();
                              removeWeapon(hw.instanceId);
                            }}
                            onMouseLeave={() => setConfirmingDeleteWeapon(null)}
                          >
                            UN-EQUIP
                          </button>
                        </div>
                      ) : (
                        <button 
                          className="btn-remove-weapon" 
                          onMouseEnter={playHoverSound}
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmingDeleteWeapon(hw.instanceId);
                          }}
                        >
                          <Trash2 size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {carriedWeapons.length === 0 && (
                <div className="no-hardware-msg">No primary or secondary arms registered.</div>
              )}
            </div>
          </div>
        </div>
        </div>
        {renderAiSidebar()}
      </div>

      {/* QUICK ADD MODAL */}
      {quickAddTarget && (
        <div className="quick-add-overlay" onClick={() => setQuickAddTarget(null)}>
          <div className="quick-add-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-main">
                <h2 className="modal-title">
                  {quickAddTarget === 'inventory' ? 'Backpack manifest' : 'Safe House Stockpile'}
                </h2>
                <div className="modal-search-wrapper">
                  <input 
                    type="text" 
                    className="modal-search-input" 
                    placeholder="Search caliber / ammo..."
                    ref={modalSearchRef}
                    value={quickAddSearch}
                    onChange={(e) => setQuickAddSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && setQuickAddTarget(null)}
                    autoFocus
                  />
                  {quickAddSearch && (
                    <button 
                      className="btn-modal-search-clear" 
                      onClick={() => setQuickAddSearch('')}
                      onMouseEnter={playHoverSound}
                      title="Clear Search"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
              <button 
                className="btn-close-modal" 
                onClick={() => setQuickAddTarget(null)}
                onMouseEnter={playHoverSound}
              >
                &times;
              </button>
            </div>
            <div className="modal-list">
              {STALKER_AMMO_DATA.map(caliber => {
                const filteredVariants = caliber.variants.filter(v => 
                  fuzzyMatch(v.name, quickAddSearch) || 
                  fuzzyMatch(caliber.name, quickAddSearch)
                );
                
                if (filteredVariants.length === 0) return null;

                return (
                  <div key={caliber.id} className="modal-section">
                    <div className="modal-caliber-label">{caliber.name}</div>
                    {filteredVariants.map(v => (
                      <div key={v.id} className="modal-ammo-row">
                        {v.imageUrl && (
                          <div className="modal-ammo-img-container">
                            <img src={v.imageUrl} alt={v.name} className="modal-ammo-img" />
                          </div>
                        )}
                        <span className="modal-ammo-name">{v.name}</span>
                        <div className="modal-ammo-actions">
                          <div className="modal-field-group">
                            <span className="modal-field-label">STOCK</span>
                            <div className="modal-input-with-btns">
                              <button 
                                className="btn-qty-adj" 
                                onClick={() => quickAddTarget && updateField(v.id, quickAddTarget, (data[v.id]?.[quickAddTarget] || 0) - v.boxSize)}
                              >
                                <Minus size={10} />
                              </button>
                              <FocusedInput 
                                type="number" 
                                className="modal-qty-input"
                                value={quickAddTarget ? (data[v.id]?.[quickAddTarget] || 0) : 0}
                                onChange={(e) => quickAddTarget && updateField(v.id, quickAddTarget, parseInt(e.target.value) || 0)}
                                onKeyDown={(e) => e.key === 'Enter' && setQuickAddTarget(null)}
                              />
                              <button 
                                className="btn-qty-adj" 
                                onClick={() => quickAddTarget && updateField(v.id, quickAddTarget, (data[v.id]?.[quickAddTarget] || 0) + v.boxSize)}
                              >
                                <Plus size={10} />
                              </button>
                            </div>
                          </div>

                          <div className="modal-field-group">
                            <span className="modal-field-label">WARN</span>
                            <div className="modal-input-with-btns">
                              <button 
                                className="btn-qty-adj" 
                                onClick={() => {
                                  const field = quickAddTarget === 'inventory' ? 'inventoryThreshold' : 'stashThreshold';
                                  updateField(v.id, field, (data[v.id]?.[field] || 0) - v.boxSize);
                                }}
                              >
                                <Minus size={10} />
                              </button>
                              <FocusedInput 
                                type="number" 
                                className="modal-qty-input threshold"
                                value={data[v.id]?.[quickAddTarget === 'inventory' ? 'inventoryThreshold' : 'stashThreshold'] || 0}
                                onChange={(e) => updateField(v.id, quickAddTarget === 'inventory' ? 'inventoryThreshold' : 'stashThreshold', parseInt(e.target.value) || 0)}
                                onKeyDown={(e) => e.key === 'Enter' && setQuickAddTarget(null)}
                              />
                              <button 
                                className="btn-qty-adj" 
                                onClick={() => {
                                  const field = quickAddTarget === 'inventory' ? 'inventoryThreshold' : 'stashThreshold';
                                  updateField(v.id, field, (data[v.id]?.[field] || 0) + v.boxSize);
                                }}
                              >
                                <Plus size={10} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      
      {/* HARDWARE CALIBRATION MODAL */}
      {calibratingWeaponId && (
          <div className="quick-add-overlay" onClick={() => setCalibratingWeaponId(null)}>
              <div className="quick-add-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                      <div className="modal-header-main">
                          <h2 className="modal-title">
                              Ammo Calibration 
                              <span className="modal-title-hardware">
                                  :: {carriedWeapons.find(w => w.instanceId === calibratingWeaponId)?.name}
                              </span>
                          </h2>
                          <div className="modal-search-wrapper">
                              <input 
                                type="text" 
                                className="modal-search-input" 
                                placeholder="Filter compatible rounds..."
                                value={calibSearch}
                                onChange={(e) => setCalibSearch(e.target.value)}
                                autoFocus
                              />
                              {calibSearch && (
                                <button 
                                  className="btn-modal-search-clear" 
                                  onClick={() => setCalibSearch('')}
                                  onMouseEnter={playHoverSound}
                                  title="Clear Search"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                          </div>
                      </div>
                      <div className="modal-header-actions">
                          <div className="modal-threshold-field">
                              <span className="modal-field-label">MIN RESERVE</span>
                              <input 
                                type="number" 
                                className="modal-qty-input"
                                value={carriedWeapons.find(w => w.instanceId === calibratingWeaponId)?.minRounds || 0}
                                onChange={(e) => updateWeaponMinRounds(calibratingWeaponId!, parseInt(e.target.value) || 0)}
                                placeholder="0"
                              />
                          </div>
                          <button className="btn-close-modal" onClick={() => setCalibratingWeaponId(null)}>&times;</button>
                      </div>
                  </div>

                  <div className="modal-info-block">
                      <div className="info-item">
                          <span className="info-dot"></span>
                          <p><strong>Selective Ammunition:</strong> Manually toggle rounds to override global Zone compatibility. Ideal for gear with specific mod restrictions or custom firing pins.</p>
                      </div>
                      <div className="info-item">
                          <span className="info-dot"></span>
                          <p><strong>Tactical Reserve:</strong> Define the total minimum rounds Kuznetsov AI must verify in your backpack to maintain combat readiness for this hardware.</p>
                      </div>
                  </div>
                  <div className="modal-list">
                      {(() => {
                          const hw = carriedWeapons.find(w => w.instanceId === calibratingWeaponId);
                          if (!hw) return null;
                          const possibleIds = WEAPON_POSSIBLE_AMMO[hw.name] || [];
                          const filter = hw.ammoFilter;

                          return STALKER_AMMO_DATA.map(caliber => (
                                  <div key={caliber.id} className="modal-section">
                                      <div className="modal-caliber-label">{caliber.name}</div>
                                      {caliber.variants.filter(v => fuzzyMatch(v.name, calibSearch) || fuzzyMatch(caliber.name, calibSearch)).map(v => {
                                           const isRecommended = possibleIds.includes(v.id);
                                           const isFiltered = filter ? filter.includes(v.id) : isRecommended;
                                          return (
                                               <div key={v.id} className={`modal-ammo-row ${isFiltered ? 'is-active' : ''}`} onClick={() => updateWeaponAmmoFilter(hw.instanceId, v.id)}>
                                                   <div className="modal-ammo-img-container">
                                                       {v.imageUrl && <img src={v.imageUrl} alt={v.name} className="modal-ammo-img" />}
                                                   </div>
                                                   <div className="modal-ammo-name">
                                                       {v.name}
                                                       {isRecommended && <span className="modal-ammo-tag" title="Standard">STD</span>}
                                                   </div>
                                                   <div className="modal-ammo-checkbox">
                                                       <div className={`custom-checkbox ${isFiltered ? 'checked' : ''}`}>
                                                           {isFiltered && <Check size={10} strokeWidth={3} />}
                                                       </div>
                                                   </div>
                                               </div>
);
                                       })}
                                   </div>
                               ));
                       })()}
                   </div>
               </div>
           </div>
       )}

      {/* API SETTINGS MODAL */}
      {showApiSettings && (
        <div className="quick-add-overlay" onClick={() => setShowApiSettings(false)}>
          <div className="api-settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                <Settings size={16} style={{ marginRight: '8px' }} />
                OpenAI Configuration
              </h2>
              <button className="btn-close-modal" onClick={() => setShowApiSettings(false)}>&times;</button>
            </div>
            <div className="api-settings-content">
              <p className="api-settings-info">
                Enter your OpenAI API key to enable screenshot scanning. 
                Your key is stored locally and never sent to our servers.
              </p>
              <div className="api-key-input-group">
                <label>API Key</label>
                <input
                  type="password"
                  className="api-key-input"
                  placeholder="sk-..."
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                />
              </div>
              <div className="api-settings-note">
                <strong>Note:</strong> Requires a valid OpenAI API key with GPT-4o access.
                Usage costs approximately $0.01-0.03 per screenshot.
              </div>
              <div className="api-settings-actions">
                <button 
                  className="btn-api-save"
                  onClick={() => {
                    localStorage.setItem('stalker_openai_key_v1', openaiKey);
                    setShowApiSettings(false);
                    playBoxSound();
                  }}
                  onMouseEnter={playHoverSound}
                >
                  Save Key
                </button>
                {openaiKey && (
                  <button 
                    className="btn-api-clear"
                    onClick={() => {
                      setOpenaiKey('');
                      localStorage.removeItem('stalker_openai_key_v1');
                      playZipperSound();
                    }}
                    onMouseEnter={playHoverSound}
                  >
                    Clear Key
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isShowcase && (() => {
        const step = SHOWCASE_STEPS[showcaseStep];
        if (!step) return null;
        return (
          <div className="showcase-overlay">
            <div className="showcase-card">
              <div className="showcase-header">
                <span className="showcase-tag">KUZNETSOV AI // TUTORIAL PROTOCOL</span>
                <button className="btn-showcase-close" onClick={endShowcase}>&times;</button>
              </div>
              <div className="showcase-body">
                <p className="showcase-narration">{step.text}</p>
                {step.action && (
                  <div className="showcase-action-prompt">
                    <span className="action-label">YOUR TURN</span>
                    <p>{step.action}</p>
                  </div>
                )}
              </div>
              <div className="showcase-footer-actions">
                <span className="showcase-progress">STEP {showcaseStep + 1} OF {SHOWCASE_STEPS.length}</span>
                <button className="btn-showcase-next" onClick={nextShowcaseStep}>
                  {showcaseStep === SHOWCASE_STEPS.length - 1 ? 'FINISH' : step.action ? 'DONE ✓' : 'NEXT'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {renderExpandedImage()}

      <footer>
        &curren; PROPRIETARY ZONE-NET PDA INTERFACE — ENCRYPTED TRANSMISSION
      </footer>
      <VersionBadge projectName="stalker2-ammo" />
    </div>
  );
}
