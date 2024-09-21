import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ColumnComponent, Column } from 'app/modules/ix-table/interfaces/column-component.class';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { TestIdModule } from 'app/modules/test-id/test-id.module';

@Component({
  selector: 'ix-cell-yesno',
  templateUrl: './ix-cell-yes-no.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TestIdModule,
    TranslateModule,
    YesNoPipe,
  ],
})
export class IxCellYesNoComponent<T> extends ColumnComponent<T> {}

export function yesNoColumn<T>(options: Partial<IxCellYesNoComponent<T>>): Column<T, IxCellYesNoComponent<T>> {
  return { type: IxCellYesNoComponent, ...options };
}
