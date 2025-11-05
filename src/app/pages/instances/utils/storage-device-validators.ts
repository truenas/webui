import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { instancesHelptext } from 'app/helptext/instances/instances';

/**
 * Validator for block device names (e.g., sda, sdb, vda, nvme0n1)
 * Used for DISK device destinations
 */
export function blockDeviceNameValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;

    if (!value) {
      return null; // Let required validator handle empty values
    }

    // Valid patterns:
    // - sda, sdb, sdc... (SATA/SCSI)
    // - vda, vdb, vdc... (VirtIO)
    // - hda, hdb, hdc... (IDE)
    // - nvme0n1, nvme0n2... (NVMe)
    const validPattern = /^(sd[a-z]|vd[a-z]|hd[a-z]|nvme\d+n\d+)$/;

    if (!validPattern.test(value)) {
      return {
        blockDeviceName: {
          message: instancesHelptext.validators.blockDeviceName,
        },
      };
    }

    return null;
  };
}

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
          message: instancesHelptext.validators.containerPathMustStartWithSlash,
        },
      };
    }

    // Cannot end with / (unless it's just /)
    if (value.length > 1 && value.endsWith('/')) {
      return {
        containerPath: {
          message: instancesHelptext.validators.containerPathCannotEndWithSlash,
        },
      };
    }

    // Cannot contain //
    if (value.includes('//')) {
      return {
        containerPath: {
          message: instancesHelptext.validators.containerPathCannotContainDoubleSlash,
        },
      };
    }

    // Cannot contain braces
    if (value.includes('{') || value.includes('}')) {
      return {
        containerPath: {
          message: instancesHelptext.validators.targetMustNotContainBraces,
        },
      };
    }

    // Valid path pattern - alphanumeric, underscore, hyphen, dot
    const validPattern = /^\/([a-zA-Z0-9_.-]+\/?)*$/;
    if (!validPattern.test(value)) {
      return {
        containerPath: {
          message: instancesHelptext.validators.containerPathInvalidCharacters,
        },
      };
    }

    return null;
  };
}

/**
 * Validator for DISK device paths
 * API requirement: path must start with "/dev/zvol/"
 */
export function diskPathValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;

    if (!value) {
      return null; // Let required validator handle empty values
    }

    if (!value.startsWith('/dev/zvol/')) {
      return {
        diskPath: {
          message: instancesHelptext.validators.diskPathMustStartWithDevZvol,
        },
      };
    }

    return null;
  };
}

/**
 * Validator for RAW device paths
 * API requirement: path must reside within a pool mount point (start with /mnt)
 */
export function rawFilePathValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;

    if (!value) {
      return null; // Let required validator handle empty values
    }

    if (!value.startsWith('/mnt/')) {
      return {
        rawFilePath: {
          message: instancesHelptext.validators.rawFilePathMustStartWithMnt,
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
          message: instancesHelptext.validators.poolPathMustStartWithMnt,
        },
      };
    }

    // Cannot contain braces
    if (value.includes('{') || value.includes('}')) {
      return {
        poolPath: {
          message: instancesHelptext.validators.sourceMustNotContainBraces,
        },
      };
    }

    return null;
  };
}
