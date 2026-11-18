export interface PlacedModule {
  uid: string;
  moduleId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  layer: number;
  isPowered: boolean;
  nftTokenId?: string | null;
}

export const PLATE_SIZE = 8;
export const SECTOR_COUNT = 3;

export function isTileUnlocked(x: number, y: number, unlockedPlates: string[]): boolean {
  if (x < 0 || y < 0 || x >= PLATE_SIZE * SECTOR_COUNT || y >= PLATE_SIZE * SECTOR_COUNT) {
    return false;
  }
  const px = Math.floor(x / PLATE_SIZE);
  const py = Math.floor(y / PLATE_SIZE);
  return unlockedPlates.includes(`${px},${py}`);
}

export function recalculateCircuitPower(
  placed: PlacedModule[],
  unlockedPlates: string[]
): PlacedModule[] {
  const traceCells = new Set<string>();
  const core = placed.find((m) => m.moduleId === 'cpu_core');

  if (!core) {
    return placed.map((m) => ({ ...m, isPowered: false }));
  }

  for (const item of placed) {
    if (item.moduleId === 'gold_trace' && isTileUnlocked(item.x, item.y, unlockedPlates)) {
      traceCells.add(`${item.x},${item.y}`);
    }
  }

  const poweredTraces = new Set<string>();
  const queue: Array<[number, number]> = [];

  for (let dx = -1; dx <= core.w; dx++) {
    for (let dy = -1; dy <= core.h; dy++) {
      const isEdge = dx === -1 || dx === core.w || dy === -1 || dy === core.h;
      const isCorner = (dx === -1 || dx === core.w) && (dy === -1 || dy === core.h);
      if (isEdge && !isCorner) {
        const key = `${core.x + dx},${core.y + dy}`;
        if (traceCells.has(key) && !poweredTraces.has(key)) {
          poweredTraces.add(key);
          queue.push([core.x + dx, core.y + dy]);
        }
      }
    }
  }

  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  while (queue.length > 0) {
    const [cx, cy] = queue.shift()!;
    for (const [ox, oy] of dirs) {
      const nx = cx + ox;
      const ny = cy + oy;
      if (!isTileUnlocked(nx, ny, unlockedPlates)) continue;
      const key = `${nx},${ny}`;
      if (traceCells.has(key) && !poweredTraces.has(key)) {
        poweredTraces.add(key);
        queue.push([nx, ny]);
      }
    }
  }

  return placed.map((mod) => {
    if (mod.moduleId === 'cpu_core') return { ...mod, isPowered: true };
    if (mod.moduleId === 'gold_trace') {
      return { ...mod, isPowered: poweredTraces.has(`${mod.x},${mod.y}`) };
    }

    let connected = false;
    for (let dx = -1; dx <= mod.w; dx++) {
      for (let dy = -1; dy <= mod.h; dy++) {
        const isEdge = dx === -1 || dx === mod.w || dy === -1 || dy === mod.h;
        const isCorner = (dx === -1 || dx === mod.w) && (dy === -1 || dy === mod.h);
        if (isEdge && !isCorner) {
          const checkX = mod.x + dx;
          const checkY = mod.y + dy;
          if (poweredTraces.has(`${checkX},${checkY}`)) {
            connected = true;
          }
          if (
            checkX >= core.x &&
            checkX < core.x + core.w &&
            checkY >= core.y &&
            checkY < core.y + core.h
          ) {
            connected = true;
          }
        }
      }
    }

    return { ...mod, isPowered: connected };
  });
}