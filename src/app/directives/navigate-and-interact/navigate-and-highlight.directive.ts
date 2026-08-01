import { Directive, input, inject } from '@angular/core';
import { NavigateAndHighlightService } from 'app/directives/navigate-and-interact/navigate-and-highlight.service';

/**
 * Navigates to a route and highlights an element there. Reacts to `click` only, so the host
 * element must be natively activatable (a `<button>` or a real link) — that way keyboard
 * activation comes from the platform instead of hand-rolled key handlers, and putting the
 * directive on a `<button>` can't fire twice for a single Enter press.
 */
@Directive({
  selector: '[ixNavigateAndHighlight]',
  host: {
    '(click)': 'onClick()',
  },
})
export class NavigateAndHighlightDirective {
  private navigateAndHighlight = inject(NavigateAndHighlightService);

  readonly navigateRoute = input.required<string[]>();
  readonly navigateHash = input.required<string>();

  /**
   * When true, the highlight on the destination element is drawn inset
   * (inside its edges). Use for master-detail cards whose surrounding
   * scroll container would clip an outset outline.
   */
  readonly navigateInset = input(false);

  onClick(): void {
    this.navigateAndHighlight.navigateAndHighlight(this.navigateRoute(), this.navigateHash(), {
      inset: this.navigateInset(),
    });
  }
}
