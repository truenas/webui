import {
  Directive, input,
  Input,
} from '@angular/core';

/**
 * Overrides nested ixTest attribute.
 *
 * Example usage: put on ix-input to override nested ixTest directive on <input>
 */
@Directive({
  selector: '[ixTestOverride]',
  standalone: true,
})
export class TestOverrideDirective {
  // eslint-disable-next-line @angular-eslint/prefer-signals
  @Input('ixTestOverride') overrideDescription: number | string | (string | number)[];
  readonly keepLastPart = input<boolean>();
}
