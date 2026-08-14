import {
  ChangeDetectionStrategy, Component, OnInit, computed, inject, signal, DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  tnIconMarker, TnButtonComponent, TnCardComponent, TnCardHeaderActionsDirective,
  TnCellDefDirective, TnDialog, TnHeaderCellDefDirective, TnTableColumnDirective, TnTableComponent,
  TnTablePagerComponent, TnTestIdDirective, TnTooltipDirective,
  type TnSortEvent,
} from '@truenas/ui-components';
import { filter } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { IscsiExtentType } from 'app/enums/iscsi.enum';
import { Role } from 'app/enums/role.enum';
import { IscsiExtent } from 'app/interfaces/iscsi.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { AsyncDataProvider } from 'app/modules/tn-table/classes/async-data-provider/async-data-provider';
import { actionsColumn, column } from 'app/modules/tn-table/column-configs';
import { TableColumnPickerComponent } from 'app/modules/tn-table/components/table-column-picker/table-column-picker.component';
import { IconActionConfig } from 'app/modules/tn-table/interfaces/icon-action-config.interface';
import {
  createTable, dataProviderLoading, dataProviderRows, mapTnSortToTableSort, toDisplayedColumns, toUniqueRowTag,
} from 'app/modules/tn-table/utils';
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
  protected readonly dataProvider = new AsyncDataProvider<IscsiExtent>(this.iscsiService.getExtents());
  protected readonly rows = dataProviderRows(this.dataProvider);
  protected readonly isLoading = dataProviderLoading(this.dataProvider);
  protected readonly emptyType = toSignal(this.dataProvider.emptyType$);

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

  // Column model retained purely to drive <ix-table-column-picker>
  // (visibility + saved prefs); tn-table renders cells from the template and
  // derives its `displayedColumns` from these via `toDisplayedColumns`.
  protected readonly columns = signal(createTable<IscsiExtent>([
    column({
      title: this.translate.instant('Extent Name'),
      propertyName: 'name',
    }),
    column({
      title: this.translate.instant('Device/File'),
      propertyName: 'path',
    }),
    column({
      title: this.translate.instant('Description'),
      propertyName: 'comment',
    }),
    column({
      title: this.translate.instant('Serial'),
      propertyName: 'serial',
    }),
    column({
      title: this.translate.instant('Product ID'),
      propertyName: 'product_id',
    }),
    column({
      title: this.translate.instant('NAA'),
      propertyName: 'naa',
    }),
    column({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
    }),
    actionsColumn(),
  ]));

  protected readonly displayedColumns = computed<string[]>(() => toDisplayedColumns(this.columns()));

  protected readonly trackByExtentId = (_index: number, row: IscsiExtent): number => row.id;

  protected uniqueRowTag(row: IscsiExtent): string {
    return toUniqueRowTag('iscsi-extent-' + row.name);
  }

  protected ariaLabel(row: IscsiExtent): string {
    return [row.name, this.translate.instant('iSCSI Extent')].join(' ');
  }

  protected devicePath(extent: IscsiExtent): string {
    return extent.type === IscsiExtentType.Disk ? extent.disk : extent.path;
  }

  ngOnInit(): void {
    this.iscsiService.listenForDataRefresh()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.dataProvider.load());

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
    this.dataProvider.setSorting(
      mapTnSortToTableSort<IscsiExtent>(event, this.displayedColumns(), { columns: this.columns() }),
    );
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
