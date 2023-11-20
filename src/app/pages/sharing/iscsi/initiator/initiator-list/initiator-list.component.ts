import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, switchMap, tap } from 'rxjs';
import { IscsiInitiatorGroup } from 'app/interfaces/iscsi.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { AsyncDataProvider } from 'app/modules/ix-table2/async-data-provider';
import { actionsColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IscsiService } from 'app/services/iscsi.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-iscsi-initiator-list',
  templateUrl: './initiator-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InitiatorListComponent implements OnInit {
  isLoading = false;
  filterString = '';
  dataProvider: AsyncDataProvider<IscsiInitiatorGroup>;

  initiators: IscsiInitiatorGroup[] = [];

  columns = createTable<IscsiInitiatorGroup>([
    textColumn({
      title: this.translate.instant('Group ID'),
      propertyName: 'id',
    }),
    textColumn({
      title: this.translate.instant('Initiators'),
      propertyName: 'initiators',
      getValue: (row) => {
        return row?.initiators?.length ? row.initiators.join(' ') : this.translate.instant('Allow all initiators');
      },
    }),
    textColumn({
      title: this.translate.instant('Description'),
      propertyName: 'comment',
    }),
    actionsColumn({
      actions: [
        {
          iconName: 'edit',
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => {
            this.router.navigate(['/sharing', 'iscsi', 'initiators', 'edit', row.id]);
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
              switchMap(() => this.ws.call('iscsi.initiator.delete', [row.id]).pipe(this.loader.withLoader())),
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
    private router: Router,
  ) {}

  ngOnInit(): void {
    const initiators$ = this.iscsiService.getInitiators().pipe(
      tap((initiators) => this.initiators = initiators),
    );

    this.dataProvider = new AsyncDataProvider(initiators$);
    this.dataProvider.load();
  }

  doAdd(): void {
    this.router.navigate(['/sharing', 'iscsi', 'initiators', 'add']);
  }

  onListFiltered(query: string): void {
    this.filterString = query.toLowerCase();
    this.dataProvider.setRows(this.initiators.filter((entry) => {
      return [entry.comment, entry.initiators.join(' ')].includes(this.filterString);
    }));
  }

  columnsChange(columns: typeof this.columns): void {
    this.columns = [...columns];
    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }
}
