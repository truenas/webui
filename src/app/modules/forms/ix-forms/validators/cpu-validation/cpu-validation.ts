import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function cpuValidator(): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const value = control.value;
    if (!value) {
      return null;
    }

    const cpuPattern = /^(\d+|\d+-\d+)(,(\d+|\d+-\d+))*$/;

    if (!cpuPattern.test(value)) {
      return { cpu: true };
    }

    const parts = value.split(',').map((part) => part.split('-').map(Number));

    // Incus will use single number as number of CPUs. This is not used for VMs cpuset.
    // Check if it's a single "0" (not allowed)
    if (parts.length === 1 && parts[0].length === 1 && parts[0][0] === 0) {
      return { cpu: true };
    }

    for (const part of parts) {
      if (part.length === 2 && part[0] > part[1]) {
        // Example: '3-1' is invalid
        return { cpu: true };
      }
    }

    return null;
  };
}
