import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, switchMap, tap } from 'rxjs';
import { IscsiPortal } from 'app/interfaces/iscsi.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { AsyncDataProvider } from 'app/modules/ix-table2/async-data-provider';
import { actionsColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { PortalFormComponent } from 'app/pages/sharing/iscsi/portal/portal-form/portal-form.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IscsiService } from 'app/services/iscsi.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-iscsi-portal-list',
  templateUrl: './portal-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortalListComponent implements OnInit {
  isLoading = false;
  filterString = '';
  dataProvider: AsyncDataProvider<IscsiPortal>;

  portals: IscsiPortal[] = [];
  ipChoices: Map<string, string>;

  columns = createTable<IscsiPortal>([
    textColumn({
      title: this.translate.instant('Portal Group ID'),
      propertyName: 'id',
    }),
    textColumn({
      title: this.translate.instant('Listen'),
      propertyName: 'listen',
      getValue: (row) => {
        return row.listen.map((listenInterface) => {
          const listenIp = this.ipChoices?.get(listenInterface.ip) || listenInterface.ip;
          return `${listenIp}:${listenInterface.port}`;
        });
      },
    }),
    textColumn({
      title: this.translate.instant('Description'),
      propertyName: 'comment',
    }),
    textColumn({
      title: this.translate.instant('Discovery Auth Method'),
      propertyName: 'discovery_authmethod',
    }),
    textColumn({
      title: this.translate.instant('Discovery Auth Group'),
      propertyName: 'discovery_authgroup',
    }),
    actionsColumn({
      actions: [
        {
          iconName: 'edit',
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => {
            const slideInRef = this.slideInService.open(PortalFormComponent, { data: row });
            slideInRef.slideInClosed$
              .pipe(filter(Boolean), untilDestroyed(this))
              .subscribe(() => this.dataProvider.load());
          },
        },
        {
          iconName: 'delete',
          tooltip: this.translate.instant('Delete'),
          onClick: (row) => {
            this.dialogService.confirm({
              title: this.translate.instant('Delete'),
              message: this.translate.instant('Are you sure you want to delete this item?'),
              buttonText: this.translate.instant('Delete'),
            }).pipe(
              filter(Boolean),
              switchMap(() => this.ws.call('iscsi.portal.delete', [row.id]).pipe(this.loader.withLoader())),
              untilDestroyed(this),
            ).subscribe({
              next: () => this.dataProvider.load(),
              error: (error: WebsocketError) => {
                this.dialogService.error(this.errorHandler.parseWsError(error));
              },
            });
          },
        },
      ],
    }),
  ]);

  constructor(
    public emptyService: EmptyService,
    private loader: AppLoaderService,
    private dialogService: DialogService,
    private ws: WebSocketService,
    private translate: TranslateService,
    private slideInService: IxSlideInService,
    private errorHandler: ErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private iscsiService: IscsiService,
  ) {}

  ngOnInit(): void {
    this.iscsiService.getIpChoices().pipe(untilDestroyed(this)).subscribe((choices) => {
      this.ipChoices = new Map(Object.entries(choices));
    });
    const portals$ = this.ws.call('iscsi.portal.query', []).pipe(
      tap((portals) => this.portals = portals),
    );

    this.dataProvider = new AsyncDataProvider(portals$);
    this.dataProvider.load();
  }

  doAdd(): void {
    const slideInRef = this.slideInService.open(PortalFormComponent);
    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => this.dataProvider.load());
  }

  onListFiltered(query: string): void {
    this.filterString = query.toLowerCase();
    this.dataProvider.setRows(this.portals.filter((entry) => {
      return [entry.comment, entry.discovery_authmethod].includes(this.filterString);
    }));
  }

  columnsChange(columns: typeof this.columns): void {
    this.columns = [...columns];
    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }
}
