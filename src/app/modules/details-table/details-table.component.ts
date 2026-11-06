import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TnTestIdDirective } from '@truenas/ui-components';

/**
 * Renders a table with keys on the left and values on the right, built from
 * `<ix-details-item [label]="…">` children. `details-table.harness.spec.ts` shows how to test it.
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
