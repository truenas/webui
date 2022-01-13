import {
  trigger, state, animate, style, transition,
} from '@angular/animations';
import {
  Component, ChangeDetectionStrategy, Input,
} from '@angular/core';
import { Option } from 'app/interfaces/option.interface';

@Component({
  selector: 'ix-table-expandable-row',
  templateUrl: './ix-table-expandable-row.component.html',
  styleUrls: ['./ix-table-expandable-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('rowExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class IxTableExpandableRowComponent {
  @Input() data: Option[];
  @Input() isExpanded: boolean;
}
