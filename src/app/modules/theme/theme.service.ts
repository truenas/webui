import { Inject, Injectable } from '@angular/core';
import { TinyColor } from '@ctrl/tinycolor';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { WINDOW } from 'app/helpers/window.helper';
import { Theme } from 'app/interfaces/theme.interface';
import { allThemes, defaultTheme } from 'app/modules/theme/theme.constants';
import { ThemeUtils } from 'app/modules/theme/utils/theme-utils';
import { AppState } from 'app/store';
import { themeNotFound } from 'app/store/preferences/preferences.actions';
import { selectTheme } from 'app/store/preferences/preferences.selectors';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  defaultTheme = defaultTheme.name;
  activeTheme = this.defaultTheme;
  activeTheme$ = new BehaviorSubject<string>(this.defaultTheme);

  allThemes: Theme[] = allThemes;
  loadTheme$ = new Subject<string>();

  private utils = new ThemeUtils();

  get isDefaultTheme(): boolean {
    return this.activeTheme === this.defaultTheme;
  }

  constructor(
    private store$: Store<AppState>,
    @Inject(WINDOW) private window: Window,
  ) {
    this.loadTheme$.subscribe(() => {
      const savedTheme = this.window.sessionStorage.getItem('theme') || defaultTheme.name;

      if (savedTheme) {
        this.onThemeChanged(savedTheme);
      }
    });

    this.store$.select(selectTheme).pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe((theme: string) => {
      this.window.sessionStorage.setItem('theme', theme);
      this.onThemeChanged(theme);
    });
  }

  onThemeChanged(theme: string): void {
    this.activeTheme = theme;
    this.activeTheme$.next(theme);
    const selectedTheme = this.findTheme(this.activeTheme);

    this.setCssVars(selectedTheme);
    this.updateThemeInLocalStorage(selectedTheme);
  }

  updateThemeInLocalStorage(theme: Theme): void {
    this.window.localStorage.setItem('theme', theme.name);
    this.window.localStorage.setItem('bg1', theme?.bg1);
    this.window.localStorage.setItem('fg1', theme?.fg1);
  }

  resetToDefaultTheme(): void {
    this.store$.dispatch(themeNotFound());
  }

  currentTheme(): Theme {
    return this.findTheme(this.activeTheme);
  }

  findTheme(name: string): Theme {
    const existingTheme = this.allThemes.find((theme) => theme.name === name);
    if (existingTheme) {
      return existingTheme;
    }

    this.resetToDefaultTheme();
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
        const txtColor = this.utils.textContrast(swatch, theme.bg2);
        document.documentElement.style.setProperty('--' + color + '-txt', txtColor);
      }

      document.documentElement.style.setProperty('--' + color, swatch);
    });

    // Add Black White and Grey Variables
    document.documentElement.style.setProperty('--black', '#000000');
    document.documentElement.style.setProperty('--white', '#ffffff');
    document.documentElement.style.setProperty('--grey', '#989898');

    // Add neutral focus color
    document.documentElement.style.setProperty('--focus-bg', 'rgba(122, 122, 122, .55)');
    document.documentElement.style.setProperty('--focus-brd', 'rgba(255, 255, 255, .25)');

    // Set Material palette colors
    document.documentElement.style.setProperty('--primary', theme.primary);
    document.documentElement.style.setProperty('--accent', theme.accent);

    // Set Material aux. text styles
    const primaryColor = this.utils.colorFromMeta(theme.primary) as keyof Theme; // eg. blue
    const accentColor = this.utils.colorFromMeta(theme.accent) as keyof Theme; // eg. yellow
    const primaryTextColor = this.utils.textContrast(theme[primaryColor] as string, theme.bg2);
    const accentTextColor = this.utils.textContrast(theme[accentColor] as string, theme.bg2);

    document.documentElement.style.setProperty('--primary-txt', primaryTextColor);
    document.documentElement.style.setProperty('--accent-txt', accentTextColor);
    document.documentElement.style.setProperty('--highlight', accentTextColor);

    // Set line colors
    const isDark: boolean = this.darkTest(theme.bg2);
    const lineColor = isDark ? 'var(--dark-theme-lines)' : 'var(--light-theme-lines)';
    document.documentElement.style.setProperty('--lines', lineColor);

    // Set multiple background color contrast options
    const contrastSrc = theme.bg2;
    const contrastPrimary = theme[primaryColor] as string;
    const contrastDarker = new TinyColor(contrastSrc).darken(5).toHslString();
    const contrastDarkest = new TinyColor(contrastSrc).darken(10).toHslString();
    const contrastLighter = new TinyColor(contrastSrc).lighten(5).toHslString();
    const contrastLightest = new TinyColor(contrastSrc).lighten(10).toHslString();
    const primaryLightest = new TinyColor(contrastPrimary).lighten(5).toHslString();

    document.documentElement.style.setProperty('--contrast-darker', contrastDarker);
    document.documentElement.style.setProperty('--contrast-darkest', contrastDarkest);
    document.documentElement.style.setProperty('--contrast-lighter', contrastLighter);
    document.documentElement.style.setProperty('--contrast-lightest', contrastLightest);
    document.documentElement.style.setProperty('--primary-lighter', primaryLightest);

    let topbarTextColor;
    if (!theme['topbar-txt'] && theme.topbar) {
      topbarTextColor = this.utils.textContrast(theme.topbar, theme.bg2);
      document.documentElement.style.setProperty('--topbar-txt', topbarTextColor);
    } else if (!theme['topbar-txt'] && !theme.topbar) {
      topbarTextColor = this.utils.textContrast(theme[primaryColor] as string, theme.bg2);
      document.documentElement.style.setProperty('--topbar-txt', topbarTextColor);
    }
  }

  darkTest(css: string): boolean {
    return new TinyColor(css).isDark();
  }

  isDarkTheme(name: string = this.activeTheme): boolean {
    const theme = this.findTheme(name);
    return this.darkTest(theme.bg2);
  }

  /**
   * Gets color pattern for active theme
   * @returns array of colors
   */
  getColorPattern(): string[] {
    return [this.currentTheme().accentColors, [...Array(50).values()]].flat().map((color: Theme['accentColors'][0]) => {
      if (color) {
        return this.currentTheme()[color];
      }
      return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
    });
  }

  getRgbBackgroundColorByIndex(index: number): string {
    return this.getColorPattern()[index];
  }

  getActiveTheme(): Theme {
    let theme: Theme = defaultTheme;
    const storedTheme = this.window.localStorage.getItem('theme');

    if (storedTheme) {
      theme = this.findTheme(storedTheme);
    }

    return theme;
  }
}
