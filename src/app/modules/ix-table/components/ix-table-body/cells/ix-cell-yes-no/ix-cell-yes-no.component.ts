import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ColumnComponent, Column } from 'app/modules/ix-table/interfaces/column-component.class';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-cell-yesno',
  templateUrl: './ix-cell-yes-no.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TranslateModule,
    YesNoPipe,
    TestDirective,
  ],
})
export class IxCellYesNoComponent<T> extends ColumnComponent<T> {}

export function yesNoColumn<T>(options: Partial<IxCellYesNoComponent<T>>): Column<T, IxCellYesNoComponent<T>> {
  return { type: IxCellYesNoComponent, ...options };
}
