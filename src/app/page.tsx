'use client';

import React, { useEffect, useState } from 'react';
import IsoMotherboard from '@/components/board/IsoMotherboard';
import ScenicBackdrop from '@/components/board/ScenicBackdrop';
import AmbienceController from '@/components/hud/AmbienceController';
import CoreQuests from '@/components/hud/CoreQuests';
import WalletConnectButton from '@/components/hud/WalletConnectButton';
import { MODULES, ResourceType } from '@/config/modules';
import { PlacedModule, recalculateCircuitPower } from '@/lib/circuitSolver';

const SAVE_KEY = 'elarion_save_v3';
const INITIAL_PLATES = ['1,1'];

const INITIAL_RESOURCES: Record<ResourceType, number> = {
  lumina: 500,
  essence: 250,
  graphite: 80,
  crystal: 0,
  ether: 0,
};

const INITIAL_MODULES: PlacedModule[] = recalculateCircuitPower(
  [
    { uid: 'core-1', moduleId: 'cpu_core', x: 10, y: 10, w: 4, h: 4, layer: 1, isPowered: true },
    { uid: 'tr-1', moduleId: 'gold_trace', x: 11, y: 9, w: 1, h: 1, layer: 1, isPowered: true },
    { uid: 'sock-1', moduleId: 'light_socket', x: 8, y: 8, w: 2, h: 2, layer: 1, isPowered: true },
  ],
  INITIAL_PLATES
);

export default function ElarionGamePage() {
  const [resources, setResources] = useState<Record<ResourceType, number>>(INITIAL_RESOURCES);
  const [unlockedPlates, setUnlockedPlates] = useState<string[]>(INITIAL_PLATES);
  const [placedModules, setPlacedModules] = useState<PlacedModule[]>(INITIAL_MODULES);
  const [claimedQuestIds, setClaimedQuestIds] = useState<string[]>([]);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [offlineBanner, setOfflineBanner] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const savedPlates: string[] = parsed.unlockedPlates ?? INITIAL_PLATES;
        const savedModules: PlacedModule[] = recalculateCircuitPower(
          parsed.placedModules ?? INITIAL_MODULES,
          savedPlates
        );
        const savedResources: Record<ResourceType, number> = {
          ...INITIAL_RESOURCES,
          ...(parsed.resources ?? {}),
        };
        const lastSavedAt: number = parsed.lastSavedAt ?? Date.now();
        const elapsedSeconds = Math.min(Math.floor((Date.now() - lastSavedAt) / 1000), 86400);

        if (elapsedSeconds > 10) {
          const gained: Partial<Record<ResourceType, number>> = {};
          for (const mod of savedModules) {
            const cfg = MODULES[mod.moduleId];
            if (!cfg?.provides.productionPerHour) continue;
            if (cfg.requiresCircuit && !mod.isPowered) continue;

            const { resource, amount } = cfg.provides.productionPerHour;
            const produced = ((amount * mod.layer) / 3600) * elapsedSeconds;
            savedResources[resource] = Number((savedResources[resource] + produced).toFixed(2));
            gained[resource] = (gained[resource] ?? 0) + produced;
          }

          const summary = Object.entries(gained)
            .filter(([, val]) => (val ?? 0) >= 1)
            .map(([res, val]) => `+${Math.floor(val ?? 0)} ${res}`)
            .join(', ');

          if (summary) {
            setOfflineBanner(`Podczas Twojej nieobecności Rdzeń wygenerował: ${summary}`);
            setTimeout(() => setOfflineBanner(null), 7000);
          }
        }

        setUnlockedPlates(savedPlates);
        setPlacedModules(savedModules);
        setResources(savedResources);
        setClaimedQuestIds(parsed.claimedQuestIds ?? []);
        setWalletAddress(parsed.walletAddress ?? null);
      }
    } catch (e) {
      console.error('Błąd odczytu zapisu Elarion:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        resources,
        unlockedPlates,
        placedModules,
        claimedQuestIds,
        walletAddress,
        lastSavedAt: Date.now(),
      })
    );
  }, [resources, unlockedPlates, placedModules, claimedQuestIds, walletAddress, isLoaded]);

  const totalResonance = placedModules.reduce((acc, m) => {
    const cfg = MODULES[m.moduleId];
    return acc + (cfg?.provides.resonance ?? 0) * m.layer;
  }, 0);

  const totalGuardians = placedModules.reduce((acc, m) => {
    const cfg = MODULES[m.moduleId];
    return acc + (cfg?.provides.guardians ?? 0) * m.layer;
  }, 0);

  useEffect(() => {
    if (!isLoaded) return;
    const timer = setInterval(() => {
      setResources((prev) => {
        const next = { ...prev };
        for (const mod of placedModules) {
          const cfg = MODULES[mod.moduleId];
          if (!cfg?.provides.productionPerHour) continue;
          if (cfg.requiresCircuit && !mod.isPowered) continue;

          const { resource, amount } = cfg.provides.productionPerHour;
          const perSecond = ((amount * mod.layer) / 3600) * 10;
          next[resource] = Number((next[resource] + perSecond).toFixed(2));
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [placedModules, isLoaded]);

  const nextPlateCost = {
    lumina: 200 * unlockedPlates.length,
    graphite: 40 * unlockedPlates.length,
  };

  const handleUnlockPlate = (px: number, py: number) => {
    const key = `${px},${py}`;
    if (unlockedPlates.includes(key)) return;
    if (resources.lumina < nextPlateCost.lumina || resources.graphite < nextPlateCost.graphite) {
      return;
    }

    setResources((prev) => ({
      ...prev,
      lumina: Number((prev.lumina - nextPlateCost.lumina).toFixed(2)),
      graphite: Number((prev.graphite - nextPlateCost.graphite).toFixed(2)),
    }));

    const nextPlates = [...unlockedPlates, key];
    setUnlockedPlates(nextPlates);
    setPlacedModules((prev) => recalculateCircuitPower(prev, nextPlates));
  };

  const handlePlaceModule = (x: number, y: number) => {
    if (!selectedModuleId) return;
    const cfg = MODULES[selectedModuleId];
    if (!cfg) return;

    for (const [res, cost] of Object.entries(cfg.cost)) {
      if ((resources[res as ResourceType] ?? 0) < (cost ?? 0)) return;
    }

    setResources((prev) => {
      const next = { ...prev };
      for (const [res, cost] of Object.entries(cfg.cost)) {
        next[res as ResourceType] -= cost ?? 0;
      }
      return next;
    });

    const newMod: PlacedModule = {
      uid: `mod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      moduleId: cfg.id,
      x,
      y,
      w: cfg.size.w,
      h: cfg.size.h,
      layer: 1,
      isPowered: false,
      nftTokenId: null,
    };

    setPlacedModules((prev) => recalculateCircuitPower([...prev, newMod], unlockedPlates));
    if (cfg.id !== 'gold_trace') {
      setSelectedModuleId(null);
    }
  };

  const handleUpgradeModule = (uid: string) => {
    const target = placedModules.find((m) => m.uid === uid);
    if (!target) return;
    const upgradeCostLumina = 50 * target.layer;
    if (resources.lumina < upgradeCostLumina) return;

    setResources((prev) => ({
      ...prev,
      lumina: Number((prev.lumina - upgradeCostLumina).toFixed(2)),
    }));

    setPlacedModules((prev) =>
      prev.map((m) => (m.uid === uid ? { ...m, layer: m.layer + 1 } : m))
    );
  };

  const handleRemoveModule = (uid: string) => {
    setPlacedModules((prev) =>
      recalculateCircuitPower(
        prev.filter((m) => m.uid !== uid),
        unlockedPlates
      )
    );
  };

  const handleClaimQuestReward = (
    questId: string,
    reward: Partial<Record<ResourceType, number>>
  ) => {
    if (claimedQuestIds.includes(questId)) return;
    setResources((prev) => {
      const next = { ...prev };
      for (const [res, val] of Object.entries(reward)) {
        next[res as ResourceType] = Number((next[res as ResourceType] + (val ?? 0)).toFixed(2));
      }
      return next;
    });
    setClaimedQuestIds((prev) => [...prev, questId]);
  };

  const handleBindNftArtifact = (uid: string) => {
    const tokenSerial = Math.floor(1300 + Math.random() * 8600);
    setPlacedModules((prev) =>
      prev.map((m) => (m.uid === uid ? { ...m, nftTokenId: `#LV-${tokenSerial}` } : m))
    );
  };

  const handleResetBoard = () => {
    localStorage.removeItem(SAVE_KEY);
    setUnlockedPlates(INITIAL_PLATES);
    setResources(INITIAL_RESOURCES);
    setPlacedModules(INITIAL_MODULES);
    setClaimedQuestIds([]);
    setSelectedModuleId(null);
  };

  return (
    <main className="relative h-screen w-screen text-slate-100 overflow-hidden">
      <ScenicBackdrop />
      <AmbienceController />

      {/* System Zadań Rdzenia */}
      <CoreQuests
        context={{
          placedModules,
          unlockedPlates,
          totalResonance,
          totalGuardians,
        }}
        claimedQuestIds={claimedQuestIds}
        onClaimReward={handleClaimQuestReward}
      />

      {/* Górny HUD z przyciskiem Portfela */}
      <header className="fixed left-1/2 top-3 z-30 flex w-[95%] max-w-6xl -translate-x-1/2 items-center justify-between rounded-2xl border border-amber-500/35 bg-slate-950/85 px-6 py-2.5 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-5 text-xs">
          <div>
            <span className="text-slate-400">Lumina: </span>
            <span className="font-semibold text-amber-300">{Math.floor(resources.lumina)}</span>
          </div>
          <div>
            <span className="text-slate-400">Esencja: </span>
            <span className="font-semibold text-sky-300">{Math.floor(resources.essence)}</span>
          </div>
          <div>
            <span className="text-slate-400">Grafit: </span>
            <span className="font-semibold text-slate-200">{Math.floor(resources.graphite)}</span>
          </div>
        </div>

        <div className="text-center">
          <h1 className="font-serif text-lg tracking-[0.28em] text-amber-300">ELARION</h1>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-slate-400">Płyty: </span>
            <span className="font-semibold text-amber-200">{unlockedPlates.length}/9</span>
          </div>
          <div>
            <span className="text-slate-400">Rezonans: </span>
            <span className="font-semibold text-amber-300">{totalResonance}</span>
          </div>
          <div>
            <span className="text-slate-400">Stróżowie: </span>
            <span className="font-semibold text-emerald-300">{totalGuardians}</span>
          </div>

          <WalletConnectButton
            walletAddress={walletAddress}
            onConnect={(addr) => setWalletAddress(addr)}
            onDisconnect={() => setWalletAddress(null)}
          />

          <button
            onClick={handleResetBoard}
            title="Resetuj płytę do stanu początkowego"
            className="rounded-md border border-slate-700 px-2 py-1 text-[10px] text-slate-400 hover:border-rose-500/50 hover:text-rose-300"
          >
            Reset
          </button>
        </div>
      </header>

      {offlineBanner && (
        <div className="fixed left-1/2 top-16 z-30 -translate-x-1/2 rounded-full border border-sky-400/40 bg-slate-900/95 px-5 py-1.5 text-xs text-sky-200 shadow-lg backdrop-blur-md">
          {offlineBanner}
        </div>
      )}

      <section className="relative z-10 flex h-full w-full items-center justify-center pt-14 pb-20">
        <IsoMotherboard
          unlockedPlates={unlockedPlates}
          nextPlateCost={nextPlateCost}
          placedModules={placedModules}
          selectedModuleId={selectedModuleId}
          walletAddress={walletAddress}
          onPlaceModule={handlePlaceModule}
          onUpgradeModule={handleUpgradeModule}
          onRemoveModule={handleRemoveModule}
          onUnlockPlate={handleUnlockPlate}
          onBindNftArtifact={handleBindNftArtifact}
        />
      </section>

      <footer className="fixed bottom-3 left-1/2 z-30 flex w-[95%] max-w-6xl -translate-x-1/2 items-center justify-start xl:justify-center gap-2.5 overflow-x-auto rounded-2xl border border-amber-500/35 bg-slate-950/90 px-4 py-2.5 shadow-2xl backdrop-blur-md">
        {Object.values(MODULES)
          .filter((m) => m.id !== 'cpu_core')
          .map((mod) => {
            const isSelected = selectedModuleId === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => setSelectedModuleId(isSelected ? null : mod.id)}
                className={`flex shrink-0 flex-col items-start rounded-xl border px-3.5 py-2 text-left transition ${
                  isSelected
                    ? 'border-sky-400 bg-sky-950/60 shadow-[0_0_15px_rgba(56,189,248,0.3)]'
                    : 'border-amber-500/25 bg-slate-900/70 hover:border-amber-400/60'
                }`}
              >
                <span className="text-xs font-medium text-amber-200">{mod.name}</span>
                <span className="mt-0.5 text-[10px] text-slate-400">
                  {mod.size.w}x{mod.size.h} •{' '}
                  {Object.entries(mod.cost)
                    .map(([k, v]) => `${v} ${k}`)
                    .join(', ')}
                </span>
              </button>
            );
          })}
      </footer>
    </main>
  );
}