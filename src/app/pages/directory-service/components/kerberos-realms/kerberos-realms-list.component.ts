import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, input, OnInit,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatToolbarRow } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  filter, map, switchMap, tap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { helptextKerberosRealms } from 'app/helptext/directory-service/kerberos-realms-form-list';
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
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { KerberosRealmRow } from 'app/pages/directory-service/components/kerberos-realms/kerberos-realm-row.interface';
import { kerberosRealmsListElements } from 'app/pages/directory-service/components/kerberos-realms/kerberos-realms-list.elements';
import { KerberosRealmsFormComponent } from 'app/pages/directory-service/components/kerberos-realms-form/kerberos-realms-form.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-kerberos-realms-list',
  templateUrl: './kerberos-realms-list.component.html',
  styleUrls: ['./kerberos-realms-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    SearchInput1Component,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    UiSearchDirective,
    MatToolbarRow,
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
export class KerberosRealmsListComponent implements OnInit {
  readonly paginator = input(true);
  readonly inCard = input(false);

  protected readonly requiredRoles = [Role.DirectoryServiceWrite];
  protected readonly searchableElements = kerberosRealmsListElements;

  filterString = '';
  dataProvider: AsyncDataProvider<KerberosRealmRow>;
  kerberosRealsm: KerberosRealmRow[] = [];
  columns = createTable<KerberosRealmRow>([
    textColumn({
      title: this.translate.instant('Realm'),
      propertyName: 'realm',
    }),
    textColumn({
      title: this.translate.instant('KDC'),
      propertyName: 'kdc_string',
    }),
    textColumn({
      title: this.translate.instant('Admin Server'),
      propertyName: 'admin_server_string',
    }),
    textColumn({
      title: this.translate.instant('Password Server'),
      propertyName: 'kpasswd_server_string',
    }),
    actionsColumn({
      actions: [
        {
          iconName: iconMarker('edit'),
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => {
            this.slideIn.open(KerberosRealmsFormComponent, { data: row }).pipe(
              filter((response) => !!response.response),
              untilDestroyed(this),
            ).subscribe(() => this.getKerberosRealms());
          },
        },
        {
          iconName: iconMarker('mdi-delete'),
          tooltip: this.translate.instant('Delete'),
          requiredRoles: this.requiredRoles,
          onClick: (row) => {
            this.dialogService.confirm({
              title: this.translate.instant(helptextKerberosRealms.krb_realmlist_deletemessage_title),
              message: this.translate.instant('Are you sure you want to delete this item?'),
            }).pipe(
              filter(Boolean),
              switchMap(() => this.api.call('kerberos.realm.delete', [row.id])),
              untilDestroyed(this),
            ).subscribe({
              error: (error: unknown) => {
                this.dialogService.error(this.errorHandler.parseError(error));
              },
              complete: () => {
                this.getKerberosRealms();
              },
            });
          },
        },
      ],
    }),
  ], {
    uniqueRowTag: (row) => 'kerberos-realm-' + row.realm,
    ariaLabels: (row) => [row.realm, this.translate.instant('Kerberos Realm')],
  });

  constructor(
    private translate: TranslateService,
    private api: ApiService,
    protected dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    protected emptyService: EmptyService,
    private slideIn: SlideIn,
  ) { }

  ngOnInit(): void {
    const kerberosRealsm$ = this.api.call('kerberos.realm.query').pipe(
      map((realms) => {
        return realms.map((realm) => {
          return {
            ...realm,
            kdc_string: realm.kdc?.join(', '),
            admin_server_string: realm.admin_server?.join(', '),
            kpasswd_server_string: realm.kpasswd_server?.join(', '),
          };
        });
      }),
      tap((kerberosRealsm) => this.kerberosRealsm = kerberosRealsm),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider<KerberosRealmRow>(kerberosRealsm$);
    this.setDefaultSort();
    this.getKerberosRealms();
    this.dataProvider.emptyType$.pipe(untilDestroyed(this)).subscribe(() => {
      this.onListFiltered(this.filterString);
    });
  }

  getKerberosRealms(): void {
    this.dataProvider.load();
  }

  setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 1,
      direction: SortDirection.Asc,
      propertyName: 'realm',
    });
  }

  doAdd(): void {
    this.slideIn.open(KerberosRealmsFormComponent).pipe(
      filter((response) => !!response.response),
      untilDestroyed(this),
    ).subscribe(() => this.getKerberosRealms());
  }

  onListFiltered(query: string): void {
    this.filterString = query;
    this.dataProvider.setFilter({
      query,
      columnKeys: ['realm', 'kdc_string', 'admin_server_string', 'kpasswd_server_string'],
    });
  }
}
