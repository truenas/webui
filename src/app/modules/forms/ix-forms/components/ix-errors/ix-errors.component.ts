import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, input, OnChanges,
} from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { MatError } from '@angular/material/form-field';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { DefaultValidationError } from 'app/enums/default-validation-error.enum';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';

type SomeError = Record<string, unknown>;

export const ixManualValidateError = 'ixManualValidateError';

@UntilDestroy()
@Component({
  selector: 'ix-errors',
  templateUrl: './ix-errors.component.html',
  styleUrls: ['./ix-errors.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatError,
    IxIconComponent,
    MatTooltip,
    TranslateModule,
  ],
})
export class IxErrorsComponent implements OnChanges {
  readonly control = input.required<AbstractControl>();
  readonly label = input<string>();

  readonly ixManualValidateError = ixManualValidateError;

  private statusChangeSubscription: Subscription;
  messages: string[] = [];

  readonly defaultErrMessages = {
    min: (min: number) => this.translate.instant('Minimum value is {min}', { min }),
    max: (max: number) => this.translate.instant('Maximum value is {max}', { max }),
    required: () => {
      if (this.label()) {
        return this.translate.instant('{field} is required', { field: this.label() });
      }

      return this.translate.instant('Field is required');
    },
    email: () => this.translate.instant('Value must be a valid email address'),
    cpu: () => this.translate.instant('Invalid CPU configuration.'),
    minlength: (minLength: number) => this.translate.instant(
      this.label()
        ? 'The length of {field} should be at least {minLength}'
        : 'The length of the field should be at least {minLength}',
      { field: this.label(), minLength },
    ),
    maxlength: (maxLength: number) => this.translate.instant(
      this.label()
        ? 'The length of {field} should be no more than {maxLength}'
        : 'The length of the field should be no more than {maxLength}',
      { field: this.label(), maxLength },
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
    if ('control' in changes && this.control()) {
      // This manually works around: https://github.com/angular/angular/issues/10816
      this.statusChangeSubscription?.unsubscribe();
      this.statusChangeSubscription = this.control().statusChanges.pipe(
        filter((status) => status !== 'PENDING'),
        untilDestroyed(this),
      ).subscribe(() => {
        const newErrors: (string | null)[] = Object.keys(this.control().errors || []).map((error) => {
          if (error === ixManualValidateError) {
            return null;
          }
          const message = (this.control().errors?.[error] as SomeError)?.message as string;
          if (message) {
            return message;
          }

          return this.getDefaultError(error as DefaultValidationError);
        });

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        this.messages = newErrors.filter((message) => !!message) as string[];

        if (this.control().errors) {
          this.control().markAllAsTouched();
        }

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
    const errors = this.control().errors || {};
    switch (error) {
      case DefaultValidationError.Min:
        return this.defaultErrMessages.min((errors.min as SomeError).min as number);
      case DefaultValidationError.Max:
        return this.defaultErrMessages.max((errors.max as SomeError).max as number);
      case DefaultValidationError.Required:
        return this.defaultErrMessages.required();
      case DefaultValidationError.Email:
        return this.defaultErrMessages.email();
      case DefaultValidationError.Cpu:
        return this.defaultErrMessages.cpu();
      case DefaultValidationError.MinLength:
        return this.defaultErrMessages.minlength((errors.minlength as SomeError).requiredLength as number);
      case DefaultValidationError.MaxLength:
        return this.defaultErrMessages.maxlength((errors.maxlength as SomeError).requiredLength as number);
      case DefaultValidationError.Range:
        return this.defaultErrMessages.range(
          (errors.rangeValue as SomeError).min as number,
          (errors.rangeValue as SomeError).max as number,
        );
      case DefaultValidationError.Pattern:
        return this.defaultErrMessages.pattern();
      case DefaultValidationError.Forbidden:
        return this.defaultErrMessages.forbidden(errors.value as string);
      case DefaultValidationError.Number:
        return this.defaultErrMessages.number();
      case DefaultValidationError.Cron:
        return this.defaultErrMessages.cron();
      case DefaultValidationError.Ip2:
        return this.defaultErrMessages.ip2();
      default:
        return '';
    }
  }

  removeManualError(): void {
    const errors = this.control().errors;
    if (errors) {
      delete errors[ixManualValidateError];
      delete errors.manualValidateError;
      delete errors.manualValidateErrorMsg;
    }
    this.control().updateValueAndValidity();
    this.cdr.markForCheck();
  }

  // TODO: Workaround for https://github.com/angular/angular/issues/56471
  protected trackMessage(message: string): string {
    return message;
  }
}
