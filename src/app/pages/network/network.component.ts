import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Navigation, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { lastValueFrom, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { NetworkInterfaceType } from 'app/enums/network-interface.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import helptext from 'app/helptext/network/interfaces/interfaces-list';
import { CoreEvent } from 'app/interfaces/events';
import { NetworkInterfacesChangedEvent } from 'app/interfaces/events/network-interfaces-changed-event.interface';
import { Ipmi } from 'app/interfaces/ipmi.interface';
import { NetworkInterface } from 'app/interfaces/network-interface.interface';
import { ReportingRealtimeUpdate } from 'app/interfaces/reporting.interface';
import { Service } from 'app/interfaces/service.interface';
import { StaticRoute } from 'app/interfaces/static-route.interface';
import { Interval } from 'app/interfaces/timeout.interface';
import { AppTableAction, AppTableConfig, TableComponent } from 'app/modules/entity/table/table.component';
import { TableService } from 'app/modules/entity/table/table.service';
import { EntityUtils } from 'app/modules/entity/utils';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { InterfaceFormComponent } from 'app/pages/network/components/interface-form/interface-form.component';
import {
  IpmiIdentifyDialogComponent,
} from 'app/pages/network/components/ipmi-identify-dialog/ipmi-identify-dialog.component';
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
  WebSocketService,
} from 'app/services';
import { CoreService } from 'app/services/core-service/core.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { ModalService } from 'app/services/modal.service';
import { IpmiFormComponent } from './components/forms/ipmi-form.component';

@UntilDestroy()
@Component({
  selector: 'ix-interfaces-list',
  templateUrl: './network.component.html',
  styleUrls: ['./network.component.scss'],
})
export class NetworkComponent implements OnInit, OnDestroy {
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
      this.slideInService.open(InterfaceFormComponent);
    },
    edit: (row: NetworkInterfaceUi) => {
      const interfacesForm = this.slideInService.open(InterfaceFormComponent);
      interfacesForm.setInterfaceForEdit(row);
    },
    delete: (row: NetworkInterfaceUi, table: TableComponent) => {
      const deleteAction = row.type === NetworkInterfaceType.Physical ? this.translate.instant('Reset configuration for ') : this.translate.instant('Delete ');
      if (this.isHaEnabled) {
        this.dialog.warn(helptext.ha_enabled_edit_title, helptext.ha_enabled_edit_msg);
      } else {
        this.tableService.delete(table, row, deleteAction);
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
      buttonMsg: (intf: NetworkInterfaceUi): string => {
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
      this.slideInService.open(StaticRouteFormComponent);
    },
    edit: (route: StaticRoute) => {
      const modal = this.slideInService.open(StaticRouteFormComponent);
      modal.setEditingStaticRoute(route);
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
        this.slideInService.open(OpenVpnClientConfigComponent, { wide: true });
      } else if (row.service === ServiceName.OpenVpnServer) {
        this.slideInService.open(OpenVpnServerConfigComponent, { wide: true });
      }
    },
    afterGetData: () => {
      const state = this.navigation.extras.state as { configureOpenVPN: string };
      if (state && state.configureOpenVPN) {
        if (state.configureOpenVPN === 'client') {
          this.slideInService.open(OpenVpnClientConfigComponent, { wide: true });
        } else {
          this.slideInService.open(OpenVpnServerConfigComponent, { wide: true });
        }
      }
    },
  };

  ipmiTableConf: AppTableConfig<NetworkComponent> = {
    title: this.translate.instant('IPMI'),
    queryCall: 'ipmi.query',
    columns: [{ name: this.translate.instant('Channel'), prop: 'channelLabel' }],
    hideHeader: true,
    parent: this,
    dataSourceHelper: (ipmi: Ipmi[]) => this.ipmiDataSourceHelper(ipmi),
    getActions: this.getIpmiActions.bind(this),
    isActionVisible: this.isIpmiActionVisible,
    edit: (row: IpmiRow) => {
      const ipmiEditForm = this.slideInService.open(IpmiFormComponent);
      ipmiEditForm.setIdIpmi(row.id);
    },
  };

  ipmiEnabled: boolean;

  hasConsoleFooter = false;
  constructor(
    private ws: WebSocketService,
    private router: Router,
    private dialog: DialogService,
    private storageService: StorageService,
    private loader: AppLoaderService,
    private modalService: ModalService,
    private translate: TranslateService,
    private tableService: TableService,
    private matDialog: MatDialog,
    private slideInService: IxSlideInService,
    private core: CoreService,
    private snackbar: SnackbarService,
    private systemGeneralService: SystemGeneralService,
  ) {
    this.navigation = this.router.getCurrentNavigation();
  }

  ngOnInit(): void {
    this.ws
      .call('system.advanced.config')
      .pipe(untilDestroyed(this))
      .subscribe((advancedConfig) => {
        this.hasConsoleFooter = advancedConfig.consolemsg;
      });

    this.slideInService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      this.staticRoutesTableConf.tableComponent.getData();
      this.getInterfaces();
      this.checkInterfacePendingChanges();
    });

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
      this.ws
        .call('failover.licensed')
        .pipe(untilDestroyed(this))
        .subscribe((isHa) => {
          if (isHa) {
            this.ws
              .call('failover.disabled.reasons')
              .pipe(untilDestroyed(this))
              .subscribe((reasons) => {
                if (reasons.length === 0) {
                  this.isHaEnabled = true;
                }
              });
          }
        });
    }

    this.openInterfaceForEditFromRoute();

    this.ws.call('ipmi.is_loaded').pipe(untilDestroyed(this)).subscribe((isIpmiLoaded) => {
      this.ipmiEnabled = isIpmiLoaded;
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
            window.location.reload(); // should just refresh after the timer goes off
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
            if ((item as any)['system-service']) {
              this.affectedServices.push((item as any)['system-service']);
            }
            if (item['service']) {
              this.affectedServices.push(item['service']);
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
        this.dialog
          .confirm({
            title: helptext.commit_changes_title,
            message: helptext.commit_changes_warning,
            hideCheckBox: false,
            buttonMsg: helptext.commit_button,
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
                  error: (err) => {
                    this.loader.close();
                    new EntityUtils().handleWsError(this, err, this.dialog);
                  },
                });
            }
          });
      });
  }

  checkInNow(): void {
    if (this.affectedServices.length > 0) {
      this.dialog
        .confirm({
          title: helptext.services_restarted.title,
          message: this.translate.instant(helptext.services_restarted.message, {
            uniqueIPs: this.uniqueIps.join(', '),
            affectedServices: this.affectedServices.join(', '),
          }),
          hideCheckBox: true,
          buttonMsg: helptext.services_restarted.button,
        })
        .pipe(filter(Boolean), untilDestroyed(this))
        .subscribe(() => {
          this.finishCheckin();
        });
    } else {
      this.dialog
        .confirm({
          title: helptext.checkin_title,
          message: helptext.checkin_message,
          hideCheckBox: true,
          buttonMsg: helptext.checkin_button,
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
        error: (err) => {
          this.loader.close();
          new EntityUtils().handleWsError(this, err, this.dialog);
        },
      });
  }

  rollbackPendingChanges(): void {
    this.dialog
      .confirm({
        title: helptext.rollback_changes_title,
        message: helptext.rollback_changes_warning,
        hideCheckBox: false,
        buttonMsg: helptext.rollback_button,
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
              error: (err) => {
                this.loader.close();
                new EntityUtils().handleWsError(this, err, this.dialog);
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
      .sub<ReportingRealtimeUpdate>('reporting.realtime')
      .pipe(untilDestroyed(this))
      .subscribe((evt) => {
        if (evt.interfaces) {
          tableSource.forEach((row) => {
            if (!evt.interfaces[row.id]) {
              row.link_state = null;
            } else {
              row.link_state = evt.interfaces[row.id].link_state;
              if (evt.interfaces[row.id].received_bytes !== undefined) {
                row.received = this.storageService.convertBytesToHumanReadable(evt.interfaces[row.id].received_bytes);
                row.received_bytes = evt.interfaces[row.id].received_bytes;
              }
              if (evt.interfaces[row.id].sent_bytes !== undefined) {
                row.sent = this.storageService.convertBytesToHumanReadable(evt.interfaces[row.id].sent_bytes);
                row.sent_bytes = evt.interfaces[row.id].sent_bytes;
              }
            }
          });
        }
      });
  }

  interfaceDataSourceHelper(nic: NetworkInterface[]): NetworkInterfaceUi[] {
    return nic.map((networkInterface) => {
      const transformed = { ...networkInterface } as NetworkInterfaceUi;
      transformed['link_state'] = networkInterface['state']['link_state'];
      const addresses = new Set([]);
      transformed.aliases.forEach((alias) => {
        // TODO: See if checks can be removed or replace with enum.
        if (alias.type.startsWith('INET')) {
          addresses.add(`${alias.address}/${alias.netmask}`);
        }
      });

      if (transformed['ipv4_dhcp'] || transformed['ipv6_auto']) {
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
      transformed['addresses'] = Array.from(addresses);
      if (networkInterface.type === NetworkInterfaceType.Physical) {
        transformed.active_media_type = networkInterface['state']['active_media_type'];
        transformed.active_media_subtype = networkInterface['state']['active_media_subtype'];
      } else if (networkInterface.type === NetworkInterfaceType.LinkAggregation) {
        transformed.lagg_ports = networkInterface['lag_ports'];
        transformed.lagg_protocol = networkInterface['lag_protocol'];
      }
      transformed.mac_address = networkInterface['state']['link_address'];

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
      icon: 'highlight',
      name: 'identify',
      matTooltip: this.translate.instant('Identify Light'),
      onClick: () => {
        this.matDialog.open(IpmiIdentifyDialogComponent);
      },
    }, {
      icon: 'launch',
      name: 'manage',
      matTooltip: this.translate.instant('Manage'),
      onClick: (row: IpmiRow) => {
        window.open(`http://${row.ipaddress}`);
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
            next: (res) => {
              if (res) {
                this.dialog.info(
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
              this.dialog.errorReport(
                this.translate.instant('Error stopping service OpenVPN {serviceLabel}', {
                  serviceLabel: row.service_label,
                }),
                err.reason,
                err.trace.formatted,
              );
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
            next: (res) => {
              if (res) {
                row.state = ServiceStatus.Running;
                row.onChanging = false;
              } else {
                this.dialog.warn(
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
              this.dialog.errorReport(
                this.translate.instant('Error starting service OpenVPN {serviceLabel}', {
                  serviceLabel: row.service_label,
                }),
                err.reason,
                err.trace.formatted,
              );
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
    const state = this.navigation.extras.state as { editInterface: string };
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

          const form = this.slideInService.open(InterfaceFormComponent);
          form.setInterfaceForEdit(interfaces[0]);
        },
        error: (error) => {
          this.loader.close();
          new EntityUtils().handleWsError(this, error);
        },
      });
  }
}
