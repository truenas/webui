import { FormControl } from '@angular/forms';
import { Option } from 'app/interfaces/option.interface';

export function unsetControlIfNoMatchingOption(
  formGroup: FormControl,
  options: Option[],
): void {
  const hasMatchingOption = options.some((option) => option.value === formGroup.value);
  if (!hasMatchingOption) {
    formGroup.setValue(null, { emitEvent: false });
  }
}
