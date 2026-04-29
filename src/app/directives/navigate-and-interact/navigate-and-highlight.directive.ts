import { Directive, input, inject } from '@angular/core';
import { NavigateAndHighlightService } from 'app/directives/navigate-and-interact/navigate-and-highlight.service';

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
