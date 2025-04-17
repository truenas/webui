import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestDirective } from 'app/modules/test-id/test.directive';

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
    TestDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailsTableComponent {

}
