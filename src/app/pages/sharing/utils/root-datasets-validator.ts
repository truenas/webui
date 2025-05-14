import { AbstractControl } from '@angular/forms';

export const forbiddenRootDatasetsSharingValidatorFn = (control: AbstractControl<string | string[]>): boolean => {
  let path = Array.isArray(control.value) ? control.value : control.value.split('/');
  path = path.filter((pathItem) => !!pathItem);
  if (!path.length) {
    return true;
  }
  if (path[0].includes('mnt') && path.length === 2) {
    return false;
  }
  return true;
};
