import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnTooltipDirective } from '@truenas/ui-components';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-cell-text',
  templateUrl: './ix-cell-text.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnTooltipDirective,
    TranslateModule,
    TestDirective,
  ],
})
export class IxCellTextComponent<T> extends ColumnComponent<T> {}

export function textColumn<T>(options: Partial<IxCellTextComponent<T>>): Column<T, IxCellTextComponent<T>> {
  return { type: IxCellTextComponent, ...options };
}
