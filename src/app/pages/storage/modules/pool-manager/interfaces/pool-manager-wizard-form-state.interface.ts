import { FormControl } from '@angular/forms';

export interface PoolManagerWizardRequiredFormPartState {
  general: FormControl<boolean | null>;
  enclosure: FormControl<boolean | null>;
  data: FormControl<boolean | null>;
}
