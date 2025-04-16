import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestDirective } from 'app/modules/test-id/test.directive';

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
