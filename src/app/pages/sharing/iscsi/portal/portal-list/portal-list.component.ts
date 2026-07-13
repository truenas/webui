import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnInit, computed, inject, signal, DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  tnIconMarker, TnButtonComponent, TnCardComponent, TnCardHeaderActionsDirective,
  TnCellDefDirective, TnHeaderCellDefDirective, TnTableColumnDirective, TnTableComponent,
  TnTablePagerComponent, TnTestIdDirective, TnTooltipDirective,
  type TnSortEvent,
} from '@truenas/ui-components';
import { kebabCase } from 'lodash-es';
import { map } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { IscsiPortal } from 'app/interfaces/iscsi.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { actionsWithMenuColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions-with-menu/ix-cell-actions-with-menu.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { TableColumnPickerComponent } from 'app/modules/ix-table/components/table-column-picker/table-column-picker.component';
import { convertStringToId, createTable, mapTnSortToTableSort, toDisplayedColumns } from 'app/modules/ix-table/utils';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { TableActionsCellComponent } from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { PortalFormComponent } from 'app/pages/sharing/iscsi/portal/portal-form/portal-form.component';
import { portalListElements } from 'app/pages/sharing/iscsi/portal/portal-list/portal-list.elements';
import { IscsiService } from 'app/services/iscsi.service';

@Component({
  selector: 'ix-iscsi-portal-list',
  templateUrl: './portal-list.component.html',
  styleUrls: ['./portal-list.component.scss'],
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
  ],
})
export class PortalListComponent implements OnInit {
  protected emptyService = inject(EmptyService);
  private dialogService = inject(DialogService);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private formPanel = inject(FormSidePanelService);
  private iscsiService = inject(IscsiService);
  private destroyRef = inject(DestroyRef);

  protected readonly searchableElements = portalListElements;

  protected readonly requiredRoles = [
    Role.SharingIscsiPortalWrite,
    Role.SharingIscsiWrite,
    Role.SharingWrite,
  ];

  protected readonly searchQuery = signal('');
  protected dataProvider: AsyncDataProvider<IscsiPortal>;

  // Signal (not a subscription-set field) so Listen cells re-render under
  // OnPush when the choices arrive after the rows.
  private readonly ipChoices = toSignal(this.iscsiService.getIpChoices().pipe(
    map((choices) => new Map(Object.entries(choices))),
  ));

  protected readonly actions: IconActionConfig<IscsiPortal>[] = [
    {
      iconName: tnIconMarker('pencil', 'mdi'),
      tooltip: this.translate.instant('Edit'),
      onClick: (row) => {
        this.openForm(row);
      },
    },
    {
      iconName: tnIconMarker('delete', 'mdi'),
      tooltip: this.translate.instant('Delete'),
      onClick: (row) => {
        this.dialogService.confirmDelete({
          message: this.translate.instant('Are you sure you want to delete this item?'),
          call: () => this.api.call('iscsi.portal.delete', [row.id]),
        }).pipe(
          takeUntilDestroyed(this.destroyRef),
        ).subscribe(() => this.refresh());
      },
      requiredRoles: this.requiredRoles,
    },
  ];

  // ix-table column model retained purely to drive <ix-table-column-picker>
  // (visibility + saved prefs); tn-table renders cells from the template and
  // derives its `displayedColumns` from these via `toDisplayedColumns`.
  protected readonly columns = signal(createTable<IscsiPortal>([
    textColumn({
      title: this.translate.instant('Portal Group ID'),
      propertyName: 'id',
    }),
    textColumn({
      title: this.translate.instant('Listen'),
      propertyName: 'listen',
    }),
    textColumn({
      title: this.translate.instant('Description'),
      propertyName: 'comment',
    }),
    actionsWithMenuColumn({ actions: [] }),
  ], {
    uniqueRowTag: (row) => 'iscsi-portal-' + row.comment,
    ariaLabels: (row) => [row.comment, this.translate.instant('Portal')],
  }));

  protected readonly displayedColumns = computed<string[]>(() => toDisplayedColumns(this.columns()));

  protected readonly trackByPortalId = (_index: number, row: IscsiPortal): number => row.id;

  protected uniqueRowTag(row: IscsiPortal): string {
    // Pre-split with lodash kebabCase so digit-bearing values resolve identically through
    // the legacy [ixTest] directive and the library [tnTestId] directive (see nfs-list).
    return kebabCase(convertStringToId('iscsi-portal-' + row.comment));
  }

  protected ariaLabel(row: IscsiPortal): string {
    return [row.comment, this.translate.instant('Portal')].join(' ');
  }

  protected formatListen(row: IscsiPortal): string {
    return row.listen.map((listenInterface) => {
      const listenIp = this.ipChoices()?.get(listenInterface.ip) || listenInterface.ip;
      return `${listenIp}:${listenInterface.port}`;
    }).join(', ');
  }

  ngOnInit(): void {
    const portals$ = this.api.call('iscsi.portal.query', []);

    this.iscsiService.listenForDataRefresh()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.dataProvider.load());

    this.dataProvider = new AsyncDataProvider(portals$);
    this.refresh();
    this.dataProvider.emptyType$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.onListFiltered(this.searchQuery());
    });
  }

  protected doAdd(): void {
    this.openForm();
  }

  protected openForm(row?: IscsiPortal): void {
    this.formPanel.open(PortalFormComponent, {
      title: row
        ? this.translate.instant('Edit Portal')
        : this.translate.instant('Add Portal'),
      inputs: { portalData: row },
    }).onSuccess(() => this.refresh(), this.destroyRef);
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(mapTnSortToTableSort<IscsiPortal>(event, this.displayedColumns()));
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);
    this.dataProvider.setFilter({ query, columnKeys: ['comment'] });
  }

  protected onColumnsChange(columns: ReturnType<typeof this.columns>): void {
    this.columns.set([...columns]);
  }

  private refresh(): void {
    this.dataProvider.load();
  }
}
