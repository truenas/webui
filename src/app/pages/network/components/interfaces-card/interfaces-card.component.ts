import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnInit, output,
  signal,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { MatToolbarRow } from '@angular/material/toolbar';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, of } from 'rxjs';
import { filter, map, throttleTime } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { NetworkInterfaceType } from 'app/enums/network-interface.enum';
import { Role } from 'app/enums/role.enum';
import { helptextInterfaces } from 'app/helptext/network/interfaces/interfaces-list';
import { NetworkInterface } from 'app/interfaces/network-interface.interface';
import { AllNetworkInterfacesUpdate } from 'app/interfaces/reporting.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { InterfaceStatusIconComponent } from 'app/modules/interface-status-icon/interface-status-icon.component';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { ArrayDataProvider } from 'app/modules/ix-table/classes/array-data-provider/array-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTableCellDirective } from 'app/modules/ix-table/directives/ix-table-cell.directive';
import { createTable } from 'app/modules/ix-table/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { InterfaceFormComponent } from 'app/pages/network/components/interface-form/interface-form.component';
import { interfacesCardElements } from 'app/pages/network/components/interfaces-card/interfaces-card.elements';
import {
  ipAddressesColumn,
} from 'app/pages/network/components/interfaces-card/ip-addresses-cell/ip-addresses-cell.component';
import { InterfacesStore } from 'app/pages/network/stores/interfaces.store';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { NetworkService } from 'app/services/network.service';
import { SlideInService } from 'app/services/slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { networkInterfacesChanged } from 'app/store/network-interfaces/network-interfaces.actions';

@UntilDestroy()
@Component({
  selector: 'ix-interfaces-card',
  templateUrl: './interfaces-card.component.html',
  styleUrls: ['./interfaces-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    MatToolbarRow,
    MatTooltip,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    UiSearchDirective,
    IxTableComponent,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTableCellDirective,
    InterfaceStatusIconComponent,
    TranslateModule,
  ],
})
export class InterfacesCardComponent implements OnInit, OnChanges {
  protected readonly searchableElements = interfacesCardElements.elements;
  @Input() isHaEnabled = false;

  readonly interfacesUpdated = output();

  readonly requiredRoles = [Role.NetworkInterfaceWrite];

  isHaEnabled$ = new BehaviorSubject(false);

  isLoading = false;
  dataProvider = new ArrayDataProvider<NetworkInterface>();
  inOutUpdates = signal<AllNetworkInterfacesUpdate>({});

  columns = createTable<NetworkInterface>([
    textColumn({
      propertyName: 'state',
    }),
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
    }),
    ipAddressesColumn({
      title: this.translate.instant('IP Addresses'),
      sortBy: (row) => row.aliases.map((alias) => alias.address).join(', '),
    }),
    actionsColumn({
      actions: [
        {
          iconName: iconMarker('edit'),
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.onEdit(row),
        },
        {
          iconName: iconMarker('refresh'),
          requiredRoles: this.requiredRoles,
          hidden: (row) => of(!this.isPhysical(row)),
          disabled: () => this.isHaEnabled$,
          dynamicTooltip: () => this.isHaEnabled$.pipe(map((isHaEnabled) => (isHaEnabled
            ? this.translate.instant(helptextInterfaces.ha_enabled_reset_msg)
            : this.translate.instant('Reset configuration')))),
          onClick: (row) => this.onReset(row),
        },
        {
          iconName: iconMarker('mdi-delete'),
          requiredRoles: this.requiredRoles,
          tooltip: this.isHaEnabled ? this.translate.instant(helptextInterfaces.ha_enabled_delete_msg) : '',
          hidden: (row) => of(this.isPhysical(row)),
          onClick: (row) => this.onDelete(row),
          disabled: () => this.isHaEnabled$,
        },
      ],
    }),
  ], {
    uniqueRowTag: (row) => 'interface-' + row.name,
    ariaLabels: (row) => [row.name, this.translate.instant('Interface')],
  });

  readonly helptext = helptextInterfaces;

  constructor(
    private interfacesStore$: InterfacesStore,
    private store$: Store<AppState>,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private slideInService: SlideInService,
    private dialogService: DialogService,
    private ws: WebSocketService,
    private loader: AppLoaderService,
    private errorHandler: ErrorHandlerService,
    private networkService: NetworkService,
  ) {}

  isPhysical(row: NetworkInterface): boolean {
    return row.type === NetworkInterfaceType.Physical;
  }

  ngOnChanges(): void {
    this.isHaEnabled$.next(this.isHaEnabled);
  }

  ngOnInit(): void {
    this.interfacesStore$.loadInterfaces();
    this.interfacesStore$.state$.pipe(untilDestroyed(this)).subscribe((state) => {
      this.isLoading = state.isLoading;
      this.dataProvider.setRows(state.interfaces);
      this.inOutUpdates.set({});
      for (const nic of state.interfaces) {
        this.inOutUpdates.update((value) => {
          value[nic.name] = {
            link_state: nic.state?.link_state,
            received_bytes_rate: 0,
            sent_bytes_rate: 0,
            speed: 0,
          };
          return value;
        });
      }
      this.subscribeToUpdates();

      this.cdr.markForCheck();
    });
  }

  onAddNew(): void {
    this.slideInService.open(InterfaceFormComponent)
      .slideInClosed$
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        this.interfacesUpdated.emit();
        this.interfacesStore$.loadInterfaces();
      });
  }

  onEdit(row: NetworkInterface): void {
    this.slideInService.open(InterfaceFormComponent, {
      data: row,
    })
      .slideInClosed$
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        this.interfacesUpdated.emit();
        this.interfacesStore$.loadInterfaces();
      });
  }

  onDelete(row: NetworkInterface): void {
    this.dialogService.confirm({
      title: this.translate.instant('Delete Interface'),
      message: this.translate.instant(helptextInterfaces.delete_dialog_text),
      buttonText: this.translate.instant('Delete'),
    })
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.makeDeleteCall(row));
  }

  onReset(row: NetworkInterface): void {
    this.dialogService.confirm({
      title: this.translate.instant('Reset Configuration'),
      message: this.translate.instant(helptextInterfaces.delete_dialog_text),
      buttonText: this.translate.instant('Reset'),
    })
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.makeDeleteCall(row));
  }

  private makeDeleteCall(row: NetworkInterface): void {
    this.ws.call('interface.delete', [row.id])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.catchError(),
        untilDestroyed(this),
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
        untilDestroyed(this),
      )
      .subscribe((updates) => {
        const updatedInterfaces = Object.keys(updates);
        this.inOutUpdates.update((value) => {
          for (const nic of updatedInterfaces) {
            value[nic] = { ...updates[nic] };
          }
          return value;
        });
        this.cdr.markForCheck();
      });
  }
}
