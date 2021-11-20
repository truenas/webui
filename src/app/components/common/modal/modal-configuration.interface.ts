import { Subject } from 'rxjs';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { WizardConfiguration } from 'app/interfaces/entity-wizard.interface';
import { EmbeddedFormConfig } from 'app/pages/common/entity/entity-form/entity-form-embedded.component';
import { ControlConfig } from 'app/pages/common/entity/entity-toolbar/models/control-config.interface';
import { Control } from 'app/pages/common/entity/entity-toolbar/models/control.interface';

/**
 * Modal configuration is a complicated object that supports one of:
 * - EntityFormComponent config
 * - EntityFormEmbeddedComponent config
 * - EntityWizard config
 *
 * and a bunch of modal specific fields.
 */
export type ModalConfiguration =
  | WizardModalConfiguration
  | FormModalConfiguration
  | EmbeddedFormConfiguration;

export type WizardModalConfiguration = WizardConfiguration & ModalSpecificConfiguration;

export type FormModalConfiguration = FormConfiguration & ModalSpecificConfiguration & {
  formType?: 'EntityFormComponent';
};

export type EmbeddedFormConfiguration = EmbeddedFormConfig & ModalSpecificConfiguration & {
  formType: 'EntityFormEmbeddedComponent';
};

export interface ModalSpecificConfiguration {
  rowid?: string | number;
  isModalForm?: boolean;
  closeModalForm?: () => Promise<void>;
  title?: string;
  columnsOnForm?: number;
  isOneColumnForm?: boolean;
  titleBarControls?: ControlConfig[];
  controller?: Subject<Control>;
}
