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

  onClick(): void {
    this.navigateAndHighlight.navigateAndHighlight(this.navigateRoute(), this.navigateHash());
  }
}
