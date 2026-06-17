import {
  ChangeDetectionStrategy, Component, computed, input, output,
} from '@angular/core';
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
}
