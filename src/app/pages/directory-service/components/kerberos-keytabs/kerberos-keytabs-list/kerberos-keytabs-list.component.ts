import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { filter, switchMap, tap } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { KerberosKeytab } from 'app/interfaces/kerberos-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { AsyncDataProvider } from 'app/modules/ix-table2/classes/async-data-provider/async-data-provider';
import { actionsColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { SortDirection } from 'app/modules/ix-table2/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { KerberosKeytabsFormComponent } from 'app/pages/directory-service/components/kerberos-keytabs/kerberos-keytabs-form/kerberos-keytabs-form.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-kerberos-keytabs-list',
  templateUrl: './kerberos-keytabs-list.component.html',
  styleUrls: ['./kerberos-keytabs-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KerberosKeytabsListComponent implements OnInit {
  @Input() paginator = true;
  @Input() inCard = false;

  readonly requiredRoles = [Role.DirectoryServiceWrite];

  filterString = '';
  dataProvider: AsyncDataProvider<KerberosKeytab>;
  kerberosRealsm: KerberosKeytab[] = [];
  columns = createTable<KerberosKeytab>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
      sortable: true,
    }),
    actionsColumn({
      actions: [
        {
          iconName: 'edit',
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => {
            const slideInRef = this.slideInService.open(KerberosKeytabsFormComponent, { data: row });
            slideInRef.slideInClosed$.pipe(
              untilDestroyed(this),
            ).subscribe(() => this.getKerberosKeytabs());
          },
        },
        {
          iconName: 'delete',
          tooltip: this.translate.instant('Delete'),
          requiredRoles: this.requiredRoles,
          onClick: (row) => {
            this.dialogService.confirm({
              title: this.translate.instant('Delete'),
              message: this.translate.instant('Are you sure you want to delete this item?'),
            }).pipe(
              filter(Boolean),
              switchMap(() => this.ws.call('kerberos.keytab.delete', [row.id])),
              untilDestroyed(this),
            ).subscribe({
              error: (error: unknown) => {
                this.dialogService.error(this.errorHandler.parseError(error));
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
    rowTestId: (row) => 'kerberos-keytab-' + row.name,
  });

  constructor(
    private translate: TranslateService,
    private ws: WebSocketService,
    protected dialogService: DialogService,
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService,
    protected emptyService: EmptyService,
    private slideInService: IxSlideInService,
  ) { }

  ngOnInit(): void {
    const keytabsRows$ = this.ws.call('kerberos.keytab.query').pipe(
      tap((keytabsRows) => this.kerberosRealsm = keytabsRows),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider<KerberosKeytab>(keytabsRows$);
    this.setDefaultSort();
    this.getKerberosKeytabs();
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
    const slideInRef = this.slideInService.open(KerberosKeytabsFormComponent);
    slideInRef.slideInClosed$.pipe(
      untilDestroyed(this),
    ).subscribe(() => this.getKerberosKeytabs());
  }

  onListFiltered(query: string): void {
    this.filterString = query.toLowerCase();
    this.dataProvider.setRows(this.kerberosRealsm.filter((idmap) => {
      return _.find(idmap, query);
    }));
  }
}
