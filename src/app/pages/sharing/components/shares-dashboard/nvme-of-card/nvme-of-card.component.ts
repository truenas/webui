import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, OnInit, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterLink } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { filter, switchMap } from 'rxjs';
import {
  IxCardComponent,
  IxCardHeaderStatus,
  IxCardAction,
  IxCardFooterLink,
  IxMenuItem,
} from 'truenas-ui';
import { nvmeOfEmptyConfig } from 'app/constants/empty-configs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { ServiceName, ServiceOperation } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { observeJob } from 'app/helpers/operators/observe-job.operator';
import { NvmeOfSubsystemDetails } from 'app/interfaces/nvme-of.interface';
import { Service } from 'app/interfaces/service.interface';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { EmptyService } from 'app/modules/empty/empty.service';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { ArrayDataProvider } from 'app/modules/ix-table/classes/array-data-provider/array-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsWithMenuColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions-with-menu/ix-cell-actions-with-menu.component';
import { templateColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-template/ix-cell-template.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerShowMoreComponent } from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { IxTableCellDirective } from 'app/modules/ix-table/directives/ix-table-cell.directive';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table/utils';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { AddSubsystemComponent } from 'app/pages/sharing/nvme-of/add-subsystem/add-subsystem.component';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/services/nvme-of.store';
import { SubsystemDeleteDialogComponent } from 'app/pages/sharing/nvme-of/subsystem-details-header/subsystem-delete-dialog/subsystem-delete-dialog.component';
import { SubSystemNameCellComponent } from 'app/pages/sharing/nvme-of/subsystems-list/subsystem-name-cell/subsystem-name-cell.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { ServicesState } from 'app/store/services/services.reducer';
import { selectService } from 'app/store/services/services.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-nvme-of-card',
  templateUrl: './nvme-of-card.component.html',
  styleUrls: ['./nvme-of-card.component.scss'],
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
    IxTableCellDirective,
    EmptyComponent,
    SubSystemNameCellComponent,
  ],
})
export class NvmeOfCardComponent implements OnInit {
  private slideIn = inject(SlideIn);
  private translate = inject(TranslateService);
  protected emptyService = inject(EmptyService);
  private store$ = inject<Store<ServicesState>>(Store);
  private nvmeOfStore = inject(NvmeOfStore);
  private matDialog = inject(MatDialog);
  private api = inject(ApiService);
  private loader = inject(LoaderService);
  private errorHandler = inject(ErrorHandlerService);
  private router = inject(Router);
  private snackbar = inject(SnackbarService);

  requiredRoles = [Role.SharingNvmeTargetWrite];
  protected readonly isLoading = this.nvmeOfStore.isLoading;
  protected readonly emptyConfig = nvmeOfEmptyConfig;

  protected service$ = this.store$.select(selectService(ServiceName.NvmeOf));
  private service = toSignal(this.service$);

  protected readonly subsystems = this.nvmeOfStore.subsystems;

  private subsystemsCount = computed(() => this.subsystems().length);

  protected dataProvider = computed<ArrayDataProvider<NvmeOfSubsystemDetails>>(() => {
    const subsystems = this.subsystems();
    const isLoading = this.isLoading();

    const dataProvider = new ArrayDataProvider<NvmeOfSubsystemDetails>();
    dataProvider.setEmptyType(EmptyType.None);
    if (isLoading) {
      dataProvider.setEmptyType(EmptyType.Loading);
      return dataProvider;
    }

    dataProvider.setRows(subsystems);
    dataProvider.setSorting({
      active: 0,
      direction: SortDirection.Asc,
      propertyName: 'name',
    });
    if (!subsystems.length) {
      dataProvider.setEmptyType(EmptyType.NoPageData);
    } else {
      dataProvider.expandedRow = subsystems[0];
    }

    return dataProvider;
  });

  protected columns = createTable<NvmeOfSubsystemDetails>([
    templateColumn({
      title: this.translate.instant('Name'),
    }),
    textColumn({
      title: this.translate.instant('Namespaces'),
      getValue: (row: NvmeOfSubsystemDetails) => {
        return row.namespaces.length;
      },
    }),
    textColumn({
      title: this.translate.instant('Ports'),
      getValue: (row) => {
        return row.ports.length;
      },
    }),
    textColumn({
      title: this.translate.instant('Hosts'),
      getValue: (row) => {
        return row.hosts.length;
      },
    }),
    actionsWithMenuColumn({
      actions: [
        {
          iconName: iconMarker('visibility'),
          tooltip: this.translate.instant('View'),
          onClick: (row) => this.router.navigate(['/sharing/nvme-of', row.name]),
          requiredRoles: this.requiredRoles,
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
    uniqueRowTag: (row) => 'nvmeof-subsys-' + row.name,
    ariaLabels: (row) => [row.name, this.translate.instant('Subsystem')],
  });

  readonly cardTitle = computed(() => {
    return this.translate.instant('NVMe-oF Subsystems');
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
    const count = this.subsystemsCount();
    return {
      label: this.translate.instant('View All {count}', { count }),
      handler: () => this.router.navigate(['/sharing', 'nvme-of']),
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
  ]);

  readonly primaryAction: IxCardAction = {
    label: this.translate.instant('Add'),
    handler: () => this.openForm(),
  };

  ngOnInit(): void {
    this.nvmeOfStore.initialize();
  }

  openForm(): void {
    this.slideIn.open(AddSubsystemComponent).pipe(
      filter(({ response }) => !!response),
      untilDestroyed(this),
    ).subscribe(() => this.nvmeOfStore.initialize());
  }

  doDelete(row: NvmeOfSubsystemDetails): void {
    this.matDialog.open(
      SubsystemDeleteDialogComponent,
      { data: row, minWidth: '500px' },
    )
      .afterClosed()
      .pipe(
        filter((data: { confirmed: boolean; force: boolean }) => data?.confirmed),
        switchMap(({ force }) => {
          return this.api.call('nvmet.subsys.delete', [row.id, { force }]).pipe(
            this.loader.withLoader(),
            this.errorHandler.withErrorHandler(),
          );
        }),
        untilDestroyed(this),
      ).subscribe(() => {
        this.nvmeOfStore.initialize();
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
}
