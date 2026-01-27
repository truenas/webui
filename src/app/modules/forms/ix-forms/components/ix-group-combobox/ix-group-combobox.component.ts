import {
  ChangeDetectionStrategy, Component, input, viewChild, inject,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import { GroupComboboxProvider } from 'app/modules/forms/ix-forms/classes/group-combobox-provider';
import { IxComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.component';
import { registeredDirectiveConfig } from 'app/modules/forms/ix-forms/directives/registered-control.directive';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { UserService } from 'app/services/user.service';

/**
 * Specialized combobox component for group input with autocomplete.
 * Provides autocomplete suggestions from the group cache.
 * Validation is handled by autocomplete matching - if a group exists in suggestions,
 * it will be converted to the correct group ID. Non-existent groups will be rejected
 * by the backend on form submission.
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
export class IxGroupComboboxComponent implements ControlValueAccessor {
  private controlDirective = inject(NgControl);
  private userService = inject(UserService);

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
