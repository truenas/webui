import { NgClass, NgStyle } from '@angular/common';
import {
  AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { IxTableHeaderCellDirective } from 'app/modules/ix-table/directives/ix-header-cell.directive';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import { DataProvider } from 'app/modules/ix-table/interfaces/data-provider.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';

@UntilDestroy()
@Component({
  selector: 'ix-table-head, thead[ix-table-head]',
  templateUrl: './ix-table-head.component.html',
  styleUrls: ['ix-table-head.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    NgClass,
    NgStyle,
    IxTableHeaderCellDirective,
    IxIconComponent,
    TestDirective,
    TooltipComponent,
    TranslateModule,
  ],
})
export class IxTableHeadComponent<T> implements AfterViewInit {
  @Input() columns: Column<T, ColumnComponent<T>>[];
  @Input() dataProvider: DataProvider<T>;

  readonly SortDirection = SortDirection;

  get displayedColumns(): Column<T, ColumnComponent<T>>[] {
    return this.columns?.filter((column) => !column?.hidden);
  }

  constructor(
    private cdr: ChangeDetectorRef,
  ) {}

  ngAfterViewInit(): void {
    this.dataProvider.currentPage$.pipe(untilDestroyed(this)).subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  onSort(columnId: number): void {
    if (this.displayedColumns[columnId]?.disableSorting) {
      return;
    }

    const currentDirection = this.dataProvider.sorting.direction;
    const currentActive = this.dataProvider.sorting.active;

    let direction = currentDirection;
    let active = currentActive;

    if (currentActive !== columnId) {
      direction = null;
      active = columnId;
    }
    if (direction === null) {
      direction = SortDirection.Asc;
    } else if (currentDirection === SortDirection.Asc) {
      direction = SortDirection.Desc;
    } else if (currentDirection === SortDirection.Desc) {
      direction = null;
    }

    const sortBy = (this.displayedColumns[columnId].sortBy
      || this.displayedColumns[columnId].getValue) as (row: T) => string | number;

    this.dataProvider.setSorting({
      propertyName: this.displayedColumns[columnId].propertyName,
      sortBy,
      direction,
      active,
    });
  }
}
