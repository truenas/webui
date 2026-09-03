import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { TnAutocompleteComponent } from '@truenas/ui-components';
import { DirectoryComboboxBase } from 'app/modules/forms/ix-forms/classes/directory-field.base';

/**
 * Single-group selection, searched against {@link UserDirectoryService}. The
 * group-side twin of `ix-user-combobox`, minus the create row.
 *
 * @example
 * ```html
 * <tn-form-field [label]="'Group' | translate">
 *   <ix-group-combobox formControlName="group" [directoryOptions]="{ localOnly: true }" />
 * </tn-form-field>
 * ```
 */
@Component({
  selector: 'ix-group-combobox',
  imports: [TnAutocompleteComponent],
  templateUrl: './directory-autocomplete.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxGroupComboboxComponent extends DirectoryComboboxBase {
  /**
   * Declared here rather than on the shared base: a view query on an abstract
   * `@Directive()` never resolves, so the base takes it as an abstract member
   * instead.
   */
  protected readonly innerControl = viewChild(TnAutocompleteComponent);

  protected readonly kind = 'group' as const;
}
