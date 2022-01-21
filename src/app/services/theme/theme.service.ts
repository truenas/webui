import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ThemeUtils } from 'app/core/classes/theme-utils/theme-utils';
import { CoreEvent } from 'app/interfaces/events';
import { ThemeChangeRequestEvent } from 'app/interfaces/events/theme-events.interface';
import {
  UserPreferencesChangedEvent,
  UserPreferencesReadyEvent,
} from 'app/interfaces/events/user-preferences-event.interface';
import { WebSocketService } from 'app/services';
import { CoreService } from 'app/services/core-service/core.service';

export const defaultTheme: Theme = {
  name: 'ix-dark',
  label: 'iX Dark',
  labelSwatch: 'blue',
  description: 'TrueNAS 12 default theme',
  accentColors: ['blue', 'magenta', 'orange', 'cyan', 'yellow', 'violet', 'red', 'green'],
  primary: 'var(--blue)',
  topbar: '#111111',
  'topbar-txt': 'var(--fg2)',
  accent: 'var(--alt-bg2)',
  bg1: '#1E1E1E',
  bg2: '#282828', // '#242424',
  fg1: '#fff',
  fg2: 'rgba(255,255,255,0.85)',
  'alt-bg1': '#383838',
  'alt-bg2': '#545454',
  'alt-fg1': 'rgba(194,194,194,0.5)',
  'alt-fg2': '#e1e1e1',
  yellow: '#DED142',
  orange: '#E68D37',
  red: '#CE2929',
  magenta: '#C006C7',
  violet: '#7617D8',
  blue: '#0095D5',
  cyan: '#00d0d6',
  green: '#71BF44',
};

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

@UntilDestroy()
@Injectable()
export class ThemeService {
  readonly freeThemeDefaultIndex = 0;
  activeTheme = 'default';
  defaultTheme = 'ix-dark';
  defaultLightTheme = 'ix-blue';
  activeThemeSwatch: string[];

  // Theme lists
  allThemes: Theme[];
  themesMenu: Theme[];
  private _customThemes: Theme[];

  freenasThemes: Theme[] = [
    defaultTheme,
    {
      name: 'ix-blue',
      label: 'iX Blue',
      labelSwatch: 'blue',
      description: 'Official iX System Colors on light',
      accentColors: ['blue', 'orange', 'cyan', 'violet', 'yellow', 'magenta', 'red', 'green'],
      primary: 'var(--blue)',
      topbar: 'var(--blue)',
      accent: 'var(--yellow)',
      bg1: '#f2f2f2',
      bg2: '#ffffff',
      fg1: '#585858',
      fg2: '#666666',
      'alt-bg1': '#ababab',
      'alt-bg2': '#cdcdcd',
      'alt-fg1': '#181a26',
      'alt-fg2': '#282a36',
      yellow: '#DED142',
      orange: '#E68D37',
      red: '#CE2929',
      magenta: '#C006C7',
      violet: '#7617D8',
      blue: '#0095D5',
      cyan: '#00d0d6',
      green: '#71BF44',
    },
    {
      name: 'dracula',
      label: 'Dracula',
      labelSwatch: 'blue',
      description: 'Dracula color theme',
      accentColors: ['violet', 'orange', 'cyan', 'blue', 'yellow', 'magenta', 'red', 'green'],
      primary: 'var(--blue)',
      topbar: 'var(--blue)',
      'topbar-txt': 'var(--fg1)',
      accent: 'var(--violet)',
      bg1: '#181a26',
      bg2: '#282a36',
      fg1: '#efefef',
      fg2: '#cacac5',
      'alt-bg1': 'rgba(122,122,122,0.25)',
      'alt-bg2': 'rgba(122,122,122,0.5)',
      'alt-fg1': '#f8f8f2',
      'alt-fg2': '#fafaf5',
      yellow: '#f1fa8c',
      orange: '#ffb86c',
      red: '#ff5555',
      magenta: '#ff79c6',
      violet: '#bd93f9',
      blue: '#6272a4',
      cyan: '#8be9fd',
      green: '#50fa7b',
    },
    {
      name: 'nord',
      label: 'Nord',
      labelSwatch: 'blue',
      description: 'Unofficial nord color theme based on https://www.nordtheme.com/',
      accentColors: ['violet', 'orange', 'cyan', 'blue', 'yellow', 'magenta', 'red', 'green'],
      primary: 'var(--cyan)',
      topbar: 'var(--alt-bg2)',
      'topbar-txt': 'var(--fg2)',
      accent: 'var(--blue)',
      bg1: '#2e3440',
      bg2: '#3b4252',
      fg1: '#eceff4',
      fg2: '#e5e9f0',
      'alt-bg1': '#434c5e',
      'alt-bg2': '#4c566a',
      'alt-fg1': '#d8dee9',
      'alt-fg2': '#d8dee9',
      yellow: '#ebcb8b',
      orange: '#d08770',
      red: '#bf616a',
      magenta: '#b48ead',
      violet: '#775daa',
      blue: '#5e81aC',
      cyan: '#88c0d0',
      green: '#a3be8c',
    },
    {
      name: 'paper',
      label: 'Paper',
      labelSwatch: 'blue',
      description: 'FreeNAS 11.2 default theme',
      accentColors: ['violet', 'orange', 'cyan', 'blue', 'yellow', 'magenta', 'red', 'green'],
      primary: 'var(--blue)',
      topbar: 'var(--blue)',
      accent: 'var(--yellow)',
      bg1: '#F2F2F2',
      bg2: '#FAFAFA',
      fg1: '#3f3f3f',
      fg2: '#666666',
      'alt-bg1': '#ababab',
      'alt-bg2': '#cdcdcd',
      'alt-fg1': '#181a26',
      'alt-fg2': '#282a36',
      yellow: '#f0cb00',
      orange: '#ee9302',
      red: '#ff0013',
      magenta: '#d238ff',
      violet: '#c17ecc',
      blue: '#0D5687',
      cyan: '#00d0d6',
      green: '#1F9642',
    },
    {
      name: 'solarized-dark',
      label: 'Solarized Dark',
      labelSwatch: 'bg2',
      description: 'Solarized dark color scheme',
      accentColors: ['blue', 'magenta', 'cyan', 'violet', 'green', 'orange', 'yellow', 'red'],
      primary: 'var(--fg1)',
      topbar: 'var(--fg1)',
      'topbar-txt': '#cdcdcd',
      accent: 'var(--cyan)',
      bg1: '#002b36',
      bg2: '#073642',
      fg1: '#586e75',
      fg2: '#7f99a2',
      'alt-bg1': 'rgba(122,122,122,0.25)',
      'alt-bg2': '#0b4f60', // '#314c54',
      'alt-fg1': '#839496',
      'alt-fg2': '#282a36',
      yellow: '#b58900',
      orange: '#cb4b16',
      red: '#dc322f',
      magenta: '#d33682',
      violet: '#6c71c4',
      blue: '#268bd2',
      cyan: '#2aa198',
      green: '#859900',
    },
    {
      name: 'midnight',
      label: 'Midnight',
      labelSwatch: 'blue',
      description: 'Dark theme with blues and greys',
      accentColors: ['violet', 'orange', 'cyan', 'blue', 'yellow', 'magenta', 'red', 'green'],
      primary: 'var(--blue)',
      topbar: 'var(--blue)',
      'topbar-txt': 'var(--fg2)',
      accent: 'var(--violet)',
      bg1: '#212a35',
      bg2: '#303d48',
      fg1: '#aaaaaa',
      fg2: '#cccccc',
      'alt-bg1': 'rgba(122,122,122,0.25)',
      'alt-bg2': '#6F6E6C',
      'alt-fg1': '#c1c1c1',
      'alt-fg2': '#e1e1e1',
      yellow: '#f0cb00',
      orange: '#ee9302',
      red: '#ff0013',
      magenta: '#d238ff',
      violet: '#c17ecc',
      blue: '#1274b5',
      cyan: '#00d0d6',
      green: '#1F9642',
    },
    {
      name: 'high-contrast',
      label: 'High Contrast',
      labelSwatch: 'fg1',
      description: 'High contrast theme based on Legacy UI color scheme',
      accentColors: ['green', 'violet', 'orange', 'cyan', 'magenta', 'red', 'yellow', 'blue'],
      primary: 'var(--blue)',
      topbar: 'var(--black)',
      accent: 'var(--magenta)',
      bg1: '#dddddd',
      bg2: '#ffffff',
      fg1: '#222222',
      fg2: '#333333',
      'alt-bg1': '#ababab',
      'alt-bg2': '#cdcdcd',
      'alt-fg1': '#181a26',
      'alt-fg2': '#282a36',
      yellow: '#f0cb00',
      orange: '#ee9302',
      red: '#ff0013',
      magenta: '#d238ff',
      violet: '#9844b1',
      blue: '#4784ac',
      cyan: '#00d0d6',
      green: '#59d600',
    },
  ];

  savedUserTheme = '';
  globalPreview = false;
  globalPreviewData: any;
  private utils: ThemeUtils;

  userThemeLoaded = false;
  constructor(
    private ws: WebSocketService,
    private core: CoreService,
  ) {
    this.utils = new ThemeUtils();

    // Set default list
    this.allThemes = this.freenasThemes;
    this.themesMenu = this.freenasThemes;

    this.core.register({ observerClass: this, eventName: 'ThemeDataRequest' }).pipe(untilDestroyed(this)).subscribe(() => {
      this.core.emit({ name: 'ThemeData', data: this.findTheme(this.activeTheme), sender: this });
    });

    // Use only for testing
    this.core.register({ observerClass: this, eventName: 'ThemeChangeRequest' }).pipe(untilDestroyed(this)).subscribe((evt: ThemeChangeRequestEvent) => {
      this.changeTheme(evt.data);
      this.core.emit({ name: 'ThemeChanged', data: this.findTheme(this.activeTheme), sender: this });
    });

    this.core.register({ observerClass: this, eventName: 'GlobalPreviewChanged' }).pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      if (evt.data) {
        this.globalPreview = true;
      } else {
        this.globalPreview = false;
      }
      this.globalPreviewData = evt.data;
      if (this.globalPreview) {
        this.setCssVars(evt.data.theme);
      } else if (!this.globalPreview) {
        this.setCssVars(this.findTheme(this.activeTheme));
        this.globalPreviewData = null;
      }
    });

    this.core.register({ observerClass: this, eventName: 'UserPreferencesChanged' }).pipe(untilDestroyed(this)).subscribe((evt: UserPreferencesChangedEvent) => {
      this.onPreferences(evt);
    });

    this.core.register({ observerClass: this, eventName: 'UserPreferencesReady' }).pipe(untilDestroyed(this)).subscribe((evt: UserPreferencesReadyEvent) => {
      this.onPreferences(evt);
    });
  }

  onPreferences(evt: UserPreferencesChangedEvent | UserPreferencesReadyEvent): void {
    if (evt.data.customThemes) {
      this.customThemes = evt.data.customThemes as any;
    }

    this.activeTheme = evt.data.userTheme == 'default' ? this.defaultTheme : evt.data.userTheme;
    this.setCssVars(this.findTheme(this.activeTheme, true));
    this.userThemeLoaded = true;
    this.core.emit({ name: 'ThemeChanged', data: this.findTheme(this.activeTheme), sender: this });

    if (evt.data.allowPwToggle) {
      document.documentElement.style.setProperty('--toggle_pw_display_prop', 'inline');
    } else if (!evt.data.allowPwToggle) {
      document.documentElement.style.setProperty('--toggle_pw_display_prop', 'none');
    }

    if (evt.data.enableWarning) {
      document.documentElement.style.setProperty('--enableWarning', 'inline');
    } else if (!evt.data.allowPwToggle) {
      document.documentElement.style.setProperty('--enableWarning', 'none');
    }
  }

  resetToDefaultTheme(): void {
    this.activeTheme = this.defaultTheme;
    this.changeTheme(this.defaultTheme);
  }

  get isDefaultTheme(): boolean {
    return this.activeTheme == this.defaultTheme;
  }

  currentTheme(): Theme {
    return this.findTheme(this.activeTheme);
  }

  findTheme(name: string, reset?: boolean): Theme {
    if (name === 'default') {
      name = this.defaultTheme;
    }

    const theme = this.allThemes.find((theme) => theme.name == name);
    if (theme) {
      return theme;
    }

    // Optionally reset if not found
    this.resetToDefaultTheme();

    if (!reset) {
      console.warn('Theme ' + name + ' not found and reset not initiated.');
    }

    return this.freenasThemes[this.freeThemeDefaultIndex];
  }

  changeTheme(theme: string): void {
    this.core.emit({ name: 'ChangeThemePreference', data: theme, sender: this });
  }

  saveCurrentTheme(): void {
    const theme = this.currentTheme();
    this.core.emit({ name: 'ChangeThemePreference', data: theme.name });
  }

  setCssVars(theme: Theme): void {
    // Sets CSS Custom Properties for an entire theme
    const keys = Object.keys(theme) as (keyof Theme)[];

    // Filter out deprecated properties and meta properties
    const palette = keys.filter((v) => {
      return !['label', 'logoPath', 'logoTextPath', 'favorite', 'labelSwatch', 'description', 'name'].includes(v);
    });

    palette.forEach((color) => {
      const swatch = theme[color] as string;

      // Generate aux. text styles
      if (this.freenasThemes[0].accentColors.includes(color as Theme['accentColors'][number])) {
        const txtColor = this.utils.textContrast(swatch, theme['bg2']);
        document.documentElement.style.setProperty('--' + color + '-txt', txtColor);
      }

      document.documentElement.style.setProperty('--' + color, swatch);
    });

    // Add Black White and Grey Variables
    document.documentElement.style.setProperty('--black', '#000000');
    document.documentElement.style.setProperty('--white', '#ffffff');
    document.documentElement.style.setProperty('--grey', '#989898');

    // Set Material palette colors
    document.documentElement.style.setProperty('--primary', theme['primary']);
    document.documentElement.style.setProperty('--accent', theme['accent']);

    // Set Material aux. text styles
    const primaryColor = this.utils.colorFromMeta(theme['primary']) as keyof Theme; // eg. blue
    const accentColor = this.utils.colorFromMeta(theme['accent']) as keyof Theme; // eg. yellow
    const primaryTextColor = this.utils.textContrast(theme[primaryColor] as string, theme['bg2']);
    const accentTextColor = this.utils.textContrast(theme[accentColor] as string, theme['bg2']);

    document.documentElement.style.setProperty('--primary-txt', primaryTextColor);
    document.documentElement.style.setProperty('--accent-txt', accentTextColor);
    document.documentElement.style.setProperty('--highlight', accentTextColor);

    // Set line colors
    const isDark: boolean = this.darkTest(theme.bg2);
    const lineColor = isDark ? 'var(--dark-theme-lines)' : 'var(--light-theme-lines)';
    document.documentElement.style.setProperty('--lines', lineColor);

    // Set multiple background color contrast options
    const contrastSrc = theme['bg2'];
    const contrastDarker = this.utils.darken(contrastSrc, 5);
    const contrastDarkest = this.utils.darken(contrastSrc, 10);
    const contrastLighter = this.utils.lighten(contrastSrc, 5);
    const contrastLightest = this.utils.lighten(contrastSrc, 10);

    document.documentElement.style.setProperty('--contrast-darker', contrastDarker);
    document.documentElement.style.setProperty('--contrast-darkest', contrastDarkest);
    document.documentElement.style.setProperty('--contrast-lighter', contrastLighter);
    document.documentElement.style.setProperty('--contrast-lightest', contrastLightest);

    let topbarTextColor;
    if (!theme['topbar-txt'] && theme.topbar) {
      topbarTextColor = this.utils.textContrast(theme.topbar, theme['bg2']);
      document.documentElement.style.setProperty('--topbar-txt', topbarTextColor);
    } else if (!theme['topbar-txt'] && !theme.topbar) {
      topbarTextColor = this.utils.textContrast(theme[primaryColor] as string, theme['bg2']);
      document.documentElement.style.setProperty('--topbar-txt', topbarTextColor);
    }

    // Logo light/dark
    if (theme['hasDarkLogo']) {
      theme.logoPath = 'assets/images/logo.svg';
      theme.logoTextPath = 'assets/images/logo-text.svg';
    } else {
      theme.logoPath = 'assets/images/light-logo.svg';
      theme.logoTextPath = 'assets/images/light-logo-text.svg';
    }
  }

  hexToRgb(str: string): { hex: string; rgb: number[] } {
    return this.utils.hexToRgb(str);
  }

  get customThemes(): Theme[] {
    return this._customThemes;
  }

  set customThemes(customThemes: Theme[]) {
    this._customThemes = customThemes;
    this.allThemes = this.freenasThemes.concat(this.customThemes);
    this.core.emit({ name: 'ThemeListsChanged' });
  }

  darkTest(css: string): boolean {
    const rgb = this.utils.forceRgb(css);
    const hsl = this.utils.rgbToHsl(rgb, false, false);

    return hsl[2] < 50;
  }

  isDarkTheme(name: string = this.activeTheme): boolean {
    const theme = this.findTheme(name);
    return this.darkTest(theme.bg2);
  }
}
