import { ApiMethod } from 'app/interfaces/api-directory.interface';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { Wizard } from 'app/pages/common/entity/entity-form/models/wizard.interface';
import { EntityWizardComponent } from 'app/pages/common/entity/entity-wizard';
import { MatStepper } from '@angular/material/stepper';

export interface WizardConfiguration {
  queryCall?: ApiMethod;
  addWsCall?: ApiMethod;
  hideCancel?: boolean;
  isLinear?: boolean;
  summary?: any;
  summaryTitle?: string;
  fieldConfig?: FieldConfig[];
  wizardConfig: Wizard[];
  saveSubmitText?: string;
  advanced_field?: string[];
  isBasicMode?: boolean;
  route_cancel?: string[];
  route_success?: string[];
  custActions?: {
    id: string;
    name: string;
    function: () => void;
  }[];

  customNext?: (stepper: MatStepper) => void;
  isCustActionVisible?: (actionId: string, stepperIndex: number) => boolean;
  preInit?: (entityWizard: EntityWizardComponent) => void;
  afterInit?: (entityWizard: EntityWizardComponent) => void;
  beforeSubmit?: (entityWizard: EntityWizardComponent) => void;
  customSubmit?: (value: any) => void;
  customCancel?: () => void;
}
