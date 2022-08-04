import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges,
} from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { DefaultValidationError } from 'app/enums/default-validation-error.enum';

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
  };

  constructor(
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ('control' in changes && this.control) {
      // This manually works around: https://github.com/angular/angular/issues/10816
      this.statusChangeSubscription?.unsubscribe();
      this.statusChangeSubscription = this.control.statusChanges.pipe(untilDestroyed(this)).subscribe(() => {
        const newErrors: string[] = [];
        for (const error in this.control.errors) {
          if (this.control.errors[error].message) {
            newErrors.push(this.control.errors[error].message);
          } else {
            newErrors.push(this.getDefaultError(error as DefaultValidationError));
          }
        }
        this.messages = newErrors;

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
        return this.defaultErrMessages.min(this.control.errors.min.min);
      case DefaultValidationError.Max:
        return this.defaultErrMessages.max(this.control.errors.max.max);
      case DefaultValidationError.Required:
        return this.defaultErrMessages.required();
      case DefaultValidationError.Email:
        return this.defaultErrMessages.email();
      case DefaultValidationError.MinLength:
        return this.defaultErrMessages.minlength(this.control.errors.minlength.requiredLength);
      case DefaultValidationError.MaxLength:
        return this.defaultErrMessages.maxlength(this.control.errors.maxlength.requiredLength);
      case DefaultValidationError.Range:
        return this.defaultErrMessages.range(this.control.errors.rangeValue.min, this.control.errors.rangeValue.max);
      case DefaultValidationError.Pattern:
        return this.defaultErrMessages.pattern();
      case DefaultValidationError.Forbidden:
        return this.defaultErrMessages.forbidden(this.control.value);
      case DefaultValidationError.Number:
        return this.defaultErrMessages.number();
    }
  }
}
