'use client';

import React, { useState } from 'react';
import { CORE_QUESTS, QuestContext } from '@/config/quests';
import { ResourceType } from '@/config/modules';

interface CoreQuestsProps {
  context: QuestContext;
  claimedQuestIds: string[];
  onClaimReward: (questId: string, reward: Partial<Record<ResourceType, number>>) => void;
}

export default function CoreQuests({
  context,
  claimedQuestIds,
  onClaimReward,
}: CoreQuestsProps) {
  const [minimized, setMinimized] = useState(false);

  const currentQuest = CORE_QUESTS.find((q) => !claimedQuestIds.includes(q.id));
  const completedCount = claimedQuestIds.length;

  if (!currentQuest) {
    return (
      <div className="fixed bottom-24 left-5 z-30 rounded-xl border border-amber-500/35 bg-slate-950/85 px-4 py-2 text-xs text-amber-200 shadow-xl backdrop-blur-md">
        ✦ Wszystkie Zadania Rdzenia ukończone ({completedCount}/{CORE_QUESTS.length})
      </div>
    );
  }

  const isReady = currentQuest.checkCompleted(context);

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className={`fixed bottom-24 left-5 z-30 flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs shadow-xl backdrop-blur-md transition ${
          isReady
            ? 'border-sky-400 bg-sky-950/90 text-sky-200 shadow-[0_0_15px_rgba(56,189,248,0.35)]'
            : 'border-amber-500/35 bg-slate-950/85 text-amber-200'
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full ${
            isReady ? 'bg-sky-400 animate-ping' : 'bg-amber-400'
          }`}
        />
        Zadania ({completedCount}/{CORE_QUESTS.length})
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 left-5 z-30 w-72 rounded-2xl border border-amber-500/40 bg-slate-950/90 p-3.5 text-xs text-slate-200 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-amber-400/80">
          Zadanie Rdzenia ({completedCount + 1}/{CORE_QUESTS.length})
        </span>
        <button
          onClick={() => setMinimized(true)}
          className="text-slate-400 hover:text-white"
          title="Zwiń panel zadań"
        >
          —
        </button>
      </div>

      <h4 className="mt-1 font-semibold text-amber-200">{currentQuest.title}</h4>
      <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
        {currentQuest.description}
      </p>

      <div className="mt-2.5 flex items-center justify-between border-t border-slate-800 pt-2">
        <span className="text-[10px] text-slate-400">
          Nagroda:{' '}
          <strong className="text-amber-300">
            {Object.entries(currentQuest.reward)
              .map(([res, val]) => `+${val} ${res}`)
              .join(', ')}
          </strong>
        </span>
      </div>

      {isReady ? (
        <button
          onClick={() => onClaimReward(currentQuest.id, currentQuest.reward)}
          className="mt-2.5 w-full rounded-lg border border-sky-400/70 bg-sky-500/25 py-1.5 font-semibold text-sky-100 shadow-[0_0_15px_rgba(56,189,248,0.3)] transition hover:bg-sky-500/35"
        >
          ✦ Odbierz nagrodę
        </button>
      ) : (
        <div className="mt-2.5 rounded-lg border border-slate-800 bg-slate-900/60 py-1 text-center text-[10px] text-slate-400">
          W toku...
        </div>
      )}
    </div>
  );
}