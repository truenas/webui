import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges,
} from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { DefaultValidationError } from 'app/enums/default-validation-error.enum';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';

interface SomeError {
  [key: string]: unknown;
}

export const ixManualValidateError = 'ixManualValidateError';

@UntilDestroy()
@Component({
  selector: 'ix-errors',
  templateUrl: './ix-errors.component.html',
  styleUrls: ['./ix-errors.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxErrorsComponent implements OnChanges {
  @Input() control: AbstractControl;
  @Input() label: string;
  readonly ixManualValidateError = ixManualValidateError;

  private statusChangeSubscription: Subscription;
  messages: string[] = [];

  readonly defaultErrMessages = {
    min: (min: number) => this.translate.instant('Minimum value is {min}', { min }),
    max: (max: number) => this.translate.instant('Maximum value is {max}', { max }),
    required: () => {
      if (this.label) {
        return this.translate.instant('{field} is required', { field: this.label });
      }

      return this.translate.instant('Field is required');
    },
    email: () => this.translate.instant('Value must be a valid email address'),
    minlength: (minLength: number) => this.translate.instant(
      'The length of {field} should be at least {minLength}',
      { field: this.label, minLength },
    ),
    maxlength: (maxLength: number) => this.translate.instant(
      'The length of {field} should be no more than {maxLength}',
      { field: this.label, maxLength },
    ),
    pattern: () => this.translate.instant('Invalid format or character'),
    forbidden: (value: string) => this.translate.instant('The name "{value}" is already in use.', { value }),
    range: (min: number, max: number) => this.translate.instant(
      'The value is out of range. Enter a value between {min} and {max}.',
      { min, max },
    ),
    number: () => this.translate.instant('Value must be a number'),
    cron: () => this.translate.instant('Invalid cron expression'),
    ip2: () => this.translate.instant('Invalid IP address'),
  };

  constructor(
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if ('control' in changes && this.control) {
      // This manually works around: https://github.com/angular/angular/issues/10816
      this.statusChangeSubscription?.unsubscribe();
      this.statusChangeSubscription = this.control.statusChanges.pipe(
        filter((status) => status !== 'PENDING'),
        untilDestroyed(this),
      ).subscribe(() => {
        const newErrors: string[] = Object.keys(this.control.errors || []).map((error) => {
          if (error === ixManualValidateError) {
            return;
          }
          const message = (this.control.errors[error] as SomeError)?.message as string;
          if (message) {
            return message;
          }

          return this.getDefaultError(error as DefaultValidationError);
        });

        this.messages = newErrors.filter((message) => !!message);

        this.cdr.markForCheck();
      });
    }
  }

  /**
   * This method takes in an error type and returns a default error
   * message
   * @param error The name of the error on control e.g., 'required'
   * @returns A default error message for the error type
   */
  getDefaultError(error: DefaultValidationError): string {
    switch (error) {
      case DefaultValidationError.Min:
        return this.defaultErrMessages.min((this.control.errors.min as SomeError).min as number);
      case DefaultValidationError.Max:
        return this.defaultErrMessages.max((this.control.errors.max as SomeError).max as number);
      case DefaultValidationError.Required:
        return this.defaultErrMessages.required();
      case DefaultValidationError.Email:
        return this.defaultErrMessages.email();
      case DefaultValidationError.MinLength:
        return this.defaultErrMessages.minlength((this.control.errors.minlength as SomeError).requiredLength as number);
      case DefaultValidationError.MaxLength:
        return this.defaultErrMessages.maxlength((this.control.errors.maxlength as SomeError).requiredLength as number);
      case DefaultValidationError.Range:
        return this.defaultErrMessages.range(
          (this.control.errors.rangeValue as SomeError).min as number,
          (this.control.errors.rangeValue as SomeError).max as number,
        );
      case DefaultValidationError.Pattern:
        return this.defaultErrMessages.pattern();
      case DefaultValidationError.Forbidden:
        return this.defaultErrMessages.forbidden(this.control.errors.value);
      case DefaultValidationError.Number:
        return this.defaultErrMessages.number();
      case DefaultValidationError.Cron:
        return this.defaultErrMessages.cron();
      case DefaultValidationError.Ip2:
        return this.defaultErrMessages.ip2();
      default:
        return undefined;
    }
  }

  removeManualError(): void {
    if (this.control.errors) {
      delete this.control.errors[ixManualValidateError];
      delete this.control.errors.manualValidateError;
      delete this.control.errors.manualValidateErrorMsg;
    }
    this.control.updateValueAndValidity();
    this.cdr.markForCheck();
  }
}
