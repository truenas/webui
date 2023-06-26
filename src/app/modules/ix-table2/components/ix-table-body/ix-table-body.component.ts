import {
  AfterViewInit,
  Component,
  ContentChild,
  ContentChildren,
  Input,
  QueryList,
  TemplateRef,
} from '@angular/core';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';
import { IxTableCellDirective } from 'app/modules/ix-table2/directives/ix-table-cell.directive';
import { IxTableDetailsRowDirective } from 'app/modules/ix-table2/directives/ix-table-details-row.directive';
import { TableColumn } from 'app/modules/ix-table2/interfaces/table-column.interface';

@Component({
  selector: 'ix-table-body, tbody[ix-table-body]',
  templateUrl: './ix-table-body.component.html',
  styleUrls: ['ix-table-body.component.scss'],
})
export class IxTableBodyComponent<T> implements AfterViewInit {
  @Input() columns: TableColumn<T>[];
  @Input() dataProvider: ArrayDataProvider<T>;
  @Input() isLoading = false;

  @ContentChildren(IxTableCellDirective)
  ixTableRows!: QueryList<IxTableCellDirective<T>>;

  @ContentChild(IxTableDetailsRowDirective)
  ixTableDetailsRow: IxTableDetailsRowDirective<T>;

  ngAfterViewInit(): void {
    const templatedRowIndexes = this.ixTableRows.toArray().map((row) => row.columnIndex);
    const availabledIndexes = Array.from({ length: this.columns.length }, (_, idx) => idx)
      .filter((idx) => !templatedRowIndexes.includes(idx));

    this.ixTableRows.forEach((row) => {
      if (row.columnIndex === undefined) {
        row.columnIndex = availabledIndexes.shift();
      }
    });
  }

  get detailsTemplate(): TemplateRef<{ $implicit: T }> | undefined {
    return this.ixTableDetailsRow?.templateRef;
  }

  getTemplateByColumnIndex(idx: number): TemplateRef<{ $implicit: T }> | undefined {
    return this.ixTableRows.toArray().find((row) => row.columnIndex === idx)?.templateRef;
  }

  onToggle(row: T): void {
    this.dataProvider.expandedRow = this.isExpanded(row) ? null : row;
  }

  isExpanded(row: T): boolean {
    return this.dataProvider.expandedRow === row;
  }
}
