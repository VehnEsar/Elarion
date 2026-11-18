'use client';

import React, { useRef, useState } from 'react';
import { MODULES } from '@/config/modules';
import {
  isTileUnlocked,
  PlacedModule,
  PLATE_SIZE,
  SECTOR_COUNT,
} from '@/lib/circuitSolver';

interface IsoMotherboardProps {
  unlockedPlates: string[];
  nextPlateCost: { lumina: number; graphite: number };
  placedModules: PlacedModule[];
  selectedModuleId: string | null;
  walletAddress: string | null;
  onPlaceModule: (x: number, y: number) => void;
  onUpgradeModule: (uid: string) => void;
  onRemoveModule: (uid: string) => void;
  onUnlockPlate: (px: number, py: number) => void;
  onBindNftArtifact: (uid: string) => void;
}

const TILE_W = 56;
const TILE_H = 28;

export default function IsoMotherboard({
  unlockedPlates,
  nextPlateCost,
  placedModules,
  selectedModuleId,
  walletAddress,
  onPlaceModule,
  onUpgradeModule,
  onRemoveModule,
  onUnlockPlate,
  onBindNftArtifact,
}: IsoMotherboardProps) {
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);

  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const hasMovedRef = useRef<boolean>(false);

  const toIso = (gx: number, gy: number) => ({
    x: (gx - gy) * (TILE_W / 2),
    y: (gx + gy) * (TILE_H / 2),
  });

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 0.89;
    setZoom((prev) => Math.min(2.6, Math.max(0.5, Number((prev * factor).toFixed(2)))));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
    hasMovedRef.current = false;
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      hasMovedRef.current = true;
    }

    if (hasMovedRef.current) {
      setPan({
        x: dragStartRef.current.panX + dx,
        y: dragStartRef.current.panY + dy,
      });
    }
  };

  const handlePointerUp = () => {
    dragStartRef.current = null;
    setIsDragging(false);
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const unlockablePlates: Array<{ px: number; py: number; key: string }> = [];
  for (let px = 0; px < SECTOR_COUNT; px++) {
    for (let py = 0; py < SECTOR_COUNT; py++) {
      const key = `${px},${py}`;
      if (unlockedPlates.includes(key)) continue;
      if (
        unlockedPlates.includes(`${px - 1},${py}`) ||
        unlockedPlates.includes(`${px + 1},${py}`) ||
        unlockedPlates.includes(`${px},${py - 1}`) ||
        unlockedPlates.includes(`${px},${py + 1}`)
      ) {
        if (!unlockablePlates.some((u) => u.key === key)) {
          unlockablePlates.push({ px, py, key });
        }
      }
    }
  }

  const visibleSectors = [
    ...unlockedPlates.map((k) => {
      const [px, py] = k.split(',').map(Number);
      return { px, py };
    }),
    ...unlockablePlates.map(({ px, py }) => ({ px, py })),
  ];

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const { px, py } of visibleSectors) {
    const sx = px * PLATE_SIZE;
    const sy = py * PLATE_SIZE;
    const corners = [
      toIso(sx, sy),
      toIso(sx + PLATE_SIZE, sy),
      toIso(sx + PLATE_SIZE, sy + PLATE_SIZE),
      toIso(sx, sy + PLATE_SIZE),
    ];
    for (const c of corners) {
      if (c.x < minX) minX = c.x;
      if (c.x > maxX) maxX = c.x;
      if (c.y < minY) minY = c.y;
      if (c.y > maxY) maxY = c.y;
    }
  }

  const vbX = minX - 50;
  const vbY = minY - 125;
  const vbW = maxX - minX + 100;
  const vbH = maxY - minY + 185;

  const getModuleAt = (x: number, y: number) =>
    placedModules.find((m) => x >= m.x && x < m.x + m.w && y >= m.y && y < m.y + m.h);

  const canPlaceAt = (gx: number, gy: number) => {
    if (!selectedModuleId) return false;
    const cfg = MODULES[selectedModuleId];
    if (!cfg) return false;

    for (let dx = 0; dx < cfg.size.w; dx++) {
      for (let dy = 0; dy < cfg.size.h; dy++) {
        if (!isTileUnlocked(gx + dx, gy + dy, unlockedPlates)) return false;
        if (getModuleAt(gx + dx, gy + dy)) return false;
      }
    }
    return true;
  };

  const sortedModules = [...placedModules].sort((a, b) => {
    if (a.moduleId === 'gold_trace' && b.moduleId !== 'gold_trace') return -1;
    if (a.moduleId !== 'gold_trace' && b.moduleId === 'gold_trace') return 1;
    return a.x + a.y + (a.w + a.h) / 2 - (b.x + b.y + (b.w + b.h) / 2);
  });

  const activeModule = placedModules.find((m) => m.uid === selectedUid) ?? null;
  const activeCfg = activeModule ? MODULES[activeModule.moduleId] : null;

  return (
    <div
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`relative flex items-center justify-center w-full h-full overflow-hidden select-none ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
        }}
        className="flex items-center justify-center w-full h-full transition-transform duration-75 ease-out"
      >
        <svg
          viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
          className="w-full h-full max-w-6xl max-h-[82vh] drop-shadow-[0_30px_60px_rgba(0,0,0,0.9)]"
        >
          <defs>
            <style>{`
              @keyframes pulseFlow {
                0% { stroke-dashoffset: 24; }
                100% { stroke-dashoffset: 0; }
              }
              @keyframes floatCore {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-4px); }
              }
              @keyframes holoPulse {
                0%, 100% { opacity: 0.45; }
                50% { opacity: 0.95; }
              }
              .energy-stream {
                stroke-dasharray: 4 4;
                animation: pulseFlow 1.2s linear infinite;
              }
              .floating-artifact {
                animation: floatCore 3.5s ease-in-out infinite;
              }
              .holo-ring {
                animation: holoPulse 3s ease-in-out infinite;
              }
            `}</style>

            <linearGradient id="pcbSlab" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1b212b" />
              <stop offset="50%" stopColor="#13171f" />
              <stop offset="100%" stopColor="#0c0f14" />
            </linearGradient>

            <linearGradient id="towerLeft" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2c3545" />
              <stop offset="100%" stopColor="#151a22" />
            </linearGradient>

            <linearGradient id="towerRight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b4659" />
              <stop offset="100%" stopColor="#1c222d" />
            </linearGradient>

            <linearGradient id="goldMetal" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fce39c" />
              <stop offset="50%" stopColor="#c99638" />
              <stop offset="100%" stopColor="#7a5616" />
            </linearGradient>

            <linearGradient id="livingMat" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#113836" />
              <stop offset="100%" stopColor="#0d1f24" />
            </linearGradient>

            <filter id="blueGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="goldGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {unlockablePlates.map(({ px, py, key }) => {
            const sx = px * PLATE_SIZE;
            const sy = py * PLATE_SIZE;
            const top = toIso(sx, sy);
            const right = toIso(sx + PLATE_SIZE, sy);
            const bottom = toIso(sx + PLATE_SIZE, sy + PLATE_SIZE);
            const left = toIso(sx, sy + PLATE_SIZE);
            const center = { x: (top.x + bottom.x) / 2, y: (top.y + bottom.y) / 2 };

            return (
              <g
                key={`locked-${key}`}
                onClick={() => {
                  if (hasMovedRef.current) return;
                  onUnlockPlate(px, py);
                }}
                className="cursor-pointer group"
              >
                <polygon
                  points={`${top.x},${top.y} ${right.x},${right.y} ${bottom.x},${bottom.y} ${left.x},${left.y}`}
                  fill="rgba(15, 23, 42, 0.32)"
                  stroke="#c99e44"
                  strokeWidth="1.2"
                  strokeDasharray="6 4"
                  className="transition-opacity opacity-55 group-hover:opacity-95"
                />
                <rect
                  x={center.x - 62}
                  y={center.y - 16}
                  width="124"
                  height="32"
                  rx="8"
                  fill="rgba(9, 13, 22, 0.88)"
                  stroke="#f3cf7a"
                  strokeWidth="1"
                />
                <text
                  x={center.x}
                  y={center.y - 2}
                  textAnchor="middle"
                  fill="#fde68a"
                  fontSize="9.5"
                  fontWeight="600"
                >
                  + DOŁĄCZ PŁYTĘ
                </text>
                <text
                  x={center.x}
                  y={center.y + 10}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="8.5"
                >
                  {nextPlateCost.lumina} Lumina • {nextPlateCost.graphite} Grafit
                </text>
              </g>
            );
          })}

          {[...unlockedPlates]
            .sort((a, b) => {
              const [ax, ay] = a.split(',').map(Number);
              const [bx, by] = b.split(',').map(Number);
              return ax + ay - (bx + by);
            })
            .map((key) => {
              const [px, py] = key.split(',').map(Number);
              const sx = px * PLATE_SIZE;
              const sy = py * PLATE_SIZE;
              const top = toIso(sx, sy);
              const right = toIso(sx + PLATE_SIZE, sy);
              const bottom = toIso(sx + PLATE_SIZE, sy + PLATE_SIZE);
              const left = toIso(sx, sy + PLATE_SIZE);
              const depth = 22;

              return (
                <g key={`plate-${key}`}>
                  <polygon
                    points={`${left.x},${left.y} ${bottom.x},${bottom.y} ${bottom.x},${bottom.y + depth} ${left.x},${left.y + depth}`}
                    fill="#090b0e"
                    stroke="#262d38"
                    strokeWidth="1"
                  />
                  <polygon
                    points={`${bottom.x},${bottom.y} ${right.x},${right.y} ${right.x},${right.y + depth} ${bottom.x},${bottom.y + depth}`}
                    fill="#12161e"
                    stroke="#262d38"
                    strokeWidth="1"
                  />
                  {Array.from({ length: PLATE_SIZE }).map((_, i) => {
                    const t1 = (i + 0.25) / PLATE_SIZE;
                    const t2 = (i + 0.75) / PLATE_SIZE;
                    const lx1 = left.x + (bottom.x - left.x) * t1;
                    const ly1 = left.y + (bottom.y - left.y) * t1;
                    const lx2 = left.x + (bottom.x - left.x) * t2;
                    const ly2 = left.y + (bottom.y - left.y) * t2;

                    const rx1 = bottom.x + (right.x - bottom.x) * t1;
                    const ry1 = bottom.y + (right.y - bottom.y) * t1;
                    const rx2 = bottom.x + (right.x - bottom.x) * t2;
                    const ry2 = bottom.y + (right.y - bottom.y) * t2;

                    return (
                      <g key={`pin-${key}-${i}`} opacity="0.75">
                        <polygon
                          points={`${lx1},${ly1 + 4} ${lx2},${ly2 + 4} ${lx2},${ly2 + 14} ${lx1},${ly1 + 14}`}
                          fill="url(#goldMetal)"
                        />
                        <polygon
                          points={`${rx1},${ry1 + 4} ${rx2},${ry2 + 4} ${rx2},${ry2 + 14} ${rx1},${ry1 + 14}`}
                          fill="url(#goldMetal)"
                        />
                      </g>
                    );
                  })}
                  <polygon
                    points={`${top.x},${top.y} ${right.x},${right.y} ${bottom.x},${bottom.y} ${left.x},${left.y}`}
                    fill="url(#pcbSlab)"
                    stroke="url(#goldMetal)"
                    strokeWidth="1.6"
                  />
                </g>
              );
            })}

          {unlockedPlates.map((key) => {
            const [px, py] = key.split(',').map(Number);
            const sx = px * PLATE_SIZE;
            const sy = py * PLATE_SIZE;

            return Array.from({ length: PLATE_SIZE }).map((_, dx) =>
              Array.from({ length: PLATE_SIZE }).map((__, dy) => {
                const gx = sx + dx;
                const gy = sy + dy;
                const p0 = toIso(gx, gy);
                const p1 = toIso(gx + 1, gy);
                const p2 = toIso(gx + 1, gy + 1);
                const p3 = toIso(gx, gy + 1);

                let isPreview = false;
                let previewValid = false;
                if (hoverCell && selectedModuleId) {
                  const cfg = MODULES[selectedModuleId];
                  if (
                    cfg &&
                    gx >= hoverCell.x &&
                    gx < hoverCell.x + cfg.size.w &&
                    gy >= hoverCell.y &&
                    gy < hoverCell.y + cfg.size.h
                  ) {
                    isPreview = true;
                    previewValid = canPlaceAt(hoverCell.x, hoverCell.y);
                  }
                }

                return (
                  <g
                    key={`${gx}-${gy}`}
                    onMouseEnter={() => setHoverCell({ x: gx, y: gy })}
                    onClick={() => {
                      if (hasMovedRef.current) return;
                      if (selectedModuleId) {
                        if (canPlaceAt(gx, gy)) onPlaceModule(gx, gy);
                      } else {
                        setSelectedUid(null);
                      }
                    }}
                    className="cursor-pointer"
                  >
                    <polygon
                      points={`${p0.x},${p0.y} ${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`}
                      fill={
                        isPreview
                          ? previewValid
                            ? 'rgba(56, 189, 248, 0.32)'
                            : 'rgba(239, 68, 68, 0.32)'
                          : 'transparent'
                      }
                      stroke="rgba(148, 163, 184, 0.1)"
                      strokeWidth="0.7"
                    />
                  </g>
                );
              })
            );
          })}

          {sortedModules.map((mod) => {
            const cfg = MODULES[mod.moduleId];
            if (!cfg) return null;

            const p0 = toIso(mod.x, mod.y);
            const p1 = toIso(mod.x + mod.w, mod.y);
            const p2 = toIso(mod.x + mod.w, mod.y + mod.h);
            const p3 = toIso(mod.x, mod.y + mod.h);
            const cx = (p0.x + p2.x) / 2;
            const cy = (p0.y + p2.y) / 2;
            const isSelected = selectedUid === mod.uid;

            const handleModuleClick = (e: React.MouseEvent) => {
              e.stopPropagation();
              if (hasMovedRef.current) return;
              setSelectedUid(mod.uid);
            };

            if (mod.moduleId === 'gold_trace') {
              const neighbors = [
                { dx: 1, dy: 0 },
                { dx: -1, dy: 0 },
                { dx: 0, dy: 1 },
                { dx: 0, dy: -1 },
              ];

              return (
                <g key={mod.uid} onClick={handleModuleClick} className="cursor-pointer">
                  <polygon
                    points={`${p0.x},${p0.y} ${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`}
                    fill="rgba(15, 23, 42, 0.45)"
                    stroke={isSelected ? '#f3cf7a' : 'rgba(201, 158, 68, 0.25)'}
                    strokeWidth={isSelected ? '1.3' : '0.6'}
                  />

                  {neighbors.map(({ dx, dy }, idx) => {
                    const nb = getModuleAt(mod.x + dx, mod.y + dy);
                    if (!nb) return null;
                    const edgeCenter = toIso(mod.x + 0.5 + dx * 0.5, mod.y + 0.5 + dy * 0.5);

                    return (
                      <g key={idx}>
                        <line
                          x1={cx}
                          y1={cy}
                          x2={edgeCenter.x}
                          y2={edgeCenter.y}
                          stroke={mod.isPowered ? '#0284c7' : '#a17624'}
                          strokeWidth={2.5 + mod.layer * 0.6}
                          strokeLinecap="round"
                        />
                        {mod.isPowered && (
                          <line
                            x1={cx}
                            y1={cy}
                            x2={edgeCenter.x}
                            y2={edgeCenter.y}
                            stroke="#7dd3fc"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            className="energy-stream"
                            filter="url(#blueGlow)"
                          />
                        )}
                      </g>
                    );
                  })}

                  <circle
                    cx={cx}
                    cy={cy}
                    r={mod.isPowered ? 4 : 3}
                    fill={mod.isPowered ? '#38bdf8' : '#1e293b'}
                    stroke="#f3cf7a"
                    strokeWidth="1.2"
                    filter={mod.isPowered ? 'url(#blueGlow)' : undefined}
                  />
                </g>
              );
            }

            const renderSocketBase = () => (
              <polygon
                points={`${p0.x},${p0.y} ${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`}
                fill="#141922"
                stroke={isSelected ? '#ffffff' : mod.isPowered ? '#38bdf8' : '#b8892d'}
                strokeWidth={isSelected ? '2.2' : '1.4'}
              />
            );

            if (mod.moduleId === 'cpu_core') {
              const h1 = 22;
              const h2 = 54 + (mod.layer - 1) * 8;
              const h3 = 82 + (mod.layer - 1) * 10;

              const shrink = (pt: { x: number; y: number }, factor: number) => ({
                x: cx + (pt.x - cx) * factor,
                y: cy + (pt.y - cy) * factor,
              });

              const b0 = shrink(p0, 0.78);
              const b1 = shrink(p1, 0.78);
              const b2 = shrink(p2, 0.78);
              const b3 = shrink(p3, 0.78);

              const m0 = shrink(p0, 0.52);
              const m1 = shrink(p1, 0.52);
              const m2 = shrink(p2, 0.52);
              const m3 = shrink(p3, 0.52);

              const t0 = shrink(p0, 0.32);
              const t1 = shrink(p1, 0.32);
              const t2 = shrink(p2, 0.32);
              const t3 = shrink(p3, 0.32);

              return (
                <g key={mod.uid} onClick={handleModuleClick} className="cursor-pointer">
                  {renderSocketBase()}
                  <polygon
                    points={`${b0.x},${b0.y} ${b1.x},${b1.y} ${b2.x},${b2.y} ${b3.x},${b3.y}`}
                    fill="none"
                    stroke="url(#goldMetal)"
                    strokeWidth="2.5"
                  />
                  <polygon
                    points={`${b3.x},${b3.y} ${b2.x},${b2.y} ${b2.x},${b2.y - h1} ${b3.x},${b3.y - h1}`}
                    fill="url(#towerLeft)"
                    stroke="#c99e44"
                    strokeWidth="1"
                  />
                  <polygon
                    points={`${b2.x},${b2.y} ${b1.x},${b1.y} ${b1.x},${b1.y - h1} ${b2.x},${b2.y - h1}`}
                    fill="url(#towerRight)"
                    stroke="#c99e44"
                    strokeWidth="1"
                  />
                  <polygon
                    points={`${b0.x},${b0.y - h1} ${b1.x},${b1.y - h1} ${b2.x},${b2.y - h1} ${b3.x},${b3.y - h1}`}
                    fill="#232a37"
                    stroke="#f3cf7a"
                    strokeWidth="1"
                  />
                  <polygon
                    points={`${m3.x},${m3.y - h1} ${m2.x},${m2.y - h1} ${m2.x},${m2.y - h2} ${m3.x},${m3.y - h2}`}
                    fill="url(#towerLeft)"
                    stroke="#c99e44"
                    strokeWidth="1"
                  />
                  <polygon
                    points={`${m2.x},${m2.y - h1} ${m1.x},${m1.y - h1} ${m1.x},${m1.y - h2} ${m2.x},${m2.y - h2}`}
                    fill="url(#towerRight)"
                    stroke="#c99e44"
                    strokeWidth="1"
                  />
                  <line
                    x1={(m3.x + m2.x) / 2}
                    y1={(m3.y + m2.y) / 2 - h1}
                    x2={(m3.x + m2.x) / 2}
                    y2={(m3.y + m2.y) / 2 - h2}
                    stroke="#38bdf8"
                    strokeWidth="2.2"
                    filter="url(#blueGlow)"
                  />
                  <line
                    x1={(m2.x + m1.x) / 2}
                    y1={(m2.y + m1.y) / 2 - h1}
                    x2={(m2.x + m1.x) / 2}
                    y2={(m2.y + m1.y) / 2 - h2}
                    stroke="#38bdf8"
                    strokeWidth="2.2"
                    filter="url(#blueGlow)"
                  />
                  <polygon
                    points={`${t3.x},${t3.y - h2} ${t2.x},${t2.y - h2} ${t2.x},${t2.y - h3} ${t3.x},${t3.y - h3}`}
                    fill="url(#towerLeft)"
                    stroke="#f3cf7a"
                    strokeWidth="1"
                  />
                  <polygon
                    points={`${t2.x},${t2.y - h2} ${t1.x},${t1.y - h2} ${t1.x},${t1.y - h3} ${t2.x},${t2.y - h3}`}
                    fill="url(#towerRight)"
                    stroke="#f3cf7a"
                    strokeWidth="1"
                  />
                  <polygon
                    points={`${t0.x},${t0.y - h3} ${t1.x},${t1.y - h3} ${t2.x},${t2.y - h3} ${t3.x},${t3.y - h3}`}
                    fill="#38bdf8"
                    stroke="#f3cf7a"
                    strokeWidth="1.2"
                    filter="url(#blueGlow)"
                  />
                  <ellipse
                    cx={cx}
                    cy={cy - h2 - 8}
                    rx="42"
                    ry="20"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.2"
                    strokeDasharray="5 3"
                    className="holo-ring"
                    filter="url(#blueGlow)"
                  />
                  <ellipse
                    cx={cx}
                    cy={cy - h3 - 10}
                    rx="26"
                    ry="12"
                    fill="none"
                    stroke="#f3cf7a"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    className="holo-ring"
                  />
                </g>
              );
            }

            if (mod.moduleId === 'resonance_arch') {
              const archH = 34 + (mod.layer - 1) * 6;
              const leftBase = { x: (p0.x + p3.x) / 2, y: (p0.y + p3.y) / 2 };
              const rightBase = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

              return (
                <g key={mod.uid} onClick={handleModuleClick} className="cursor-pointer">
                  {renderSocketBase()}
                  <path
                    d={`M ${leftBase.x} ${leftBase.y} Q ${cx} ${cy - archH * 1.45} ${rightBase.x} ${rightBase.y} Z`}
                    fill="rgba(56, 189, 248, 0.16)"
                  />
                  <path
                    d={`M ${leftBase.x} ${leftBase.y} Q ${cx} ${cy - archH * 1.5} ${rightBase.x} ${rightBase.y}`}
                    fill="none"
                    stroke="url(#goldMetal)"
                    strokeWidth={6 + mod.layer}
                    strokeLinecap="round"
                    filter="url(#goldGlow)"
                  />
                  <path
                    d={`M ${leftBase.x} ${leftBase.y} Q ${cx} ${cy - archH * 1.5} ${rightBase.x} ${rightBase.y}`}
                    fill="none"
                    stroke="#7dd3fc"
                    strokeWidth="1.2"
                    strokeDasharray="3 4"
                  />
                </g>
              );
            }

            if (mod.moduleId === 'living_field_bus') {
              const h = 8 + (mod.layer - 1) * 4;
              return (
                <g key={mod.uid} onClick={handleModuleClick} className="cursor-pointer">
                  {renderSocketBase()}
                  <polygon
                    points={`${p3.x},${p3.y} ${p2.x},${p2.y} ${p2.x},${p2.y - h} ${p3.x},${p3.y - h}`}
                    fill="#0f292a"
                    stroke="#c99e44"
                    strokeWidth="1"
                  />
                  <polygon
                    points={`${p2.x},${p2.y} ${p1.x},${p1.y} ${p1.x},${p1.y - h} ${p2.x},${p2.y - h}`}
                    fill="#15383a"
                    stroke="#c99e44"
                    strokeWidth="1"
                  />
                  <polygon
                    points={`${p0.x},${p0.y - h} ${p1.x},${p1.y - h} ${p2.x},${p2.y - h} ${p3.x},${p3.y - h}`}
                    fill="url(#livingMat)"
                    stroke="#34d399"
                    strokeWidth="1.1"
                  />
                  {[-12, 0, 12].map((ox, i) => (
                    <circle
                      key={i}
                      cx={cx + ox}
                      cy={cy - h + (i % 2 === 0 ? -2 : 3)}
                      r={mod.isPowered ? 3.2 : 2}
                      fill={mod.isPowered ? '#34d399' : '#1e3a3a'}
                      filter={mod.isPowered ? 'url(#blueGlow)' : undefined}
                    />
                  ))}
                </g>
              );
            }

            if (mod.moduleId === 'vehn_esar_monolith') {
              const baseH = 12;
              const apexY = cy - 48 - (mod.layer - 1) * 6;
              return (
                <g key={mod.uid} onClick={handleModuleClick} className="cursor-pointer">
                  {renderSocketBase()}
                  <ellipse
                    cx={cx}
                    cy={cy}
                    rx="26"
                    ry="13"
                    fill="rgba(243, 207, 122, 0.15)"
                    stroke="#f3cf7a"
                    strokeWidth="1.2"
                  />
                  <g className="floating-artifact">
                    <polygon
                      points={`${cx},${apexY} ${cx - 18},${cy - baseH} ${cx},${cy - baseH + 9}`}
                      fill="#1e2430"
                      stroke="#f3cf7a"
                      strokeWidth="1.2"
                    />
                    <polygon
                      points={`${cx},${apexY} ${cx + 18},${cy - baseH} ${cx},${cy - baseH + 9}`}
                      fill="#2d3648"
                      stroke="#f3cf7a"
                      strokeWidth="1.2"
                    />
                    <circle
                      cx={cx}
                      cy={apexY - 8}
                      r="4.5"
                      fill="#38bdf8"
                      filter="url(#blueGlow)"
                    />
                  </g>
                </g>
              );
            }

            const blockHeight = (mod.moduleId === 'graphite_foundry' ? 24 : 18) + (mod.layer - 1) * 7;
            return (
              <g key={mod.uid} onClick={handleModuleClick} className="cursor-pointer">
                {renderSocketBase()}
                <polygon
                  points={`${p3.x},${p3.y} ${p2.x},${p2.y} ${p2.x},${p2.y - blockHeight} ${p3.x},${p3.y - blockHeight}`}
                  fill="url(#towerLeft)"
                  stroke="#c99e44"
                  strokeWidth="1"
                />
                <polygon
                  points={`${p2.x},${p2.y} ${p1.x},${p1.y} ${p1.x},${p1.y - blockHeight} ${p2.x},${p2.y - blockHeight}`}
                  fill="url(#towerRight)"
                  stroke="#c99e44"
                  strokeWidth="1"
                />
                <polygon
                  points={`${p0.x},${p0.y - blockHeight} ${p1.x},${p1.y - blockHeight} ${p2.x},${p2.y - blockHeight} ${p3.x},${p3.y - blockHeight}`}
                  fill="#222936"
                  stroke="#f3cf7a"
                  strokeWidth="1.2"
                />
                {mod.moduleId === 'graphite_foundry' && (
                  <line
                    x1={(p0.x + p3.x) / 2}
                    y1={(p0.y + p3.y) / 2 - blockHeight}
                    x2={(p1.x + p2.x) / 2}
                    y2={(p1.y + p2.y) / 2 - blockHeight}
                    stroke="#f3cf7a"
                    strokeWidth="2.5"
                  />
                )}
                <ellipse
                  cx={cx}
                  cy={cy - blockHeight}
                  rx="11"
                  ry="5.5"
                  fill={mod.isPowered ? 'rgba(56, 189, 248, 0.45)' : 'rgba(239, 68, 68, 0.25)'}
                  stroke={mod.isPowered ? '#7dd3fc' : '#f87171'}
                  strokeWidth="1.3"
                  filter={mod.isPowered ? 'url(#blueGlow)' : undefined}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Pasek kontroli Zoomu i centrowania widoku */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        className="fixed bottom-24 right-6 z-30 flex items-center gap-1.5 rounded-xl border border-amber-500/35 bg-slate-950/85 px-2.5 py-1.5 text-xs text-slate-200 shadow-xl backdrop-blur-md"
      >
        <button
          onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.15).toFixed(2))))}
          className="h-6 w-6 rounded-md border border-slate-700 bg-slate-900 hover:border-amber-400/60"
          title="Oddal"
        >
          −
        </button>
        <span className="w-11 text-center text-[11px] text-amber-200">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.min(2.6, Number((z + 0.15).toFixed(2))))}
          className="h-6 w-6 rounded-md border border-slate-700 bg-slate-900 hover:border-amber-400/60"
          title="Przybliż"
        >
          +
        </button>
        {(zoom !== 1 || pan.x !== 0 || pan.y !== 0) && (
          <button
            onClick={handleResetView}
            className="ml-1 rounded-md border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-200 hover:bg-amber-500/25"
            title="Przywróć domyślny kadr"
          >
            Centruj
          </button>
        )}
      </div>

      {/* Panel inspekcji gniazda + Karta Kolekcjonerska NFT */}
      {activeModule && activeCfg && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="fixed right-6 top-20 z-30 w-76 rounded-2xl border border-amber-500/40 bg-slate-950/92 p-4 text-slate-100 shadow-2xl backdrop-blur-md"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-amber-300">{activeCfg.name}</h3>
              <p className="mt-0.5 text-xs text-slate-400">
                Warstwa: <span className="text-amber-200">{activeModule.layer}</span> /{' '}
                {activeCfg.maxLayers}
              </p>
            </div>
            <button
              onClick={() => setSelectedUid(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                activeModule.isPowered ? 'bg-sky-400 shadow-[0_0_8px_#38bdf8]' : 'bg-rose-500'
              }`}
            />
            <span>
              {activeModule.isPowered
                ? 'Obwód zasilany przez Procesor'
                : 'Brak połączenia z Magistralą!'}
            </span>
          </div>

          {/* Karta Kolekcjonerska NFT dla Artefaktów Lumina */}
          {activeCfg.nftSlotType === 'LUMINA_ARTIFACT' && (
            <div className="mt-3.5 rounded-xl border border-amber-400/35 bg-gradient-to-br from-slate-900 via-slate-950 to-amber-950/20 p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-amber-300">
                  Slot Kontraktu Lumina NFT
                </span>
                <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-200">
                  dNFT • Warstwa {activeModule.layer}
                </span>
              </div>

              {activeModule.nftTokenId ? (
                <div className="mt-2 space-y-1 text-[11px]">
                  <p className="text-emerald-300">✓ Zarejestrowano w kolekcji gracza</p>
                  <p className="text-slate-400">
                    Token ID: <span className="font-mono text-amber-200">{activeModule.nftTokenId}</span>
                  </p>
                </div>
              ) : (
                <div className="mt-2">
                  <p className="text-[11px] text-slate-400">
                    {walletAddress
                      ? 'Portfel gotowy. Przypisz ten artefakt do swojego adresu.'
                      : 'Połącz portfel u góry ekranu, aby przypisać artefakt.'}
                  </p>
                  <button
                    disabled={!walletAddress}
                    onClick={() => onBindNftArtifact(activeModule.uid)}
                    className={`mt-2 w-full rounded-lg border py-1.5 text-[11px] font-semibold transition ${
                      walletAddress
                        ? 'border-amber-400/60 bg-amber-500/25 text-amber-100 hover:bg-amber-500/35'
                        : 'cursor-not-allowed border-slate-800 bg-slate-900 text-slate-500'
                    }`}
                  >
                    {walletAddress ? 'Wybij / Przypisz NFT (Lumina)' : 'Wymagany Portfel Web3'}
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex gap-2">
            {activeModule.layer < (activeCfg.maxLayers ?? 1) && (
              <button
                onClick={() => onUpgradeModule(activeModule.uid)}
                className="flex-1 rounded-lg border border-amber-400/50 bg-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-200 hover:bg-amber-500/30"
              >
                + Nałóż warstwę ({50 * activeModule.layer} Lumina)
              </button>
            )}
            {activeModule.moduleId !== 'cpu_core' && (
              <button
                onClick={() => {
                  onRemoveModule(activeModule.uid);
                  setSelectedUid(null);
                }}
                className="rounded-lg border border-rose-500/40 bg-rose-950/50 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-900/50"
              >
                Usuń
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}