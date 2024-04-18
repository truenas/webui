import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { BehaviorSubject, of } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { NetworkInterfaceType } from 'app/enums/network-interface.enum';
import { Role } from 'app/enums/role.enum';
import { helptextInterfaces } from 'app/helptext/network/interfaces/interfaces-list';
import { NetworkInterface } from 'app/interfaces/network-interface.interface';
import { AllNetworkInterfacesUpdate } from 'app/interfaces/reporting.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ArrayDataProvider } from 'app/modules/ix-table/classes/array-data-provider/array-data-provider';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { createTable } from 'app/modules/ix-table/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { InterfaceFormComponent } from 'app/pages/network/components/interface-form/interface-form.component';
import {
  IpAddressesCellComponent,
} from 'app/pages/network/components/interfaces-card/ip-addresses-cell/ip-addresses-cell.component';
import { InterfacesStore } from 'app/pages/network/stores/interfaces.store';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { NetworkService } from 'app/services/network.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { networkInterfacesChanged } from 'app/store/network-interfaces/network-interfaces.actions';

@UntilDestroy()
@Component({
  selector: 'ix-interfaces-card',
  templateUrl: './interfaces-card.component.html',
  styleUrls: ['./interfaces-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InterfacesCardComponent implements OnInit, OnChanges {
  @Input() isHaEnabled = false;
  @Output() interfacesUpdated = new EventEmitter<void>();

  readonly requiredRoles = [Role.NetworkInterfaceWrite];

  isHaEnabled$ = new BehaviorSubject(false);

  isLoading = false;
  dataProvider = new ArrayDataProvider<NetworkInterface>();
  inOutUpdates: AllNetworkInterfacesUpdate;

  columns = createTable<NetworkInterface>([
    textColumn({
      // In-out column
      propertyName: 'state',
    }),
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
    }),
    {
      type: IpAddressesCellComponent,
      title: this.translate.instant('IP Addresses'),
    },
    actionsColumn({
      actions: [
        {
          iconName: 'edit',
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.onEdit(row),
        },
        {
          iconName: 'refresh',
          requiredRoles: this.requiredRoles,
          hidden: (row) => of(!this.isPhysical(row)),
          disabled: () => this.isHaEnabled$,
          dynamicTooltip: () => this.isHaEnabled$.pipe(map((isHaEnabled) => (isHaEnabled
            ? this.translate.instant(helptextInterfaces.ha_enabled_reset_msg)
            : this.translate.instant('Reset configuration')))),
          onClick: (row) => this.onReset(row),
        },
        {
          iconName: 'delete',
          requiredRoles: this.requiredRoles,
          tooltip: this.isHaEnabled ? this.translate.instant(helptextInterfaces.ha_enabled_delete_msg) : '',
          hidden: (row) => of(this.isPhysical(row)),
          onClick: (row) => this.onDelete(row),
          disabled: () => this.isHaEnabled$,
        },
      ],
    }),
  ], {
    rowTestId: (row) => 'interface-' + row.name,
  });

  readonly helptext = helptextInterfaces;

  constructor(
    private interfacesStore$: InterfacesStore,
    private store$: Store<AppState>,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private slideInService: IxSlideInService,
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
      this.inOutUpdates = {};
      for (const nic of state.interfaces) {
        this.inOutUpdates[nic.name] = {
          link_state: nic.state?.link_state,
          received_bytes_rate: 0,
          sent_bytes_rate: 0,
          speed: 0,
        };
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
    this.networkService.subscribeToInOutUpdates().pipe(untilDestroyed(this)).subscribe((updates) => {
      if (!updates) {
        return;
      }
      const newInOutUpdates = _.cloneDeep(this.inOutUpdates);
      const updatedInterfaces = Object.keys(updates);
      for (const nic of updatedInterfaces) {
        newInOutUpdates[nic] = {
          ...updates[nic],
        };
      }
      this.inOutUpdates = newInOutUpdates;
      this.cdr.markForCheck();
    });
  }
}
