import {
  NgStyle, NgClass, NgTemplateOutlet, AsyncPipe,
} from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  Component,
  contentChildren,
  contentChild,
  TemplateRef, output, input,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { IxTableBodyCellDirective } from 'app/modules/ix-table/directives/ix-body-cell.directive';
import { IxTableCellDirective } from 'app/modules/ix-table/directives/ix-table-cell.directive';
import { IxTableDetailsRowDirective } from 'app/modules/ix-table/directives/ix-table-details-row.directive';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import { DataProvider } from 'app/modules/ix-table/interfaces/data-provider.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';

@UntilDestroy()
@Component({
  selector: 'ix-table-body, tbody[ix-table-body]',
  templateUrl: './ix-table-body.component.html',
  styleUrls: ['ix-table-body.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    UiSearchDirective,
    NgStyle,
    NgClass,
    NgTemplateOutlet,
    IxTableBodyCellDirective,
    MatIconButton,
    MatTooltip,
    IxIconComponent,
    MatProgressSpinner,
    TranslateModule,
    AsyncPipe,
    TestDirective,
  ],
})
export class IxTableBodyComponent<T> implements AfterViewInit {
  readonly columns = input<Column<T, ColumnComponent<T>>[]>();
  readonly dataProvider = input<DataProvider<T>>();
  readonly isLoading = input(false);
  readonly detailsRowIdentifier = input<keyof T>('id' as keyof T);

  readonly expanded = output<T>();

  readonly customCells = contentChildren(IxTableCellDirective);

  readonly detailsRow = contentChild(IxTableDetailsRowDirective);

  get displayedColumns(): Column<T, ColumnComponent<T>>[] {
    return this.columns()?.filter((column) => !column?.hidden);
  }

  get detailsTemplate(): TemplateRef<{ $implicit: T }> | undefined {
    return this.detailsRow()?.templateRef;
  }

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    const templatedCellIndexes = this.customCells().map((cell) => cell.columnIndex());
    const availableIndexes = Array.from({ length: this.columns().length }, (_, idx) => idx)
      .filter((idx) => !templatedCellIndexes.includes(idx));

    this.customCells().forEach((cell) => {
      if (cell.columnIndex() === undefined) {
        cell.columnIndex.set(availableIndexes.shift());
      }
    });

    this.dataProvider().currentPage$.pipe(untilDestroyed(this)).subscribe(() => {
      this.cdr.detectChanges();
      this.cdr.markForCheck();
    });
  }

  getRowTag(row: T): string {
    return this.columns()[0]?.uniqueRowTag(row) ?? '';
  }

  getTemplateByColumnIndex(idx: number): TemplateRef<{ $implicit: T }> | undefined {
    return this.customCells().find((cell) => cell.columnIndex() === idx)?.templateRef;
  }

  onToggle(row: T): void {
    this.dataProvider().expandedRow = this.isExpanded(row) ? null : row;
    this.expanded.emit(this.dataProvider().expandedRow);
  }

  isExpanded(row: T): boolean {
    return this.detailsRowIdentifier()
      && (this.dataProvider()?.expandedRow?.[this.detailsRowIdentifier()] === row?.[this.detailsRowIdentifier()]);
  }

  protected trackRowByIdentity(item: T): string {
    return this.getRowTag(item);
  }

  protected trackColumnByIdentity(column: Column<T, ColumnComponent<T>>): Column<T, ColumnComponent<T>> {
    return column;
  }
}
