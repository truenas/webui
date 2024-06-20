import { TestBed } from '@angular/core/testing';
import {
  AbstractControl,
  FormBuilder, FormGroup,
} from '@angular/forms';
import { doesNotEqualFgValidator, matchOthersFgValidator } from 'app/modules/forms/ix-forms/validators/password-validation/password-validation';

describe('PasswordValidation', () => {
  describe('matchOtherValidator', () => {
    let thisControl: AbstractControl;
    let otherControl: AbstractControl;
    let form: FormGroup;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [FormBuilder],
        declarations: [matchOthersFgValidator],
      });

      const formBuilder = new FormBuilder();
      form = formBuilder.group({
        this: [''],
        other: ['', []],
      }, {
        validators: [
          matchOthersFgValidator(
            'this',
            ['other'],
          ),
        ],
      });

      thisControl = form.controls.this;
      otherControl = form.controls.other;
    });

    it('should throw error when no otherControl is given', () => {
      expect(() => {
        form.removeControl('other');
        thisControl.setValue('test');
      }).toThrow('matchOtherValidator(): other control is not found in the group');
    });

    it('should not have matchOther error', () => {
      otherControl.setValue('changed');
      thisControl.setValue('changed');
      expect(thisControl.hasError('matchOther')).toBeFalsy();
      expect(otherControl.value).toBe(thisControl.value);
    });

    it('should have matchOther error', () => {
      thisControl.setValue('invoke error');
      expect(thisControl.hasError('matchOther')).toBeTruthy();
    });
  });

  describe('doesNotEqualValidator', () => {
    let thisControl: AbstractControl;
    let otherControl: AbstractControl;
    let form: FormGroup;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [FormBuilder],
      });

      const formBuilder = new FormBuilder();
      form = formBuilder.group({
        this: [''],
        other: ['', []],
      }, {
        validators: [
          doesNotEqualFgValidator(
            'this',
            ['other'],
          ),
        ],
      });

      thisControl = form.controls.this;
      otherControl = form.controls.other;
    });

    it('should throw error if otherControl is missing', () => {
      expect(() => {
        form.removeControl('other');
        thisControl.setValue('test');
      }).toThrow('doesNotEqual(): other control is not found in the group');
    });

    it('should have matchesOther error', () => {
      otherControl.setValue('invoke error');
      thisControl.setValue('invoke error');
      expect(otherControl.value).toBe(thisControl.value);
      expect(thisControl.hasError('matchesOther')).toBeTruthy();
      expect(form.valid).toBeFalsy();
    });

    it('should not have matchesOther error', () => {
      thisControl.setValue(null);
      otherControl.setValue('non-null');
      expect(thisControl.hasError('matchesOther')).toBeFalsy();
      expect(form.valid).toBeTruthy();
    });
  });
});
