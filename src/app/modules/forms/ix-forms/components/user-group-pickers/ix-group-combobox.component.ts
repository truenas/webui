import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { TnAutocompleteComponent } from '@truenas/ui-components';
import { DirectoryComboboxBase } from 'app/modules/forms/ix-forms/classes/directory-field.base';

/**
 * Single-group selection searched against {@link UserDirectoryService}; the group twin of
 * `ix-user-combobox`, without the create row, e.g.
 * `<ix-group-combobox formControlName="group" [directoryOptions]="{ localOnly: true }" />`.
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
