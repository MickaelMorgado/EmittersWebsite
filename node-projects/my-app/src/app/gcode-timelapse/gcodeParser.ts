// Minimalist G-code parser for timelapse visualization
export interface GCodePoint {
  x: number;
  y: number;
  z: number;
  e: number; // extrusion amount
  isExtrusion: boolean;
  isPositiveExtrusion: boolean; // true when E increases (outer wall extrusion)
}

export function parseGCode(content: string): GCodePoint[] {
  const lines = content.split('\n');
  const points: GCodePoint[] = [];
  let currentPos = { x: 0, y: 0, z: 0, e: 0 };
  /* Unused: isInOuterWallSection */

  for (const line of lines) {
    const trimmed = line.trim();

    // Check for section comments to determine feature type
    if (trimmed.startsWith(';')) {
      continue; // Skip comment lines
    }

    if (!trimmed) continue;

    const parts = trimmed.split(' ');
    const command = parts[0];

    // Only process G0 and G1 commands (linear moves)
    if (command === 'G0' || command === 'G1') {
      const newPos = { ...currentPos };
      let hasExtrusion = false;

      for (const part of parts.slice(1)) {
        if (!part || part.trim() === '') continue;

        const key = part[0].toLowerCase();
        const value = parseFloat(part.slice(1));

        switch (key) {
          case 'x': newPos.x = value; break;
          case 'y': newPos.y = value; break;
          case 'z': newPos.z = value; break;
          case 'e':
            newPos.e = value;
            hasExtrusion = true;
            break;
        }
      }

      // Detect positive extrusion: only for G1 commands with E increasing (outer wall extrusion)
      // G0 commands are travel moves and should not be considered positive extrusion
      const isPositiveExtrusion = hasExtrusion && command === 'G1' && newPos.e > currentPos.e;

      // Only add points for moves with extrusion (actual printing)
      if (hasExtrusion || points.length === 0) {
        points.push({
          ...newPos,
          isExtrusion: hasExtrusion,
          isPositiveExtrusion
        });
      }

      currentPos = newPos;
    }
  }

  return points;
}
