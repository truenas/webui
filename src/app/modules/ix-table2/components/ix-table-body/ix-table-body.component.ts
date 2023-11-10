import {
  AfterViewInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  ContentChildren,
  Input,
  QueryList,
  TemplateRef,
  Output,
  EventEmitter,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { IxTableCellDirective } from 'app/modules/ix-table2/directives/ix-table-cell.directive';
import { IxTableDetailsRowDirective } from 'app/modules/ix-table2/directives/ix-table-details-row.directive';
import { DataProvider } from 'app/modules/ix-table2/interfaces/data-provider.interface';
import { Column, ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';

@UntilDestroy()
@Component({
  selector: 'ix-table-body, tbody[ix-table-body]',
  templateUrl: './ix-table-body.component.html',
  styleUrls: ['ix-table-body.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxTableBodyComponent<T> implements AfterViewInit {
  @Input() columns: Column<T, ColumnComponent<T>>[];
  @Input() dataProvider: DataProvider<T>;
  @Input() isLoading = false;

  @Output() expanded = new EventEmitter<T>();

  @ContentChildren(IxTableCellDirective) customCells!: QueryList<IxTableCellDirective<T>>;

  @ContentChild(IxTableDetailsRowDirective) detailsRow: IxTableDetailsRowDirective<T>;

  get displayedColumns(): Column<T, ColumnComponent<T>>[] {
    return this.columns?.filter((column) => !column?.hidden);
  }

  constructor(
    private cdr: ChangeDetectorRef,
  ) {}

  ngAfterViewInit(): void {
    const templatedCellIndexes = this.customCells.toArray().map((cell) => cell.columnIndex);
    const availableIndexes = Array.from({ length: this.columns.length }, (_, idx) => idx)
      .filter((idx) => !templatedCellIndexes.includes(idx));

    this.customCells.forEach((cell) => {
      if (cell.columnIndex === undefined) {
        cell.columnIndex = availableIndexes.shift();
      }
    });

    this.dataProvider.currentPage$.pipe(untilDestroyed(this)).subscribe(() => {
      this.cdr.detectChanges();
      this.cdr.markForCheck();
    });
  }

  get detailsTemplate(): TemplateRef<{ $implicit: T }> | undefined {
    return this.detailsRow?.templateRef;
  }

  getTestAttr(row: T): string {
    const idColumn = this.columns.find((column) => column.identifier);
    return idColumn ? row[idColumn.propertyName].toString() : '';
  }

  getTemplateByColumnIndex(idx: number): TemplateRef<{ $implicit: T }> | undefined {
    return this.customCells.toArray().find((cell) => cell.columnIndex === idx)?.templateRef;
  }

  onToggle(row: T): void {
    this.dataProvider.expandedRow = this.isExpanded(row) ? null : row;
    this.expanded.emit(this.dataProvider.expandedRow);
  }

  isExpanded(row: T): boolean {
    return this.dataProvider.expandedRow === row;
  }
}
