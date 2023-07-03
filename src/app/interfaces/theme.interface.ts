export interface Theme {
  name: string;
  description: string;
  label: string;
  labelSwatch?: string;
  accentColors: ('blue' | 'orange' | 'cyan' | 'violet' | 'yellow' | 'magenta' | 'red' | 'green' | 'pink' | 'aqua' | 'tomato' | 'teal' | 'slategray' | 'salmon')[];
  topbar?: string; // CSS var from palette. Defaults to primary
  'topbar-txt'?: string; // Text color for topbar. Will be auto generated if nothing is set
  primary: string;
  accent: string;
  bg1: string;
  bg2: string;
  fg1: string;
  fg2: string;
  'alt-bg1': string;
  'alt-bg2': string;
  'alt-fg1': string;
  'alt-fg2': string;
  yellow: string;
  orange: string;
  red: string;
  magenta: string;
  violet: string;
  blue: string;
  cyan: string;
  green: string;
  pink: string;
  aqua: string;
  tomato: string;
  teal: string;
  slategray: string;
  salmon: string;
}
