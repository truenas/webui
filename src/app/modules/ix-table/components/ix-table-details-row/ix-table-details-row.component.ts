import {
  Component, ChangeDetectionStrategy, input,
} from '@angular/core';
import { MatDivider } from '@angular/material/divider';
import { TranslateModule } from '@ngx-translate/core';
import { IxTableBodyCellDirective } from 'app/modules/ix-table/directives/ix-body-cell.directive';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';

@Component({
  selector: 'ix-table-details-row',
  templateUrl: './ix-table-details-row.component.html',
  styleUrls: ['./ix-table-details-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxTableBodyCellDirective,
    MatDivider,
    TranslateModule,
  ],
})
export class IxTableDetailsRowComponent<T> {
  readonly hiddenColumns = input<Column<T, ColumnComponent<T>>[]>();
  readonly row = input<T>();
}
