import { Directive, HostListener, input, inject } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { NavigateAndHighlightService } from 'app/directives/navigate-and-interact/navigate-and-highlight.service';

@UntilDestroy()
@Directive({
  selector: '[ixNavigateAndHighlight]',
})
export class NavigateAndHighlightDirective {
  private navigateAndHighlight = inject(NavigateAndHighlightService);

  readonly navigateRoute = input.required<string[]>();
  readonly navigateHash = input.required<string>();

  @HostListener('click')
  onClick(): void {
    this.navigateAndHighlight.navigateAndHighlight(this.navigateRoute(), this.navigateHash());
  }
}
