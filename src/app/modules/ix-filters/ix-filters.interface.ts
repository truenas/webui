import { FormControl, FormGroup } from '@angular/forms';

export interface IxFilter {
  property: string;
  value: string[];
}

export interface FilterGroup {
  property: FormControl<string>;
  value: FormControl<string[]>;
}

export type FilterFormGroup = FormGroup<FilterGroup>;
