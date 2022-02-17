export interface Theme {
  name: string;
  description: string;
  label: string;
  labelSwatch?: string;
  accentColors: ('blue' | 'orange' | 'cyan' | 'violet' | 'yellow' | 'magenta' | 'red' | 'green')[];
  topbar?: string; // CSS var from palette. Defaults to primary
  'topbar-txt'?: string; // Text color for topbar. Will be auto generated if nothing is set

  /**
   * @deprecated Hasn't been used since the theme switcher was in the topbar
   */
  favorite?: boolean;
  /**
   * @deprecated logo colors are set with CSS now
   */
  hasDarkLogo?: boolean;
  /**
   * @deprecated Themes haven't used this in a couple of releases now
   */
  logoPath?: string;
  /**
   * @deprecated Themes haven't used this in a couple of releases now
   */
  logoTextPath?: string;
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
}
