import { CustomUntypedFormArray } from 'app/modules/ix-forms/components/ix-dynamic-form/classes/custom-untped-form-array';
import { CustomUntypedFormControl } from 'app/modules/ix-forms/components/ix-dynamic-form/classes/custom-untped-form-control';
import { CustomUntypedFormGroup } from 'app/modules/ix-forms/components/ix-dynamic-form/classes/custom-untyped-form-group';

export type CustomUntypedFormField = CustomUntypedFormArray
| CustomUntypedFormControl
| CustomUntypedFormGroup;
