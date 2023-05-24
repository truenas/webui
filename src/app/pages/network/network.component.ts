import {
  AfterViewInit,
  Component, Inject, OnDestroy, OnInit,
} from '@angular/core';
import { Navigation, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { lastValueFrom, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { NetworkInterfaceType } from 'app/enums/network-interface.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { WINDOW } from 'app/helpers/window.helper';
import helptext from 'app/helptext/network/interfaces/interfaces-list';
import { CoreEvent } from 'app/interfaces/events';
import { NetworkInterfacesChangedEvent } from 'app/interfaces/events/network-interfaces-changed-event.interface';
import { Ipmi } from 'app/interfaces/ipmi.interface';
import { NetworkInterface } from 'app/interfaces/network-interface.interface';
import { Service } from 'app/interfaces/service.interface';
import { StaticRoute } from 'app/interfaces/static-route.interface';
import { Interval } from 'app/interfaces/timeout.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { AppTableAction, AppTableConfig, TableComponent } from 'app/modules/entity/table/table.component';
import { TableService } from 'app/modules/entity/table/table.service';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { InterfaceFormComponent } from 'app/pages/network/components/interface-form/interface-form.component';
import { OpenVpnClientConfigComponent } from 'app/pages/network/components/open-vpn-client-config/open-vpn-client-config.component';
import {
  OpenVpnServerConfigComponent,
} from 'app/pages/network/components/open-vpn-server-config/open-vpn-server-config.component';
import { StaticRouteFormComponent } from 'app/pages/network/components/static-route-form/static-route-form.component';
import { IpmiRow } from 'app/pages/network/interfaces/network-dashboard.interface';
import { NetworkInterfaceUi } from 'app/pages/network/interfaces/network-interface-ui.interface';
import {
  AppLoaderService,
  DialogService,
  StorageService, SystemGeneralService,
} from 'app/services';
import { CoreService } from 'app/services/core-service/core.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
import { selectHaStatus } from 'app/store/ha-info/ha-info.selectors';
import { AppState } from 'app/store/index';
import { IpmiFormComponent } from './components/forms/ipmi-form.component';

@UntilDestroy()
@Component({
  selector: 'ix-interfaces-list',
  templateUrl: './network.component.html',
  styleUrls: ['./network.component.scss'],
})
export class NetworkComponent implements OnInit, AfterViewInit, OnDestroy {
  protected summaryCall = 'network.general.summary' as const;
  formEvent$: Subject<CoreEvent>;

  isHaEnabled = false;
  hasPendingChanges = false;
  checkinWaiting = false;
  checkinTimeout = 60;
  checkinTimeoutPattern = /\d+/;
  checkinRemaining: number = null;
  private uniqueIps: string[] = [];
  private affectedServices: string[] = [];
  checkinInterval: Interval;

  private navigation: Navigation;
  helptext = helptext;

  interfaceTableConf: AppTableConfig<NetworkComponent> = {
    title: this.translate.instant('Interfaces'),
    queryCall: 'interface.query',
    deleteCall: 'interface.delete',
    name: 'interfaces',
    columns: [
      { name: this.translate.instant('Name'), prop: 'name', state: { prop: 'link_state' } },
      { name: this.translate.instant('IP Addresses'), prop: 'addresses', listview: true },
    ],
    dataSourceHelper: this.interfaceDataSourceHelper,
    getInOutInfo: this.getInterfaceInOutInfo.bind(this),
    parent: this,
    add: () => {
      const slideIn = this.slideInService.open(InterfaceFormComponent);
      this.handleSlideInClosed(slideIn);
    },
    edit: (row: NetworkInterfaceUi) => {
      const slideIn = this.slideInService.open(InterfaceFormComponent);
      this.handleSlideInClosed(slideIn);
      slideIn.componentInstance.setInterfaceForEdit(row);
    },
    delete: (row: NetworkInterfaceUi, table: TableComponent) => {
      const deleteAction = row.type === NetworkInterfaceType.Physical ? this.translate.instant('Reset configuration for ') : this.translate.instant('Delete ');
      if (this.isHaEnabled) {
        this.dialogService.warn(helptext.ha_enabled_edit_title, helptext.ha_enabled_edit_msg);
      } else {
        this.tableService.delete(table, row as unknown as Record<string, unknown>, deleteAction);
      }
    },
    afterDelete: this.afterDelete.bind(this),
    deleteMsg: {
      title: 'interfaces',
      key_props: ['name'],
    },
    confirmDeleteDialog: {
      buildTitle: (intf: NetworkInterfaceUi): string => {
        if (intf.type === NetworkInterfaceType.Physical) {
          return this.translate.instant('Reset Configuration');
        }
        return this.translate.instant('Delete');
      },
      buttonMessage: (intf: NetworkInterfaceUi): string => {
        if (intf.type === NetworkInterfaceType.Physical) {
          return this.translate.instant('Reset Configuration');
        }
        return this.translate.instant('Delete');
      },
      message: helptext.delete_dialog_text,
    },
  };

  staticRoutesTableConf: AppTableConfig<NetworkComponent> = {
    title: this.translate.instant('Static Routes'),
    queryCall: 'staticroute.query',
    deleteCall: 'staticroute.delete',
    name: 'staticRoutes',
    columns: [
      { name: this.translate.instant('Destination'), prop: 'destination' },
      { name: this.translate.instant('Gateway'), prop: 'gateway' },
    ],
    parent: this,
    add: () => {
      const slideIn = this.slideInService.open(StaticRouteFormComponent);
      this.handleSlideInClosed(slideIn);
    },
    edit: (route: StaticRoute) => {
      const slideIn = this.slideInService.open(StaticRouteFormComponent);
      this.handleSlideInClosed(slideIn);
      slideIn.componentInstance.setEditingStaticRoute(route);
    },
    deleteMsg: {
      title: 'static route',
      key_props: ['destination', 'gateway'],
    },
  };

  openvpnTableConf: AppTableConfig<NetworkComponent> = {
    title: this.translate.instant('OpenVPN'),
    queryCall: 'service.query',
    name: 'openVPN',
    columns: [
      { name: this.translate.instant('Service'), prop: 'service_label' },
      { name: this.translate.instant('State'), prop: 'state' },
    ],
    hideHeader: true,
    parent: this,
    dataSourceHelper: this.openvpnDataSourceHelper,
    getActions: this.getOpenVpnActions.bind(this),
    isActionVisible: this.isOpenVpnActionVisible,
    edit: (row: Service) => {
      if (row.service === ServiceName.OpenVpnClient) {
        const slideIn = this.slideInService.open(OpenVpnClientConfigComponent, { wide: true });
        this.handleSlideInClosed(slideIn);
      } else if (row.service === ServiceName.OpenVpnServer) {
        const slideIn = this.slideInService.open(OpenVpnServerConfigComponent, { wide: true });
        this.handleSlideInClosed(slideIn);
      }
    },
    afterGetData: () => {
      const state = this.navigation?.extras?.state as { configureOpenVPN: string };
      if (state && state.configureOpenVPN) {
        if (state.configureOpenVPN === 'client') {
          const slideIn = this.slideInService.open(OpenVpnClientConfigComponent, { wide: true });
          this.handleSlideInClosed(slideIn);
        } else {
          const slideIn = this.slideInService.open(OpenVpnServerConfigComponent, { wide: true });
          this.handleSlideInClosed(slideIn);
        }
      }
    },
  };

  ipmiTableConf: AppTableConfig<NetworkComponent> = {
    title: this.translate.instant('IPMI'),
    queryCall: 'ipmi.lan.query',
    columns: [{ name: this.translate.instant('Channel'), prop: 'channelLabel' }],
    hideHeader: true,
    parent: this,
    dataSourceHelper: (ipmi: Ipmi[]) => this.ipmiDataSourceHelper(ipmi),
    getActions: this.getIpmiActions.bind(this),
    isActionVisible: this.isIpmiActionVisible,
    edit: (row: IpmiRow) => {
      const slideIn = this.slideInService.open(IpmiFormComponent);
      this.handleSlideInClosed(slideIn);
      slideIn.componentInstance.setIdIpmi(row.id);
    },
  };

  ipmiEnabled: boolean;

  constructor(
    private ws: WebSocketService,
    private router: Router,
    private dialogService: DialogService,
    private storageService: StorageService,
    private loader: AppLoaderService,
    private translate: TranslateService,
    private tableService: TableService,
    private slideInService: IxSlideInService,
    private core: CoreService,
    private snackbar: SnackbarService,
    private store$: Store<AppState>,
    private errorHandler: ErrorHandlerService,
    private systemGeneralService: SystemGeneralService,
    @Inject(WINDOW) private window: Window,
  ) {
    this.navigation = this.router.getCurrentNavigation();
  }

  ngOnInit(): void {
    this.getInterfaces();
    this.checkInterfacePendingChanges();
    this.core
      .register({ observerClass: this, eventName: 'NetworkInterfacesChanged' })
      .pipe(untilDestroyed(this))
      .subscribe((evt: NetworkInterfacesChangedEvent) => {
        if (!evt || !evt.data.checkin) {
          return;
        }

        this.checkinRemaining = null;
        this.checkinWaiting = false;
        if (this.checkinInterval) {
          clearInterval(this.checkinInterval);
        }
        this.hasPendingChanges = false;
      });

    if (this.systemGeneralService.getProductType() === ProductType.ScaleEnterprise) {
      this.listenForHaStatus();
    }

    this.openInterfaceForEditFromRoute();
  }

  ngAfterViewInit(): void {
    this.ws.call('ipmi.is_loaded').pipe(untilDestroyed(this)).subscribe((isIpmiLoaded) => {
      this.ipmiEnabled = isIpmiLoaded;
    });
  }

  handleSlideInClosed(slideIn: IxSlideInRef<unknown, unknown>): void {
    slideIn.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => {
      this.staticRoutesTableConf.tableComponent.getData();
      this.getInterfaces();
      this.checkInterfacePendingChanges();
    });
  }

  private listenForHaStatus(): void {
    this.store$.select(selectHaStatus).pipe(filter(Boolean), untilDestroyed(this)).subscribe(({ hasHa }) => {
      this.isHaEnabled = hasHa;
    });
  }

  private async checkInterfacePendingChanges(): Promise<void> {
    let hasPendingChanges = await this.getPendingChanges();
    let checkinWaitingSeconds = await this.getCheckinWaitingSeconds();

    if (hasPendingChanges && checkinWaitingSeconds > 0) {
      await this.cancelCommit();
      hasPendingChanges = await this.getPendingChanges();
      checkinWaitingSeconds = await this.getCheckinWaitingSeconds();
    }

    this.hasPendingChanges = hasPendingChanges;
    this.handleWaitingCheckin(checkinWaitingSeconds);
  }

  private getInterfaces(): void {
    if (this.interfaceTableConf.tableComponent) {
      this.interfaceTableConf.tableComponent.getData();
    }
  }

  private getCheckinWaitingSeconds(): Promise<number> {
    return lastValueFrom(
      this.ws.call('interface.checkin_waiting'),
    );
  }

  private getPendingChanges(): Promise<boolean> {
    return lastValueFrom(
      this.ws.call('interface.has_pending_changes'),
    );
  }

  private async cancelCommit(): Promise<void> {
    await lastValueFrom(
      this.ws.call('interface.cancel_rollback'),
    );
  }

  private handleWaitingCheckin(seconds: number): void {
    if (seconds !== null) {
      if (seconds > 0 && this.checkinRemaining === null) {
        this.checkinRemaining = Math.round(seconds);
        this.checkinInterval = setInterval(() => {
          if (this.checkinRemaining > 0) {
            this.checkinRemaining -= 1;
          } else {
            this.checkinRemaining = null;
            this.checkinWaiting = false;
            clearInterval(this.checkinInterval);
            this.window.location.reload(); // should just refresh after the timer goes off
          }
        }, 1000);
      }
      this.checkinWaiting = true;
    } else {
      this.checkinWaiting = false;
      this.checkinRemaining = null;
      if (this.checkinInterval) {
        clearInterval(this.checkinInterval);
      }
    }
  }

  commitPendingChanges(): void {
    this.ws
      .call('interface.services_restarted_on_sync')
      .pipe(untilDestroyed(this))
      .subscribe((services) => {
        if (services.length > 0) {
          const ips: string[] = [];
          services.forEach((item) => {
            // TODO: Check if `system-service` can actually be returned.
            const systemService = (item as unknown as { 'system-service': string })['system-service'];
            if (systemService) {
              this.affectedServices.push(systemService);
            }
            if (item.service) {
              this.affectedServices.push(item.service);
            }
            item.ips.forEach((ip) => {
              ips.push(ip);
            });
          });

          ips.forEach((ip) => {
            if (!this.uniqueIps.includes(ip)) {
              this.uniqueIps.push(ip);
            }
          });
        }
        this.dialogService
          .confirm({
            title: helptext.commit_changes_title,
            message: helptext.commit_changes_warning,
            hideCheckbox: false,
            buttonText: helptext.commit_button,
          })
          .pipe(untilDestroyed(this))
          .subscribe((confirm: boolean) => {
            if (confirm) {
              this.loader.open();
              this.ws
                .call('interface.commit', [{ checkin_timeout: this.checkinTimeout }])
                .pipe(untilDestroyed(this))
                .subscribe({
                  next: async () => {
                    this.core.emit({
                      name: 'NetworkInterfacesChanged',
                      data: { commit: true, checkin: false },
                      sender: this,
                    });
                    this.interfaceTableConf.tableComponent.getData();
                    this.loader.close();
                    this.handleWaitingCheckin(await this.getCheckinWaitingSeconds());
                  },
                  error: (error: WebsocketError) => {
                    this.loader.close();
                    this.dialogService.error(this.errorHandler.parseWsError(error));
                  },
                });
            }
          });
      });
  }

  checkInNow(): void {
    if (this.affectedServices.length > 0) {
      this.dialogService
        .confirm({
          title: helptext.services_restarted.title,
          message: this.translate.instant(helptext.services_restarted.message, {
            uniqueIPs: this.uniqueIps.join(', '),
            affectedServices: this.affectedServices.join(', '),
          }),
          hideCheckbox: true,
          buttonText: helptext.services_restarted.button,
        })
        .pipe(filter(Boolean), untilDestroyed(this))
        .subscribe(() => {
          this.finishCheckin();
        });
    } else {
      this.dialogService
        .confirm({
          title: helptext.checkin_title,
          message: helptext.checkin_message,
          hideCheckbox: true,
          buttonText: helptext.checkin_button,
        })
        .pipe(filter(Boolean), untilDestroyed(this))
        .subscribe(() => {
          this.finishCheckin();
        });
    }
  }

  finishCheckin(): void {
    this.loader.open();
    this.ws
      .call('interface.checkin')
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.core.emit({ name: 'NetworkInterfacesChanged', data: { commit: true, checkin: true }, sender: this });
          this.loader.close();
          this.snackbar.success(
            this.translate.instant(helptext.checkin_complete_message),
          );
          this.hasPendingChanges = false;
          this.checkinWaiting = false;
          clearInterval(this.checkinInterval);
          this.checkinRemaining = null;
        },
        error: (error: WebsocketError) => {
          this.loader.close();
          this.dialogService.error(this.errorHandler.parseWsError(error));
        },
      });
  }

  rollbackPendingChanges(): void {
    this.dialogService
      .confirm({
        title: helptext.rollback_changes_title,
        message: helptext.rollback_changes_warning,
        hideCheckbox: false,
        buttonText: helptext.rollback_button,
      })
      .pipe(untilDestroyed(this))
      .subscribe((confirm: boolean) => {
        if (confirm) {
          this.loader.open();
          this.ws
            .call('interface.rollback')
            .pipe(untilDestroyed(this))
            .subscribe({
              next: () => {
                this.core.emit({ name: 'NetworkInterfacesChanged', data: { commit: false }, sender: this });
                this.interfaceTableConf.tableComponent.getData();
                this.hasPendingChanges = false;
                this.checkinWaiting = false;
                this.loader.close();
                this.snackbar.success(
                  this.translate.instant(helptext.changes_rolled_back),
                );
              },
              error: (error: WebsocketError) => {
                this.loader.close();
                this.dialogService.error(this.errorHandler.parseWsError(error));
              },
            });
        }
      });
  }

  afterDelete(): void {
    this.hasPendingChanges = true;
    this.core.emit({ name: 'NetworkInterfacesChanged', data: { commit: false, checkin: false }, sender: this });
  }

  goToHa(): void {
    this.router.navigate(['/', 'system', 'failover']);
  }

  ngOnDestroy(): void {
    if (this.formEvent$) {
      this.formEvent$.complete();
    }
    this.core.unregister({ observerClass: this });
  }

  getInterfaceInOutInfo(tableSource: NetworkInterfaceUi[]): void {
    this.ws
      .subscribe('reporting.realtime')
      .pipe(
        map((event) => event.fields),
        untilDestroyed(this),
      )
      .subscribe((reportingData) => {
        if (reportingData.interfaces) {
          tableSource.forEach((row) => {
            if (!reportingData.interfaces[row.id]) {
              row.link_state = null;
            } else {
              row.link_state = reportingData.interfaces[row.id].link_state;
              if (reportingData.interfaces[row.id].received_bytes !== undefined) {
                row.received = this.storageService.convertBytesToHumanReadable(
                  reportingData.interfaces[row.id].received_bytes,
                );
                row.received_bytes = reportingData.interfaces[row.id].received_bytes;
              }
              if (reportingData.interfaces[row.id].sent_bytes !== undefined) {
                row.sent = this.storageService.convertBytesToHumanReadable(
                  reportingData.interfaces[row.id].sent_bytes,
                );
                row.sent_bytes = reportingData.interfaces[row.id].sent_bytes;
              }
            }
          });
        }
      });
  }

  interfaceDataSourceHelper(nic: NetworkInterface[]): NetworkInterfaceUi[] {
    return nic.map((networkInterface) => {
      const transformed = { ...networkInterface } as NetworkInterfaceUi;
      transformed.link_state = networkInterface.state.link_state;
      const addresses = new Set([]);
      transformed.aliases.forEach((alias) => {
        // TODO: See if checks can be removed or replace with enum.
        if (alias.type.startsWith('INET')) {
          addresses.add(`${alias.address}/${alias.netmask}`);
        }
      });

      if (transformed.ipv4_dhcp || transformed.ipv6_auto) {
        transformed.state.aliases.forEach((alias) => {
          if (alias.type.startsWith('INET')) {
            addresses.add(`${alias.address}/${alias.netmask}`);
          }
        });
      }
      if (transformed.hasOwnProperty('failover_aliases')) {
        transformed.failover_aliases.forEach((alias) => {
          if (alias.type.startsWith('INET')) {
            addresses.add(`${alias.address}/${alias.netmask}`);
          }
        });
      }
      transformed.addresses = Array.from(addresses);
      if (networkInterface.type === NetworkInterfaceType.Physical) {
        transformed.active_media_type = networkInterface.state.active_media_type;
        transformed.active_media_subtype = networkInterface.state.active_media_subtype;
      } else if (networkInterface.type === NetworkInterfaceType.LinkAggregation) {
        transformed.lagg_ports = networkInterface.lag_ports;
        transformed.lagg_protocol = networkInterface.lag_protocol;
      }
      transformed.mac_address = networkInterface.state.link_address;

      return transformed;
    });
  }

  ipmiDataSourceHelper(ipmi: Ipmi[]): IpmiRow[] {
    return ipmi.map((item) => ({
      ...item,
      channelLabel: this.translate.instant('Channel {n}', { n: item.channel }),
    }));
  }

  getIpmiActions(): AppTableAction[] {
    return [{
      icon: 'launch',
      name: 'manage',
      matTooltip: this.translate.instant('Manage'),
      onClick: (row: IpmiRow) => {
        this.window.open(`https://${row.ipaddress}`);
      },
    }];
  }

  openvpnDataSourceHelper(services: Service[]): (Service & { service_label: string })[] {
    return services
      .filter((item) => item.service.includes('openvpn_'))
      .map((item) => ({
        ...item,
        service_label: item.service.charAt(8).toUpperCase() + item.service.slice(9),
      }));
  }

  getOpenVpnActions(): AppTableAction[] {
    return [{
      icon: 'stop',
      name: 'stop',
      matTooltip: this.translate.instant('Stop'),
      onChanging: false,
      onClick: (row: Service & { onChanging: boolean; service_label: string }) => {
        row.onChanging = true;
        this.ws
          .call('service.stop', [row.service, { silent: false }])
          .pipe(untilDestroyed(this))
          .subscribe({
            next: (wasStopped) => {
              if (wasStopped) {
                this.dialogService.info(
                  this.translate.instant('Service failed to stop'),
                  this.translate.instant('OpenVPN {serviceLabel} service failed to stop.', {
                    serviceLabel: row.service_label,
                  }),
                );
                row.state = ServiceStatus.Running;
                row.onChanging = false;
              } else {
                row.state = ServiceStatus.Stopped;
                row.onChanging = false;
              }
            },
            error: (err) => {
              row.onChanging = false;
              this.dialogService.error({
                ...this.errorHandler.parseWsError(err),
                title: this.translate.instant('Error stopping service OpenVPN {serviceLabel}', {
                  serviceLabel: row.service_label,
                }),
              });
            },
          });
      },
    },
    {
      icon: 'play_arrow',
      name: 'start',
      matTooltip: this.translate.instant('Start'),
      onClick: (row: Service & { onChanging: boolean; service_label: string }) => {
        row.onChanging = true;
        this.ws
          .call('service.start', [row.service, { silent: false }])
          .pipe(untilDestroyed(this))
          .subscribe({
            next: (hasStarted) => {
              if (hasStarted) {
                row.state = ServiceStatus.Running;
                row.onChanging = false;
              } else {
                this.dialogService.warn(
                  this.translate.instant('Service failed to start'),
                  this.translate.instant('OpenVPN {serviceLabel} service failed to start.', {
                    serviceLabel: row.service_label,
                  }),
                );
                row.state = ServiceStatus.Stopped;
                row.onChanging = false;
              }
            },
            error: (err) => {
              row.onChanging = false;
              this.dialogService.error({
                ...this.errorHandler.parseWsError(err),
                title: this.translate.instant('Error starting service OpenVPN {serviceLabel}', {
                  serviceLabel: row.service_label,
                }),
              });
            },
          });
      },
    }];
  }

  isOpenVpnActionVisible(name: string, row: Service): boolean {
    if (
      (name === 'start' && row.state === ServiceStatus.Running)
      || (name === 'stop' && row.state === ServiceStatus.Stopped)
    ) {
      return false;
    }
    return true;
  }

  isIpmiActionVisible(name: string, row: IpmiRow): boolean {
    if (name === 'manage' && row.ipaddress === '0.0.0.0') {
      return false;
    }
    return true;
  }

  private openInterfaceForEditFromRoute(): void {
    const state = this.navigation?.extras?.state as { editInterface: string };
    if (!state?.editInterface) {
      return;
    }

    this.loader.open();
    this.ws.call('interface.query', [[['id', '=', state.editInterface]]])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (interfaces) => {
          this.loader.close();
          if (!interfaces[0]) {
            return;
          }

          const slideIn = this.slideInService.open(InterfaceFormComponent);
          this.handleSlideInClosed(slideIn);
          slideIn.componentInstance.setInterfaceForEdit(interfaces[0]);
        },
        error: (error: WebsocketError) => {
          this.loader.close();
          this.dialogService.error(this.errorHandler.parseWsError(error));
        },
      });
  }
}
