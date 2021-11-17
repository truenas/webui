import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges,
} from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { DefaultValidationErrors } from 'app/enums/default-validation-errors.enum';

@UntilDestroy()
@Component({
  selector: 'ix-errors',
  templateUrl: './ix-errors.component.html',
  styleUrls: ['./ix-errors.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxErrorsComponent implements OnChanges {
  @Input() control: AbstractControl;
  @Input() label: string ;

  private statusChangeSubscription: Subscription;
  messages: string[] = [];

  readonly defaultErrMessages = {
    min: (min: number) => this.translate.instant('Minimum value is {min}.', { min }),
    max: (max: number) => this.translate.instant('Maximum value is {max}.', { max }),
    required: () => this.translate.instant('{field} is required', { field: this.label }),
    email: () => this.translate.instant('Value must be a valid email address.'),
    minlength: (minLength: number) => this.translate.instant('The length of {field} should be at least {minLength}.', { field: this.label, minLength }),
    maxlength: (maxLength: number) => this.translate.instant(
      'The length of {field} should be no more than {maxLength}.',
      { field: this.label, maxLength },
    ),
    pattern: () => this.translate.instant('Invalid format or character.'),

  };

  constructor(
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ('control' in changes && this.control) {
      // This manually works around: https://github.com/angular/angular/issues/10816
      this.statusChangeSubscription?.unsubscribe();
      // eslint-disable-next-line rxjs-angular/prefer-takeuntil
      this.statusChangeSubscription = this.control.statusChanges.pipe(untilDestroyed(this)).subscribe(() => {
        const newErrors: string[] = [];
        for (const error in this.control.errors) {
          if (this.control.errors[error].message) {
            newErrors.push(this.control.errors[error].message);
          } else {
            newErrors.push(this.getDefaultError(error as DefaultValidationErrors));
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
  getDefaultError(error: DefaultValidationErrors): string {
    switch (error) {
      case DefaultValidationErrors.Min:
        return this.defaultErrMessages.min(this.control.errors.min.min);
      case DefaultValidationErrors.Max:
        return this.defaultErrMessages.max(this.control.errors.max.max);
      case DefaultValidationErrors.Required:
        return this.defaultErrMessages.required();
      case DefaultValidationErrors.Email:
        return this.defaultErrMessages.email();
      case DefaultValidationErrors.MinLength:
        return this.defaultErrMessages.minlength(this.control.errors.minlength.requiredLength);
      case DefaultValidationErrors.MaxLength:
        return this.defaultErrMessages.maxlength(this.control.errors.maxlength.requiredLength);
      case DefaultValidationErrors.Pattern:
        return this.defaultErrMessages.pattern();
    }
  }
}
