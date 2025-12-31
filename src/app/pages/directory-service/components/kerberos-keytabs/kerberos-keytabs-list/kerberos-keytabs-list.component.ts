import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, OnInit, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatToolbarRow } from '@angular/material/toolbar';
import { MatTooltip } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { filter, switchMap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { DirectoryServiceStatus, DirectoryServiceType } from 'app/enums/directory-services.enum';
import { Role } from 'app/enums/role.enum';
import { KerberosKeytab } from 'app/interfaces/kerberos-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table/utils';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { KerberosKeytabsFormComponent } from 'app/pages/directory-service/components/kerberos-keytabs/kerberos-keytabs-form/kerberos-keytabs-form.component';
import { kerberosKeytabsListElements } from 'app/pages/directory-service/components/kerberos-keytabs/kerberos-keytabs-list/kerberos-keytabs-list.elements';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-kerberos-keytabs-list',
  templateUrl: './kerberos-keytabs-list.component.html',
  styleUrls: ['./kerberos-keytabs-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SearchInput1Component,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    UiSearchDirective,
    MatToolbarRow,
    MatTooltip,
    RouterLink,
    IxIconComponent,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTablePagerComponent,
    TranslateModule,
    AsyncPipe,
    PageHeaderComponent,
  ],
})
export class KerberosKeytabsListComponent implements OnInit {
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  protected dialogService = inject(DialogService);
  private errorHandler = inject(ErrorHandlerService);
  protected emptyService = inject(EmptyService);
  private slideIn = inject(SlideIn);
  private snackbar = inject(SnackbarService);

  readonly paginator = input(true);
  readonly inCard = input(false);
  readonly showSyncButton = input(false);

  protected readonly requiredRoles = [Role.DirectoryServiceWrite];
  protected readonly searchableElements = kerberosKeytabsListElements;

  protected readonly isActiveDirectoryEnabled = signal(false);
  filterString = '';
  dataProvider: AsyncDataProvider<KerberosKeytab>;
  columns = createTable<KerberosKeytab>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
    }),
    actionsColumn({
      actions: [
        {
          iconName: iconMarker('edit'),
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => {
            this.slideIn.open(KerberosKeytabsFormComponent, { data: row }).pipe(
              filter((response) => !!response.response),
              untilDestroyed(this),
            ).subscribe(() => this.getKerberosKeytabs());
          },
        },
        {
          iconName: iconMarker('mdi-delete'),
          tooltip: this.translate.instant('Delete'),
          requiredRoles: this.requiredRoles,
          onClick: (row) => {
            this.dialogService.confirm({
              title: this.translate.instant('Delete'),
              message: this.translate.instant('Are you sure you want to delete this item?'),
            }).pipe(
              filter(Boolean),
              switchMap(() => this.api.call('kerberos.keytab.delete', [row.id])),
              untilDestroyed(this),
            ).subscribe({
              error: (error: unknown) => {
                this.errorHandler.showErrorModal(error);
              },
              complete: () => {
                this.getKerberosKeytabs();
              },
            });
          },
        },
      ],
    }),
  ], {
    uniqueRowTag: (row) => 'kerberos-keytab-' + row.name,
    ariaLabels: (row) => [row.name, this.translate.instant('Kerberos Keytab')],
  });

  ngOnInit(): void {
    const keytabsRows$ = this.api.call('kerberos.keytab.query');
    this.dataProvider = new AsyncDataProvider<KerberosKeytab>(keytabsRows$);
    this.setDefaultSort();
    this.getKerberosKeytabs();
    this.dataProvider.emptyType$.pipe(untilDestroyed(this)).subscribe(() => {
      this.onListFiltered(this.filterString);
    });

    if (this.inCard()) {
      this.isActiveDirectoryEnabled.set(this.showSyncButton());
    } else {
      this.checkActiveDirectoryStatus();
    }
  }

  private checkActiveDirectoryStatus(): void {
    this.api.call('directoryservices.status').pipe(
      untilDestroyed(this),
    ).subscribe((status) => {
      this.isActiveDirectoryEnabled.set(
        status.type === DirectoryServiceType.ActiveDirectory
        && status.status !== DirectoryServiceStatus.Disabled,
      );
    });
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
    this.slideIn.open(KerberosKeytabsFormComponent).pipe(
      filter((response) => !!response.response),
      untilDestroyed(this),
    ).subscribe(() => this.getKerberosKeytabs());
  }

  onListFiltered(query: string): void {
    this.filterString = query;
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
        untilDestroyed(this),
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
