import { CustomUntypedFormArray } from 'app/modules/forms/ix-dynamic-form/components/ix-dynamic-form/classes/custom-untped-form-array';
import { CustomUntypedFormControl } from 'app/modules/forms/ix-dynamic-form/components/ix-dynamic-form/classes/custom-untped-form-control';
import { CustomUntypedFormGroup } from 'app/modules/forms/ix-dynamic-form/components/ix-dynamic-form/classes/custom-untyped-form-group';

export type CustomUntypedFormField = CustomUntypedFormArray
  | CustomUntypedFormControl
  | CustomUntypedFormGroup;
