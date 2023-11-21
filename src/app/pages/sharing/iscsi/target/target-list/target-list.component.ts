import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, switchMap, tap } from 'rxjs/operators';
import { IscsiTarget } from 'app/interfaces/iscsi.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { AsyncDataProvider } from 'app/modules/ix-table2/async-data-provider';
import { actionsColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { TargetFormComponent } from 'app/pages/sharing/iscsi/target/target-form/target-form.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IscsiService } from 'app/services/iscsi.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-iscsi-target-list',
  templateUrl: './target-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TargetListComponent implements OnInit {
  dataProvider: AsyncDataProvider<IscsiTarget>;
  filterString = '';
  targets: IscsiTarget[] = [];

  columns = createTable<IscsiTarget>([
    textColumn({
      title: this.translate.instant('Target Name'),
      propertyName: 'name',
      sortable: true,
    }),
    textColumn({
      title: this.translate.instant('Target Alias'),
      propertyName: 'alias',
      sortable: true,
    }),
    actionsColumn({
      actions: [
        {
          iconName: 'edit',
          tooltip: this.translate.instant('Edit'),
          onClick: (target) => {
            const slideInRef = this.slideInService.open(TargetFormComponent, { data: target });
            slideInRef.slideInClosed$
              .pipe(filter(Boolean), untilDestroyed(this))
              .subscribe(() => this.dataProvider.load());
          },
        },
        {
          iconName: 'delete',
          tooltip: this.translate.instant('Delete'),
          onClick: (row) => {
            this.iscsiService.getGlobalSessions().pipe(untilDestroyed(this)).subscribe(
              (sessions) => {
                let warningMsg = '';
                sessions.forEach((session) => {
                  if (Number(session.target.split(':')[1]) === row.id) {
                    warningMsg = `<font color="red">${this.translate.instant('Warning: iSCSI Target is already in use.</font><br>')}`;
                  }
                });
                const deleteMsg = this.translate.instant('Delete Target {name}', { name: row.name });

                this.dialogService.confirm({
                  title: this.translate.instant('Delete'),
                  message: warningMsg + deleteMsg,
                  buttonText: this.translate.instant('Delete'),
                }).pipe(
                  filter(Boolean),
                  switchMap(() => this.ws.call('iscsi.target.delete', [row.id, true]).pipe(this.loader.withLoader())),
                  untilDestroyed(this),
                ).subscribe({
                  next: () => this.dataProvider.load(),
                  error: (error: WebsocketError) => {
                    this.dialogService.error(this.errorHandler.parseWsError(error));
                  },
                });
              },
            );
          },
        },
      ],
    }),
  ]);


  constructor(
    public emptyService: EmptyService,
    private iscsiService: IscsiService,
    private slideInService: IxSlideInService,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private translate: TranslateService,
    private loader: AppLoaderService,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const targets$ = this.iscsiService.getTargets().pipe(
      tap((targets) => this.targets = targets),
    );
    this.dataProvider = new AsyncDataProvider(targets$);
    this.dataProvider.load();
  }

  doAdd(): void {
    const slideInRef = this.slideInService.open(TargetFormComponent, { wide: true });
    slideInRef.slideInClosed$
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.dataProvider.load());
  }

  onListFiltered(query: string): void {
    this.filterString = query.toLowerCase();
    this.dataProvider.setRows(this.targets.filter((target) => {
      return [target.name].includes(this.filterString);
    }));
  }

  columnsChange(columns: typeof this.columns): void {
    this.columns = [...columns];
    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }
}
