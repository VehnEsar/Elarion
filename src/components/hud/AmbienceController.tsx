'use client';

import React, { useEffect, useRef, useState } from 'react';

function parseYouTubeEmbedUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const listId = url.searchParams.get('list');
    const videoId =
      url.searchParams.get('v') ||
      (url.hostname.includes('youtu.be') ? url.pathname.replace('/', '') : null);

    if (listId && !videoId) {
      return `https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(listId)}&autoplay=1`;
    }
    if (videoId && listId) {
      return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?list=${encodeURIComponent(listId)}&autoplay=1`;
    }
    if (videoId) {
      return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1&loop=1&playlist=${encodeURIComponent(videoId)}`;
    }
  } catch {
    return null;
  }
  return null;
}

export default function AmbienceController() {
  const [is432Playing, setIs432Playing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [ytInput, setYtInput] = useState('');
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [ytError, setYtError] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  // Wczytanie zapisanego linku YouTube
  useEffect(() => {
    const savedLink = localStorage.getItem('elarion_yt_ambience');
    if (savedLink) {
      setYtInput(savedLink);
      const parsed = parseYouTubeEmbedUrl(savedLink);
      if (parsed) setEmbedUrl(parsed);
    }
  }, []);

  // Generator ciepłego rezonansu 432 Hz (Web Audio API)
  const toggle432Hz = () => {
    if (is432Playing) {
      if (masterGainRef.current && audioCtxRef.current) {
        masterGainRef.current.gain.setTargetAtTime(0.0001, audioCtxRef.current.currentTime, 0.4);
      }
      setIs432Playing(false);
      return;
    }

    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.0001, ctx.currentTime);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(620, ctx.currentTime);

      // Harmoniczne oparte na 432 Hz: 216 Hz (oktawa niżej), 432 Hz (rdzeń), 648 Hz (kwinta czysta)
      const freqs = [216, 432, 648];
      const gains = [0.09, 0.06, 0.025];

      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = i === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        oscGain.gain.setValueAtTime(gains[i], ctx.currentTime);

        osc.connect(oscGain);
        oscGain.connect(filter);
        osc.start();
      });

      filter.connect(master);
      master.connect(ctx.destination);

      audioCtxRef.current = ctx;
      masterGainRef.current = master;
    }

    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setTargetAtTime(0.45, audioCtxRef.current.currentTime, 0.8);
    }
    setIs432Playing(true);
  };

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  const handleApplyYouTube = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseYouTubeEmbedUrl(ytInput);
    if (!parsed) {
      setYtError('Wklej poprawny link do filmu lub playlisty YouTube.');
      return;
    }
    setYtError(null);
    setEmbedUrl(parsed);
    localStorage.setItem('elarion_yt_ambience', ytInput.trim());
  };

  const handleStopYouTube = () => {
    setEmbedUrl(null);
    setYtInput('');
    localStorage.removeItem('elarion_yt_ambience');
  };

  return (
    <div className="fixed left-5 top-20 z-30 flex flex-col items-start gap-2">
      {/* Pasek szybkiego sterowania dźwiękiem */}
      <div className="flex items-center gap-2 rounded-xl border border-amber-500/35 bg-slate-950/85 px-3 py-1.5 text-xs shadow-xl backdrop-blur-md">
        <button
          onClick={toggle432Hz}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition ${
            is432Playing
              ? 'bg-sky-500/25 text-sky-200 border border-sky-400/50 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
              : 'bg-slate-900 text-amber-200/80 border border-amber-500/25 hover:border-amber-400/60'
          }`}
        >
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              is432Playing ? 'bg-sky-400 animate-pulse' : 'bg-amber-500/50'
            }`}
          />
          {is432Playing ? '432 Hz: Aktywny' : 'Rezonans 432 Hz'}
        </button>

        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className={`rounded-lg border px-2.5 py-1 transition ${
            embedUrl
              ? 'border-amber-400/60 bg-amber-500/20 text-amber-200'
              : 'border-slate-700 bg-slate-900/80 text-slate-300 hover:border-amber-500/40'
          }`}
        >
          {embedUrl ? 'YouTube ♪' : '+ Własne YT'}
        </button>
      </div>

      {/* Rozwijane okienko do wklejenia własnego linku / playlisty YouTube */}
      {isOpen && (
        <div className="w-80 rounded-2xl border border-amber-500/40 bg-slate-950/92 p-4 text-xs text-slate-200 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-amber-300">Tło Muzyczne / Playlista YT</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white"
              title="Zminimalizuj (muzyka gra dalej w tle)"
            >
              —
            </button>
          </div>

          <form onSubmit={handleApplyYouTube} className="flex flex-col gap-2">
            <input
              type="text"
              value={ytInput}
              onChange={(e) => setYtInput(e.target.value)}
              placeholder="Wklej link do filmu lub playlisty YouTube..."
              className="w-full rounded-lg border border-amber-500/30 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-sky-400 focus:outline-none"
            />
            {ytError && <p className="text-[11px] text-rose-400">{ytError}</p>}

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 rounded-lg border border-amber-400/50 bg-amber-500/20 py-1.5 font-medium text-amber-200 hover:bg-amber-500/30"
              >
                Odtwórz
              </button>
              {embedUrl && (
                <button
                  type="button"
                  onClick={handleStopYouTube}
                  className="rounded-lg border border-rose-500/40 bg-rose-950/50 px-3 py-1.5 text-rose-300 hover:bg-rose-900/50"
                >
                  Wyłącz
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Odtwarzacz YouTube (zostaje aktywny w tle nawet po zminimalizowaniu okienka) */}
      {embedUrl && (
        <div
          className={`overflow-hidden rounded-xl border border-amber-500/30 bg-black shadow-xl transition-all ${
            isOpen ? 'w-80 h-44 opacity-100' : 'w-1 h-1 opacity-0 pointer-events-none'
          }`}
        >
          <iframe
            src={embedUrl}
            title="Elarion Ambience Player"
            className="h-full w-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        </div>
      )}
    </div>
  );
}