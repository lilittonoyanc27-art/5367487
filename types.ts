export type OptionKey = 'A' | 'B' | 'C' | 'D';

export interface OptionItem {
  key: OptionKey;
  es: string;
  hy: string;
}

export interface Question {
  id: number;
  es: string;
  hy: string;
  options: OptionItem[];
  correct: OptionKey;
  explanationEs?: string;
  explanationHy?: string;
}

export interface WheelSector {
  label: string;
  points: number;
  color: string;
  type: 'points' | 'double' | 'open_letter' | 'bankrupt';
}
