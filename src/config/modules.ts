export type ResourceType = 'lumina' | 'essence' | 'graphite' | 'crystal' | 'ether';

export interface ModuleConfig {
  id: string;
  name: string;
  category: 'core' | 'trace' | 'generator' | 'manufactory' | 'capacitor' | 'artifact';
  size: { w: number; h: number };
  requiresCircuit: boolean;
  maxLayers: number; // Ile warstw ulepszeń można nałożyć na ten socket
  cost: Partial<Record<ResourceType, number>>;
  provides: {
    guardians?: number; // Stróżowie Światła (Populacja)
    resonance?: number; // Rezonans (Harmonia)
    productionPerHour?: { resource: ResourceType; amount: number };
  };
  nftSlotType?: 'LUMINA_ARTIFACT' | 'EXPANSION_BOARD' | null;
}

export const MODULES: Record<string, ModuleConfig> = {
  cpu_core: {
    id: 'cpu_core',
    name: 'Rdzeń Procesora (Wieża Centralna)',
    category: 'core',
    size: { w: 4, h: 4 },
    requiresCircuit: false,
    maxLayers: 10,
    cost: {},
    provides: { guardians: 50, resonance: 100 },
    nftSlotType: null,
  },
  gold_trace: {
    id: 'gold_trace',
    name: 'Magistrala Złotego Przepływu',
    category: 'trace',
    size: { w: 1, h: 1 },
    requiresCircuit: false,
    maxLayers: 3, // Warstwa 1: Zwykła, Warstwa 2: Złota, Warstwa 3: Holograficzna (+Rezonans)
    cost: { lumina: 15 },
    provides: { resonance: 2 },
    nftSlotType: null,
  },
  light_socket: {
    id: 'light_socket',
    name: 'Gniazdo Sanktuarium (Kondensator Światła)',
    category: 'generator',
    size: { w: 2, h: 2 },
    requiresCircuit: true,
    maxLayers: 5,
    cost: { lumina: 60, essence: 20 },
    provides: {
      guardians: 25,
      productionPerHour: { resource: 'lumina', amount: 120 },
    },
    nftSlotType: null,
  },
  living_field_bus: {
    id: 'living_field_bus',
    name: 'Matryca Żyjącego Pola',
    category: 'generator',
    size: { w: 3, h: 2 },
    requiresCircuit: true,
    maxLayers: 5,
    cost: { lumina: 80, essence: 10 },
    provides: {
      productionPerHour: { resource: 'essence', amount: 90 },
    },
    nftSlotType: null,
  },
  graphite_foundry: {
    id: 'graphite_foundry',
    name: 'Procesor Grafitu Runicznego',
    category: 'manufactory',
    size: { w: 3, h: 3 },
    requiresCircuit: true,
    maxLayers: 5,
    cost: { lumina: 250, essence: 120 },
    provides: {
      productionPerHour: { resource: 'graphite', amount: 30 },
    },
    nftSlotType: null,
  },
  resonance_arch: {
    id: 'resonance_arch',
    name: 'Mostek Złotego Rezonansu',
    category: 'capacitor',
    size: { w: 2, h: 1 },
    requiresCircuit: false, // Działa autonomicznie na wolnych polach laminatu
    maxLayers: 3,
    cost: { lumina: 140, essence: 50 },
    provides: { resonance: 65 },
    nftSlotType: null,
  },
  vehn_esar_monolith: {
    id: 'vehn_esar_monolith',
    name: "Koprocesor Vehn'Esar (Artefakt)",
    category: 'artifact',
    size: { w: 3, h: 3 },
    requiresCircuit: false,
    maxLayers: 5,
    cost: { lumina: 500, graphite: 100 },
    provides: {
      resonance: 250,
      productionPerHour: { resource: 'ether', amount: 15 },
    },
    nftSlotType: 'LUMINA_ARTIFACT', // Gotowe gniazdo pod przyszłe podpięcie kontraktu NFT Lumina
  },
};