import {
  Directive, ElementRef, input, OnChanges, OnDestroy, output, Renderer2,
} from '@angular/core';
import { Timeout } from 'app/interfaces/timeout.interface';

/**
 * Directive that handles CSS animation-based removal of elements from the DOM.
 * Similar to the proposed Angular animate.out helper.
 *
 * Usage:
 * <div
 *   [animateOut]="shouldRemove"
 *   animateOutClass="fade-out"
 *   (animateOutComplete)="onRemoved()">
 * </div>
 *
 * TODO: May not be necessary in the future: https://github.com/angular/angular/discussions/62212
 */
@Directive({
  selector: '[animateOut]',
  standalone: true,
})
export class AnimateOutDirective implements OnChanges, OnDestroy {
  readonly animateOut = input(false);
  readonly animateOutClass = input('');
  readonly animateOutDuration = input(300); // Default timeout in ms
  readonly animateOutComplete = output();

  private timeoutId: Timeout | null = null;
  private animationEndListener: (() => void) | null = null;

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private renderer: Renderer2,
  ) {}

  ngOnChanges(): void {
    if (this.animateOut()) {
      this.triggerAnimateOut();
    }
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private triggerAnimateOut(): void {
    const element = this.elementRef.nativeElement;

    if (this.animateOutClass()) {
      // Add the animation class
      this.renderer.addClass(element, this.animateOutClass());

      // Listen for animation/transition end
      this.animationEndListener = () => {
        this.cleanup();
        this.animateOutComplete.emit();
      };

      // Listen for both animationend and transitionend
      element.addEventListener('animationend', this.animationEndListener);
      element.addEventListener('transitionend', this.animationEndListener);

      // Fallback timeout in case animation events don't fire
      this.timeoutId = setTimeout(() => {
        this.cleanup();
        this.animateOutComplete.emit();
      }, this.animateOutDuration());
    } else {
      // No animation class, emit immediately
      this.animateOutComplete.emit();
    }
  }

  private cleanup(): void {
    const element = this.elementRef.nativeElement;

    if (this.animationEndListener) {
      element.removeEventListener('animationend', this.animationEndListener);
      element.removeEventListener('transitionend', this.animationEndListener);
      this.animationEndListener = null;
    }

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}
