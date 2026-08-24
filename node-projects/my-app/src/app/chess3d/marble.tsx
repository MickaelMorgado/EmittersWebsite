'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

function generateMarbleTexture(dark: boolean): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base colors
  if (dark) {
    ctx.fillStyle = '#12091a';
  } else {
    ctx.fillStyle = '#d8dce8';
  }
  ctx.fillRect(0, 0, size, size);

  // Marble veins using layered translucent strokes
  const veins = dark ? 40 : 30;
  for (let i = 0; i < veins; i++) {
    ctx.beginPath();
    const startX = Math.random() * size;
    const startY = Math.random() * size;
    ctx.moveTo(startX, startY);

    const segments = 6 + Math.floor(Math.random() * 8);
    for (let j = 0; j < segments; j++) {
      const cpX = startX + (Math.random() - 0.5) * size * 0.6;
      const cpY = startY + (Math.random() - 0.5) * size * 0.6;
      const endX = startX + (Math.random() - 0.5) * size * 0.8;
      const endY = startY + (Math.random() - 0.5) * size * 0.8;
      ctx.quadraticCurveTo(cpX, cpY, endX, endY);
    }

    if (dark) {
      const alpha = 0.04 + Math.random() * 0.08;
      ctx.strokeStyle = `rgba(140, 100, 200, ${alpha})`;
      ctx.lineWidth = 0.5 + Math.random() * 2.5;
    } else {
      const alpha = 0.06 + Math.random() * 0.12;
      ctx.strokeStyle = `rgba(80, 60, 120, ${alpha})`;
      ctx.lineWidth = 0.5 + Math.random() * 2;
    }
    ctx.stroke();
  }

  // Fine grain noise
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * (dark ? 8 : 12);
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);

  // Subtle sheen gradient
  const gradient = ctx.createRadialGradient(size * 0.3, size * 0.3, 0, size * 0.5, size * 0.5, size * 0.7);
  if (dark) {
    gradient.addColorStop(0, 'rgba(100, 60, 160, 0.08)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  } else {
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(180, 160, 200, 0.05)');
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function useMarbleTextures() {
  return useMemo(() => {
    const lightTex = generateMarbleTexture(false);
    const darkTex = generateMarbleTexture(true);
    return { lightTex, darkTex };
  }, []);
}
