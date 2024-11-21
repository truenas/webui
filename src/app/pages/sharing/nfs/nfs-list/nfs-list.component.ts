import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, tap } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { shared } from 'app/helptext/sharing';
import { NfsShare } from 'app/interfaces/nfs-share.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { toggleColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-toggle/ix-cell-toggle.component';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { NfsFormComponent } from 'app/pages/sharing/nfs/nfs-form/nfs-form.component';
import { nfsListElements } from 'app/pages/sharing/nfs/nfs-list/nfs-list.elements';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-nfs-list',
  templateUrl: './nfs-list.component.html',
  styleUrls: ['./nfs-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NfsListComponent implements OnInit {
  requiredRoles = [Role.SharingNfsWrite, Role.SharingWrite];
  protected readonly searchableElements = nfsListElements;

  filterString = '';
  dataProvider: AsyncDataProvider<NfsShare>;

  nfsShares: NfsShare[] = [];
  columns = createTable<NfsShare>([
    textColumn({
      title: this.translate.instant('Path'),
      propertyName: 'path',
    }),
    textColumn({
      title: this.translate.instant('Description'),
      propertyName: 'comment',
    }),
    textColumn({
      title: this.translate.instant('Networks'),
      propertyName: 'networks',
      getValue: (row) => {
        return row.networks.reduce((networkList, network, index) => {
          return index > 0 ? networkList + ', ' + network : network;
        }, '');
      },
    }),
    textColumn({
      title: this.translate.instant('Hosts'),
      propertyName: 'hosts',
      getValue: (row) => {
        return row.hosts.reduce((hostsList, host, index) => {
          return index > 0 ? hostsList + ', ' + host : host;
        }, '');
      },
    }),
    toggleColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
      onRowToggle: (row: NfsShare) => this.onChangeEnabledState(row),
      requiredRoles: this.requiredRoles,
    }),
    actionsColumn({
      actions: [
        {
          iconName: 'edit',
          tooltip: this.translate.instant('Edit'),
          onClick: (nfsShare) => {
            const slideInRef = this.slideInService.open(NfsFormComponent, { data: { existingNfsShare: nfsShare } });
            slideInRef.slideInClosed$
              .pipe(filter(Boolean), untilDestroyed(this))
              .subscribe(() => this.refresh());
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
                  next: () => this.refresh(),
                });
              },
            });
          },
          requiredRoles: this.requiredRoles,
        },
      ],
    }),
  ], {
    rowTestId: (row) => 'nfs-share-' + row.path + '-' + row.comment,
    ariaLabels: (row) => [row.path, this.translate.instant('NFS Share')],
  });

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
    const shares$ = this.ws.call('sharing.nfs.query').pipe(
      tap((shares) => this.nfsShares = shares),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider<NfsShare>(shares$);
    this.setDefaultSort();
    this.refresh();
    this.dataProvider.emptyType$.pipe(untilDestroyed(this)).subscribe(() => {
      this.onListFiltered(this.filterString);
    });
  }

  setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 0,
      direction: SortDirection.Asc,
      propertyName: 'path',
    });
  }

  doAdd(): void {
    const slideInRef = this.slideInService.open(NfsFormComponent);
    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe({
      next: () => {
        this.refresh();
      },
    });
  }

  onListFiltered(query: string): void {
    this.filterString = query;
    this.dataProvider.setFilter({
      query,
      columnKeys: !this.nfsShares.length ? [] : Object.keys(this.nfsShares[0]) as (keyof NfsShare)[],
    });
    this.cdr.markForCheck();
  }

  columnsChange(columns: typeof this.columns): void {
    this.columns = [...columns];
    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }

  private refresh(): void {
    this.dataProvider.load();
  }

  private onChangeEnabledState(row: NfsShare): void {
    this.ws.call('sharing.nfs.update', [row.id, { enabled: !row.enabled }]).pipe(
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.dataProvider.load();
      },
      error: (error: unknown) => {
        this.dataProvider.load();
        this.errorHandler.showErrorModal(this.errorHandler.parseError(error));
      },
    });
  }
}
