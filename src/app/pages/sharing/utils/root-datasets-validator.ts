import { AbstractControl } from '@angular/forms';

export const getRootDatasetsValidator = (allowedPaths: string[] = []): ((control: AbstractControl) => boolean) => {
  return (control: AbstractControl<string | string[]>): boolean => {
    if (!control) {
      return true;
    }
    const joinedPath = Array.isArray(control.value)
      ? control.value.reduce((prevValue, currentValue) => `${prevValue}/${currentValue}`)
      : control.value;
    if (!joinedPath || allowedPaths.includes(joinedPath)) {
      return true;
    }
    const splitPath = joinedPath.split('/').filter((pathItem) => !!pathItem);
    if (!splitPath.length) {
      return true;
    }
    if (splitPath[0].includes('mnt') && splitPath.length === 2) {
      return false;
    }
    return true;
  };
};
