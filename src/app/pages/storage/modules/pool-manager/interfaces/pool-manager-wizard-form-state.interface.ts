import { PoolCreationWizardStep } from 'app/pages/storage/modules/pool-manager/enums/pool-creation-wizard-step.enum';

export type PoolManagerWizardRequiredFormPartState = {
  [key in PoolCreationWizardStep]?: {
    valid: boolean | null;
    required: boolean;
  };
};
