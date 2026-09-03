import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { TnAutocompleteComponent } from '@truenas/ui-components';
import { DirectoryComboboxBase } from 'app/modules/forms/ix-forms/classes/directory-field.base';

/**
 * Single-user selection, searched against {@link UserDirectoryService}.
 *
 * Everything a user field needs is here: the server-side search with its
 * debounce and paging, the "does this name exist" validation for a typed value,
 * and — with `allowCreate` — a row that opens the create-user side panel and
 * selects whoever comes back. Drop it into a `tn-form-field` and bind a control.
 *
 * @example
 * ```html
 * <tn-form-field [label]="'Owner' | translate">
 *   <ix-user-combobox formControlName="owner" />
 * </tn-form-field>
 * ```
 *
 * @example Restricted to privileged users, with a create row
 * ```html
 * <ix-user-combobox
 *   formControlName="username"
 *   [requireSelection]="true"
 *   [allowCustomValue]="false"
 *   [allowCreate]="true"
 *   [directoryOptions]="{ queryParams: [[['roles', '!=', []]]] }"
 * ></ix-user-combobox>
 * ```
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
