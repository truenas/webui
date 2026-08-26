import {
  ChangeDetectionStrategy, Component, OnInit, computed, inject, signal, DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  tnIconMarker, TnButtonComponent, TnCardComponent, TnCardHeaderActionsDirective,
  TnCellDefDirective, TnHeaderCellDefDirective, TnTableColumnDirective, TnTableComponent,
  TnTablePagerComponent, TnTestIdDirective,
  type TnSortEvent,
} from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { IscsiAuthAccess } from 'app/interfaces/iscsi.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { AsyncDataProvider } from 'app/modules/tn-table/classes/async-data-provider/async-data-provider';
import { actionsColumn, column } from 'app/modules/tn-table/column-configs';
import { TableColumnPickerComponent } from 'app/modules/tn-table/components/table-column-picker/table-column-picker.component';
import { IconActionConfig } from 'app/modules/tn-table/interfaces/icon-action-config.interface';
import {
  createTable, dataProviderLoading, dataProviderRows, mapTnSortToTableSort, toDisplayedColumns, toUniqueRowTag,
} from 'app/modules/tn-table/utils';
import { TableActionsCellComponent } from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  getAuthorizedAccessFormConfig,
} from 'app/pages/sharing/iscsi/authorized-access/authorized-access-form/authorized-access.form-config';
import {
  authorizedAccessListElements,
} from 'app/pages/sharing/iscsi/authorized-access/authorized-access-list/authorized-access-list.elements';
import { IscsiService } from 'app/services/iscsi.service';

@Component({
  selector: 'ix-iscsi-authorized-access-list',
  templateUrl: './authorized-access-list.component.html',
  styleUrls: ['./authorized-access-list.component.scss'],
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
    TranslateModule,
  ],
})
export class AuthorizedAccessListComponent implements OnInit {
  protected emptyService = inject(EmptyService);
  private dialogService = inject(DialogService);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private formPanel = inject(FormSidePanelService);
  private iscsiService = inject(IscsiService);
  private destroyRef = inject(DestroyRef);

  protected readonly searchableElements = authorizedAccessListElements;

  protected readonly requiredRoles = [
    Role.SharingIscsiAuthWrite,
    Role.SharingIscsiWrite,
    Role.SharingWrite,
  ];

  protected readonly searchQuery = signal('');
  protected readonly dataProvider = new AsyncDataProvider<IscsiAuthAccess>(this.iscsiService.getAuth());
  protected readonly rows = dataProviderRows(this.dataProvider);
  protected readonly isLoading = dataProviderLoading(this.dataProvider);
  protected readonly emptyType = toSignal(this.dataProvider.emptyType$);

  protected readonly actions: IconActionConfig<IscsiAuthAccess>[] = [
    {
      iconName: tnIconMarker('pencil', 'mdi'),
      tooltip: this.translate.instant('Edit'),
      onClick: (row) => {
        this.formPanel.openForm(getAuthorizedAccessFormConfig(this.api, this.translate, row), {
          title: this.translate.instant('Edit Authorized Access'),
          // Confirm fields aren't persisted, so seed them from the saved secrets.
          editData: {
            ...row,
            secret_confirm: row.secret,
            peersecret_confirm: row.peersecret,
          },
        }).onSuccess(() => this.refresh(), this.destroyRef);
      },
    },
    {
      iconName: tnIconMarker('delete', 'mdi'),
      tooltip: this.translate.instant('Delete'),
      onClick: (row) => {
        this.dialogService.confirmDelete({
          message: this.translate.instant('Are you sure you want to delete this item?'),
          call: () => this.api.call('iscsi.auth.delete', [row.id]),
        }).pipe(
          takeUntilDestroyed(this.destroyRef),
        ).subscribe(() => this.refresh());
      },
      requiredRoles: this.requiredRoles,
    },
  ];

  // Column model retained purely to drive <ix-table-column-picker>
  // (visibility + saved prefs); tn-table renders cells from the template and
  // derives its `displayedColumns` from these via `toDisplayedColumns`.
  protected readonly columns = signal(createTable<IscsiAuthAccess>([
    column({
      title: this.translate.instant('Group ID'),
      propertyName: 'tag',
    }),
    column({
      title: this.translate.instant('User'),
      propertyName: 'user',
    }),
    column({
      title: this.translate.instant('Peer User'),
      propertyName: 'peeruser',
    }),
    actionsColumn(),
  ]));

  protected readonly displayedColumns = computed<string[]>(() => toDisplayedColumns(this.columns()));

  protected readonly trackByAuthId = (_index: number, row: IscsiAuthAccess): number => row.id;

  protected uniqueRowTag(row: IscsiAuthAccess): string {
    return toUniqueRowTag('iscsi-authorized-access-' + row.user + '-' + row.peeruser);
  }

  protected ariaLabel(row: IscsiAuthAccess): string {
    return [row.user, this.translate.instant('Authorized Access')].join(' ');
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
    this.formPanel.openForm(getAuthorizedAccessFormConfig(this.api, this.translate, undefined), {
      title: this.translate.instant('Add Authorized Access'),
    }).onSuccess(() => this.refresh(), this.destroyRef);
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(
      mapTnSortToTableSort<IscsiAuthAccess>(event, this.displayedColumns(), { columns: this.columns() }),
    );
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);
    this.dataProvider.setFilter({ query, columnKeys: ['peeruser', 'user'] });
  }

  protected onColumnsChange(columns: ReturnType<typeof this.columns>): void {
    this.columns.set([...columns]);
  }

  private refresh(): void {
    this.dataProvider.load();
  }
}
