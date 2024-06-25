import { AbstractControl, FormBuilder, FormGroup } from '@angular/forms';
import { of } from 'rxjs';
import {
  forbiddenAsyncValues,
  forbiddenValues,
} from 'app/modules/forms/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';

describe('forbiddenValuesValidation', () => {
  let formControl: AbstractControl;
  let form: FormGroup;
  const existingNames = ['name', 'second name'];
  const asyncArrayNames$ = of(existingNames);

  beforeEach(() => {
    const formBuilder = new FormBuilder();
    form = formBuilder.group({
      name: [''],
    });
    formControl = form.controls.name;
  });
  describe('forbidden validator', () => {
    it('formcontrol should have a "forbidden" error if typing an already existing name', () => {
      form.controls.name.addValidators(forbiddenValues(existingNames));
      formControl.setValue('second name');

      expect(formControl.hasError('forbidden')).toBeTruthy();
    });

    it('formcontrol should have a "forbidden" error if typing an already existing name in a case-insensitive way', () => {
      form.controls.name.addValidators(forbiddenValues(existingNames, true));
      formControl.setValue('Name');

      expect(formControl.hasError('forbidden')).toBeTruthy();
    });
  });
  describe('forbidden async validator', () => {
    it('formcontrol should have a "forbidden" error if typing an already existing name', () => {
      form.controls.name.addAsyncValidators(forbiddenAsyncValues(asyncArrayNames$));
      formControl.setValue('name');

      expect(formControl.hasError('forbidden')).toBeTruthy();
    });

    it('formcontrol should have a "forbidden" error if typing an already existing name in a case-insensitive way', () => {
      form.controls.name.addAsyncValidators(forbiddenAsyncValues(asyncArrayNames$, true));
      formControl.setValue('Second Name');

      expect(formControl.hasError('forbidden')).toBeTruthy();
    });
  });
});
