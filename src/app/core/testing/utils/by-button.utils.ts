import { DOMSelector } from '@ngneat/spectator';
import { byText } from '@ngneat/spectator/jest';
import { SelectorMatcherOptions } from '@testing-library/dom';

export function byButton(label: string, options?: SelectorMatcherOptions): DOMSelector {
  return byText(label, {
    selector: 'button, button span',
    ...options,
  });
}
