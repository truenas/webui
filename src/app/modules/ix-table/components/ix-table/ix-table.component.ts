import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ix-table',
  templateUrl: './ix-table.component.html',
  styleUrls: ['./ix-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxTableComponent {}
