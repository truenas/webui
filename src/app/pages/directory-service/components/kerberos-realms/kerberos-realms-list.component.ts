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
import { map } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { helptextKerberosRealms } from 'app/helptext/directory-service/kerberos-realms-form-list';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { convertStringToId, mapTnSortToTableSort } from 'app/modules/ix-table/utils';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import {
  TableActionsCellComponent,
} from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { KerberosRealmRow } from 'app/pages/directory-service/components/kerberos-realms/kerberos-realm-row.interface';
import { kerberosRealmsListElements } from 'app/pages/directory-service/components/kerberos-realms/kerberos-realms-list.elements';
import { KerberosRealmsFormComponent } from 'app/pages/directory-service/components/kerberos-realms-form/kerberos-realms-form.component';

@Component({
  selector: 'ix-kerberos-realms-list',
  templateUrl: './kerberos-realms-list.component.html',
  styleUrls: ['./kerberos-realms-list.component.scss'],
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
export class KerberosRealmsListComponent implements OnInit {
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  protected dialogService = inject(DialogService);
  protected emptyService = inject(EmptyService);
  private slideIn = inject(SlideIn);
  private destroyRef = inject(DestroyRef);

  readonly paginator = input(true);
  readonly inCard = input(false);

  protected readonly requiredRoles = [Role.DirectoryServiceWrite];
  protected readonly searchableElements = kerberosRealmsListElements;

  searchQuery = signal('');
  dataProvider: AsyncDataProvider<KerberosRealmRow>;

  protected readonly displayedColumns = ['realm', 'kdc_string', 'admin_server_string', 'kpasswd_server_string', 'actions'];
  protected readonly trackByRealmId = (_index: number, row: KerberosRealmRow): number => row.id;

  protected readonly actions: IconActionConfig<KerberosRealmRow>[] = [
    {
      iconName: tnIconMarker('pencil', 'mdi'),
      tooltip: this.translate.instant('Edit'),
      onClick: (row) => {
        this.slideIn.open(KerberosRealmsFormComponent, { data: row })
          .onSuccess(() => this.getKerberosRealms(), this.destroyRef);
      },
    },
    {
      iconName: tnIconMarker('delete', 'mdi'),
      tooltip: this.translate.instant('Delete'),
      requiredRoles: this.requiredRoles,
      onClick: (row) => {
        this.dialogService.confirmDelete({
          title: this.translate.instant(helptextKerberosRealms.deleteDialogTitle),
          message: this.translate.instant('Are you sure you want to delete this item?'),
          call: () => this.api.call('kerberos.realm.delete', [row.id]),
        }).pipe(
          takeUntilDestroyed(this.destroyRef),
        ).subscribe(() => this.getKerberosRealms());
      },
    },
  ];

  ngOnInit(): void {
    const kerberosRealms$ = this.api.call('kerberos.realm.query').pipe(
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
      takeUntilDestroyed(this.destroyRef),
    );
    this.dataProvider = new AsyncDataProvider<KerberosRealmRow>(kerberosRealms$);
    this.setDefaultSort();
    this.getKerberosRealms();
    this.dataProvider.emptyType$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.onListFiltered(this.searchQuery());
    });
  }

  protected uniqueRowTag(row: KerberosRealmRow): string {
    return convertStringToId('kerberos-realm-' + row.realm);
  }

  protected ariaLabel(row: KerberosRealmRow): string {
    return [row.realm, this.translate.instant('Kerberos Realm')].join(' ');
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(mapTnSortToTableSort<KerberosRealmRow>(event, this.displayedColumns));
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
    this.slideIn.open(KerberosRealmsFormComponent)
      .onSuccess(() => this.getKerberosRealms(), this.destroyRef);
  }

  onListFiltered(query: string): void {
    this.searchQuery.set(query);
    this.dataProvider.setFilter({
      query,
      columnKeys: ['realm', 'kdc_string', 'admin_server_string', 'kpasswd_server_string'],
    });
  }
}
