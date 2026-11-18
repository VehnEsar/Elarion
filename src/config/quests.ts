import { ResourceType } from './modules';
import { PlacedModule } from '@/lib/circuitSolver';

export interface QuestContext {
  placedModules: PlacedModule[];
  unlockedPlates: string[];
  totalResonance: number;
  totalGuardians: number;
}

export interface QuestDefinition {
  id: string;
  title: string;
  description: string;
  reward: Partial<Record<ResourceType, number>>;
  checkCompleted: (ctx: QuestContext) => boolean;
}

export const CORE_QUESTS: QuestDefinition[] = [
  {
    id: 'q_first_circuit',
    title: 'I. Pierwszy Impuls',
    description: 'Upewnij się, że Gniazdo Sanktuarium jest zasilane przez Rdzeń Procesora.',
    reward: { lumina: 150, essence: 50 },
    checkCompleted: ({ placedModules }) =>
      placedModules.some((m) => m.moduleId === 'light_socket' && m.isPowered),
  },
  {
    id: 'q_second_layer',
    title: 'II. Architektura Warstwowa',
    description: 'Kliknij dowolny moduł na płycie i nałóż na niego 2. warstwę ulepszeń.',
    reward: { lumina: 200, graphite: 40 },
    checkCompleted: ({ placedModules }) => placedModules.some((m) => m.layer >= 2),
  },
  {
    id: 'q_plate_expansion',
    title: 'III. Płyta do Płyty',
    description: 'Dołącz sąsiednią płytę rozszerzeń przez złote złącza krawędziowe.',
    reward: { lumina: 300, essence: 100 },
    checkCompleted: ({ unlockedPlates }) => unlockedPlates.length >= 2,
  },
  {
    id: 'q_living_field',
    title: 'IV. Matryca Życia',
    description: 'Postaw Matrycę Żyjącego Pola i doprowadź do niej Magistralę Przepływu.',
    reward: { lumina: 250, graphite: 80 },
    checkCompleted: ({ placedModules }) =>
      placedModules.some((m) => m.moduleId === 'living_field_bus' && m.isPowered),
  },
  {
    id: 'q_resonance_250',
    title: 'V. Złota Harmonia',
    description: 'Osiągnij łączny poziom Rezonansu królestwa wynoszący minimum 250.',
    reward: { lumina: 500, graphite: 120 },
    checkCompleted: ({ totalResonance }) => totalResonance >= 250,
  },
  {
    id: 'q_vehn_esar',
    title: "VI. Artefakt Vehn'Esar",
    description: "Wznieś Koprocesor Vehn'Esar i zarejestruj go w gnieździe kolekcjonerskim.",
    reward: { lumina: 1000, essence: 300 },
    checkCompleted: ({ placedModules }) =>
      placedModules.some((m) => m.moduleId === 'vehn_esar_monolith'),
  },
];