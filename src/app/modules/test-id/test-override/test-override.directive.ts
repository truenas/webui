import {
  Directive,
  Input,
} from '@angular/core';

/**
 * Overrides nested ixTest attribute.
 *
 * Example usage: put on ix-input to override nested ixTest directive on <input>
 */
@Directive({
  selector: '[ixTestOverride]',
})
export class TestOverrideDirective {
  @Input('ixTestOverride') overrideDescription: number | string | (string | number)[];
}
