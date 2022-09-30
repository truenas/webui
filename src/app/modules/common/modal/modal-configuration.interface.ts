import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { WizardConfiguration } from 'app/interfaces/entity-wizard.interface';

/**
 * Modal configuration is a complicated object that supports one of:
 * - EntityFormComponent config
 * - EntityWizard config
 *
 * and a bunch of modal specific fields.
 */
export type ModalConfiguration =
  | WizardModalConfiguration
  | FormModalConfiguration;

export type WizardModalConfiguration = WizardConfiguration & ModalSpecificConfiguration;

export type FormModalConfiguration = FormConfiguration & ModalSpecificConfiguration & {
  formType?: 'EntityFormComponent';
};

export interface ModalSpecificConfiguration {
  rowid?: string | number;
  isModalForm?: boolean;
  closeModalForm?: () => Promise<void>;
  title?: string;
  columnsOnForm?: number;
  isOneColumnForm?: boolean;
}
