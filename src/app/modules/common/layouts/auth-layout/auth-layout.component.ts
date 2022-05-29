import { Component, OnInit } from '@angular/core';
import { Theme } from 'app/interfaces/theme.interface';
import { LanguageService } from 'app/services/language.service';
import { defaultTheme } from 'app/services/theme/theme.constants';

@Component({
  selector: 'ix-auth-layout',
  templateUrl: './auth-layout.component.html',
})
export class AuthLayoutComponent implements OnInit {
  private theme: Theme = defaultTheme;

  constructor(public language: LanguageService) {
    // Translator init
    language.setLanguageFromBrowser();
  }

  ngOnInit(): void {
    this.setCssVars(this.theme);
  }

  setCssVars(theme: Theme): void {
    const palette = Object.keys(theme) as (keyof Theme)[];
    palette.splice(0, 6);

    const adminLayoutElement = document.getElementsByTagName('IX-AUTH-LAYOUT')[0] as HTMLElement;

    palette.forEach((color) => {
      adminLayoutElement.style.setProperty('--' + color, theme[color] as string);
      document.documentElement.style.setProperty('--' + color, theme[color] as string);
    });
    adminLayoutElement.style.setProperty('--primary', theme['primary']);
    adminLayoutElement.style.setProperty('--accent', theme['accent']);
    document.documentElement.style.setProperty('--primary', theme['primary']);
    document.documentElement.style.setProperty('--accent', theme['accent']);
  }
}
