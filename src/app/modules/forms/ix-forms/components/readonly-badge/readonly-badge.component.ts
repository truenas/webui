import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ix-readonly-badge',
  templateUrl: './readonly-badge.component.html',
  styleUrls: ['./readonly-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReadOnlyComponent {

}
