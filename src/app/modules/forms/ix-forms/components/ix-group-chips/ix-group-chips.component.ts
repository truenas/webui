import {
  AfterViewInit, ChangeDetectionStrategy, Component, input, viewChild, inject,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { map } from 'rxjs/operators';
import { ChipsProvider } from 'app/modules/forms/ix-forms/components/ix-chips/chips-provider';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { registeredDirectiveConfig } from 'app/modules/forms/ix-forms/directives/registered-control.directive';
import { UserGroupExistenceValidationService } from 'app/modules/forms/ix-forms/validators/user-group-existence-validation.service';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { UserService } from 'app/services/user.service';

/**
 * Specialized chips component for group input with built-in validation.
 * Automatically validates that entered groups exist in the system (local or directory services).
 * Provides autocomplete suggestions from the group cache.
 *
 * @example
 * ```html
 * <ix-group-chips
 *   formControlName="groups"
 *   [label]="'Groups' | translate"
 *   [tooltip]="'Select groups' | translate"
 * ></ix-group-chips>
 * ```
 */
@Component({
  selector: 'ix-group-chips',
  templateUrl: './ix-group-chips.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxChipsComponent,
  ],
  hostDirectives: [
    { ...registeredDirectiveConfig },
  ],
})
export class IxGroupChipsComponent implements AfterViewInit, ControlValueAccessor {
  private controlDirective = inject(NgControl);
  private userService = inject(UserService);
  private existenceValidator = inject(UserGroupExistenceValidationService);

  readonly label = input<TranslatedString>();
  readonly placeholder = input<TranslatedString>('');
  readonly hint = input<TranslatedString>();
  readonly tooltip = input<TranslatedString>();
  readonly required = input<boolean>(false);
  readonly debounceTime = input<number>(300);

  private readonly ixChips = viewChild.required(IxChipsComponent);

  protected readonly groupProvider: ChipsProvider = (query) => {
    return this.userService.groupQueryDsCache(query).pipe(
      map((groups) => groups.map((group) => group.group)),
    );
  };

  constructor() {
    this.controlDirective.valueAccessor = this;
  }

  ngAfterViewInit(): void {
    // Add async validator to check group existence.
    // The base ix-chips component allows new entries by default,
    // so validation is always needed to ensure typed groups exist.
    const control = this.controlDirective.control;
    if (control) {
      control.addAsyncValidators([
        this.existenceValidator.validateGroupsExist(this.debounceTime()),
      ]);
      // Don't call updateValueAndValidity() here to avoid showing validation errors
      // immediately on form load. Validation will run automatically when the user
      // interacts with the field or when the form is submitted.
    }
  }

  writeValue(value: string[]): void {
    this.ixChips().writeValue(value);
  }

  registerOnChange(onChange: (value: string[]) => void): void {
    this.ixChips().registerOnChange(onChange);
  }

  registerOnTouched(onTouched: () => void): void {
    this.ixChips().registerOnTouched(onTouched);
  }

  setDisabledState?(isDisabled: boolean): void {
    this.ixChips().setDisabledState?.(isDisabled);
  }
}
