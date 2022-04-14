import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { select, Store } from '@ngrx/store';
import { filter } from 'rxjs/operators';
import { ThemeUtils } from 'app/core/classes/theme-utils/theme-utils';
import { Theme } from 'app/interfaces/theme.interface';
import { WebSocketService } from 'app/services';
import { CoreService } from 'app/services/core-service/core.service';
import { allThemes, defaultTheme } from 'app/services/theme/theme.constants';
import { AppState } from 'app/store';
import { themeNotFound } from 'app/store/preferences/preferences.actions';
import { selectTheme } from 'app/store/preferences/preferences.selectors';

@UntilDestroy()
@Injectable()
export class ThemeService {
  activeTheme = 'default';
  defaultTheme = defaultTheme.name;
  activeThemeSwatch: string[];

  // Theme lists
  allThemes: Theme[] = allThemes;

  private utils: ThemeUtils;

  userThemeLoaded = false;
  constructor(
    private ws: WebSocketService,
    private core: CoreService,
    private store$: Store<AppState>,
  ) {
    this.utils = new ThemeUtils();

    // Set default list
    this.core.register({ observerClass: this, eventName: 'ThemeDataRequest' }).pipe(untilDestroyed(this)).subscribe(() => {
      this.core.emit({ name: 'ThemeData', data: this.findTheme(this.activeTheme), sender: this });
    });

    this.store$.pipe(
      select(selectTheme),
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe((theme: string) => this.onThemeChanged(theme));
  }

  onThemeChanged(theme: string): void {
    this.activeTheme = this.getNormalizedThemeName(theme);
    this.setCssVars(this.findTheme(this.activeTheme, true));
    this.userThemeLoaded = true;
    this.core.emit({ name: 'ThemeChanged', data: this.findTheme(this.activeTheme), sender: this });
  }

  getNormalizedThemeName(theme: string): string {
    return theme === 'default' ? this.defaultTheme : theme;
  }

  resetToDefaultTheme(): void {
    this.store$.dispatch(themeNotFound());
  }

  get isDefaultTheme(): boolean {
    return this.activeTheme === this.defaultTheme;
  }

  currentTheme(): Theme {
    return this.findTheme(this.activeTheme);
  }

  findTheme(name: string, reset?: boolean): Theme {
    name = this.getNormalizedThemeName(name);

    const theme = this.allThemes.find((theme) => theme.name === name);
    if (theme) {
      return theme;
    }

    // Optionally reset if not found
    this.resetToDefaultTheme();

    if (!reset) {
      // TODO: Weird condition
      console.warn('Theme ' + name + ' not found and reset not initiated.');
    }

    return defaultTheme;
  }

  setCssVars(theme: Theme): void {
    // Sets CSS Custom Properties for an entire theme
    const keys = Object.keys(theme) as (keyof Theme)[];

    // Filter out deprecated properties and meta properties
    const palette = keys.filter((attribute) => {
      return !['label', 'logoPath', 'logoTextPath', 'favorite', 'labelSwatch', 'description', 'name'].includes(attribute);
    });

    palette.forEach((color) => {
      const swatch = theme[color] as string;

      // Generate aux. text styles
      if (this.allThemes[0].accentColors.includes(color as Theme['accentColors'][number])) {
        const txtColor = this.utils.textContrast(swatch, theme['bg2']);
        document.documentElement.style.setProperty('--' + color + '-txt', txtColor);
      }

      document.documentElement.style.setProperty('--' + color, swatch);
    });

    // Add Black White and Grey Variables
    document.documentElement.style.setProperty('--black', '#000000');
    document.documentElement.style.setProperty('--white', '#ffffff');
    document.documentElement.style.setProperty('--grey', '#989898');

    // Add neutral focus color
    document.documentElement.style.setProperty('--focus-bg', 'rgba(122, 122, 122, .25)');
    document.documentElement.style.setProperty('--focus-brd', 'rgba(255, 255, 255, .25)');

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
    const contrastPrimary = theme[primaryColor] as string;
    const contrastDarker = this.utils.darken(contrastSrc, 5);
    const contrastDarkest = this.utils.darken(contrastSrc, 10);
    const contrastLighter = this.utils.lighten(contrastSrc, 5);
    const contrastLightest = this.utils.lighten(contrastSrc, 10);
    const primaryLightest = this.utils.lighten(contrastPrimary, 5);

    document.documentElement.style.setProperty('--contrast-darker', contrastDarker);
    document.documentElement.style.setProperty('--contrast-darkest', contrastDarkest);
    document.documentElement.style.setProperty('--contrast-lighter', contrastLighter);
    document.documentElement.style.setProperty('--contrast-lightest', contrastLightest);
    document.documentElement.style.setProperty('--primary-lighter', primaryLightest);

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
