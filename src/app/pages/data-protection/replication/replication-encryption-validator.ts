import { ValidationErrors } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { ixManualValidateError } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';

export interface TargetEncryptionInfo {
  encrypted: boolean;
  isOwnEncryptionRoot: boolean;
}

/**
 * Validates encryption settings against the target dataset's encryption state.
 * Shared between the replication form target section and the replication wizard.
 */
export function getEncryptionErrors(
  targetDataset: TargetEncryptionInfo | null,
  encryptionEnabled: boolean,
  translate: TranslateService,
): ValidationErrors | null {
  if (!targetDataset) {
    return null;
  }

  if (targetDataset.isOwnEncryptionRoot) {
    if (encryptionEnabled) {
      // Destination was likely created by a previous replication with encryption.
      return null;
    }
    return {
      [ixManualValidateError]: {
        removable: false,
        message: translate.instant(
          'Destination dataset is its own encryption root. Replicating into an existing encryption root is not supported. Encrypt the parent dataset instead.',
        ),
      },
    };
  }

  if (encryptionEnabled !== targetDataset.encrypted) {
    return {
      [ixManualValidateError]: {
        removable: false,
        message: translate.instant(
          'Source and Destination dataset must have matching encryption states.',
        ),
      },
    };
  }

  return null;
}

/**
 * Extracts encryption info from a dataset response.
 */
export function extractTargetEncryptionInfo(dataset: {
  id: string;
  encrypted: boolean;
  encryption_root?: string;
}): TargetEncryptionInfo {
  return {
    encrypted: dataset.encrypted,
    isOwnEncryptionRoot: dataset.encrypted && dataset.encryption_root === dataset.id,
  };
}
