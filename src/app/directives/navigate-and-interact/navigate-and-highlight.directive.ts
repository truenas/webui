import {
  Directive, HostListener, input,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { NavigateAndHighlightService } from 'app/directives/navigate-and-interact/navigate-and-highlight.service';

@UntilDestroy()
@Directive({
  selector: '[ixNavigateAndHighlight]',
  standalone: true,
})
export class NavigateAndHighlightDirective {
  readonly navigateRoute = input.required<string[]>();
  readonly navigateHash = input.required<string>();

  constructor(private navigateAndHighlight: NavigateAndHighlightService) {}

  @HostListener('click')
  onClick(): void {
    this.navigateAndHighlight.navigateAndHighlight(this.navigateRoute(), this.navigateHash());
  }
}
