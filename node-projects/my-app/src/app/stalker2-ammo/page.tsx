'use client';
import { AlertTriangle, ArrowLeft, ArrowRight, BarChart3, LayoutGrid, Minus, Plus, Settings, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AmmoVariant, STALKER_AMMO_DATA } from './data';
import './styles.css';

interface AmmoState {
  inventory: number;
  stash: number;
  inventoryThreshold: number;
  stashThreshold: number;
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
  <span className="warning-blink" style={{ color: 'var(--accent-red)', display: 'inline-flex', alignItems: 'center' }}>
    <AlertTriangle size={size} strokeWidth={2.5} />
  </span>
);

export default function StalkerAmmoPage() {
  const [data, setData] = useState<{ [key: string]: AmmoState }>({});
  const [mounted, setMounted] = useState(false);
  const [editingThreshold, setEditingThreshold] = useState<string | null>(null);
  const [hoveredAmmoId, setHoveredAmmoId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'graph'>('grid');
  const [hoveringWarningId, setHoveringWarningId] = useState<string | null>(null);
  const [activeAmmoId, setActiveAmmoId] = useState<string | null>(null);
  const [quickAddTarget, setQuickAddTarget] = useState<'inventory' | 'stash' | null>(null);
  const [quickAddSearch, setQuickAddSearch] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [stashSearch, setStashSearch] = useState('');
  const [inventorySearch, setInventorySearch] = useState('');
  const [aiChatInput, setAiChatInput] = useState('');
  const [caliberThresholds, setCaliberThresholds] = useState<{ [key: string]: { inventory: number; stash: number } }>({});
  const modalSearchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditingThreshold(null);
  }, [activeAmmoId]);

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


  // Initialize data
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('stalker_ammo_data_v4');
    const savedCaliber = localStorage.getItem('stalker_caliber_thresh_v4');
    if (saved) {
      try {
        setData(JSON.parse(saved));
        if (savedCaliber) setCaliberThresholds(JSON.parse(savedCaliber));
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
    if (mounted) {
      localStorage.setItem('stalker_ammo_data_v4', JSON.stringify(data));
      localStorage.setItem('stalker_caliber_thresh_v4', JSON.stringify(caliberThresholds));
    }
  }, [data, caliberThresholds, mounted]);

  const updateField = (id: string, field: keyof AmmoState, value: number) => {
    setData(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: Math.max(0, value) }
    }));
  };

  const moveAmmo = (id: string, from: 'inventory' | 'stash', to: 'inventory' | 'stash', amount: number) => {
    const currentFrom = data[id]?.[from] || 0;
    const currentTo = data[id]?.[to] || 0;
    const actualAmount = Math.min(amount, currentFrom);

    setData(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [from]: currentFrom - actualAmount,
        [to]: currentTo + actualAmount
      }
    }));
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

  const updateCaliberThreshold = (caliberId: string, field: 'inventory' | 'stash', value: number) => {
    setCaliberThresholds(prev => ({
      ...prev,
      [caliberId]: { ...prev[caliberId], [field]: Math.max(0, value) }
    }));
  };

  const renderAiSidebar = () => {
    // Generate autonomous suggestions
    const suggestions: { type: 'critical' | 'warning', message: string, target?: string }[] = [];
    
    STALKER_AMMO_DATA.forEach(caliber => {
      const calStats = getCaliberStats(caliber.id);
      
      // Caliber-level critical check
      const calInvThreshold = calStats.inventoryThreshold || 150;
      const calLowInInventory = calStats.inventory > 0 && calStats.inventory < calInvThreshold;
      
      caliber.variants.forEach(v => {
        const state = data[v.id];
        if (!state) return;

        // Nuanced Variant Check
        if (state.inventory > 0 && state.inventory < state.inventoryThreshold) {
          if (calStats.inventory >= (calStats.inventoryThreshold || 150)) {
            // Reassurance message
            suggestions.push({ 
              type: 'warning', 
              message: `REASSURANCE: ${v.name} is low, but you have sufficient ${caliber.name} reserves overall to compensate.`,
              target: caliber.name
            });
          } else {
            // Critical message
            const weaponList = v.compatibleWeapons ? ` (Compatible: ${v.compatibleWeapons.join(', ')})` : '';
            suggestions.push({ 
              type: 'critical', 
              message: `BACKPACK ALERT: ${v.name} is critically low (${state.inventory}/${state.inventoryThreshold}).${weaponList}`,
              target: v.name
            });
          }
        }
        
        if (state.stash > 0 && state.stash < state.stashThreshold) {
          const weaponList = v.compatibleWeapons ? ` (Required for: ${v.compatibleWeapons.join(', ')})` : '';
          suggestions.push({ 
            type: 'critical', 
            message: `LOOT ALERT: ${v.name} in Safe House is below tactical reserve.${weaponList}`,
            target: v.name
          });
        }
        
        // Missing threshold check
        if ((state.inventory > 0 && state.inventoryThreshold === 0) || (state.stash > 0 && state.stashThreshold === 0)) {
           if (state.inventoryThreshold === 0 && state.inventory > 0) {
             suggestions.push({ 
               type: 'warning', 
               message: `STRATEGY: Initialize threshold for ${v.name} to enable automated logistics tracking.`,
               target: caliber.name
             });
           }
        }
      });
    });

    return (
      <aside className="ai-sidebar">
        <div className="sidebar-header">
          <div className="ai-pulse" />
          <h3 className="sidebar-title">KUZNETSOV AI</h3>
          <span className="sidebar-status">ONLINE</span>
        </div>
        
        <div className="sidebar-content">
          <div className="ai-chat-window">
             <div className="ai-message system">
               <span className="msg-tag">[LOGISTICS_SCAN]</span>
               {suggestions.length > 0 ? (
                 <ul className="suggestion-list">
                   {suggestions.map((s, i) => (
                     <li 
                      key={i} 
                      className={s.type === 'warning' ? 'warning' : ''}
                      style={{ cursor: 'pointer' }}
                      onClick={() => s.target && setGlobalSearch(s.target)}
                      title={`Jump to ${s.target}`}
                     >
                       {s.message}
                     </li>
                   ))}
                 </ul>
               ) : (
                 <p>All supply lines reported within tactical parameters. No critical shortages detected in the Zone.</p>
               )}
             </div>
             
             <div className="ai-message assistant">
               <span className="msg-tag">[AI_ASSISTANT]</span>
               <p>Welcome back, Stalker. I am monitoring your caches in real-time. Input tactical queries below for advanced supply-chain analysis.</p>
             </div>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="ai-input-wrapper">
            <input 
              type="text" 
              className="ai-chat-input" 
              placeholder="Ask Kuznetsov..."
              value={aiChatInput}
              onChange={(e) => setAiChatInput(e.target.value)}
            />
            <button className="btn-ai-send">
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </aside>
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
    
    return (
      <div 
        key={variant.id} 
        className={`ammo-slot ${isBelowThreshold ? 'status-warning' : ''} ${isHighlighted ? 'is-highlighted' : ''} ${isActive ? 'is-active' : ''}`}
        onMouseEnter={() => setHoveredAmmoId(variant.id)}
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
            color: hoveringWarningId === variant.id ? 'var(--accent-red)' : '',
            cursor: isBelowThreshold ? 'help' : 'default'
          }}
          onMouseEnter={() => isBelowThreshold && setHoveringWarningId(variant.id)}
          onMouseLeave={() => setHoveringWarningId(null)}
        >
          {isBelowThreshold && <WarningIcon size={12} />}
          {hoveringWarningId === variant.id ? `> ${state[thresholdField]}` : count}
        </div>
        
        {/* CLICK-TO-TOGGLE OVERLAY */}
        <div className="ammo-slot-tooltip" onClick={(e) => e.stopPropagation()}>
          {isActive && (
            <>
              <div className="tooltip-name">{variant.name}</div>
              
              <div className="tooltip-control-group">
                {editingThreshold === variant.id ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <button 
                        className="btn-qty-adj" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingThreshold(null);
                        }}
                        title="Back to Quantity"
                      >
                        <ArrowLeft size={10} />
                      </button>
                      <div className="tooltip-row-label danger">WARN THRESHOLD</div>
                    </div>
                    <div className="tooltip-quantity-controls">
                      <button className="btn-qty-adj" onClick={(e) => {
                        e.stopPropagation();
                        updateField(variant.id, thresholdField, (state[thresholdField] || 0) - 20);
                      }}>
                        <Minus size={10} />
                      </button>
                      <div className="tooltip-input-wrapper threshold">
                        <FocusedInput 
                          type="number" 
                          className="tooltip-input red"
                          forceFocus={true}
                          value={state[thresholdField]} 
                          onChange={(e) => updateField(variant.id, thresholdField, parseInt(e.target.value) || 0)}
                          onKeyDown={(e) => e.key === 'Enter' && setEditingThreshold(null)}
                        />
                      </div>
                      <button className="btn-qty-adj" onClick={(e) => {
                        e.stopPropagation();
                        updateField(variant.id, thresholdField, (state[thresholdField] || 0) + 20);
                      }}>
                        <Plus size={10} />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="tooltip-quantity-controls">
                      <button className="btn-qty-adj" onClick={(e) => {
                        e.stopPropagation();
                        updateField(variant.id, section, count - 20);
                      }}>
                        <Minus size={10} />
                      </button>
                      <div className="tooltip-input-wrapper">
                        <FocusedInput 
                          type="number" 
                          className="tooltip-input"
                          forceFocus={true}
                          value={count} 
                          onChange={(e) => updateField(variant.id, section, parseInt(e.target.value) || 0)}
                          onKeyDown={(e) => e.key === 'Enter' && setActiveAmmoId(null)}
                        />
                      </div>
                      <button className="btn-qty-adj" onClick={(e) => {
                        e.stopPropagation();
                        updateField(variant.id, section, count + 20);
                      }}>
                        <Plus size={10} />
                      </button>
                    </div>
                    
                    <div className="tooltip-actions">
                      <button className="btn-tooltip" onClick={(e) => {
                        e.stopPropagation();
                        moveAmmo(variant.id, section, isInventory ? 'stash' : 'inventory', 20);
                      }}>
                        {isInventory ? <ArrowLeft size={13} /> : <ArrowRight size={13} />}
                        TRANSFER 20
                      </button>
                      <button 
                        className="btn-tooltip settings"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingThreshold(variant.id);
                        }}
                      >
                        <Settings size={11} />
                      </button>
                    </div>
                  </>
                )}
              </div>
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
            
            if (!matchesGlobal || !matchesLocal) return false;

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
                  
                  // Calculate percentage for bar, capped at a reasonable visual max (e.g., 2x threshold)
                  const maxDisplay = Math.max(threshold * 1.5, count, 100);
                  const qtyPercent = (count / maxDisplay) * 100;
                  const threshPercent = (threshold / maxDisplay) * 100;
                  const isWarning = count < threshold;

                  return (
                    <div key={v.id} className="graph-row" onClick={() => {
                      setActiveAmmoId(v.id);
                      // Scroll could be added here if needed
                    }}>
                      <div className="graph-item-info">
                        <div className="graph-item-main">
                          {v.imageUrl && (
                            <div className="graph-item-thumb-container">
                              <img src={v.imageUrl} alt="" className="graph-item-thumb" />
                            </div>
                          )}
                          <span className="graph-item-name">{v.name}</span>
                        </div>
                        <span className={`graph-item-qty ${isWarning ? 'warning' : ''}`}>
                          {count} <span className="qty-divider">/</span> <span className="qty-thresh">{threshold}</span>
                        </span>
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
      <header className="stalker-header">
        <div className="header-top">
          <div className="header-brand">
            <h1 className="stalker-title">Zone Logistics Terminal</h1>
            <p className="stalker-subtitle">Authorized Stalker Logistics v. 4.0.0</p>
          </div>
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
                <button className="btn-search-clear" onClick={() => setGlobalSearch('')}>
                  <Trash2 size={12} />
                </button>
              )}
            </div>
            <div className="view-toggle-group">
              <button 
                className={`btn-toggle ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                <LayoutGrid size={16} />
              </button>
              <button 
                className={`btn-toggle ${viewMode === 'graph' ? 'active' : ''}`}
                onClick={() => setViewMode('graph')}
                title="Graphical View"
              >
                <BarChart3 size={16} />
              </button>
            </div>
            <button className="btn-purge" onClick={purgeData}>
              <Trash2 size={13} /> TERMINATE DATA
            </button>
          </div>
        </div>
      </header>

      <div className="main-layout-container">
        <div className="dual-panel-grid">
        {/* STASH PANEL */}
        <div className="panel stash-panel">
          <div className="panel-header">
            <div className="panel-header-top">
              <h2 className="panel-title">Loot</h2>
              <span className="panel-meta">(SAFE HOUSE STASH)</span>
            </div>
            <div className="panel-search-wrapper">
              <input 
                type="text" 
                className="panel-search-input" 
                placeholder="Filter Stash..."
                value={stashSearch}
                onChange={(e) => setStashSearch(e.target.value)}
              />
              {stashSearch && (
                <button className="btn-search-clear" onClick={() => setStashSearch('')}>
                  <Trash2 size={10} />
                </button>
              )}
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
                  return hasStock && matchesGlobal && matchesLocal;
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
                            onClick={() => setEditingThreshold(`cal_${caliber.id}_stash`)}
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
          
          {/* STASH QUICK ADD */}
          <button 
            className="btn-floating-add stash" 
            onClick={() => setQuickAddTarget('stash')}
            title="Quick Stockpile Stash"
          >
            <Plus size={24} />
          </button>
        </div>

        {/* INVENTORY PANEL */}
        <div className="panel inventory-panel">
          <div className="panel-header">
            <div className="panel-header-top">
              <h2 className="panel-title">Inventory</h2>
              <span className="panel-meta">(BACKPACK)</span>
            </div>
            <div className="panel-search-wrapper">
              <input 
                type="text" 
                className="panel-search-input" 
                placeholder="Filter Backpack..."
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
              />
              {inventorySearch && (
                <button className="btn-search-clear" onClick={() => setInventorySearch('')}>
                  <Trash2 size={10} />
                </button>
              )}
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
                  return hasStock && matchesGlobal && matchesLocal;
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
                            onClick={() => setEditingThreshold(`cal_${caliber.id}_inv`)}
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
          
          {/* INVENTORY QUICK ADD */}
          <button 
            className="btn-floating-add" 
            onClick={() => setQuickAddTarget('inventory')}
            title="Quick Add to Backpack"
          >
            <Plus size={24} />
          </button>
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
                      title="Clear Search"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
              <button className="btn-close-modal" onClick={() => setQuickAddTarget(null)}>
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
                            <FocusedInput 
                              type="number" 
                              className="modal-qty-input"
                              value={data[v.id]?.[quickAddTarget] || 0}
                              onChange={(e) => updateField(v.id, quickAddTarget, parseInt(e.target.value) || 0)}
                              onKeyDown={(e) => e.key === 'Enter' && setQuickAddTarget(null)}
                            />
                          </div>

                          <div className="modal-field-group">
                            <span className="modal-field-label">WARN</span>
                            <FocusedInput 
                              type="number" 
                              className="modal-qty-input threshold"
                              value={data[v.id]?.[quickAddTarget === 'inventory' ? 'inventoryThreshold' : 'stashThreshold'] || 0}
                              onChange={(e) => updateField(v.id, quickAddTarget === 'inventory' ? 'inventoryThreshold' : 'stashThreshold', parseInt(e.target.value) || 0)}
                              onKeyDown={(e) => e.key === 'Enter' && setQuickAddTarget(null)}
                            />
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
      
      <footer>
        &curren; PROPRIETARY ZONE-NET PDA INTERFACE — ENCRYPTED TRANSMISSION
      </footer>
    </div>
  );
}
