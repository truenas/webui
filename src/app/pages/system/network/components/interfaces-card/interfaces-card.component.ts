import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, output, signal, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCardComponent, TnCardHeaderDirective,
  TnCellDefDirective, TnHeaderCellDefDirective, TnTableColumnDirective, TnTableComponent,
  TnTooltipDirective, tnIconMarker, type TnSortEvent,
} from '@truenas/ui-components';
import { BehaviorSubject, combineLatest, of } from 'rxjs';
import {
  filter, map, throttleTime,
} from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { NetworkInterfaceType } from 'app/enums/network-interface.enum';
import { Role } from 'app/enums/role.enum';
import { helptextInterfaces } from 'app/helptext/network/interfaces/interfaces-list';
import { NetworkInterface } from 'app/interfaces/network-interface.interface';
import { AllNetworkInterfacesUpdate } from 'app/interfaces/reporting.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { InterfaceStatusIconComponent } from 'app/modules/interface-status-icon/interface-status-icon.component';
import { ArrayDataProvider } from 'app/modules/ix-table/classes/array-data-provider/array-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { convertStringToId, dataProviderRows, mapTnSortToTableSort } from 'app/modules/ix-table/utils';
import { LoaderService } from 'app/modules/loader/loader.service';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import {
  TableActionsCellComponent,
} from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { InterfaceFormComponent } from 'app/pages/system/network/components/interface-form/interface-form.component';
import { interfacesCardElements } from 'app/pages/system/network/components/interfaces-card/interfaces-card.elements';
import {
  IpAddressesCellComponent,
} from 'app/pages/system/network/components/interfaces-card/ip-addresses-cell/ip-addresses-cell.component';
import { InterfacesStore } from 'app/pages/system/network/stores/interfaces.store';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { NetworkService } from 'app/services/network.service';
import { AppState } from 'app/store';
import { networkInterfacesChanged } from 'app/store/network-interfaces/network-interfaces.actions';

@Component({
  selector: 'ix-interfaces-card',
  templateUrl: './interfaces-card.component.html',
  styleUrls: ['./interfaces-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardHeaderDirective,
    TnButtonComponent,
    TnTooltipDirective,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TableActionsCellComponent,
    RequiresRolesDirective,
    UiSearchDirective,
    InterfaceStatusIconComponent,
    IpAddressesCellComponent,
    TranslateModule,
  ],
})
export class InterfacesCardComponent implements OnInit {
  private interfacesStore$ = inject(InterfacesStore);
  private store$ = inject<Store<AppState>>(Store);
  private translate = inject(TranslateService);
  private formPanel = inject(FormSidePanelService);
  private dialogService = inject(DialogService);
  private api = inject(ApiService);
  private loader = inject(LoaderService);
  private errorHandler = inject(ErrorHandlerService);
  private networkService = inject(NetworkService);
  private destroyRef = inject(DestroyRef);

  protected readonly searchableElements = interfacesCardElements.elements;

  readonly interfacesUpdated = output();

  protected readonly requiredRoles = [Role.NetworkInterfaceWrite];
  protected readonly interfaces = signal<NetworkInterface[]>([]);

  // Kept as a subject because IconActionConfig hidden/disabled/dynamicTooltip callbacks expect Observables.
  protected readonly isHaEnabled$ = new BehaviorSubject<boolean>(false);
  protected readonly isHaEnabled = toSignal(this.isHaEnabled$, { initialValue: false });

  protected readonly isLoading = signal(false);
  dataProvider = new ArrayDataProvider<NetworkInterface>();
  protected readonly rows = dataProviderRows(this.dataProvider);
  inOutUpdates = signal<AllNetworkInterfacesUpdate>({});

  protected readonly displayedColumns = ['state', 'name', 'ip_addresses', 'mac', 'actions'];

  protected readonly actions: IconActionConfig<NetworkInterface>[] = [
    {
      iconName: tnIconMarker('pencil', 'mdi'),
      tooltip: this.translate.instant('Edit'),
      onClick: (row) => this.onEdit(row),
    },
    {
      iconName: tnIconMarker('refresh', 'mdi'),
      requiredRoles: this.requiredRoles,
      hidden: (row) => combineLatest([
        of(!this.isPhysical(row)),
        this.isHaEnabled$,
      ]).pipe(
        map(([isNotPhysical, isHaEnabled]) => isHaEnabled || isNotPhysical),
      ),
      tooltip: this.translate.instant('Reset configuration'),
      onClick: (row) => this.onReset(row),
    },
    {
      iconName: tnIconMarker('', 'mdi'),
      hidden: () => this.isHaEnabled$.pipe(map((isHaEnabled) => !isHaEnabled)),
      disabled: () => of(true),
      tooltip: this.translate.instant(helptextInterfaces.haEnabledResetMessage),
      onClick: (): void => {},
    },
    {
      iconName: tnIconMarker('delete', 'mdi'),
      requiredRoles: this.requiredRoles,
      dynamicTooltip: () => this.isHaEnabled$.pipe(
        map((isHaEnabled) => (isHaEnabled
          ? this.translate.instant(helptextInterfaces.haEnabledDeleteMessage)
          : this.translate.instant('Delete'))),
      ),
      hidden: (row) => of(this.isPhysical(row)),
      onClick: (row) => this.onDelete(row),
      disabled: () => this.isHaEnabled$,
    },
  ];

  protected nameWithDescription(row: NetworkInterface): string {
    return row.description ? `${row.name} (${row.description})` : row.name;
  }

  protected uniqueRowTag(row: NetworkInterface): string {
    return convertStringToId('interface-' + row.name);
  }

  protected ariaLabel(row: NetworkInterface): string {
    return [row.name, this.translate.instant('Interface')].join(' ');
  }

  // Restores the header-click sorting the ix-table version had. Each sortable column needs a
  // custom key because none map to a plain NetworkInterface property (name folds in the
  // description, ip_addresses/mac live on nested structures).
  protected onSortChange(event: TnSortEvent): void {
    const base = mapTnSortToTableSort<NetworkInterface>(event, this.displayedColumns);
    this.dataProvider.setSorting({
      ...base,
      sortBy: base.direction ? this.sortByForColumn(event.column) : undefined,
    });
  }

  private sortByForColumn(column: string): ((row: NetworkInterface) => string) | undefined {
    switch (column) {
      case 'name':
        return (row) => this.nameWithDescription(row);
      case 'ip_addresses':
        return (row) => row.aliases.map((alias) => alias.address).join(', ');
      case 'mac':
        return (row) => row.state.permanent_link_address;
      default:
        return undefined;
    }
  }

  readonly helptext = helptextInterfaces;

  private isPhysical(row: NetworkInterface): boolean {
    return row.type === NetworkInterfaceType.Physical;
  }

  ngOnInit(): void {
    this.interfacesStore$.loadInterfaces();
    this.interfacesStore$.state$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((state) => {
      this.isLoading.set(state.isLoading);
      this.interfaces.set(state.interfaces);
      this.dataProvider.setRows(state.interfaces);
      const inOutUpdates: AllNetworkInterfacesUpdate = {};
      for (const nic of state.interfaces) {
        inOutUpdates[nic.name] = {
          link_state: nic.state?.link_state,
          received_bytes_rate: 0,
          sent_bytes_rate: 0,
          speed: 0,
        };
      }
      this.inOutUpdates.set(inOutUpdates);
      this.subscribeToUpdates();
    });
    this.checkFailoverDisabled();
  }

  private checkFailoverDisabled(): void {
    this.networkService.getIsHaEnabled().pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((isHaEnabled) => {
      this.isHaEnabled$.next(isHaEnabled);
    });
  }

  protected onAddNew(): void {
    this.formPanel.open(InterfaceFormComponent, {
      title: this.translate.instant('Add Interface'),
      inputs: {
        interfacesList: this.interfaces(),
      },
    }).onSuccess(() => {
      this.interfacesUpdated.emit();
      this.interfacesStore$.loadInterfaces();
    }, this.destroyRef);
  }

  protected onEdit(row: NetworkInterface): void {
    this.formPanel.open(InterfaceFormComponent, {
      title: this.translate.instant('Edit Interface'),
      inputs: {
        editInterface: row,
      },
    }).onSuccess(() => {
      this.interfacesUpdated.emit();
      this.interfacesStore$.loadInterfaces();
    }, this.destroyRef);
  }

  protected onDelete(row: NetworkInterface): void {
    this.dialogService.confirmDelete({
      title: this.translate.instant('Delete Interface'),
      message: this.translate.instant(helptextInterfaces.deleteDialogText),
      call: () => this.api.call('interface.delete', [row.id]),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.interfacesUpdated.emit();
      this.interfacesStore$.loadInterfaces();
      this.store$.dispatch(networkInterfacesChanged({ commit: false, checkIn: false }));
    });
  }

  protected onReset(row: NetworkInterface): void {
    this.dialogService.confirm({
      title: this.translate.instant('Reset Configuration'),
      message: this.translate.instant(helptextInterfaces.deleteDialogText),
      buttonText: this.translate.instant('Reset'),
    })
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.makeDeleteCall(row));
  }

  private makeDeleteCall(row: NetworkInterface): void {
    this.api.call('interface.delete', [row.id])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.interfacesUpdated.emit();
        this.interfacesStore$.loadInterfaces();
        this.store$.dispatch(networkInterfacesChanged({ commit: false, checkIn: false }));
      });
  }

  private subscribeToUpdates(): void {
    this.networkService.subscribeToInOutUpdates()
      .pipe(
        filter(Boolean),
        throttleTime(1000),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((updates) => {
        const updatedInterfaces = Object.keys(updates);
        this.inOutUpdates.update((value) => {
          const next = { ...value };
          for (const nic of updatedInterfaces) {
            next[nic] = { ...updates[nic] };
          }
          return next;
        });
      });
  }
}
