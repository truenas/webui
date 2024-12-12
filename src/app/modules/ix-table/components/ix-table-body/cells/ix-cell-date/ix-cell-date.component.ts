import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { IxDateComponent } from 'app/modules/dates/pipes/ix-date/ix-date.component';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-cell-date',
  templateUrl: './ix-cell-date.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxDateComponent,
    TranslateModule,
    TestDirective,
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

    if (typeof this.value === 'string') {
      return this.value as null;
    }

    return this.value as number;
  }

  get dateDataType(): string {
    return typeof this.date;
  }
}

export function dateColumn<T>(options: Partial<IxCellDateComponent<T>>): Column<T, IxCellDateComponent<T>> {
  return { type: IxCellDateComponent, ...options };
}
