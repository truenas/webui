import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable, combineLatest, filter, of, switchMap } from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { shared } from 'app/helptext/sharing';
import { NfsShare } from 'app/interfaces/nfs-share.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';
import { actionsColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { toggleColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-toggle/ix-cell-toggle.component';
import { SortDirection } from 'app/modules/ix-table2/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { NfsFormComponent } from 'app/pages/sharing/nfs/nfs-form/nfs-form.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './nfs-list.component.html',
  styleUrls: ['./nfs-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NfsListComponent implements OnInit {
  filterString = '';
  dataProvider = new ArrayDataProvider<NfsShare>();

  nfsShares: NfsShare[] = [];
  columns = createTable<NfsShare>([
    textColumn({
      title: this.translate.instant('Path'),
      propertyName: 'path',
      sortable: true,
    }),
    textColumn({
      title: this.translate.instant('Description'),
      propertyName: 'comment',
      sortable: true,
    }),
    textColumn({
      title: this.translate.instant('Networks'),
      propertyName: 'networks',
      sortable: true,
      getValue: (row) => {
        return row.networks.reduce((networkList, network, index) => {
          return index > 0 ? networkList + ', ' + network : network;
        }, '');
      },
    }),
    textColumn({
      title: this.translate.instant('Hosts'),
      propertyName: 'hosts',
      sortable: true,
      getValue: (row) => {
        return row.hosts.reduce((hostsList, host, index) => {
          return index > 0 ? hostsList + ', ' + host : host;
        }, '');
      },
    }),
    toggleColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
      onRowToggle: (row) => {
        this.ws.call('sharing.nfs.update', [row.id, { enabled: row.enabled }]).pipe(
          this.appLoader.withLoader(),
          untilDestroyed(this),
        ).subscribe({
          next: (share) => {
            row.enabled = share.enabled;
          },
          error: (error: WebsocketError) => {
            row.enabled = !row.enabled;
            this.dialog.error(this.errorHandler.parseWsError(error));
          },
        });
      },
    }),
    actionsColumn({
      actions: [
        {
          iconName: 'edit',
          tooltip: this.translate.instant('Edit'),
          onClick: (nfsShare) => {
            const slideInRef = this.slideInService.open(NfsFormComponent, { data: nfsShare });
            slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => this.loadData());
          },
        },
        {
          iconName: 'delete',
          tooltip: this.translate.instant('Unshare'),
          onClick: (row) => {
            this.dialog.confirm({
              title: this.translate.instant('Unshare {name}', { name: row.path }),
              message: shared.delete_share_message,
              buttonText: this.translate.instant('Unshare'),
            }).pipe(
              filter(Boolean),
              untilDestroyed(this),
            ).subscribe({
              next: () => {
                this.ws.call('sharing.nfs.delete', [row.id]).pipe(
                  this.appLoader.withLoader(),
                  untilDestroyed(this),
                ).subscribe({
                  next: () => {
                    this.loadData();
                  },
                });
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
  emptyType$: Observable<EmptyType> = combineLatest([
    this.isLoading$,
    this.isNoData$,
    this.hasError$,
  ]).pipe(
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
    private appLoader: AppLoaderService,
    private ws: WebSocketService,
    private translate: TranslateService,
    private dialog: DialogService,
    private errorHandler: ErrorHandlerService,
    private slideInService: IxSlideInService,
    private cdr: ChangeDetectorRef,
    protected emptyService: EmptyService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading$.next(true);
    this.ws.call('sharing.nfs.query').pipe(
      untilDestroyed(this),
    ).subscribe({
      next: (shares: NfsShare[]) => {
        this.nfsShares = shares;
        this.dataProvider.setRows(this.nfsShares);
        this.isLoading$.next(false);
        this.isNoData$.next(!this.nfsShares?.length);
        this.setDefaultSort();
        this.cdr.markForCheck();
      },
      error: () => {
        this.dataProvider.setRows([]);
        this.isLoading$.next(false);
        this.hasError$.next(true);
        this.cdr.markForCheck();
      },
    });
  }

  setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 1,
      direction: SortDirection.Asc,
      propertyName: 'id',
    });
  }

  doAdd(): void {
    const slideInRef = this.slideInService.open(NfsFormComponent);
    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe({
      next: () => {
        this.loadData();
      },
    });
  }

  onListFiltered(query: string): void {
    this.filterString = query.toLowerCase();
    const filteredExporters = this.nfsShares.filter((share) => {
      return JSON.stringify(share).includes(query);
    });
    this.dataProvider.setRows(filteredExporters);
    this.cdr.markForCheck();
  }
}