import { AbstractControl, Validators } from '@angular/forms';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';

describe('IxValidatorsService', () => {
  let spectator: SpectatorService<IxValidatorsService>;

  const createService = createServiceFactory({
    service: IxValidatorsService,
  });

  beforeEach(() => {
    spectator = createService();
  });

  describe('withMessage', () => {
    it('wraps a validator and sets a custom error message when validation fails', () => {
      const validator = spectator.service.withMessage(
        Validators.required,
        'Please enter a value',
      );
      const control = {} as AbstractControl;

      const errors = validator(control);

      expect(errors).toEqual({
        required: {
          message: 'Please enter a value',
        },
      });
    });
  });

  describe('validateOnCondition', () => {
    it('returns a validator function that runs validation when condition callback is true', () => {
      let condition = jest.fn(() => true);
      const control = {} as AbstractControl;
      let validatorFn = spectator.service.validateOnCondition(condition, Validators.required);

      let errors = validatorFn(control);

      expect(errors).toEqual({ required: true });
      expect(condition).toHaveBeenCalledWith(control);

      condition = jest.fn(() => false);
      validatorFn = spectator.service.validateOnCondition(condition, Validators.required);

      errors = validatorFn(control);
      expect(errors).toBeNull();
    });
  });

  describe('customValidator', () => {
    it('returns a validator function that adds a custom error message when custom function returns false', () => {
      const myValidator = jest.fn(() => false);
      const validatorFn = spectator.service.customValidator(myValidator, 'my error message');
      const control = {} as AbstractControl;

      const errors = validatorFn(control);
      expect(errors).toEqual({
        customValidator: {
          message: 'my error message',
        },
      });
      expect(myValidator).toHaveBeenCalledWith(control);
    });
  });
});
