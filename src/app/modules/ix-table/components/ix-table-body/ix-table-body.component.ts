import {
  NgStyle, NgClass, NgTemplateOutlet, AsyncPipe,
} from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  ContentChildren,
  Input,
  QueryList,
  TemplateRef, output,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTableBodyCellDirective } from 'app/modules/ix-table/directives/ix-body-cell.directive';
import { IxTableCellDirective } from 'app/modules/ix-table/directives/ix-table-cell.directive';
import { IxTableDetailsRowDirective } from 'app/modules/ix-table/directives/ix-table-details-row.directive';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import { DataProvider } from 'app/modules/ix-table/interfaces/data-provider.interface';
import { TestIdModule } from 'app/modules/test-id/test-id.module';

@UntilDestroy()
@Component({
  selector: 'ix-table-body, tbody[ix-table-body]',
  templateUrl: './ix-table-body.component.html',
  styleUrls: ['ix-table-body.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TestIdModule,
    UiSearchDirective,
    NgStyle,
    NgClass,
    NgTemplateOutlet,
    IxTableBodyCellDirective,
    MatIconButton,
    MatTooltip,
    IxIconModule,
    MatProgressSpinner,
    TranslateModule,
    AsyncPipe,
  ],
})
export class IxTableBodyComponent<T> implements AfterViewInit {
  @Input() columns: Column<T, ColumnComponent<T>>[];
  @Input() dataProvider: DataProvider<T>;
  @Input() isLoading = false;
  @Input() detailsRowIdentifier: keyof T = 'id' as keyof T;

  readonly expanded = output<T>();

  @ContentChildren(IxTableCellDirective) customCells!: QueryList<IxTableCellDirective<T>>;

  @ContentChild(IxTableDetailsRowDirective) detailsRow: IxTableDetailsRowDirective<T>;

  get displayedColumns(): Column<T, ColumnComponent<T>>[] {
    return this.columns?.filter((column) => !column?.hidden);
  }

  get detailsTemplate(): TemplateRef<{ $implicit: T }> | undefined {
    return this.detailsRow?.templateRef;
  }

  constructor(private cdr: ChangeDetectorRef) {}

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

  getRowTag(row: T): string {
    return this.columns[0]?.uniqueRowTag(row) ?? '';
  }

  getTemplateByColumnIndex(idx: number): TemplateRef<{ $implicit: T }> | undefined {
    return this.customCells.toArray().find((cell) => cell.columnIndex === idx)?.templateRef;
  }

  onToggle(row: T): void {
    this.dataProvider.expandedRow = this.isExpanded(row) ? null : row;
    this.expanded.emit(this.dataProvider.expandedRow);
  }

  isExpanded(row: T): boolean {
    return this.detailsRowIdentifier
      && (this.dataProvider?.expandedRow?.[this.detailsRowIdentifier] === row?.[this.detailsRowIdentifier]);
  }

  protected trackRowByIdentity(item: T): string {
    return this.getRowTag(item);
  }

  protected trackColumnByIdentity(column: Column<T, ColumnComponent<T>>): Column<T, ColumnComponent<T>> {
    return column;
  }
}
