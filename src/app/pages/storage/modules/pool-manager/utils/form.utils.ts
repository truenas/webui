import { FormControl } from '@angular/forms';
import { isEqual } from 'lodash-es';
import { Option } from 'app/interfaces/option.interface';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';

export function unsetControlIfNoMatchingOption(
  control: FormControl<unknown>,
  options: Option<unknown>[],
): void {
  const currentValue = control.value;
  const hasMatchingOption = options.some((option) => option.value === currentValue);
  if (!hasMatchingOption) {
    setValueIfNotSame(control, null);
  }
}

export function setValueIfNotSame(
  control: FormControl<unknown>,
  value: unknown,
): void {
  if (control.value === value) {
    return;
  }

  control.setValue(value);
}

export function hasDeepChanges<T>(
  changes: IxSimpleChanges<T>,
  key: keyof T,
): boolean {
  return changes[key]?.currentValue
    && !isEqual(changes[key].currentValue, changes[key].previousValue);
}
