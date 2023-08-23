import { Component, OnInit, Inject } from '@angular/core';
import { WINDOW } from 'app/helpers/window.helper';
import { Theme } from 'app/interfaces/theme.interface';
import { LanguageService } from 'app/services/language.service';
import { defaultTheme } from 'app/services/theme/theme.constants';
import { ThemeService } from 'app/services/theme/theme.service';

@Component({
  selector: 'ix-auth-layout',
  templateUrl: './auth-layout.component.html',
})
export class AuthLayoutComponent implements OnInit {
  constructor(
    public language: LanguageService,
    private themeService: ThemeService,
    @Inject(WINDOW) private window: Window,
  ) {
    // Translator init
    language.setLanguageFromBrowser();
  }

  ngOnInit(): void {
    let theme: Theme = defaultTheme;
    const storedTheme = this.window.localStorage.getItem('theme');

    if (storedTheme) {
      theme = this.themeService.findTheme(storedTheme);
    }

    this.setCssVars(theme);
  }

  setCssVars(theme: Theme): void {
    const palette = Object.keys(theme) as (keyof Theme)[];
    palette.splice(0, 6);

    const adminLayoutElement = document.getElementsByTagName('IX-AUTH-LAYOUT')[0] as HTMLElement;

    palette.forEach((color) => {
      adminLayoutElement.style.setProperty('--' + color, theme[color] as string);
      document.documentElement.style.setProperty('--' + color, theme[color] as string);
    });
    adminLayoutElement.style.setProperty('--primary', theme.primary);
    adminLayoutElement.style.setProperty('--accent', theme.accent);
    document.documentElement.style.setProperty('--primary', theme.primary);
    document.documentElement.style.setProperty('--accent', theme.accent);
    document.documentElement.style.setProperty('--lines', theme['alt-bg1']);
  }
}
