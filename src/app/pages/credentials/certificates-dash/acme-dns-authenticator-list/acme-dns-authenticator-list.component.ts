import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnInit,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatToolbarRow } from '@angular/material/toolbar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { switchMap, filter, tap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { DnsAuthenticator } from 'app/interfaces/dns-authenticator.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerShowMoreComponent } from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table/utils';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { acmeDnsAuthenticatorListElements } from 'app/pages/credentials/certificates-dash/acme-dns-authenticator-list/acme-dns-authenticator-list.elements';
import { AcmednsFormComponent } from 'app/pages/credentials/certificates-dash/forms/acmedns-form/acmedns-form.component';
import { SlideInService } from 'app/services/slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-acme-dns-authenticator-list',
  templateUrl: './acme-dns-authenticator-list.component.html',
  styleUrls: ['./acme-dns-authenticator-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    UiSearchDirective,
    MatToolbarRow,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    MatCardContent,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTablePagerShowMoreComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class AcmeDnsAuthenticatorListComponent implements OnInit {
  protected readonly requiredRoles = [Role.FullAdmin];
  protected readonly searchableElements = acmeDnsAuthenticatorListElements;

  filterString = '';
  dataProvider: AsyncDataProvider<DnsAuthenticator>;
  authenticators: DnsAuthenticator[] = [];
  columns = createTable<DnsAuthenticator>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
    }),
    textColumn({
      title: this.translate.instant('Authenticator'),
      propertyName: 'authenticator',
    }),
    actionsColumn({
      actions: [
        {
          iconName: iconMarker('edit'),
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.doEdit(row),
        },
        {
          iconName: iconMarker('mdi-delete'),
          requiredRoles: this.requiredRoles,
          tooltip: this.translate.instant('Delete'),
          onClick: (row) => this.doDelete(row),
        },
      ],
    }),
  ], {
    uniqueRowTag: (row) => 'amce-dns-' + row.name,
    ariaLabels: (row) => [row.name, this.translate.instant('ACME DNS Authenticator')],
  });

  constructor(
    private ws: WebSocketService,
    private slideInService: SlideInService,
    private translate: TranslateService,
    protected emptyService: EmptyService,
    private dialog: DialogService,
  ) {}

  ngOnInit(): void {
    const authenticators$ = this.ws.call('acme.dns.authenticator.query').pipe(
      tap((authenticators) => this.authenticators = authenticators),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider<DnsAuthenticator>(authenticators$);
    this.setDefaultSort();
    this.getAuthenticators();
  }

  getAuthenticators(): void {
    this.dataProvider.load();
  }

  setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 1,
      direction: SortDirection.Asc,
      propertyName: 'id',
    });
  }

  doAdd(): void {
    const slideInRef = this.slideInService.open(AcmednsFormComponent);
    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.getAuthenticators();
    });
  }

  doEdit(authenticator: DnsAuthenticator): void {
    const slideInRef = this.slideInService.open(AcmednsFormComponent, { data: authenticator });
    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.getAuthenticators();
    });
  }

  doDelete(authenticator: DnsAuthenticator): void {
    this.dialog
      .confirm({
        title: this.translate.instant('Delete DNS Authenticator'),
        message: this.translate.instant('Are you sure you want to delete the <b>{name}</b> DNS Authenticator?', {
          name: authenticator.name,
        }),
        buttonText: this.translate.instant('Delete'),
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.ws.call('acme.dns.authenticator.delete', [authenticator.id])),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.getAuthenticators();
      });
  }
}
