import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { BehaviorSubject, Observable, combineLatest, filter, of, switchMap } from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { KerberosKeytab } from 'app/interfaces/kerberos-config.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';
import { actionsColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { SortDirection } from 'app/modules/ix-table2/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { KerberosKeytabsFormComponent } from 'app/pages/directory-service/components/kerberos-keytabs/kerberos-keytabs-form/kerberos-keytabs-form.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './kerberos-keytabs-list.component.html',
  styleUrls: ['./kerberos-keytabs-list.component.scss'],
  selector: 'ix-kerberos-keytabs-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class KerberosKeytabsListComponent implements OnInit {
  @Input() paginator = true;
  @Input() toolbar = false;
  filterString = '';
  dataProvider = new ArrayDataProvider<KerberosKeytab>();
  kerberosRealsm: KerberosKeytab[] = [];
  columns = createTable<KerberosKeytab>([
    textColumn({
      title: this.translateService.instant('Name'),
      propertyName: 'name',
      sortable: true,
    }),
    actionsColumn({
      actions: [
        {
          iconName: 'edit',
          tooltip: this.translateService.instant('Edit'),
          onClick: (row) => {
            const slideInRef = this.slideInService.open(KerberosKeytabsFormComponent, { data: row });
            slideInRef.slideInClosed$.pipe(
              untilDestroyed(this),
            ).subscribe(() => this.getKerberosKeytabs());
          },
        },
        {
          iconName: 'delete',
          tooltip: this.translateService.instant('Delete'),
          onClick: (row) => {
            this.dialogService.confirm({
              title: this.translateService.instant('Delete'),
              message: this.translateService.instant('Are you sure you want to delete this item?'),
            }).pipe(
              filter(Boolean),
              switchMap(() => this.ws.call('kerberos.keytab.delete', [row.id])),
              untilDestroyed(this),
            ).subscribe({
              error: (error: WebsocketError) => {
                this.dialogService.error(this.errorHandler.parseWsError(error));
              },
              complete: () => {
                this.getKerberosKeytabs();
              },
            });
          },
        },
      ],
    }),
  ]);


  isLoading$ = new BehaviorSubject<boolean>(true);
  isNoData$ = new BehaviorSubject<boolean>(false);
  hasError$ = new BehaviorSubject<boolean>(false);
  emptyType$: Observable<EmptyType> = combineLatest([this.isLoading$, this.isNoData$, this.hasError$]).pipe(
    switchMap(([isLoading, isNoData, isError]) => {
      if (isLoading) {
        return of(EmptyType.Loading);
      }
      if (isError) {
        return of(EmptyType.Errors);
      }
      if (isNoData) {
        return of(EmptyType.NoPageData);
      }
      return of(EmptyType.NoSearchResults);
    }),
  );

  constructor(
    private translateService: TranslateService,
    private ws: WebSocketService,
    protected dialogService: DialogService,
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService,
    protected emptyService: EmptyService,
    private slideInService: IxSlideInService,
  ) { }

  ngOnInit(): void {
    this.getKerberosKeytabs();
  }

  getKerberosKeytabs(): void {
    this.ws.call('kerberos.keytab.query').pipe(
      untilDestroyed(this),
    ).subscribe({
      next: (keytabsRows) => {
        this.kerberosRealsm = keytabsRows;
        this.dataProvider.setRows(keytabsRows);
        this.isLoading$.next(false);
        this.isNoData$.next(!keytabsRows.length);
        this.setDefaultSort();
        this.cdr.markForCheck();
      },
    });
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