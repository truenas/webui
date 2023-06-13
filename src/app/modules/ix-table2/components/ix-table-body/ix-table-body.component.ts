import {
  AfterViewInit,
  Component,
  ContentChildren,
  Input,
  QueryList,
  TemplateRef,
} from '@angular/core';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';
import { IxTableRowDirective } from 'app/modules/ix-table2/directives/ix-table-row.directive';
import { TableColumn } from 'app/modules/ix-table2/interfaces/table-column.interface';

@Component({
  selector: 'ix-table-body, tbody[ix-table-body]',
  templateUrl: './ix-table-body.component.html',
  styleUrls: ['ix-table-body.component.scss'],
})
export class IxTableBodyComponent<T> implements AfterViewInit {
  @Input() columns!: TableColumn<T>[];
  @Input() dataProvider!: ArrayDataProvider<T>;

  @ContentChildren(IxTableRowDirective)
  ixTableRows!: QueryList<IxTableRowDirective<T>>;

  ngAfterViewInit(): void {
    const appointedIds = this.ixTableRows.toArray().map((row) => row.columnIndex);
    const availabledIds = Array.from({ length: this.columns.length }, (_, idx) => idx)
      .filter((id) => !appointedIds.includes(id));

    this.ixTableRows.forEach((row) => {
      if (row.columnIndex === undefined) {
        row.columnIndex = availabledIds.shift();
      }
    });
  }

  getTemplateByColumnIndex(idx: number): TemplateRef<{ $implicit: T }> | undefined {
    return this.ixTableRows.toArray().find((row) => row.columnIndex === idx)?.templateRef;
  }
}
