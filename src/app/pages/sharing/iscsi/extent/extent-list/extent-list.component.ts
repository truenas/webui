import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, tap } from 'rxjs';
import { IscsiExtentType } from 'app/enums/iscsi.enum';
import { IscsiExtent } from 'app/interfaces/iscsi.interface';
import { AsyncDataProvider } from 'app/modules/ix-table2/async-data-provider';
import { actionsColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { yesNoColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-yesno/ix-cell-yesno.component';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { ExtentFormComponent } from 'app/pages/sharing/iscsi/extent/extent-form/extent-form.component';
import {
  DeleteExtentDialogComponent,
} from 'app/pages/sharing/iscsi/extent/extent-list/delete-extent-dialog/delete-extent-dialog.component';
import { IscsiService } from 'app/services/iscsi.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-iscsi-extent-list',
  templateUrl: './extent-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExtentListComponent implements OnInit {
  isLoading = false;
  filterString = '';
  dataProvider: AsyncDataProvider<IscsiExtent>;

  extents: IscsiExtent[] = [];

  columns = createTable<IscsiExtent>([
    textColumn({
      title: this.translate.instant('Extent Name'),
      propertyName: 'name',
    }),
    textColumn({
      title: this.translate.instant('Device/File'),
      propertyName: 'path',
      getValue: (extent) => {
        return extent.type === IscsiExtentType.Disk ? extent.disk : extent.path;
      },
    }),
    textColumn({
      title: this.translate.instant('Description'),
      propertyName: 'comment',
    }),
    textColumn({
      title: this.translate.instant('Serial'),
      propertyName: 'serial',
    }),
    textColumn({
      title: this.translate.instant('NAA'),
      propertyName: 'naa',
    }),
    yesNoColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
    }),
    actionsColumn({
      actions: [
        {
          iconName: 'edit',
          tooltip: this.translate.instant('Edit'),
          onClick: (extent) => {
            const slideInRef = this.slideInService.open(ExtentFormComponent, { wide: true, data: extent });
            slideInRef.slideInClosed$
              .pipe(filter(Boolean), untilDestroyed(this))
              .subscribe(() => this.dataProvider.load());
          },
        },
        {
          iconName: 'delete',
          tooltip: this.translate.instant('Delete'),
          onClick: (row) => this.showDeleteDialog(row),
        },
      ],
    }),
  ]);

  constructor(
    public emptyService: EmptyService,
    private slideInService: IxSlideInService,
    private translate: TranslateService,
    private matDialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private iscsiService: IscsiService,
  ) {}

  ngOnInit(): void {
    const extents$ = this.iscsiService.getExtents().pipe(
      tap((extents) => this.extents = extents),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider(extents$);
    this.dataProvider.load();
  }

  doAdd(): void {
    const slideInRef = this.slideInService.open(ExtentFormComponent, { wide: true });
    slideInRef.slideInClosed$
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.dataProvider.load());
  }

  showDeleteDialog(extent: IscsiExtent): void {
    this.matDialog.open(DeleteExtentDialogComponent, { data: extent })
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.dataProvider.load());
  }

  onListFiltered(query: string): void {
    this.filterString = query.toLowerCase();
    this.dataProvider.setRows(this.extents.filter((extent) => {
      return [extent.name].includes(this.filterString);
    }));
  }

  columnsChange(columns: typeof this.columns): void {
    this.columns = [...columns];
    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }
}
