import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TnTestIdDirective } from '@truenas/ui-components';

/**
 * Renders table with key on the left and value on the right.
 *
 * @example
 *
 * ```html
 * <ix-details-table>
 *   <ix-details-item [label]="'Name' | translate">
 *     {{ user.name}}
 *   </ix-details-item>
 * </ix-details-table>
 * ```
 *
 * For examples on how to test this component with harnesses, see `details-table.harness.spec.ts`.
 */
@Component({
  selector: 'ix-details-table',
  templateUrl: './details-table.component.html',
  styleUrl: './details-table.component.scss',
  standalone: true,
  imports: [
    TnTestIdDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailsTableComponent {

}
