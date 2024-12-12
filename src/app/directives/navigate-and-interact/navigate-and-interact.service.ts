import { Inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { WINDOW } from 'app/helpers/window.helper';

@Injectable({
  providedIn: 'root',
})
export class NavigateAndInteractService {
  constructor(
    private router: Router,
    @Inject(WINDOW) private window: Window,
  ) {}

  navigateAndInteract(route: string[], hash: string): void {
    this.router.navigate(route, { fragment: hash }).then(() => {
      setTimeout(() => {
        const htmlElement = this.window.document.getElementById(hash);
        if (htmlElement) {
          this.scrollIntoView(htmlElement);
        }
      }, 150);
    });
  }

  scrollIntoView(htmlElement: HTMLElement): void {
    const highlightedClass = 'highlighted-element';
    htmlElement.scrollIntoView({ block: 'center' });
    htmlElement.classList.add(highlightedClass);
    htmlElement.click();
    setTimeout(() => htmlElement.classList.remove(highlightedClass), 2150);
  }
}
