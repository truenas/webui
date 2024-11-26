import {
  Directive, HostListener, input,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { NavigateAndInteractService } from 'app/directives/navigate-and-interact/navigate-and-interact.service';

@UntilDestroy()
@Directive({
  selector: '[ixNavigateAndInteract]',
  standalone: true,
})
export class NavigateAndInteractDirective {
  readonly navigateRoute = input.required<string[]>();
  readonly navigateHash = input.required<string>();

  constructor(private navigateAndInteract: NavigateAndInteractService) {}

  @HostListener('click')
  onClick(): void {
    this.navigateAndInteract.navigateAndInteract(this.navigateRoute(), this.navigateHash());
  }
}
