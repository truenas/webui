import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { switchMap, filter, tap } from 'rxjs';
import { DnsAuthenticator } from 'app/interfaces/dns-authenticator.interface';
import { AsyncDataProvider } from 'app/modules/ix-table2/async-data-provider';
import { templateColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-template/ix-cell-template.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { SortDirection } from 'app/modules/ix-table2/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { AcmednsFormComponent } from 'app/pages/credentials/certificates-dash/forms/acmedns-form/acmedns-form.component';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-acme-dns-authenticator-list',
  templateUrl: './acme-dns-authenticator-list.component.html',
  styleUrls: ['./acme-dns-authenticator-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcmeDnsAuthenticatorListComponent implements OnInit {
  filterString = '';
  dataProvider: AsyncDataProvider<DnsAuthenticator>;
  authenticators: DnsAuthenticator[] = [];
  columns = createTable<DnsAuthenticator>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
      sortable: true,
    }),
    textColumn({
      title: this.translate.instant('Authenticator'),
      propertyName: 'authenticator',
      sortable: true,
    }),
    templateColumn(),
  ]);

  constructor(
    private ws: WebSocketService,
    private slideInService: IxSlideInService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
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
  }

  getAuthenticators(): void {
    this.dataProvider.refresh();
  }

  onListFiltered(query: string): void {
    this.filterString = query.toLowerCase();
    this.dataProvider.setRows(
      this.authenticators.filter((authenticator) => [authenticator.name.toLowerCase()].includes(this.filterString)),
    );
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
