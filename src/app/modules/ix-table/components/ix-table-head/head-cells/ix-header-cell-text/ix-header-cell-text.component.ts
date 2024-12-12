import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';

@Component({
  selector: 'ix-header-cell-text',
  templateUrl: './ix-header-cell-text.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule],
})
export class IxHeaderCellTextComponent<T> extends ColumnComponent<T> {}
