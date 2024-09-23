import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-table',
  templateUrl: './ix-table.component.html',
  styleUrls: ['./ix-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TestDirective,
  ],
})
export class IxTableComponent {}
