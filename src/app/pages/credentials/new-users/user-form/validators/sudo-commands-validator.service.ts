import { Injectable } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';

@Injectable()
export class SudoCommandsValidatorService {
  constructor(
    private validators: IxValidatorsService,
    private translate: TranslateService,
  ) {}

  validate = this.validators.customValidator(
    (control: AbstractControl) => this.validateCommands(control),
    this.translate.instant('Each command must start with \'/\''),
  );

  private validateCommands(control: AbstractControl): boolean {
    const commands = control.value as string[];
    if (!Array.isArray(commands) || !commands.length) {
      return true;
    }
    return commands.every((cmd) => typeof cmd === 'string' && cmd.startsWith('/'));
  }
}
