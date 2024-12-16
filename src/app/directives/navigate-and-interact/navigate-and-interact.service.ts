import { Inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { timer } from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';

@UntilDestroy()
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
    htmlElement.scrollIntoView({ block: 'center' });
    this.createOverlay(htmlElement);
    htmlElement.click();
  }

  createOverlay(targetElement: HTMLElement): void {
    if (!targetElement) return;

    const overlay: HTMLDivElement | null = this.window.document.createElement('div');

    const rect = targetElement.getBoundingClientRect();
    overlay.style.position = 'absolute';
    overlay.style.top = `${rect.top + this.window.scrollY}px`;
    overlay.style.left = `${rect.left + this.window.scrollX}px`;
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;
    overlay.style.border = '2px solid var(--primary)';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '1000';

    this.window.document.body.appendChild(overlay);
    this.updateOverlayPosition(targetElement, overlay);

    this.window.addEventListener('scroll', () => {
      this.updateOverlayPosition(targetElement, overlay);
    }, true);
    timer(2150).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.removeOverlay(overlay);
      },
    });
  }

  private updateOverlayPosition(targetElement: HTMLElement, overlay: HTMLDivElement | null): void {
    if (!targetElement || !overlay) return;

    const rect = targetElement.getBoundingClientRect();

    const scrollTop = this.window.pageYOffset || this.window.document.documentElement.scrollTop;
    const scrollLeft = this.window.pageXOffset || this.window.document.documentElement.scrollLeft;

    overlay.style.top = `${rect.top + scrollTop}px`;
    overlay.style.left = `${rect.left + scrollLeft}px`;
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;
  }

  removeOverlay(overlay: HTMLDivElement | null): void {
    if (overlay) {
      overlay.remove();
      overlay = null;
    }
  }
}
