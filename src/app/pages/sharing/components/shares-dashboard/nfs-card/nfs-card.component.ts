import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, signal, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, filter, switchMap, tap } from 'rxjs';
import {
  IxCardComponent,
  IxCardHeaderStatus,
  IxCardAction,
  IxCardFooterLink,
  IxMenuItem,
} from 'truenas-ui';
import { nfsCardEmptyConfig } from 'app/constants/empty-configs';
import { Role } from 'app/enums/role.enum';
import { ServiceName, ServiceOperation } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { LoadingMap, accumulateLoadingState } from 'app/helpers/operators/accumulate-loading-state.helper';
import { observeJob } from 'app/helpers/operators/observe-job.operator';
import { NfsShare } from 'app/interfaces/nfs-share.interface';
import { Service } from 'app/interfaces/service.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { EmptyService } from 'app/modules/empty/empty.service';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsWithMenuColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions-with-menu/ix-cell-actions-with-menu.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { toggleColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-toggle/ix-cell-toggle.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerShowMoreComponent } from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table/utils';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ServiceNfsComponent } from 'app/pages/services/components/service-nfs/service-nfs.component';
import { NfsFormComponent } from 'app/pages/sharing/nfs/nfs-form/nfs-form.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { ServicesState } from 'app/store/services/services.reducer';
import { selectService } from 'app/store/services/services.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-nfs-card',
  templateUrl: './nfs-card.component.html',
  styleUrls: ['./nfs-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxCardComponent,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTablePagerShowMoreComponent,
    TranslateModule,
    AsyncPipe,
    RouterLink,
    EmptyComponent,
  ],
})
export class NfsCardComponent implements OnInit {
  private slideIn = inject(SlideIn);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  private store$ = inject<Store<ServicesState>>(Store);
  protected emptyService = inject(EmptyService);
  private router = inject(Router);
  private loader = inject(LoaderService);
  private snackbar = inject(SnackbarService);

  loadingMap$ = new BehaviorSubject<LoadingMap>(new Map());
  requiredRoles = [Role.SharingNfsWrite, Role.SharingWrite];
  service$ = this.store$.select(selectService(ServiceName.Nfs));
  private service = toSignal(this.service$);
  dataProvider: AsyncDataProvider<NfsShare>;
  protected readonly emptyConfig = nfsCardEmptyConfig;

  private sharesCount = signal(0);

  columns = createTable<NfsShare>([
    textColumn({
      title: this.translate.instant('Path'),
      propertyName: 'path',
    }),
    textColumn({
      title: this.translate.instant('Description'),
      propertyName: 'comment',
    }),
    toggleColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
      onRowToggle: (row: NfsShare) => this.onChangeEnabledState(row),
      requiredRoles: this.requiredRoles,
    }),
    actionsWithMenuColumn({
      cssClass: 'tight-actions',
      actions: [
        {
          iconName: iconMarker('edit'),
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.openForm(row),
        },
        {
          iconName: iconMarker('mdi-delete'),
          tooltip: this.translate.instant('Delete'),
          onClick: (row) => this.doDelete(row),
          requiredRoles: this.requiredRoles,
        },
      ],
    }),
  ], {
    uniqueRowTag: (row) => 'card-nfs-share-' + row.path + '-' + row.comment,
    ariaLabels: (row) => [row.path, this.translate.instant('NFS Share')],
  });

  readonly cardTitle = computed(() => {
    return this.translate.instant('UNIX (NFS) Shares');
  });

  readonly headerStatus = computed<IxCardHeaderStatus | undefined>(() => {
    const service = this.service();
    if (!service) {
      return undefined;
    }

    switch (service.state) {
      case ServiceStatus.Running:
        return { label: this.translate.instant('RUNNING'), type: 'success' };
      case ServiceStatus.Stopped:
        return { label: this.translate.instant('STOPPED'), type: 'error' };
      default:
        return { label: service.state, type: 'warning' };
    }
  });

  readonly footerLink = computed<IxCardFooterLink>(() => {
    const count = this.sharesCount();
    return {
      label: this.translate.instant('View All {count}', { count }),
      handler: () => this.router.navigate(['/sharing', 'nfs']),
    };
  });

  readonly headerMenu = computed<IxMenuItem[]>(() => [
    {
      id: 'toggle-service',
      label: this.service()?.state === ServiceStatus.Running
        ? this.translate.instant('Turn Off Service')
        : this.translate.instant('Turn On Service'),
      action: () => this.changeServiceState(),
    },
    {
      id: 'config-service',
      label: this.translate.instant('Config Service'),
      action: () => this.configureService(),
    },
    {
      id: 'view-sessions',
      label: this.translate.instant('View Sessions'),
      action: () => this.viewSessions(),
    },
  ]);

  readonly primaryAction: IxCardAction = {
    label: this.translate.instant('Add'),
    handler: () => this.openForm(),
  };

  ngOnInit(): void {
    const nfsShares$ = this.api.call('sharing.nfs.query').pipe(
      tap((shares) => {
        this.sharesCount.set(shares.length);
      }),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider<NfsShare>(nfsShares$);
    this.setDefaultSort();
    this.dataProvider.load();
  }

  protected openForm(row?: NfsShare): void {
    this.slideIn.open(NfsFormComponent, { data: { existingNfsShare: row } }).pipe(
      filter((response) => !!response.response),
      untilDestroyed(this),
    ).subscribe(() => {
      this.dataProvider.load();
    });
  }

  protected doDelete(nfs: NfsShare): void {
    this.dialogService.confirm({
      message: this.translate.instant('Are you sure you want to delete NFS Share <b>"{path}"</b>?', { path: nfs.path }),
      buttonColor: 'warn',
      buttonText: this.translate.instant('Delete'),
    }).pipe(
      filter(Boolean),
      switchMap(() => this.api.call('sharing.nfs.delete', [nfs.id])),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.dataProvider.load();
      },
      error: (error: unknown) => {
        this.errorHandler.showErrorModal(error);
      },
    });
  }

  private onChangeEnabledState(row: NfsShare): void {
    const param = 'enabled';

    this.api.call('sharing.nfs.update', [row.id, { [param]: !row[param] }]).pipe(
      accumulateLoadingState(row.id, this.loadingMap$),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.dataProvider.load();
      },
      error: (error: unknown) => {
        this.dataProvider.load();
        this.errorHandler.showErrorModal(error);
      },
    });
  }

  protected setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 0,
      direction: SortDirection.Asc,
      propertyName: 'path',
    });
  }

  private changeServiceState(): void {
    const service = this.service();
    if (!service) {
      return;
    }

    if (service.state === ServiceStatus.Running) {
      this.stopService(service);
    } else {
      this.startService(service);
    }
  }

  private configureService(): void {
    this.slideIn.open(ServiceNfsComponent);
  }

  private startService(service: Service): void {
    this.api.job('service.control', [ServiceOperation.Start, service.service, { silent: false }])
      .pipe(
        observeJob(),
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      )
      .subscribe({
        complete: () => this.snackbar.success(this.translate.instant('Service started')),
      });
  }

  private stopService(service: Service): void {
    this.api.job('service.control', [ServiceOperation.Stop, service.service, { silent: false }])
      .pipe(
        observeJob(),
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      )
      .subscribe({
        complete: () => this.snackbar.success(this.translate.instant('Service stopped')),
      });
  }

  private viewSessions(): void {
    this.router.navigate(['/sharing', 'nfs', 'sessions']);
  }
}
