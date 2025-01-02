import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Theme } from 'app/interfaces/theme.interface';
import { LanguageService } from 'app/modules/language/language.service';
import { ThemeService } from 'app/modules/theme/theme.service';

@Component({
  selector: 'ix-blank-layout',
  templateUrl: './blank-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterOutlet],
})
export class BlankLayoutComponent implements OnInit {
  constructor(
    public language: LanguageService,
    private themeService: ThemeService,
  ) {
    // Translator init
    language.setLanguageFromBrowser();
  }

  ngOnInit(): void {
    this.setCssVars(this.themeService.getActiveTheme());
  }

  setCssVars(theme: Theme): void {
    const palette = Object.keys(theme) as (keyof Theme)[];
    palette.splice(0, 6);

    const adminLayoutElement = document.getElementsByTagName('IX-BLANK-LAYOUT')[0] as HTMLElement;

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
