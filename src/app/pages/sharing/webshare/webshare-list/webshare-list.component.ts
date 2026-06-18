import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnInit, computed, inject, signal, viewChild, DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  tnIconMarker, TnBannerComponent, TnButtonComponent, TnCardComponent, TnCardHeaderActionsDirective,
  TnCardHeaderDirective, TnCellDefDirective, TnEmptyComponent, TnHeaderCellDefDirective, TnIconComponent,
  TnSidePanelActionDirective, TnSidePanelComponent, TnTableColumnDirective, TnTableComponent,
  TnTablePagerComponent, TnTooltipDirective, type TnSortEvent,
} from '@truenas/ui-components';
import { map, Observable, of } from 'rxjs';
import { combineLatestWith } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { helptextSharingWebshare } from 'app/helptext/sharing/webshare/webshare';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { TableColumnPickerComponent } from 'app/modules/ix-table/components/table-column-picker/table-column-picker.component';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { convertStringToId, createTable, mapTnSortToTableSort, toDisplayedColumns } from 'app/modules/ix-table/utils';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TableActionsCellComponent } from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ServiceStateButtonComponent } from 'app/pages/sharing/components/shares-dashboard/service-state-button/service-state-button.component';
import { webShareNameColumn, WebShareTableRow } from 'app/pages/sharing/components/webshare-name-cell/webshare-name-cell.component';
import { webshareListElements } from 'app/pages/sharing/webshare/webshare-list/webshare-list.elements';
import { WebShareFormData, WebShareSharesFormComponent } from 'app/pages/sharing/webshare/webshare-shares-form/webshare-shares-form.component';
import { WebShareService } from 'app/pages/sharing/webshare/webshare.service';
import { AppState } from 'app/store';
import { selectService } from 'app/store/services/services.selectors';

@Component({
  selector: 'ix-webshare-list',
  templateUrl: './webshare-list.component.html',
  styleUrls: ['./webshare-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TnCardComponent,
    TnCardHeaderDirective,
    TnCardHeaderActionsDirective,
    ServiceStateButtonComponent,
    BasicSearchComponent,
    TableColumnPickerComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    TestDirective,
    UiSearchDirective,
    TnBannerComponent,
    TnEmptyComponent,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TableActionsCellComponent,
    TnTablePagerComponent,
    TnIconComponent,
    TnTooltipDirective,
    TnSidePanelComponent,
    TnSidePanelActionDirective,
    WebShareSharesFormComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class WebShareListComponent implements OnInit {
  protected readonly requiredRoles = [Role.SharingWebshareWrite, Role.SharingWrite];
  protected readonly EmptyType = EmptyType;
  protected readonly searchableElements = webshareListElements;

  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private dialog = inject(DialogService);
  protected emptyService = inject(EmptyService);
  private store$ = inject(Store<AppState>);
  private destroyRef = inject(DestroyRef);
  private webShareService = inject(WebShareService);
  private truenasConnectService = inject(TruenasConnectService);
  private unsavedChanges = inject(UnsavedChangesService);
  private router = inject(Router);

  service$ = this.store$.select(selectService(ServiceName.WebShare));
  searchQuery = '';
  dataProvider: AsyncDataProvider<WebShareTableRow>;

  // Side-panel host for the add/edit share form (the form is dual-host: it also
  // still opens via legacy SlideIn from the shares-dashboard card).
  protected readonly configOpen = signal(false);
  protected readonly formData = signal<WebShareFormData | undefined>(undefined);
  protected readonly configForm = viewChild(WebShareSharesFormComponent);
  protected readonly sidePanelTitle = computed(() => (this.formData()?.isNew
    ? this.helptext.webshare_form_title_add
    : this.helptext.webshare_form_title_edit));

  protected readonly closeFormGuard = (): Observable<boolean> => (this.configForm()?.hasUnsavedChanges()
    ? this.unsavedChanges.showConfirmDialog()
    : of(true));

  hasTruenasConnect$ = this.truenasConnectService.config$.pipe(
    map((config) => config?.status === TruenasConnectStatus.Configured),
  );

  showNoWebshareUsersNotice$ = this.hasTruenasConnect$.pipe(
    combineLatestWith(this.webShareService.hasWebshareUsers$),
    map(([hasTruenasConnect, hasWebshareUsers]) => hasTruenasConnect && !hasWebshareUsers),
  );

  protected readonly helptext = helptextSharingWebshare;

  protected readonly actions: IconActionConfig<WebShareTableRow>[] = [
    {
      iconName: tnIconMarker('open-in-new', 'mdi'),
      tooltip: this.translate.instant('Open'),
      onClick: (row) => this.openWebShare(row),
      disabled: () => this.webShareService.canOpenWebShare$.pipe(map((canOpen) => !canOpen)),
      dynamicTooltip: () => this.webShareService.canOpenWebShare$.pipe(
        map((canOpen) => (canOpen
          ? this.translate.instant('Open')
          : this.translate.instant('WebShare can only be opened when accessed via a .truenas.direct domain'))),
      ),
    },
    {
      iconName: tnIconMarker('pencil', 'mdi'),
      tooltip: this.translate.instant('Edit'),
      onClick: (row) => this.doEdit(row),
    },
    {
      iconName: tnIconMarker('delete', 'mdi'),
      tooltip: this.translate.instant('Delete'),
      onClick: (row) => this.doDelete(row),
      requiredRoles: this.requiredRoles,
    },
  ];

  // ix-table column model retained purely to drive <ix-table-columns-selector>
  // (visibility + saved prefs); tn-table renders cells from the template and
  // derives its `displayedColumns` from these via `toDisplayedColumns`.
  protected readonly columns = signal(createTable<WebShareTableRow>([
    webShareNameColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
    }),
    textColumn({
      title: this.translate.instant('Path'),
      propertyName: 'path',
    }),
    actionsColumn({}),
  ]));

  protected readonly displayedColumns = computed(() => toDisplayedColumns(this.columns()));

  protected readonly trackByWebShareId = (_index: number, row: WebShareTableRow): number => row.id;

  protected uniqueRowTag(row: WebShareTableRow): string {
    return convertStringToId(row.name);
  }

  protected ariaLabel(row: WebShareTableRow): string {
    return [row.name, this.translate.instant('WebShare')].join(' ');
  }

  ngOnInit(): void {
    this.setDataProvider();
    this.setDefaultSort();
    this.dataProvider.emptyType$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.onListFiltered(this.searchQuery);
    });

    // Trigger hostname lookup to enable WebShare opening when not on truenas.direct domain
    this.webShareService.hostnameMapping$.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      error: () => {
        // Error already handled by catchError in hostnameMapping$
      },
    });
  }

  private setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 0,
      direction: SortDirection.Asc,
      propertyName: 'name',
    });
  }

  onColumnsChange(columns: ReturnType<typeof this.columns>): void {
    this.columns.set([...columns]);
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(mapTnSortToTableSort<WebShareTableRow>(event, this.displayedColumns()));
  }

  onListFiltered(query: string): void {
    this.searchQuery = query;
    this.dataProvider.setFilter({
      query,
      columnKeys: ['name', 'path'],
    });
  }

  doAdd(): void {
    this.formData.set({ isNew: true, name: '', path: '' });
    this.configOpen.set(true);
  }

  doEdit(row: WebShareTableRow): void {
    this.formData.set({
      id: row.id,
      isNew: false,
      name: row.name,
      path: row.path,
      isHomeBase: row.isHomeBase,
    });
    this.configOpen.set(true);
  }

  onFormClosed(saved: boolean): void {
    this.configOpen.set(false);
    if (saved) {
      this.loadWebShareConfig();
    }
  }

  doDelete(row: WebShareTableRow): void {
    this.dialog.confirmDelete({
      title: this.translate.instant(this.helptext.delete_dialog_title),
      message: this.translate.instant(this.helptext.delete_dialog_message, {
        name: row.name,
        path: row.path,
      }),
      call: () => this.api.call('sharing.webshare.delete', [row.id]),
      successMessage: this.translate.instant('WebShare deleted'),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.loadWebShareConfig());
  }

  private setDataProvider(): void {
    const webshares$ = this.webShareService.getWebShareTableRows().pipe(
      takeUntilDestroyed(this.destroyRef),
    );

    this.dataProvider = new AsyncDataProvider<WebShareTableRow>(webshares$);
    this.dataProvider.load();
  }

  private loadWebShareConfig(): void {
    this.dataProvider.load();
  }

  openTruenasConnectDialog(): void {
    this.truenasConnectService.openStatusModal();
  }

  navigateToUsers(): void {
    this.router.navigate(['/credentials', 'users']);
  }

  openWebShare(row: WebShareTableRow): void {
    this.webShareService.openWebShare(row.name);
  }
}
