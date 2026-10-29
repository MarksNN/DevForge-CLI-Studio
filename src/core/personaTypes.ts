export type PersonaState =
  | 'idle'
  | 'listening'
  | 'planning'
  | 'working'
  | 'collaborating'
  | 'waiting'
  | 'needs_approval'
  | 'blocked'
  | 'error'
  | 'completed'
  | 'learning';

export interface PersonaAppearance {
  silhouette: string;
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  eyesStyle: 'digital' | 'lens' | 'visor' | 'particles' | 'none';
  shapeType: 'geometric' | 'crystalline' | 'neural' | 'modular' | 'mechanical' | 'fluid' | 'waveform';
  accessories: string[];
}

export interface PersonaPersonality {
  archetype: string;
  temperament: string;
  communicationStyle: string;
  formality: number; // 0.0 a 1.0
  humor: number; // 0.0 a 1.0
  detailLevel: number; // 0.0 a 1.0
  proactivity: number; // 0.0 a 1.0
  catchphrase?: string;
}

export interface PersonaVoiceSettings {
  enabled: boolean;
  voiceProfile: string;
  pitch: number;
  rate: number;
}

export interface PersonaProfile {
  agent_id: string; // "00".."25", "01A", "06A", "08A"
  official_name: string; // "NEXO", "FORJA", "SAFIRA", etc.
  display_name: string;
  role: string;
  specialty: string;
  appearance: PersonaAppearance;
  personality: PersonaPersonality;
  voice: PersonaVoiceSettings;
  customization: {
    allow_rename: boolean;
    allow_color_change: boolean;
    allow_accessories: boolean;
    allow_voice_change: boolean;
  };
  state: PersonaState;
  updated_at: string;
}
