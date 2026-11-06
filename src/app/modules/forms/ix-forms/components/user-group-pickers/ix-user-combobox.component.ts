import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { TnAutocompleteComponent } from '@truenas/ui-components';
import { DirectoryComboboxBase } from 'app/modules/forms/ix-forms/classes/directory-field.base';

/**
 * Single-user selection searched against {@link UserDirectoryService}, with debounced paged search,
 * existence validation for typed names, and with `allowCreate` a row that opens the create-user panel
 * and selects the result. Use inside a `tn-form-field`, e.g. `<ix-user-combobox formControlName="owner" />`;
 * narrow it with `[directoryOptions]`, e.g. `{ queryParams: [[['roles', '!=', []]]] }` for privileged users.
 */
@Component({
  selector: 'ix-user-combobox',
  imports: [TnAutocompleteComponent],
  templateUrl: './directory-autocomplete.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxUserComboboxComponent extends DirectoryComboboxBase {
  /**
   * Declared here rather than on the shared base: a view query on an abstract
   * `@Directive()` never resolves, so the base takes it as an abstract member
   * instead.
   */
  protected readonly innerControl = viewChild(TnAutocompleteComponent);

  protected readonly kind = 'user' as const;

  /** Only the user field can create — there is no create-group flow. */
  protected override readonly supportsCreate = true;
}
