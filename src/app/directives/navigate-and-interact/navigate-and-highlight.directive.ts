import { Directive, input, inject } from '@angular/core';
import { NavigateAndHighlightService } from 'app/directives/navigate-and-interact/navigate-and-highlight.service';

@Directive({
  selector: '[ixNavigateAndHighlight]',
  host: {
    '(click)': 'onClick()',
    '(keydown.enter)': 'onClick()',
    '(keydown.space)': 'onSpace($event)',
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

  /**
   * Hosts are usually anchors without an `href`, so the browser gives them no keyboard
   * activation of their own. Space would otherwise scroll the page instead of navigating.
   */
  onSpace(event: Event): void {
    event.preventDefault();
    this.onClick();
  }
}
