import {
  ChangeDetectionStrategy, Component, computed, effect, input, output,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TnSlideToggleComponent, TnTooltipDirective } from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';

/**
 * tn-table replacement for the ix-table `toggleColumn` cell renderer, built on
 * `tn-slide-toggle` so dashboard card tables carry no Material in their toggle
 * column. Shared across the sharing and data-protection card tables.
 *
 * The test ID is produced by `tn-slide-toggle`'s native `testId` input, which
 * the library prefixes with `toggle-` via `composeTestId` — byte-identical to
 * the legacy `ixTest` output on `mat-slide-toggle`.
 */
@Component({
  selector: 'ix-table-toggle-cell',
  templateUrl: './table-toggle-cell.component.html',
  styleUrls: ['./table-toggle-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    RequiresRolesDirective,
    TnSlideToggleComponent,
    TnTooltipDirective,
  ],
})
export class TableToggleCellComponent {
  /** Column title segment for the test ID (e.g. the translated "Enabled"). */
  readonly title = input.required<string>();
  readonly uniqueRowTag = input.required<string>();
  /** Base aria label for the row (the toggle prepends Enable/Disable). */
  readonly ariaLabel = input.required<string>();
  readonly checked = input.required<boolean>();
  readonly disabled = input<boolean>(false);
  readonly tooltip = input<string>('');
  readonly requiredRoles = input<Role[]>([]);

  readonly toggled = output<boolean>();

  protected readonly testId = computed(() => [this.title(), this.uniqueRowTag(), 'row-toggle']);

  /**
   * `tn-slide-toggle` flips its own internal state on click — instant optimistic
   * feedback — and can only be reset through its `ControlValueAccessor`. Bind it to a
   * form control so the cell can both mirror the authoritative `checked` input (on
   * reload) and undo a flip when the parent calls {@link revert} after a failed update.
   */
  protected readonly control = new FormControl(false, { nonNullable: true });

  constructor() {
    // Kept as two independent effects so a `disabled` change never re-runs the
    // value mirror — otherwise toggling `disabled` mid-flight would clobber the
    // user's optimistic flip by resetting the control to the stale `checked`.
    effect(() => {
      this.control.setValue(this.checked(), { emitEvent: false });
    });
    effect(() => {
      // Drive the disabled state through the control rather than a `[disabled]`
      // binding, which reactive forms warns against on a control-bound element.
      if (this.disabled()) {
        this.control.disable({ emitEvent: false });
      } else {
        this.control.enable({ emitEvent: false });
      }
    });
  }

  /**
   * Undo the user's optimistic flip, returning the toggle to the authoritative
   * `checked` value. Parents call this on a failed update — the table reuses this cell
   * across reloads, so the toggle's internal state has to be reset directly rather than
   * waiting for the `checked` input to change (`tn-slide-toggle` OR-merges its CVA value
   * with the `checked` input, so a stale optimistic flip would otherwise stick). Writing
   * the control drives the library's `writeValue`, which resets that internal state and
   * re-renders the native input through its own `[checked]` binding.
   */
  revert(): void {
    this.control.setValue(this.checked(), { emitEvent: false });
  }
}
