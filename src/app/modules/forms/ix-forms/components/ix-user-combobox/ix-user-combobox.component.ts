import {
  ChangeDetectionStrategy, Component, input, viewChild, inject,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import { UserComboboxProvider } from 'app/modules/forms/ix-forms/classes/user-combobox-provider';
import { IxComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.component';
import { registeredDirectiveConfig } from 'app/modules/forms/ix-forms/directives/registered-control.directive';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { UserService } from 'app/services/user.service';

/**
 * Specialized combobox component for user input with autocomplete.
 * Provides autocomplete suggestions from the user cache.
 * Validation is handled by autocomplete matching - if a user exists in suggestions,
 * it will be converted to the correct user ID. Non-existent users will be rejected
 * by the backend on form submission.
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
@UntilDestroy()
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
export class IxUserComboboxComponent implements ControlValueAccessor {
  private controlDirective = inject(NgControl);
  private userService = inject(UserService);

  readonly label = input<TranslatedString>();
  readonly hint = input<TranslatedString>();
  readonly tooltip = input<TranslatedString>();
  readonly required = input<boolean>(false);
  readonly allowCustomValue = input<boolean>(true);
  readonly debounceTime = input<number>(300);

  private readonly ixCombobox = viewChild.required(IxComboboxComponent);

  protected readonly userProvider = new UserComboboxProvider(this.userService);

  constructor() {
    this.controlDirective.valueAccessor = this;
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
