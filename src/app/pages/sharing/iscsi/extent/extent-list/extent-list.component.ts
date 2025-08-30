import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatToolbarRow } from '@angular/material/toolbar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { filter, tap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { IscsiExtentType } from 'app/enums/iscsi.enum';
import { Role } from 'app/enums/role.enum';
import { IscsiExtent } from 'app/interfaces/iscsi.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsWithMenuColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions-with-menu/ix-cell-actions-with-menu.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { yesNoColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-yes-no/ix-cell-yes-no.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableColumnsSelectorComponent } from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { createTable } from 'app/modules/ix-table/utils';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ExtentFormComponent } from 'app/pages/sharing/iscsi/extent/extent-form/extent-form.component';
import {
  DeleteExtentDialog,
} from 'app/pages/sharing/iscsi/extent/extent-list/delete-extent-dialog/delete-extent-dialog.component';
import { extentListElements } from 'app/pages/sharing/iscsi/extent/extent-list/extent-list.elements';
import { IscsiService } from 'app/services/iscsi.service';

@UntilDestroy()
@Component({
  selector: 'ix-iscsi-extent-list',
  templateUrl: './extent-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    FakeProgressBarComponent,
    MatToolbarRow,
    BasicSearchComponent,
    IxTableColumnsSelectorComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    MatCardContent,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTablePagerComponent,
    TranslateModule,
    AsyncPipe,
    UiSearchDirective,
  ],
})
export class ExtentListComponent implements OnInit {
  emptyService = inject(EmptyService);
  private slideIn = inject(SlideIn);
  private translate = inject(TranslateService);
  private matDialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  private iscsiService = inject(IscsiService);

  protected readonly searchableElements = extentListElements;

  protected readonly requiredRoles = [
    Role.SharingIscsiExtentWrite,
    Role.SharingIscsiWrite,
    Role.SharingWrite,
  ];

  isLoading = false;
  searchQuery = signal('');
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
      title: this.translate.instant('Product ID'),
      propertyName: 'product_id',
    }),
    textColumn({
      title: this.translate.instant('NAA'),
      propertyName: 'naa',
    }),
    yesNoColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
    }),
    actionsWithMenuColumn({
      actions: [
        {
          iconName: iconMarker('edit'),
          tooltip: this.translate.instant('Edit'),
          onClick: (extent) => {
            this.slideIn.open(ExtentFormComponent, { wide: true, data: extent }).pipe(
              filter((response) => !!response.response),
              untilDestroyed(this),
            ).subscribe(() => this.refresh());
          },
        },
        {
          iconName: iconMarker('mdi-delete'),
          tooltip: this.translate.instant('Delete'),
          onClick: (row) => this.showDeleteDialog(row),
          requiredRoles: this.requiredRoles,
        },
      ],
    }),
  ], {
    uniqueRowTag: (row) => 'iscsi-extent-' + row.name,
    ariaLabels: (row) => [row.name, this.translate.instant('iSCSI Extent')],
  });

  ngOnInit(): void {
    const extents$ = this.iscsiService.getExtents().pipe(
      tap((extents) => this.extents = extents),
      untilDestroyed(this),
    );

    this.iscsiService.listenForDataRefresh()
      .pipe(untilDestroyed(this))
      .subscribe(() => this.dataProvider.load());

    this.dataProvider = new AsyncDataProvider(extents$);
    this.refresh();
    this.dataProvider.emptyType$.pipe(untilDestroyed(this)).subscribe(() => {
      this.onListFiltered(this.searchQuery());
    });
  }

  protected doAdd(): void {
    this.slideIn.open(ExtentFormComponent, { wide: true }).pipe(
      filter((response) => !!response.response),
      untilDestroyed(this),
    ).subscribe(() => this.refresh());
  }

  private showDeleteDialog(extent: IscsiExtent): void {
    this.matDialog.open(DeleteExtentDialog, { data: extent })
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.refresh());
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);
    this.dataProvider.setFilter({ query, columnKeys: ['name'] });
  }

  protected columnsChange(columns: typeof this.columns): void {
    this.columns = [...columns];
    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }

  private refresh(): void {
    this.dataProvider.load();
  }
}
