import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, input, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  tnIconMarker,
  TnButtonComponent,
  TnCardComponent,
  TnCardFooterActionsDirective,
  TnCardHeaderDirective,
  TnCellDefDirective,
  TnHeaderCellDefDirective,
  TnIconComponent,
  TnTableColumnDirective,
  TnTableComponent,
  TnTablePagerComponent,
  TnTestIdDirective,
  TnTooltipDirective,
  type TnSortEvent,
} from '@truenas/ui-components';
import { filter, switchMap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { DirectoryServiceStatus, DirectoryServiceType } from 'app/enums/directory-services.enum';
import { Role } from 'app/enums/role.enum';
import { KerberosKeytab } from 'app/interfaces/kerberos-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { convertStringToId, mapTnSortToTableSort } from 'app/modules/ix-table/utils';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  TableActionsCellComponent,
} from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { KerberosKeytabsFormComponent } from 'app/pages/directory-service/components/kerberos-keytabs/kerberos-keytabs-form/kerberos-keytabs-form.component';
import { kerberosKeytabsListElements } from 'app/pages/directory-service/components/kerberos-keytabs/kerberos-keytabs-list/kerberos-keytabs-list.elements';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-kerberos-keytabs-list',
  templateUrl: './kerberos-keytabs-list.component.html',
  styleUrls: ['./kerberos-keytabs-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BasicSearchComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    TnCardComponent,
    TnCardFooterActionsDirective,
    TnCardHeaderDirective,
    UiSearchDirective,
    TnTooltipDirective,
    TnTestIdDirective,
    RouterLink,
    TnIconComponent,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TableActionsCellComponent,
    TnTablePagerComponent,
    TranslateModule,
    AsyncPipe,
    NgTemplateOutlet,
    PageHeaderComponent,
  ],
})
export class KerberosKeytabsListComponent implements OnInit {
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  protected dialogService = inject(DialogService);
  private errorHandler = inject(ErrorHandlerService);
  protected emptyService = inject(EmptyService);
  private formPanel = inject(FormSidePanelService);
  private snackbar = inject(SnackbarService);
  private destroyRef = inject(DestroyRef);

  readonly paginator = input(true);
  readonly inCard = input(false);
  readonly showSyncButton = input(false);

  protected readonly requiredRoles = [Role.DirectoryServiceWrite];
  protected readonly searchableElements = kerberosKeytabsListElements;

  protected readonly isActiveDirectoryEnabled = signal(false);
  searchQuery = signal('');
  dataProvider: AsyncDataProvider<KerberosKeytab>;

  protected readonly displayedColumns = ['name', 'actions'];
  protected readonly trackByKeytabId = (_index: number, row: KerberosKeytab): number => row.id;

  protected readonly actions: IconActionConfig<KerberosKeytab>[] = [
    {
      iconName: tnIconMarker('pencil', 'mdi'),
      tooltip: this.translate.instant('Edit'),
      onClick: (row) => {
        this.formPanel.open(KerberosKeytabsFormComponent, {
          title: this.translate.instant('Edit Kerberos Keytab'),
          inputs: { editingRow: row },
        }).onSuccess(() => this.getKerberosKeytabs(), this.destroyRef);
      },
    },
    {
      iconName: tnIconMarker('delete', 'mdi'),
      tooltip: this.translate.instant('Delete'),
      requiredRoles: this.requiredRoles,
      onClick: (row) => {
        this.dialogService.confirmDelete({
          message: this.translate.instant('Are you sure you want to delete this item?'),
          call: () => this.api.call('kerberos.keytab.delete', [row.id]),
        }).pipe(
          takeUntilDestroyed(this.destroyRef),
        ).subscribe(() => this.getKerberosKeytabs());
      },
    },
  ];

  ngOnInit(): void {
    const keytabsRows$ = this.api.call('kerberos.keytab.query');
    this.dataProvider = new AsyncDataProvider<KerberosKeytab>(keytabsRows$);
    this.setDefaultSort();
    this.getKerberosKeytabs();
    this.dataProvider.emptyType$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.onListFiltered(this.searchQuery());
    });

    if (this.inCard()) {
      this.isActiveDirectoryEnabled.set(this.showSyncButton());
    } else {
      this.checkActiveDirectoryStatus();
    }
  }

  private checkActiveDirectoryStatus(): void {
    this.api.call('directoryservices.status').pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((status) => {
      this.isActiveDirectoryEnabled.set(
        status.type === DirectoryServiceType.ActiveDirectory
        && status.status !== DirectoryServiceStatus.Disabled,
      );
    });
  }

  protected uniqueRowTag(row: KerberosKeytab): string {
    return convertStringToId('kerberos-keytab-' + row.name);
  }

  protected ariaLabel(row: KerberosKeytab): string {
    return [row.name, this.translate.instant('Kerberos Keytab')].join(' ');
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(mapTnSortToTableSort<KerberosKeytab>(event, this.displayedColumns));
  }

  getKerberosKeytabs(): void {
    this.dataProvider.load();
  }

  setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 1,
      direction: SortDirection.Asc,
      propertyName: 'name',
    });
  }

  doAdd(): void {
    this.formPanel.open(KerberosKeytabsFormComponent, {
      title: this.translate.instant('Add Kerberos Keytab'),
    }).onSuccess(() => this.getKerberosKeytabs(), this.destroyRef);
  }

  onListFiltered(query: string): void {
    this.searchQuery.set(query);
    this.dataProvider.setFilter({ query, columnKeys: ['name'] });
  }

  syncKeytab(): void {
    if (!this.isActiveDirectoryEnabled()) {
      return;
    }

    this.dialogService.confirm({
      title: this.translate.instant('Sync Keytab'),
      message: this.translate.instant('This operation synchronizes the local kerberos keytab with entries from the remote domain controller. This may be disruptive and is only required if manual changes have been made to SPNs on the remote domain controller. Do you want to continue?'),
      buttonText: this.translate.instant('Sync'),
    })
      .pipe(
        filter(Boolean),
        switchMap(() => {
          return this.dialogService.jobDialog(
            this.api.job('directoryservices.sync_keytab'),
            { title: this.translate.instant('Sync Keytab') },
          ).afterClosed();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.snackbar.success(this.translate.instant('Keytab synchronized successfully.'));
          this.getKerberosKeytabs();
        },
        error: (error: unknown) => {
          this.errorHandler.showErrorModal(error);
        },
      });
  }
}
