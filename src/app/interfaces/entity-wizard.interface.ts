import { MatStepper } from '@angular/material/stepper';
import { ApiMethod } from 'app/interfaces/api-directory.interface';
import { Wizard } from 'app/pages/common/entity/entity-form/models/wizard.interface';
import { EntityWizardComponent } from 'app/pages/common/entity/entity-wizard/entity-wizard.component';

export interface WizardConfiguration {
  addWsCall?: ApiMethod;
  hideCancel?: boolean;
  isLinear?: boolean;
  summary?: Record<string, unknown>;
  summaryTitle?: string;
  wizardConfig: Wizard[];
  saveSubmitText?: string;
  advanced_field?: string[];
  isBasicMode?: boolean;
  showSpinner?: boolean;
  isAutoSummary?: boolean;
  route_cancel?: string[];
  route_success?: string[];
  custActions?: EntityWizardAction[];

  customNext?: (stepper: MatStepper) => void;
  isCustActionVisible?: (actionId: string, stepperIndex: number) => boolean;
  preInit?: (entityWizard: EntityWizardComponent) => void;
  afterInit?: (entityWizard: EntityWizardComponent) => void;
  beforeSubmit?: (value: any) => any;
  customSubmit?: (value: any) => void;
  customCancel?: () => void;
}

export interface EntityWizardAction {
  id: string;
  name: string;
  function: () => void;
}
