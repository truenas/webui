import {
  Component, ChangeDetectionStrategy, Input,
} from '@angular/core';
import { Option } from 'app/interfaces/option.interface';

@Component({
  selector: 'ix-table2-expandable-row',
  templateUrl: './ix-table2-expandable-row.component.html',
  styleUrls: ['./ix-table2-expandable-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxTable2ExpandableRowComponent {
  @Input() data: Option[];
}
