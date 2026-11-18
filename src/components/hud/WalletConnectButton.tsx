'use client';

import React from 'react';

interface WalletConnectButtonProps {
  walletAddress: string | null;
  onConnect: (address: string) => void;
  onDisconnect: () => void;
}

export default function WalletConnectButton({
  walletAddress,
  onConnect,
  onDisconnect,
}: WalletConnectButtonProps) {
  const handleConnectClick = async () => {
    const eth = (window as unknown as { ethereum?: { request: (args: { method: string }) => Promise<string[]> } }).ethereum;

    if (eth) {
      try {
        const accounts = await eth.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts[0]) {
          onConnect(accounts[0]);
          return;
        }
      } catch (err) {
        console.error('Anulowano połączenie portfela:', err);
        return;
      }
    }

    // Tryb podglądu (gdy przeglądarka nie ma zainstalowanego MetaMaska/Rabby)
    onConnect('0x71C9...VehnEsar');
  };

  if (walletAddress) {
    const shortAddr =
      walletAddress.length > 16
        ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
        : walletAddress;

    return (
      <button
        onClick={onDisconnect}
        title="Kliknij, aby rozłączyć portfel"
        className="flex items-center gap-1.5 rounded-lg border border-sky-400/45 bg-sky-950/60 px-2.5 py-1 text-[11px] font-medium text-sky-200 hover:border-rose-400/50 hover:text-rose-200"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_#38bdf8]" />
        {shortAddr}
      </button>
    );
  }

  return (
    <button
      onClick={handleConnectClick}
      className="rounded-lg border border-amber-400/50 bg-amber-500/15 px-3 py-1 text-[11px] font-medium text-amber-200 transition hover:bg-amber-500/25"
    >
      Połącz Portfel
    </button>
  );
}