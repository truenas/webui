import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';
import { LanguageService } from 'app/modules/language/language.service';
import { WINDOW } from 'app/helpers/window.helper';

@Component({
  selector: 'ix-root',
  template: '<router-outlet></router-outlet>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
})
export class AppComponent {
  private title = inject(Title);
  private language = inject(LanguageService);
  private window = inject<Window>(WINDOW);

  constructor() {
    this.title.setTitle('HarborNavi - ' + this.window.location.hostname);
    this.language.setLanguageFromBrowser().subscribe();
    this.setFavicon(this.window.matchMedia('(prefers-color-scheme: dark)').matches);
    this.window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
      this.setFavicon(event.matches);
    });
  }

  private setFavicon(isDarkMode: boolean): void {
    const path = isDarkMode
      ? 'assets/images/harbor_ondark_favicon.png'
      : 'assets/images/harbor_favicon.png';
    const existingLinkElement = document.querySelector('link[rel=icon]');

    if (existingLinkElement) {
      (existingLinkElement as HTMLLinkElement).href = path;
      return;
    }

    const link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    link.href = path;
    document.getElementsByTagName('head')[0].appendChild(link);
  }
}
