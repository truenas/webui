import {
  Component, ChangeDetectionStrategy, input,
} from '@angular/core';
import { Option } from 'app/interfaces/option.interface';

@Component({
  selector: 'ix-table-expandable-row',
  templateUrl: './ix-table-expandable-row.component.html',
  styleUrls: ['./ix-table-expandable-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxTableExpandableRowComponent {
  readonly data = input<Option[]>();
}
