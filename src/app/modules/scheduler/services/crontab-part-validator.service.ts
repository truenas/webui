import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import * as cronParser from 'cron-parser';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';

export enum CrontabPart {
  Minutes = 0,
  Hours = 1,
  Days = 2,
}

// TODO: Figure out how to limit to module.
@Injectable({
  providedIn: 'root',
})
export class CrontabPartValidatorService {
  constructor(
    private validatorsService: IxValidatorsService,
    private translate: TranslateService,
  ) {}

  crontabPartValidator(part: CrontabPart): ValidatorFn {
    const validator = (control: AbstractControl<string>): ValidationErrors | null => {
      const parts = (new Array(5)).fill('*');
      parts[part] = control.value;

      const crontab = parts.join(' ');
      const parsingResult = cronParser.parseString(crontab);

      if (!Object.keys(parsingResult.errors).length) {
        return {};
      }

      return {
        crontabPart: true,
      };
    };

    return this.validatorsService.withMessage(validator, this.translate.instant('Incorrect crontab value.'));
  }
}
