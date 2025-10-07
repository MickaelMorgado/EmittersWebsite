'use client';

import './terminal.css';
/* 
type DataNode = {
  details?: {
    symbol: string;
    price: string;
    market_cap: string;
    volume_24h?: string;
    circulating_supply?: string;
    total_supply?: string;
    max_supply?: string;
  };
  children?: Record<string, DataNode>;
};

const dataset = datasetRaw as Record<string, DataNode>;
const MAX_MARKETCAP = 1000000000000;
const BAR_LENGTH = 10;
const MAXCAP_STR = MAX_MARKETCAP.toLocaleString().replace(/,/g, ' ');

// Generate lines for a given subtree
function generateLinesForKey(
  key: string,
  data: Record<string, DataNode>,
  depth: number
): string[] {
  const lines: string[] = [];
  const indent = '--'.repeat(depth);
  const upper = key.toUpperCase();
  lines.push(`${indent}${upper}`);
  const node = data[key];
  if (node.children) {
    for (const childKey of Object.keys(node.children)) {
      lines.push(
        ...generateLinesForKey(childKey, node.children!, depth + 1)
      );
    }
  }
  return lines;
}

export default function CanvasCryptoVisualizer() {
  const [stack, setStack] = useState<string[]>([]);
  const [typedLines, setTypedLines] = useState<string[]>([]);
  const [queue, setQueue] = useState<string[]>(() =>
    Object.keys(dataset).map((k) => k.toUpperCase())
  );
  const [charPos, setCharPos] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  // Hover state for sidebar
  const [hoveredDetails, setHoveredDetails] = useState<DataNode['details'] | null>(null);

  // Typing effect, character by character
  useEffect(() => {
    if (queue.length === 0) return;
    const currentLine = queue[0];
    const timer = setTimeout(() => {
      if (charPos < currentLine.length) {
        setCharPos((pos) => pos + 1);
      } else {
        setTypedLines((lines) => [...lines, currentLine]);
        setQueue((q) => q.slice(1));
        setCharPos(0);
      }
    }, 5);
    return () => clearTimeout(timer);
  }, [charPos, queue]);

  // Blinking cursor
  useEffect(() => {
    const blink = setInterval(() => setShowCursor((v) => !v), 500);
    return () => clearInterval(blink);
  }, []);

  const navigateTo = (key?: string) => {
    // reset display
    setTypedLines([]);
    setCharPos(0);
    if (!key) {
      setStack([]);
      setQueue(Object.keys(dataset).map((k) => k.toUpperCase()));
    } else {
      setStack((prev) => [...prev, key]);
      setQueue(generateLinesForKey(key, dataset, 0));
    }
  };

  const handleClick = (index: number) => {
    const fullLine = typedLines[index];
    const key = fullLine.replace(/^-+/, '').toLowerCase();
    if (dataset[key]?.children) {
      navigateTo(key);
    }
  };

  const handleBack = () => {
    if (stack.length === 0) return;
    const newStack = stack.slice(0, -1);
    setStack(newStack);
    const parentKey = newStack[newStack.length - 1];
    if (parentKey) {
      setTypedLines([]);
      setCharPos(0);
      setQueue(generateLinesForKey(parentKey, dataset, 0));
    } else {
      navigateTo();
    }
  };



  return (
    <div style={{ display: 'flex', height: '100vh', backdropFilter: 'blur(1px)', backgroundColor: 'rgba(0, 0, 0, .5)' }}>
      <div
        className="terminal"
        style={{
          color: 'orange',
          padding: '4rem',
          fontFamily: 'monospace',
          fontSize: '14px',
          letterSpacing: '1px',
          textShadow: '0 0 5px orange',
          height: '100%',
          overflow: 'auto',
          whiteSpace: 'pre',
          flex: 1
        }}
      >
        {stack.length > 0 && (
          <div
            style={{ cursor: 'pointer' }}
            onClick={handleBack}
          >
            ../
          </div>
        )}
        {typedLines.map((line, idx) => {
          const key = line.replace(/^-+/, '').toLowerCase();
          const node = (dataset as any)[key] as DataNode;
          const capStr = node?.details?.market_cap;
          const commonProps = {
            onMouseEnter: () => setHoveredDetails(node.details || null),
            onMouseLeave: () => setHoveredDetails(null),
            onClick: () => handleClick(idx),
            style: {
              display: capStr ? 'flex' : 'block',
              justifyContent: capStr ? 'space-between' : undefined,
              cursor: node?.children ? 'pointer' : 'default'
            }
          };
          if (capStr) {
            const cap = Number(capStr.replace(/\s/g, ''));
            const rawCount = Math.round((cap / MAX_MARKETCAP) * BAR_LENGTH);
            const filled = Math.min(BAR_LENGTH, Math.max(0, rawCount));
            const empty = BAR_LENGTH - filled;
            const bar = '█'.repeat(filled) + '-'.repeat(empty);
            const info = `${capStr} / ${MAXCAP_STR} [${bar}]`;
            return (
              <div key={idx} {...commonProps}>
                <span>{line}</span>
                <span>{info}</span>
              </div>
            );
          } else {
            return (
              <div key={idx} {...commonProps}>
                {line}
              </div>
            );
          }
        })}
        {queue.length > 0 && (
          <div style={{ color: 'white' }}>
            {queue[0].slice(0, charPos)}
            {showCursor ? '█' : ''}
          </div>
        )}
      </div>
      <div
        className="sidebar"
        style={{
          fontFamily: 'monospace',
          fontSize: '1.2rem',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          position: 'relative',
          top: "10px",
          right: "10px",
          width: '600px',
          height: '890px',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          color: 'orange',
          padding: '1rem',
          overflowY: 'auto',
          border: '2px solid orange',
          boxShadow: '0 0 40px -15px orange',
        }}
      >
        {hoveredDetails ? (
          <div>
            <h3>{hoveredDetails.symbol}</h3>
            <p>Price: {hoveredDetails.price}</p>
            <p>Market Cap: {hoveredDetails.market_cap}</p>
            {hoveredDetails.volume_24h && <p>24h Volume: {hoveredDetails.volume_24h}</p>}
            {hoveredDetails.circulating_supply && <p>Circulating Supply: {hoveredDetails.circulating_supply}</p>}
            {hoveredDetails.total_supply && <p>Total Supply: {hoveredDetails.total_supply}</p>}
            {hoveredDetails.max_supply && <p>Max Supply: {hoveredDetails.max_supply}</p>}
          </div>
        ) : (
          <div>Hover over a crypto to see details</div>
        )}
      </div>
    </div>
  );
}
 */