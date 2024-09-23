import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestIdModule } from 'app/modules/test-id/test-id.module';

@Component({
  selector: 'ix-table',
  templateUrl: './ix-table.component.html',
  styleUrls: ['./ix-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TestIdModule],
})
export class IxTableComponent {}
