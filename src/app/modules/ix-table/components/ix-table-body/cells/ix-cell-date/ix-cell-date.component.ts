import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import { IxDateComponent } from 'app/modules/pipes/ix-date/ix-date.component';
import { TestIdModule } from 'app/modules/test-id/test-id.module';

@Component({
  selector: 'ix-cell-date',
  templateUrl: './ix-cell-date.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxDateComponent,
    TestIdModule,
    TranslateModule,
  ],
})
export class IxCellDateComponent<T> extends ColumnComponent<T> {
  get date(): number | null | Date {
    if (!this.value) {
      return null;
    }
    if ((this.value as ApiTimestamp)?.$date) {
      return (this.value as ApiTimestamp).$date;
    }
    return this.value as number | Date;
  }
}

export function dateColumn<T>(options: Partial<IxCellDateComponent<T>>): Column<T, IxCellDateComponent<T>> {
  return { type: IxCellDateComponent, ...options };
}
