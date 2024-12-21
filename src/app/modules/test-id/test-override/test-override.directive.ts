import {
  Directive, input,
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
  readonly overrideDescription = input<number | string | (string | number)[] | undefined>(
    undefined,
  { alias: 'ixTestOverride' },
  );

  readonly keepLastPart = input<boolean>();
}
