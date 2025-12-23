import {
  AfterViewInit, ChangeDetectionStrategy, Component, input, viewChild, inject,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import { map } from 'rxjs/operators';
import { ChipsProvider } from 'app/modules/forms/ix-forms/components/ix-chips/chips-provider';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { registeredDirectiveConfig } from 'app/modules/forms/ix-forms/directives/registered-control.directive';
import { UserGroupExistenceValidationService } from 'app/modules/forms/ix-forms/validators/user-group-existence-validation.service';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { UserService } from 'app/services/user.service';

/**
 * Specialized chips component for user input with built-in validation.
 * Automatically validates that entered users exist in the system (local or directory services).
 * Provides autocomplete suggestions from the user cache.
 *
 * @example
 * ```html
 * <ix-user-chips
 *   formControlName="users"
 *   [label]="'Users' | translate"
 *   [tooltip]="'Select users' | translate"
 * ></ix-user-chips>
 * ```
 */
@UntilDestroy()
@Component({
  selector: 'ix-user-chips',
  templateUrl: './ix-user-chips.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxChipsComponent,
  ],
  hostDirectives: [
    { ...registeredDirectiveConfig },
  ],
})
export class IxUserChipsComponent implements AfterViewInit, ControlValueAccessor {
  private controlDirective = inject(NgControl);
  private userService = inject(UserService);
  private existenceValidator = inject(UserGroupExistenceValidationService);

  readonly label = input<TranslatedString>();
  readonly placeholder = input<TranslatedString>('');
  readonly hint = input<TranslatedString>();
  readonly tooltip = input<TranslatedString>();
  readonly required = input<boolean>(false);

  private readonly ixChips = viewChild.required(IxChipsComponent);

  protected readonly userProvider: ChipsProvider = (query) => {
    return this.userService.userQueryDsCache(query).pipe(
      map((users) => users.map((user) => user.username)),
    );
  };

  constructor() {
    this.controlDirective.valueAccessor = this;
  }

  ngAfterViewInit(): void {
    // Add async validator to check user existence
    const control = this.controlDirective.control;
    if (control) {
      control.addAsyncValidators([
        this.existenceValidator.validateUsersExist(),
      ]);
      control.updateValueAndValidity();
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
