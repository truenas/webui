import { FormControl } from '@angular/forms';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { TranslateService } from '@ngx-translate/core';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { CrontabPartValidatorService, CrontabPart } from './crontab-part-validator.service';

describe('CrontabPartValidatorService', () => {
  let spectator: SpectatorService<CrontabPartValidatorService>;
  let service: CrontabPartValidatorService;
  let mockValidatorsService: Partial<IxValidatorsService>;
  let mockTranslateService: Partial<TranslateService>;

  const createService = createServiceFactory({
    service: CrontabPartValidatorService,
    providers: [
      {
        provide: IxValidatorsService,
        useValue: {
          withMessage: jest.fn((validator, _) => validator),
        },
      },
      {
        provide: TranslateService,
        useValue: {
          instant: jest.fn().mockReturnValue('Incorrect crontab value.'),
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createService();
    service = spectator.service;
    mockValidatorsService = spectator.inject(IxValidatorsService);
    mockTranslateService = spectator.inject(TranslateService);
  });

  describe('crontabPartValidator', () => {
    describe('Minutes validation', () => {
      it('should return null for valid minute values', () => {
        const validator = service.crontabPartValidator(CrontabPart.Minutes);
        const control = new FormControl('0');

        const result = validator(control);

        expect(result).toEqual({});
      });

      it('should return null for valid minute ranges', () => {
        const validator = service.crontabPartValidator(CrontabPart.Minutes);
        const control = new FormControl('0-59');

        const result = validator(control);

        expect(result).toEqual({});
      });

      it('should return null for valid minute intervals', () => {
        const validator = service.crontabPartValidator(CrontabPart.Minutes);
        const control = new FormControl('*/5');

        const result = validator(control);

        expect(result).toEqual({});
      });

      it('should return null for valid minute lists', () => {
        const validator = service.crontabPartValidator(CrontabPart.Minutes);
        const control = new FormControl('0,15,30,45');

        const result = validator(control);

        expect(result).toEqual({});
      });

      it('should return null for wildcard', () => {
        const validator = service.crontabPartValidator(CrontabPart.Minutes);
        const control = new FormControl('*');

        const result = validator(control);

        expect(result).toEqual({});
      });

      it('should return validation error for invalid minute values', () => {
        const validator = service.crontabPartValidator(CrontabPart.Minutes);
        const control = new FormControl('60'); // Invalid: minutes go from 0-59

        const result = validator(control);

        expect(result).toEqual({ crontabPart: true });
      });

      it('should return validation error for invalid minute format', () => {
        const validator = service.crontabPartValidator(CrontabPart.Minutes);
        const control = new FormControl('invalid');

        const result = validator(control);

        expect(result).toEqual({ crontabPart: true });
      });
    });

    describe('Hours validation', () => {
      it('should return null for valid hour values', () => {
        const validator = service.crontabPartValidator(CrontabPart.Hours);
        const control = new FormControl('0');

        const result = validator(control);

        expect(result).toEqual({});
      });

      it('should return null for valid hour ranges', () => {
        const validator = service.crontabPartValidator(CrontabPart.Hours);
        const control = new FormControl('9-17');

        const result = validator(control);

        expect(result).toEqual({});
      });

      it('should return validation error for invalid hour values', () => {
        const validator = service.crontabPartValidator(CrontabPart.Hours);
        const control = new FormControl('24'); // Invalid: hours go from 0-23

        const result = validator(control);

        expect(result).toEqual({ crontabPart: true });
      });
    });

    describe('Days validation', () => {
      it('should return null for valid day values', () => {
        const validator = service.crontabPartValidator(CrontabPart.Days);
        const control = new FormControl('1');

        const result = validator(control);

        expect(result).toEqual({});
      });

      it('should return null for valid day ranges', () => {
        const validator = service.crontabPartValidator(CrontabPart.Days);
        const control = new FormControl('1-31');

        const result = validator(control);

        expect(result).toEqual({});
      });

      it('should return validation error for invalid day values', () => {
        const validator = service.crontabPartValidator(CrontabPart.Days);
        const control = new FormControl('32'); // Invalid: days go from 1-31

        const result = validator(control);

        expect(result).toEqual({ crontabPart: true });
      });
    });

    describe('Service integration', () => {
      it('should call withMessage with correct parameters', () => {
        service.crontabPartValidator(CrontabPart.Minutes);

        expect(mockValidatorsService.withMessage).toHaveBeenCalledWith(
          expect.any(Function),
          'Incorrect crontab value.',
        );
      });

      it('should call translate.instant with correct message', () => {
        service.crontabPartValidator(CrontabPart.Minutes);

        expect(mockTranslateService.instant).toHaveBeenCalledWith('Incorrect crontab value.');
      });
    });
  });
});
