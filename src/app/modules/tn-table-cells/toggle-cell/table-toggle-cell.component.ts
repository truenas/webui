import {
  ChangeDetectionStrategy, Component, computed, effect, input, output, viewChild,
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

  private readonly slideToggle = viewChild(TnSlideToggleComponent);

  constructor() {
    effect(() => {
      this.control.setValue(this.checked(), { emitEvent: false });
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
   * across reloads, so the library's internal state has to be reset directly rather
   * than waiting for `checked` to change. The native input is also reset imperatively
   * because Angular's property binding skips the write when the value nets unchanged.
   */
  revert(): void {
    this.control.setValue(this.checked(), { emitEvent: false });
    const toggle = this.slideToggle();
    if (toggle) {
      toggle.toggleEl().nativeElement.checked = this.checked();
    }
  }
}
