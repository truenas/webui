import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  tnIconMarker,
  TnButtonComponent,
  TnCardComponent,
  TnCardFooterActionsDirective,
  TnCellDefDirective,
  TnEmptyComponent,
  TnHeaderCellDefDirective,
  type TnSortEvent,
  TnTableColumnDirective,
  TnTableComponent,
} from '@truenas/ui-components';
import { tap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { DnsAuthenticator } from 'app/interfaces/dns-authenticator.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { IxTablePagerShowMoreComponent } from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { mapTnSortToProviderSorting } from 'app/modules/ix-table/utils';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import {
  TableActionsCellComponent,
} from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { acmeDnsAuthenticatorListElements } from 'app/pages/credentials/certificates-dash/acme-dns-authenticator-list/acme-dns-authenticator-list.elements';
import { AcmednsFormComponent } from 'app/pages/credentials/certificates-dash/acmedns-form/acmedns-form.component';

@Component({
  selector: 'ix-acme-dns-authenticator-list',
  templateUrl: './acme-dns-authenticator-list.component.html',
  styleUrls: ['./acme-dns-authenticator-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardFooterActionsDirective,
    UiSearchDirective,
    RequiresRolesDirective,
    TnButtonComponent,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnEmptyComponent,
    TableActionsCellComponent,
    IxTablePagerShowMoreComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class AcmeDnsAuthenticatorListComponent implements OnInit {
  private api = inject(ApiService);
  private formPanel = inject(FormSidePanelService);
  private translate = inject(TranslateService);
  protected emptyService = inject(EmptyService);
  private dialog = inject(DialogService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.NetworkInterfaceWrite];
  protected readonly searchableElements = acmeDnsAuthenticatorListElements;

  protected dataProvider: AsyncDataProvider<DnsAuthenticator>;
  private authenticators: DnsAuthenticator[] = [];

  protected readonly displayedColumns = ['name', 'authenticator', 'actions'];

  protected readonly trackBy = (_: number, row: DnsAuthenticator): number => row.id;

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(mapTnSortToProviderSorting<DnsAuthenticator>(event));
  }

  protected readonly actions: IconActionConfig<DnsAuthenticator>[] = [
    {
      iconName: tnIconMarker('pencil', 'mdi'),
      tooltip: this.translate.instant('Edit'),
      onClick: (row) => this.doEdit(row),
    },
    {
      iconName: tnIconMarker('delete', 'mdi'),
      requiredRoles: this.requiredRoles,
      tooltip: this.translate.instant('Delete'),
      onClick: (row) => this.doDelete(row),
    },
  ];

  protected uniqueRowTag(row: DnsAuthenticator): string {
    return 'amce-dns-' + row.name;
  }

  protected ariaLabel(row: DnsAuthenticator): string {
    return [row.name, this.translate.instant('ACME DNS Authenticator')].join(' ');
  }

  ngOnInit(): void {
    const authenticators$ = this.api.call('acme.dns.authenticator.query').pipe(
      tap((authenticators) => this.authenticators = authenticators),
      takeUntilDestroyed(this.destroyRef),
    );
    this.dataProvider = new AsyncDataProvider<DnsAuthenticator>(authenticators$);
    this.setDefaultSort();
    this.getAuthenticators();
  }

  private getAuthenticators(): void {
    this.dataProvider.load();
  }

  private setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 1,
      direction: SortDirection.Asc,
      propertyName: 'id',
    });
  }

  protected doAdd(): void {
    this.formPanel.open(AcmednsFormComponent, { title: this.translate.instant('Add DNS Authenticator') })
      .onSuccess(() => this.getAuthenticators(), this.destroyRef);
  }

  private doEdit(authenticator: DnsAuthenticator): void {
    this.formPanel.open(AcmednsFormComponent, {
      title: this.translate.instant('Edit DNS Authenticator'),
      inputs: { editingAuthenticator: authenticator },
    })
      .onSuccess(() => this.getAuthenticators(), this.destroyRef);
  }

  private doDelete(authenticator: DnsAuthenticator): void {
    this.dialog
      .confirmDelete({
        title: this.translate.instant('Delete DNS Authenticator'),
        message: this.translate.instant('Are you sure you want to delete the <b>{name}</b> DNS Authenticator?', {
          name: authenticator.name,
        }),
        call: () => this.api.call('acme.dns.authenticator.delete', [authenticator.id]),
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.getAuthenticators();
      });
  }
}
