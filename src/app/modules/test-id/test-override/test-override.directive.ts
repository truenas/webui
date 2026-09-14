import {
  Directive, input,
} from '@angular/core';

/**
 * Overrides nested ixTest attribute.
 *
 * Example usage: put on a control component to override the nested ixTest directive on its
 * inner `<input>`.
 */
@Directive({
  selector: '[ixTestOverride]',
})
export class TestOverrideDirective {
  readonly overrideDescription = input<number | string | (string | number)[] | undefined>(
    undefined,
    { alias: 'ixTestOverride' },
  );

  readonly keepLastPart = input<boolean>();
}
