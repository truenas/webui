import { PoolCreationSeverity } from 'app/pages/storage/modules/pool-manager/enums/pool-creation-severity';
import { PoolCreationWizardStep } from 'app/pages/storage/modules/pool-manager/enums/pool-creation-wizard-step.enum';

export interface PoolCreationError {
  text: string;
  severity: PoolCreationSeverity;
  step: PoolCreationWizardStep;
}
