import { MatStepper } from '@angular/material/stepper';
import { ApiMethod } from 'app/interfaces/api-directory.interface';
import { Wizard } from 'app/modules/entity/entity-form/models/wizard.interface';
import { EntityWizardComponent } from 'app/modules/entity/entity-wizard/entity-wizard.component';

export interface WizardConfiguration {
  addWsCall?: ApiMethod;
  hideCancel?: boolean;
  isLinear?: boolean;
  summary?: Record<string, unknown>;
  summaryTitle?: string;
  wizardConfig: Wizard[];
  saveSubmitText?: string;
  advancedFields?: string[];
  isBasicMode?: boolean;
  showSpinner?: boolean;
  isAutoSummary?: boolean;
  routeCancel?: string[];
  routeSuccess?: string[];
  customActions?: EntityWizardAction[];

  customNext?: (stepper: MatStepper) => void;
  isCustomActionVisible?: (actionId: string, stepperIndex: number) => boolean;
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
