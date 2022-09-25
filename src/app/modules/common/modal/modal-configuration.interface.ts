import { FormConfiguration } from 'app/interfaces/entity-form.interface';

export type ModalConfiguration = FormConfiguration & ModalSpecificConfiguration & {
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
