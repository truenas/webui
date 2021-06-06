import { Component, OnInit } from '@angular/core';
import { LanguageService } from 'app/services/language.service';
import { Theme, DefaultTheme } from 'app/services/theme/theme.service';

@Component({
  selector: 'app-auth-layout',
  templateUrl: './auth-layout.component.html',
})
export class AuthLayoutComponent implements OnInit {
  private theme: Theme = DefaultTheme;

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

    const admin_layout_el = document.getElementsByTagName('APP-AUTH-LAYOUT')[0] as HTMLElement;

    palette.forEach((color) => {
      admin_layout_el.style.setProperty('--' + color, theme[color] as string);
      document.documentElement.style.setProperty('--' + color, theme[color] as string);
    });
    admin_layout_el.style.setProperty('--primary', theme['primary']);
    admin_layout_el.style.setProperty('--accent', theme['accent']);
    document.documentElement.style.setProperty('--primary', theme['primary']);
    document.documentElement.style.setProperty('--accent', theme['accent']);
  }
}
