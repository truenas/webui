import { FormControl, FormGroup } from '@angular/forms';
import { CreateVdevLayout } from 'app/enums/v-dev-type.enum';

export interface PoolManagerWizardForm {
  general: FormGroup<GeneralInfoForm>;
  data: FormGroup<CreateDataForm>;
  log: FormGroup;
  spare: FormGroup;
  cache: FormGroup;
  metadata: FormGroup;
  review: FormGroup;
}

interface GeneralInfoForm {
  name: FormControl<string>;
  encryption: FormControl<boolean>;
}

interface CreateDataForm {
  type: FormControl<CreateVdevLayout>;
  size: FormControl<string>;
  width: FormControl<number>;
  number: FormControl<number>;
}
