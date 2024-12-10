import {
  Component, ChangeDetectionStrategy, input,
} from '@angular/core';
import { MatDivider } from '@angular/material/divider';
import { TranslateModule } from '@ngx-translate/core';
import { ActionOption } from 'app/interfaces/option.interface';

@Component({
  selector: 'ix-table-expandable-row',
  templateUrl: './ix-table-expandable-row.component.html',
  styleUrls: ['./ix-table-expandable-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatDivider, TranslateModule],
})
export class IxTableExpandableRowComponent {
  readonly data = input<ActionOption[]>();
}
