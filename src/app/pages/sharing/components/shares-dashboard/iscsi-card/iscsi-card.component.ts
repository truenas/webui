import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, effect, OnInit, signal, inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterLink } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  filter, Observable, startWith, tap,
} from 'rxjs';
import {
  IxCardComponent,
  IxCardHeaderStatus,
  IxCardAction,
  IxCardFooterLink,
  IxMenuItem,
} from 'truenas-ui';
import { iscsiCardEmptyConfig } from 'app/constants/empty-configs';
import { IscsiTargetMode, iscsiTargetModeNames } from 'app/enums/iscsi.enum';
import { Role } from 'app/enums/role.enum';
import { ServiceName, ServiceOperation } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { observeJob } from 'app/helpers/operators/observe-job.operator';
import { IscsiTarget } from 'app/interfaces/iscsi.interface';
import { Service } from 'app/interfaces/service.interface';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { EmptyService } from 'app/modules/empty/empty.service';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsWithMenuColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions-with-menu/ix-cell-actions-with-menu.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerShowMoreComponent } from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table/utils';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInResponse } from 'app/modules/slide-ins/slide-in.interface';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { iscsiCardElements } from 'app/pages/sharing/components/shares-dashboard/iscsi-card/iscsi-card.elements';
import {
  GlobalTargetConfigurationComponent,
} from 'app/pages/sharing/iscsi/global-target-configuration/global-target-configuration.component';
import { IscsiWizardComponent } from 'app/pages/sharing/iscsi/iscsi-wizard/iscsi-wizard.component';
import { DeleteTargetDialog } from 'app/pages/sharing/iscsi/target/delete-target-dialog/delete-target-dialog.component';
import { TargetFormComponent } from 'app/pages/sharing/iscsi/target/target-form/target-form.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { IscsiService } from 'app/services/iscsi.service';
import { LicenseService } from 'app/services/license.service';
import { ServicesState } from 'app/store/services/services.reducer';
import { selectService } from 'app/store/services/services.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-iscsi-card',
  templateUrl: './iscsi-card.component.html',
  styleUrls: ['./iscsi-card.component.scss'],
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
export class IscsiCardComponent implements OnInit {
  private slideIn = inject(SlideIn);
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  protected emptyService = inject(EmptyService);
  private store$ = inject<Store<ServicesState>>(Store);
  private matDialog = inject(MatDialog);
  private iscsiService = inject(IscsiService);
  private cdr = inject(ChangeDetectorRef);
  private license = inject(LicenseService);
  private router = inject(Router);
  private loader = inject(LoaderService);
  private snackbar = inject(SnackbarService);
  private errorHandler = inject(ErrorHandlerService);

  service$ = this.store$.select(selectService(ServiceName.Iscsi));
  private service = toSignal(this.service$);

  requiredRoles = [
    Role.SharingIscsiTargetWrite,
    Role.SharingIscsiWrite,
    Role.SharingWrite,
  ];

  targets = signal<IscsiTarget[] | null>(null);

  protected readonly hasFibreChannel = toSignal(
    this.license.hasFibreChannel$.pipe(startWith(false)),
  );

  protected readonly searchableElements = iscsiCardElements;
  protected readonly emptyConfig = iscsiCardEmptyConfig;

  dataProvider: AsyncDataProvider<IscsiTarget>;

  columns = createTable<IscsiTarget>([
    textColumn({
      title: this.translate.instant('Target Name'),
      propertyName: 'name',
    }),
    textColumn({
      title: this.translate.instant('Target Alias'),
      propertyName: 'alias',
    }),
    textColumn({
      title: this.translate.instant('Mode'),
      propertyName: 'mode',
      hidden: true,
      getValue: (row) => this.translate.instant(iscsiTargetModeNames.get(row.mode) || row.mode) || '-',
    }),
    actionsWithMenuColumn({
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
    uniqueRowTag: (row) => 'card-iscsi-target-' + row.name,
    ariaLabels: (row) => [row.name, this.translate.instant('iSCSI Target')],
  });

  readonly cardTitle = computed(() => {
    return this.hasFibreChannel()
      ? this.translate.instant('Block (iSCSI/FC) Shares Targets')
      : this.translate.instant('Block (iSCSI) Shares Targets');
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

  private targetsCount = signal(0);

  readonly footerLink = computed<IxCardFooterLink>(() => {
    const count = this.targetsCount();
    return {
      label: this.translate.instant('View All {count}', { count }),
      handler: () => this.router.navigate(['/sharing', 'iscsi', 'targets']),
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
  ]);

  readonly primaryAction: IxCardAction = {
    label: this.translate.instant('Wizard'),
    handler: () => this.openForm(undefined, true),
  };

  constructor() {
    effect(() => {
      if (this.targets()?.some((target) => target.mode !== IscsiTargetMode.Iscsi)) {
        this.columns = this.columns.map((column) => {
          if (column.propertyName === 'mode') {
            return {
              ...column,
              hidden: false,
            };
          }

          return column;
        });
        this.cdr.detectChanges();
        this.cdr.markForCheck();
      }
    });
  }

  ngOnInit(): void {
    const iscsiShares$ = this.api.call('iscsi.target.query').pipe(
      tap((targets) => {
        this.targets.set(targets);
        this.targetsCount.set(targets.length);
      }),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider<IscsiTarget>(iscsiShares$);
    this.setDefaultSort();
    this.dataProvider.load();
  }

  openForm(row?: IscsiTarget, openWizard?: boolean): void {
    let slideInRef$: Observable<SlideInResponse<boolean | IscsiTarget>>;

    if (openWizard) {
      slideInRef$ = this.slideIn.open(IscsiWizardComponent, { data: row, wide: true });
    } else {
      slideInRef$ = this.slideIn.open(TargetFormComponent, { data: row, wide: true });
    }

    slideInRef$.pipe(
      filter((response) => !!response.response),
      untilDestroyed(this),
    ).subscribe(() => {
      this.dataProvider.load();
    });
  }

  doDelete(iscsi: IscsiTarget): void {
    this.matDialog
      .open(DeleteTargetDialog, { data: iscsi, width: '600px' })
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.dataProvider.load());
  }

  setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 0,
      direction: SortDirection.Asc,
      propertyName: 'name',
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
    this.slideIn.open(GlobalTargetConfigurationComponent);
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
