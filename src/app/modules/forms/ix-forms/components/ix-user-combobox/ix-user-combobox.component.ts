import {
  AfterViewInit, ChangeDetectionStrategy, Component, input, viewChild, inject,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { UserComboboxProvider } from 'app/modules/forms/ix-forms/classes/user-combobox-provider';
import { IxComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.component';
import { registeredDirectiveConfig } from 'app/modules/forms/ix-forms/directives/registered-control.directive';
import { defaultDebounceTimeMs } from 'app/modules/forms/ix-forms/ix-forms.constants';
import { attachAsyncValidator } from 'app/modules/forms/ix-forms/validators/attach-async-validator';
import { UserGroupExistenceValidationService } from 'app/modules/forms/ix-forms/validators/user-group-existence-validation.service';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { UserService } from 'app/services/user.service';

/**
 * Specialized combobox component for user input with built-in validation.
 * Automatically validates that entered users exist in the system (local or directory services).
 * Provides autocomplete suggestions from the user cache.
 *
 * @example
 * ```html
 * <ix-user-combobox
 *   formControlName="owner"
 *   [label]="'User' | translate"
 *   [tooltip]="'Select a user' | translate"
 *   [required]="true"
 * ></ix-user-combobox>
 * ```
 */
@Component({
  selector: 'ix-user-combobox',
  templateUrl: './ix-user-combobox.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxComboboxComponent,
  ],
  hostDirectives: [
    { ...registeredDirectiveConfig },
  ],
})
export class IxUserComboboxComponent implements AfterViewInit, ControlValueAccessor {
  private controlDirective = inject(NgControl);
  private userService = inject(UserService);
  private existenceValidator = inject(UserGroupExistenceValidationService);

  readonly label = input<TranslatedString>();
  readonly hint = input<TranslatedString>();
  readonly tooltip = input<TranslatedString>();
  readonly required = input<boolean>(false);
  readonly allowCustomValue = input<boolean>(true);
  readonly debounceTime = input<number>(defaultDebounceTimeMs);

  private readonly ixCombobox = viewChild.required(IxComboboxComponent);

  protected readonly userProvider = new UserComboboxProvider(this.userService);

  constructor() {
    this.controlDirective.valueAccessor = this;
  }

  ngAfterViewInit(): void {
    // Add validation to check user existence when custom values are allowed (default).
    // When allowCustomValue is false, users can only select from autocomplete
    // suggestions which are guaranteed to exist, making validation redundant.
    const control = this.controlDirective.control;
    if (control && this.allowCustomValue()) {
      // Attached silently: `addAsyncValidators()` would route through the
      // `@ngneat/reactive-forms` override of `setAsyncValidators`, which runs
      // `updateValueAndValidity()` and so emits a status change. On an untouched,
      // empty, required control that emission is enough for `ix-errors` to render
      // "<field> is required" before the user has reached the field (NAS-143522).
      // Validation still runs when the user edits the field or the form is submitted.
      attachAsyncValidator(control, this.existenceValidator.validateUserExists(this.debounceTime()));
    }
  }

  writeValue(value: string | number): void {
    this.ixCombobox().writeValue(value);
  }

  registerOnChange(onChange: (value: string | number | null) => void): void {
    this.ixCombobox().registerOnChange(onChange);
  }

  registerOnTouched(onTouched: () => void): void {
    this.ixCombobox().registerOnTouched(onTouched);
  }

  setDisabledState?(isDisabled: boolean): void {
    this.ixCombobox().setDisabledState?.(isDisabled);
  }
}
