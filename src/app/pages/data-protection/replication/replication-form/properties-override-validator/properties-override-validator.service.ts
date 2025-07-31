import { Injectable, inject } from '@angular/core';
import { AbstractControl, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';

@Injectable()
export class PropertiesOverrideValidatorService {
  private validatorsService = inject(IxValidatorsService);
  private translate = inject(TranslateService);


  validate = this.validatorsService.customValidator(
    (control: AbstractControl) => this.validatePropertyOverride(control),
    this.translate.instant('Invalid format. Expected format: <property>=<value>'),
  );

  private validatePropertyOverride(control: AbstractControl): boolean {
    const overrides = control.value as string[];
    if (!overrides?.length && control.hasValidator(Validators.required)) {
      return false;
    }

    return overrides.every((override) => {
      const parts = override.split('=');
      return parts[0] && parts[1] && parts.length === 2;
    });
  }
}
