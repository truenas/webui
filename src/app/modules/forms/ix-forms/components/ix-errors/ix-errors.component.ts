import { LiveAnnouncer } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, input, OnChanges, OnDestroy, inject } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { MatError } from '@angular/material/form-field';
import { MatTooltip } from '@angular/material/tooltip';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
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
  imports: [
    MatError,
    IxIconComponent,
    MatTooltip,
    TranslateModule,
  ],
})
export class IxErrorsComponent implements OnChanges, OnDestroy {
  private translate = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);
  private liveAnnouncer = inject(LiveAnnouncer);

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
        ? T('The length of {field} should be at least {minLength}')
        : T('The length of the field should be at least {minLength}'),
      { field: this.label(), minLength },
    ),
    maxlength: (maxLength: number) => this.translate.instant(
      this.label()
        ? T('The length of {field} should be no more than {maxLength}')
        : T('The length of the field should be no more than {maxLength}'),
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
    invalidRegex: () => this.translate.instant('Invalid regular expression'),
    invalidStrftimeSpecifier: (specifier: string) => this.translate.instant('Invalid format specifier: {specifier}', { specifier }),
    containsSlash: () => this.translate.instant('Forward slashes are not allowed'),
    invalidCharacters: () => this.translate.instant('Contains invalid characters'),
    orphanedPercent: () => this.translate.instant('Percent sign at end must be escaped as %%'),
    invalidRcloneBandwidthLimit: (value: string) => this.translate.instant('Invalid Rclone bandwidth limit: {value}', { value }),
    selectionMustBeFile: () => this.translate.instant('Selected path must be a file and not a directory'),
    empty: () => this.translate.instant('Value cannot be empty or whitespace only'),
  };

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if ('control' in changes && this.control()) {
      this.subscribeToControlStatusChanges();
    }
  }

  ngOnDestroy(): void {
    this.statusChangeSubscription?.unsubscribe();
  }

  private subscribeToControlStatusChanges(): void {
    // This manually works around: https://github.com/angular/angular/issues/10816
    this.statusChangeSubscription?.unsubscribe();
    this.statusChangeSubscription = this.control().statusChanges.pipe(
      filter((status) => status !== 'PENDING'),
      untilDestroyed(this),
    ).subscribe(() => {
      this.handleErrors();
    });

    // Handle errors immediately in case control already has errors on init
    this.handleErrors();
  }

  private handleErrors(): void {
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

    this.messages = newErrors.filter((message) => !!message) as string[];

    if (this.control().errors) {
      this.control().markAllAsTouched();
    }

    this.cdr.markForCheck();
    this.announceErrors();
  }

  /**
   * This method takes in an error type and returns a default error
   * message
   * @param error The name of the error on control e.g., 'required'
   * @returns A default error message for the error type
   */
  private getDefaultError(error: DefaultValidationError): string {
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
      case DefaultValidationError.InvalidRegex:
        return this.defaultErrMessages.invalidRegex();
      case DefaultValidationError.InvalidStrftimeSpecifier:
        return this.defaultErrMessages.invalidStrftimeSpecifier(
          (errors.invalidStrftimeSpecifier as SomeError).specifier as string,
        );
      case DefaultValidationError.ContainsSlash:
        return this.defaultErrMessages.containsSlash();
      case DefaultValidationError.InvalidCharacters:
        return this.defaultErrMessages.invalidCharacters();
      case DefaultValidationError.OrphanedPercent:
        return this.defaultErrMessages.orphanedPercent();
      case DefaultValidationError.InvalidRcloneBandwidthLimit:
        return this.defaultErrMessages.invalidRcloneBandwidthLimit(
          (errors.invalidRcloneBandwidthLimit as SomeError).value as string,
        );
      case DefaultValidationError.SelectionMustBeFile:
        return this.defaultErrMessages.selectionMustBeFile();
      case DefaultValidationError.Empty:
        return this.defaultErrMessages.empty();
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

  private announceErrors(): void {
    const messages = [...this.messages];
    const manualError = (
      this.control().errors?.[ixManualValidateError] as { message: string } | undefined
    )?.message;
    if (manualError) {
      messages.push(manualError);
    }

    if (messages.length) {
      const messageToAnnounce = this.label()
        ? this.translate.instant('Errors in {field}: {messages}', {
            field: this.label(),
            messages: messages.join(', '),
          })
        : this.translate.instant('Errors in the form: {messages}', {
            messages: messages.join(', '),
          });

      this.liveAnnouncer.announce(messageToAnnounce);
    }
  }
}
