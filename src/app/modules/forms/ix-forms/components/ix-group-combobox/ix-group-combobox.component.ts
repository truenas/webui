import {
  AfterViewInit, ChangeDetectionStrategy, Component, input, viewChild, inject,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import { GroupComboboxProvider } from 'app/modules/forms/ix-forms/classes/group-combobox-provider';
import { IxComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.component';
import { registeredDirectiveConfig } from 'app/modules/forms/ix-forms/directives/registered-control.directive';
import { UserGroupExistenceValidationService } from 'app/modules/forms/ix-forms/validators/user-group-existence-validation.service';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { UserService } from 'app/services/user.service';

/**
 * Specialized combobox component for group input with built-in validation.
 * Automatically validates that entered groups exist in the system (local or directory services).
 * Provides autocomplete suggestions from the group cache.
 *
 * @example
 * ```html
 * <ix-group-combobox
 *   formControlName="ownerGroup"
 *   [label]="'Group' | translate"
 *   [tooltip]="'Select a group' | translate"
 *   [required]="true"
 * ></ix-group-combobox>
 * ```
 */
@UntilDestroy()
@Component({
  selector: 'ix-group-combobox',
  templateUrl: './ix-group-combobox.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxComboboxComponent,
  ],
  hostDirectives: [
    { ...registeredDirectiveConfig },
  ],
})
export class IxGroupComboboxComponent implements AfterViewInit, ControlValueAccessor {
  private controlDirective = inject(NgControl);
  private userService = inject(UserService);
  private existenceValidator = inject(UserGroupExistenceValidationService);

  readonly label = input<TranslatedString>();
  readonly hint = input<TranslatedString>();
  readonly tooltip = input<TranslatedString>();
  readonly required = input<boolean>(false);
  readonly allowCustomValue = input<boolean>(true);
  readonly debounceTime = input<number>(300);

  private readonly ixCombobox = viewChild.required(IxComboboxComponent);

  protected readonly groupProvider = new GroupComboboxProvider(this.userService);

  constructor() {
    this.controlDirective.valueAccessor = this;
  }

  ngAfterViewInit(): void {
    // Add validation to check group existence when custom values are allowed (default).
    // When allowCustomValue is false, users can only select from autocomplete
    // suggestions which are guaranteed to exist, making validation redundant.
    const control = this.controlDirective.control;
    if (control && this.allowCustomValue()) {
      control.addAsyncValidators([
        this.existenceValidator.validateGroupExists(this.debounceTime()),
      ]);
      // Don't call updateValueAndValidity() here to avoid showing validation errors
      // immediately on form load. Validation will run automatically when the user
      // interacts with the field or when the form is submitted.
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
