import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnInit, computed, inject, signal, DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  tnIconMarker, TnButtonComponent, TnCardComponent, TnCardHeaderActionsDirective,
  TnCellDefDirective, TnDialog, TnHeaderCellDefDirective, TnTableColumnDirective, TnTableComponent,
  TnTablePagerComponent, TnTestIdDirective, TnTooltipDirective,
  type TnSortEvent,
} from '@truenas/ui-components';
import { kebabCase } from 'lodash-es';
import { filter } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { IscsiExtentType } from 'app/enums/iscsi.enum';
import { Role } from 'app/enums/role.enum';
import { IscsiExtent } from 'app/interfaces/iscsi.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { actionsWithMenuColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions-with-menu/ix-cell-actions-with-menu.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { yesNoColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-yes-no/ix-cell-yes-no.component';
import { TableColumnPickerComponent } from 'app/modules/ix-table/components/table-column-picker/table-column-picker.component';
import { convertStringToId, createTable, mapTnSortToTableSort, toDisplayedColumns } from 'app/modules/ix-table/utils';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { TableActionsCellComponent } from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import { ExtentFormComponent } from 'app/pages/sharing/iscsi/extent/extent-form/extent-form.component';
import {
  DeleteExtentDialog,
} from 'app/pages/sharing/iscsi/extent/extent-list/delete-extent-dialog/delete-extent-dialog.component';
import { extentListElements } from 'app/pages/sharing/iscsi/extent/extent-list/extent-list.elements';
import { IscsiService } from 'app/services/iscsi.service';

@Component({
  selector: 'ix-iscsi-extent-list',
  templateUrl: './extent-list.component.html',
  styleUrls: ['./extent-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardHeaderActionsDirective,
    BasicSearchComponent,
    TableColumnPickerComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    TnTestIdDirective,
    UiSearchDirective,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TableActionsCellComponent,
    TnTablePagerComponent,
    TnTooltipDirective,
    TranslateModule,
    AsyncPipe,
    YesNoPipe,
  ],
})
export class ExtentListComponent implements OnInit {
  protected emptyService = inject(EmptyService);
  private formPanel = inject(FormSidePanelService);
  private translate = inject(TranslateService);
  private tnDialog = inject(TnDialog);
  private iscsiService = inject(IscsiService);
  private destroyRef = inject(DestroyRef);

  protected readonly searchableElements = extentListElements;

  protected readonly requiredRoles = [
    Role.SharingIscsiExtentWrite,
    Role.SharingIscsiWrite,
    Role.SharingWrite,
  ];

  protected readonly searchQuery = signal('');
  protected dataProvider: AsyncDataProvider<IscsiExtent>;

  protected readonly actions: IconActionConfig<IscsiExtent>[] = [
    {
      iconName: tnIconMarker('pencil', 'mdi'),
      tooltip: this.translate.instant('Edit'),
      onClick: (extent) => {
        this.openForm(extent);
      },
    },
    {
      iconName: tnIconMarker('delete', 'mdi'),
      tooltip: this.translate.instant('Delete'),
      onClick: (row) => this.showDeleteDialog(row),
      requiredRoles: this.requiredRoles,
    },
  ];

  // ix-table column model retained purely to drive <ix-table-column-picker>
  // (visibility + saved prefs); tn-table renders cells from the template and
  // derives its `displayedColumns` from these via `toDisplayedColumns`.
  protected readonly columns = signal(createTable<IscsiExtent>([
    textColumn({
      title: this.translate.instant('Extent Name'),
      propertyName: 'name',
    }),
    textColumn({
      title: this.translate.instant('Device/File'),
      propertyName: 'path',
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
    actionsWithMenuColumn({ actions: [] }),
  ], {
    uniqueRowTag: (row) => 'iscsi-extent-' + row.name,
    ariaLabels: (row) => [row.name, this.translate.instant('iSCSI Extent')],
  }));

  protected readonly displayedColumns = computed<string[]>(() => toDisplayedColumns(this.columns()));

  protected readonly trackByExtentId = (_index: number, row: IscsiExtent): number => row.id;

  protected uniqueRowTag(row: IscsiExtent): string {
    // Pre-split with lodash kebabCase so digit-bearing values resolve identically through
    // the legacy [ixTest] directive and the library [tnTestId] directive (see nfs-list).
    return kebabCase(convertStringToId('iscsi-extent-' + row.name));
  }

  protected ariaLabel(row: IscsiExtent): string {
    return [row.name, this.translate.instant('iSCSI Extent')].join(' ');
  }

  protected devicePath(extent: IscsiExtent): string {
    return extent.type === IscsiExtentType.Disk ? extent.disk : extent.path;
  }

  ngOnInit(): void {
    const extents$ = this.iscsiService.getExtents();

    this.iscsiService.listenForDataRefresh()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.dataProvider.load());

    this.dataProvider = new AsyncDataProvider(extents$);
    this.refresh();
    this.dataProvider.emptyType$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.onListFiltered(this.searchQuery());
    });
  }

  protected doAdd(): void {
    this.openForm();
  }

  protected openForm(extent?: IscsiExtent): void {
    this.formPanel.open(ExtentFormComponent, {
      title: extent
        ? this.translate.instant('Edit Extent')
        : this.translate.instant('Add Extent'),
      wide: true,
      inputs: { extentData: extent },
    }).onSuccess(() => this.refresh(), this.destroyRef);
  }

  private showDeleteDialog(extent: IscsiExtent): void {
    this.tnDialog.open(DeleteExtentDialog, { data: extent })
      .closed
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refresh());
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(mapTnSortToTableSort<IscsiExtent>(event, this.displayedColumns()));
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);
    this.dataProvider.setFilter({ query, columnKeys: ['name'] });
  }

  protected onColumnsChange(columns: ReturnType<typeof this.columns>): void {
    this.columns.set([...columns]);
  }

  private refresh(): void {
    this.dataProvider.load();
  }
}
