import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, OnInit, inject, signal, viewChild, DestroyRef } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  tnIconMarker,
  TnButtonComponent,
  TnCardComponent,
  TnCardHeaderDirective,
  TnCellDefDirective,
  TnEmptyComponent,
  TnHeaderCellDefDirective,
  TnIconComponent,
  TnSidePanelActionDirective,
  TnSidePanelComponent,
  TnTableColumnDirective,
  TnTableComponent,
  TnTooltipDirective,
  type TnCardAction,
  type TnSortEvent,
  TnDialog,
} from '@truenas/ui-components';
import { filter, switchMap } from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { NvmeOfSubsystemDetails } from 'app/interfaces/nvme-of.interface';
import { CardAlertBadgeComponent } from 'app/modules/alerts/components/card-alert-badge/card-alert-badge.component';
import { AuthService } from 'app/modules/auth/auth.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { ArrayDataProvider } from 'app/modules/ix-table/classes/array-data-provider/array-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { IxTablePagerShowMoreComponent } from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { convertStringToId, mapTnSortToTableSort } from 'app/modules/ix-table/utils';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import {
  TableActionsCellComponent,
} from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  ServiceActionsMenuService,
} from 'app/pages/sharing/components/shares-dashboard/service-extra-actions/service-actions-menu.service';
import { AddSubsystemComponent } from 'app/pages/sharing/nvme-of/add-subsystem/add-subsystem.component';
import {
  NvmeOfConfigurationComponent,
} from 'app/pages/sharing/nvme-of/nvme-of-configuration/nvme-of-configuration.component';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/services/nvme-of.store';
import { SubsystemDeleteDialogComponent } from 'app/pages/sharing/nvme-of/subsystem-details-header/subsystem-delete-dialog/subsystem-delete-dialog.component';
import { SubSystemNameCellComponent } from 'app/pages/sharing/nvme-of/subsystems-list/subsystem-name-cell/subsystem-name-cell.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { ServicesState } from 'app/store/services/services.reducer';
import { selectService } from 'app/store/services/services.selectors';

@Component({
  selector: 'ix-nvme-of-card',
  templateUrl: './nvme-of-card.component.html',
  styleUrls: ['./nvme-of-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnButtonComponent,
    TnCardComponent,
    TnCardHeaderDirective,
    TnSidePanelComponent,
    TnSidePanelActionDirective,
    TestDirective,
    TnIconComponent,
    TnTooltipDirective,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    IxTablePagerShowMoreComponent,
    TranslateModule,
    AsyncPipe,
    RouterLink,
    TnEmptyComponent,
    SubSystemNameCellComponent,
    CardAlertBadgeComponent,
    NvmeOfConfigurationComponent,
    TableActionsCellComponent,
  ],
})
export class NvmeOfCardComponent implements OnInit {
  private slideIn = inject(SlideIn);
  private translate = inject(TranslateService);
  protected emptyService = inject(EmptyService);
  private store$ = inject<Store<ServicesState>>(Store);
  private nvmeOfStore = inject(NvmeOfStore);
  private tnDialog = inject(TnDialog);
  private api = inject(ApiService);
  private loader = inject(LoaderService);
  private errorHandler = inject(ErrorHandlerService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);
  private actionsMenu = inject(ServiceActionsMenuService);

  requiredRoles = [Role.SharingNvmeTargetWrite];
  protected readonly isLoading = this.nvmeOfStore.isLoading;
  protected readonly cardMenuPath = ['sharing', 'nvme-of'];

  protected service$ = this.store$.select(selectService(ServiceName.NvmeOf));
  private service = toSignal(this.service$);
  private hasAddRole = toSignal(this.authService.hasRole(this.requiredRoles), { initialValue: false });

  protected serviceStatus = computed(() => this.actionsMenu.buildCardHeaderStatus(this.service()));

  protected headerMenuTriggerTestId = computed(() => this.actionsMenu.cardHeaderMenuTriggerTestId(this.service()));

  protected addAction = computed<TnCardAction | undefined>(() => {
    if (!this.hasAddRole()) {
      return undefined;
    }
    return {
      label: this.translate.instant('Add'),
      testId: 'button-nvme-of-share-add',
      handler: () => this.openForm(),
    };
  });

  protected configOpen = signal(false);
  protected configForm = viewChild(NvmeOfConfigurationComponent);
  protected closeConfigGuard = this.actionsMenu.buildUnsavedChangesGuard(
    () => this.configForm()?.hasUnsavedChanges() ?? false,
  );

  protected serviceMenu = computed(() => this.actionsMenu.buildServiceCardMenu(
    this.service(),
    this.hasAddRole(),
    () => this.configOpen.set(true),
  ));

  protected serviceControl = computed(() => this.actionsMenu.buildServiceControl(this.service(), this.hasAddRole()));

  protected onConfigClosed(): void {
    this.configOpen.set(false);
  }

  protected readonly subsystems = this.nvmeOfStore.subsystems;

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

  protected readonly actions: IconActionConfig<NvmeOfSubsystemDetails>[] = [
    {
      iconName: tnIconMarker('eye', 'mdi'),
      tooltip: this.translate.instant('View'),
      onClick: (row) => this.router.navigate(['/sharing/nvme-of', row.name]),
      requiredRoles: this.requiredRoles,
    },
    {
      iconName: tnIconMarker('delete', 'mdi'),
      tooltip: this.translate.instant('Delete'),
      onClick: (row) => this.doDelete(row),
      requiredRoles: this.requiredRoles,
    },
  ];

  protected readonly displayedColumns = ['name', 'namespaces', 'ports', 'hosts', 'actions'];

  protected readonly trackBySubsystemId = (_index: number, row: NvmeOfSubsystemDetails): number => row.id;

  protected uniqueRowTag(row: NvmeOfSubsystemDetails): string {
    return convertStringToId('nvmeof-subsys-' + row.name);
  }

  protected ariaLabel(row: NvmeOfSubsystemDetails): string {
    return [row.name, this.translate.instant('Subsystem')].join(' ');
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider().setSorting(mapTnSortToTableSort<NvmeOfSubsystemDetails>(event, this.displayedColumns));
  }

  ngOnInit(): void {
    this.nvmeOfStore.initialize();
  }

  openForm(): void {
    this.slideIn.open(AddSubsystemComponent)
      .onSuccess(() => this.nvmeOfStore.initialize(), this.destroyRef);
  }

  doDelete(row: NvmeOfSubsystemDetails): void {
    this.tnDialog.open(
      SubsystemDeleteDialogComponent,
      { data: row, minWidth: '500px' },
    )
      .closed
      .pipe(
        filter((data: { confirmed: boolean; force: boolean }) => data?.confirmed),
        switchMap(({ force }) => {
          return this.api.call('nvmet.subsys.delete', [row.id, { force }]).pipe(
            this.loader.withLoader(),
            this.errorHandler.withErrorHandler(),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe(() => {
        this.nvmeOfStore.initialize();
      });
  }
}
