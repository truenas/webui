import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { map, Observable } from 'rxjs';
import { ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';

@UntilDestroy()
@Component({
  selector: 'ix-header-cell-checkbox',
  templateUrl: './ix-header-cell-checkbox.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxHeaderCellCheckboxComponent<T> extends ColumnComponent<T> {
  onColumnCheck: (checked: boolean) => void;

  onCheckboxChange(event: MatCheckboxChange): void {
    this.onColumnCheck(event.checked);
  }

  get allChecked$(): Observable<boolean> {
    return this.dataProvider.currentPage$.pipe(
      map((rows) => rows.every((row) => row[this.propertyName])),
      untilDestroyed(this),
    );
  }
}
