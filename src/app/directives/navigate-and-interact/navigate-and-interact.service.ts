import { Inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subscription, timer } from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class NavigateAndInteractService {
  private prevHighlightDiv: HTMLDivElement | null;
  private prevSubscription: Subscription | null;
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

    if (this.prevHighlightDiv) {
      this.removeOverlay(this.prevHighlightDiv);
      this.prevHighlightDiv = null;
      if (this.prevSubscription) {
        this.prevSubscription.unsubscribe();
        this.prevSubscription = null;
      }
    }

    this.prevHighlightDiv = this.window.document.createElement('div');

    const rect = targetElement.getBoundingClientRect();
    this.prevHighlightDiv.style.position = 'absolute';
    this.prevHighlightDiv.style.top = `${rect.top + this.window.scrollY}px`;
    this.prevHighlightDiv.style.left = `${rect.left + this.window.scrollX}px`;
    this.prevHighlightDiv.style.width = `${rect.width}px`;
    this.prevHighlightDiv.style.height = `${rect.height}px`;
    this.prevHighlightDiv.style.border = '2px solid var(--primary)';
    this.prevHighlightDiv.style.pointerEvents = 'none';
    this.prevHighlightDiv.style.zIndex = '1000';

    this.window.document.body.appendChild(this.prevHighlightDiv);
    this.updateOverlayPosition(targetElement, this.prevHighlightDiv);

    this.window.addEventListener('scroll', () => {
      this.updateOverlayPosition(targetElement, this.prevHighlightDiv);
    }, true);

    this.prevSubscription = timer(2150).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.removeOverlay(this.prevHighlightDiv);
        this.prevHighlightDiv = null;
        this.prevSubscription?.unsubscribe();
        this.prevSubscription = null;
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
