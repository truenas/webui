import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { TnChipInputComponent } from '@truenas/ui-components';
import { DirectoryChipsBase } from 'app/modules/forms/ix-forms/classes/directory-field.base';

/**
 * Multi-user selection as chips, searched against {@link UserDirectoryService}. Every typed name is
 * checked, and those that don't resolve are named in one validation message. Use inside a
 * `tn-form-field`: `<ix-user-chips formControlName="users" />`.
 */
@Component({
  selector: 'ix-user-chips',
  imports: [TnChipInputComponent],
  templateUrl: './directory-chips.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxUserChipsComponent extends DirectoryChipsBase {
  /**
   * Declared here rather than on the shared base: a view query on an abstract
   * `@Directive()` never resolves, so the base takes it as an abstract member
   * instead.
   */
  protected readonly innerControl = viewChild(TnChipInputComponent);

  protected readonly kind = 'user' as const;
}
