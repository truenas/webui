import {
  Directive, effect, input, untracked,
} from '@angular/core';
import { AccessGateDirective } from 'app/directives/has-access/access-gate.directive';

@Directive({
  selector: '[ixHasAccess]',
})
export class HasAccessDirective extends AccessGateDirective {
  readonly ixHasAccess = input.required<boolean>();

  constructor() {
    super();
    effect(() => {
      const hasAccess = this.ixHasAccess();
      untracked(() => this.renderAccess(hasAccess));
    });
  }
}
