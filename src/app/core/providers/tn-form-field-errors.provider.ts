import { inject, Provider } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';
import { TN_FORM_FIELD_ERRORS, type TnFormFieldErrorResolver } from '@truenas/ui-components';
import { DefaultValidationError } from 'app/enums/default-validation-error.enum';

type ErrorDetail = Record<string, unknown>;

function detail(errors: ValidationErrors, key: string): ErrorDetail {
  const value = errors[key];
  return (value && typeof value === 'object' ? value : {}) as ErrorDetail;
}

/**
 * Builds a translated message for a single validation error, mirroring the
 * `ix-errors` component so `tn-form-field` surfaces the same wording and i18n.
 *
 * Returns `null` for keys we do not handle so the library falls through to its
 * built-in defaults and then the raw error key.
 */
function translateError(
  translate: TranslateService,
  key: string,
  errors: ValidationErrors,
): string | null {
  switch (key as DefaultValidationError) {
    case DefaultValidationError.Min:
      return translate.instant('Minimum value is {min}', { min: detail(errors, key).min });
    case DefaultValidationError.Max:
      return translate.instant('Maximum value is {max}', { max: detail(errors, key).max });
    case DefaultValidationError.Required:
      return translate.instant('Field is required');
    case DefaultValidationError.Email:
      return translate.instant('Value must be a valid email address');
    case DefaultValidationError.Cpu:
      return translate.instant('Invalid CPU configuration.');
    case DefaultValidationError.MinLength:
      return translate.instant(
        T('The length of the field should be at least {minLength}'),
        { minLength: detail(errors, key).requiredLength },
      );
    case DefaultValidationError.MaxLength:
      return translate.instant(
        T('The length of the field should be no more than {maxLength}'),
        { maxLength: detail(errors, key).requiredLength },
      );
    case DefaultValidationError.Range:
      return translate.instant(
        'The value is out of range. Enter a value between {min} and {max}.',
        { min: detail(errors, 'rangeValue').min, max: detail(errors, 'rangeValue').max },
      );
    case DefaultValidationError.Pattern:
      return translate.instant('Invalid format or character');
    case DefaultValidationError.Forbidden:
      return translate.instant('The name "{value}" is already in use.', { value: errors.value as string });
    case DefaultValidationError.Number:
      return translate.instant('Value must be a number');
    case DefaultValidationError.Cron:
      return translate.instant('Invalid cron expression');
    case DefaultValidationError.Ip2:
      return translate.instant('Invalid IP address');
    case DefaultValidationError.InvalidRegex:
      return translate.instant('Invalid regular expression');
    case DefaultValidationError.InvalidStrftimeSpecifier:
      return translate.instant('Invalid format specifier: {specifier}', {
        specifier: detail(errors, key).specifier,
      });
    case DefaultValidationError.ContainsSlash:
      return translate.instant('Forward slashes are not allowed');
    case DefaultValidationError.InvalidCharacters:
      return translate.instant('Contains invalid characters');
    case DefaultValidationError.OrphanedPercent:
      return translate.instant('Percent sign at end must be escaped as %%');
    case DefaultValidationError.InvalidRcloneBandwidthLimit:
      return translate.instant('Invalid Rclone bandwidth limit: {value}', {
        value: detail(errors, key).value,
      });
    case DefaultValidationError.SelectionMustBeFile:
      return translate.instant('Selected path must be a file and not a directory');
    case DefaultValidationError.Empty:
      return translate.instant('Value cannot be empty or whitespace only');
    case DefaultValidationError.ExactLength:
      return translate.instant(
        T('The length must be exactly {requiredLength} (current length: {actualLength})'),
        {
          requiredLength: detail(errors, key).requiredLength,
          actualLength: detail(errors, key).actualLength,
        },
      );
    case DefaultValidationError.MinArrayLength: {
      const minLength = detail(errors, key).requiredLength as number;
      return translate.instant(
        minLength === 1
          ? T('List should have at least {minLength} item')
          : T('List should have at least {minLength} items'),
        { minLength },
      );
    }
    case DefaultValidationError.MaxArrayLength: {
      const maxLength = detail(errors, key).requiredLength as number;
      return translate.instant(
        maxLength === 1
          ? T('List should have no more than {maxLength} item')
          : T('List should have no more than {maxLength} items'),
        { maxLength },
      );
    }
    default:
      return null;
  }
}

/**
 * App-wide resolver for `tn-form-field` validation messages.
 *
 * The library ships English-only fallbacks and no project-specific validator
 * wording, so this wires its `TN_FORM_FIELD_ERRORS` hook to `TranslateService`
 * and reuses the same messages as the legacy `ix-errors` component:
 * 1. A custom validator that stored a pre-built `{ message }` string wins.
 * 2. Otherwise a known error key resolves to its translated message.
 * 3. Unknown keys return `null` to fall through to the library defaults.
 */
export function provideTnFormFieldErrors(): Provider {
  return {
    provide: TN_FORM_FIELD_ERRORS,
    useFactory: (): TnFormFieldErrorResolver => {
      const translate = inject(TranslateService);
      return (errorKey: string, errorValue: unknown, control: AbstractControl | null) => {
        const customMessage = (errorValue as { message?: unknown } | null)?.message;
        if (typeof customMessage === 'string' && customMessage.trim()) {
          return customMessage;
        }

        // Backend (API) validation errors are mapped onto controls by
        // `FormErrorHandlerService`, which sets `manualValidateError: true` (a bare
        // flag, rendered first by tn-form-field) alongside the real message in the
        // sibling `manualValidateErrorMsg` key. Surface that sibling message — the
        // legacy `ix-errors` component had equivalent special-casing.
        if (errorKey === 'manualValidateError') {
          const message = control?.errors?.['manualValidateErrorMsg'];
          return typeof message === 'string' ? message : null;
        }

        return translateError(translate, errorKey, control?.errors ?? { [errorKey]: errorValue });
      };
    },
  };
}
