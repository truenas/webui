import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCheckboxChange, MatCheckbox } from '@angular/material/checkbox';
import { TranslateModule } from '@ngx-translate/core';
import { map, Observable } from 'rxjs';
import { ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-header-cell-checkbox',
  templateUrl: './ix-header-cell-checkbox.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCheckbox,
    TranslateModule,
    AsyncPipe,
    TestDirective,
  ],
})
export class IxHeaderCellCheckboxComponent<T> extends ColumnComponent<T> {
  private destroyRef = inject(DestroyRef);

  onColumnCheck: (checked: boolean) => void;

  onCheckboxChange(event: MatCheckboxChange): void {
    this.onColumnCheck(event.checked);
  }

  get allChecked$(): Observable<boolean> {
    return this.dataProvider.currentPage$.pipe(
      map((rows) => rows.every((row) => row[this.propertyName])),
      takeUntilDestroyed(this.destroyRef),
    );
  }
}
