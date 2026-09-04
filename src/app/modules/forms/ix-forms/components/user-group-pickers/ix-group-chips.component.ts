import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { TnChipInputComponent } from '@truenas/ui-components';
import { DirectoryChipsBase } from 'app/modules/forms/ix-forms/classes/directory-field.base';

/**
 * Multi-group selection as chips, searched against {@link UserDirectoryService}.
 * The group-side twin of `ix-user-chips`.
 *
 * @example
 * ```html
 * <tn-form-field [label]="'Groups' | translate">
 *   <ix-group-chips formControlName="groups" />
 * </tn-form-field>
 * ```
 */
@Component({
  selector: 'ix-group-chips',
  imports: [TnChipInputComponent],
  templateUrl: './directory-chips.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxGroupChipsComponent extends DirectoryChipsBase {
  /**
   * Declared here rather than on the shared base: a view query on an abstract
   * `@Directive()` never resolves, so the base takes it as an abstract member
   * instead.
   */
  protected readonly innerControl = viewChild(TnChipInputComponent);

  protected readonly kind = 'group' as const;
}
