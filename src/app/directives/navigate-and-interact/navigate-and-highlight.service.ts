import { Inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subscription, timer } from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class NavigateAndHighlightService {
  private prevHighlightDiv: HTMLDivElement | null = null;
  private prevSubscription: Subscription | null = null;
  private clickOutsideListener: ((event: MouseEvent) => void) | null = null;

  constructor(
    private router: Router,
    @Inject(WINDOW) private window: Window,
  ) {}

  navigateAndHighlight(route: string[], hash: string): void {
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
  }

  createOverlay(targetElement: HTMLElement): void {
    if (!targetElement) return;

    this.cleanupPreviousHighlight();

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

    const updatePosition = (): void => this.updateOverlayPosition(targetElement, this.prevHighlightDiv);
    this.window.addEventListener('scroll', updatePosition, true);

    this.prevSubscription = timer(2150).pipe(untilDestroyed(this)).subscribe(() => {
      this.cleanupPreviousHighlight();
      this.window.removeEventListener('scroll', updatePosition, true);
    });

    targetElement.addEventListener(
      'click',
      () => {
        this.cleanupPreviousHighlight();
        this.window.removeEventListener('scroll', updatePosition, true);
      },
      { once: true },
    );

    this.addClickOutsideListener(targetElement);
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

  private addClickOutsideListener(targetElement: HTMLElement): void {
    this.clickOutsideListener = (event: MouseEvent) => {
      if (!targetElement.contains(event.target as Node)) {
        this.cleanupPreviousHighlight();
      }
    };

    this.window.document.addEventListener('click', this.clickOutsideListener, true);
  }

  private cleanupPreviousHighlight(): void {
    if (this.prevHighlightDiv) {
      this.prevHighlightDiv.remove();
      this.prevHighlightDiv = null;
    }

    if (this.prevSubscription) {
      this.prevSubscription.unsubscribe();
      this.prevSubscription = null;
    }

    if (this.clickOutsideListener) {
      this.window.document.removeEventListener('click', this.clickOutsideListener, true);
      this.clickOutsideListener = null;
    }
  }
}
