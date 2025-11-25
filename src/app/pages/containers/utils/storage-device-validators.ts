import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { containersHelptext } from 'app/helptext/containers/containers';

/**
 * Validator for container mount paths
 * Used for FILESYSTEM device targets
 */
export function containerPathValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;

    if (!value) {
      return null; // Let required validator handle empty values
    }

    // Must start with /
    if (!value.startsWith('/')) {
      return {
        containerPath: {
          message: containersHelptext.validators.containerPathMustStartWithSlash,
        },
      };
    }

    // Cannot end with / (unless it's just /)
    if (value.length > 1 && value.endsWith('/')) {
      return {
        containerPath: {
          message: containersHelptext.validators.containerPathCannotEndWithSlash,
        },
      };
    }

    // Cannot contain //
    if (value.includes('//')) {
      return {
        containerPath: {
          message: containersHelptext.validators.containerPathCannotContainDoubleSlash,
        },
      };
    }

    // Cannot contain braces
    if (value.includes('{') || value.includes('}')) {
      return {
        containerPath: {
          message: containersHelptext.validators.targetMustNotContainBraces,
        },
      };
    }

    // Valid path pattern - alphanumeric, underscore, hyphen, dot
    const validPattern = /^\/([a-zA-Z0-9_.-]+\/?)*$/;
    if (!validPattern.test(value)) {
      return {
        containerPath: {
          message: containersHelptext.validators.containerPathInvalidCharacters,
        },
      };
    }

    return null;
  };
}

/**
 * Validator for FILESYSTEM device source paths
 * API requirement: path must reside within a pool mount point (start with /mnt)
 * Note: The form uses /mnt/ paths, but the API expects them without /mnt/ prefix
 */
export function poolPathValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;

    if (!value) {
      return null; // Let required validator handle empty values
    }

    if (!value.startsWith('/mnt/')) {
      return {
        poolPath: {
          message: containersHelptext.validators.poolPathMustStartWithMnt,
        },
      };
    }

    // Cannot contain braces
    if (value.includes('{') || value.includes('}')) {
      return {
        poolPath: {
          message: containersHelptext.validators.sourceMustNotContainBraces,
        },
      };
    }

    return null;
  };
}
