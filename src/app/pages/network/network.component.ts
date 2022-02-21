import { Component, OnDestroy, OnInit } from '@angular/core';
import { Navigation, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LinkState, NetworkInterfaceType } from 'app/enums/network-interface.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import helptext from 'app/helptext/network/interfaces/interfaces-list';
import { CoreEvent } from 'app/interfaces/events';
import { NetworkInterfacesChangedEvent } from 'app/interfaces/events/network-interfaces-changed-event.interface';
import { Ipmi } from 'app/interfaces/ipmi.interface';
import { NetworkInterface } from 'app/interfaces/network-interface.interface';
import { NetworkSummary } from 'app/interfaces/network-summary.interface';
import { ReportingRealtimeUpdate } from 'app/interfaces/reporting.interface';
import { Service } from 'app/interfaces/service.interface';
import { StaticRoute } from 'app/interfaces/static-route.interface';
import { Interval } from 'app/interfaces/timeout.interface';
import { AppTableAction, AppTableConfig, TableComponent } from 'app/modules/entity/table/table.component';
import { TableService } from 'app/modules/entity/table/table.service';
import { IpmiRow } from 'app/pages/network/network-dashboard.interface';
import { NetworkInterfaceUi } from 'app/pages/network/network-interface-ui.interface';
import { StaticRouteFormComponent } from 'app/pages/network/static-route-form/static-route-form.component';
import {
  AppLoaderService,
  DialogService,
  StorageService,
  WebSocketService,
} from 'app/services';
import { CoreService } from 'app/services/core-service/core.service';
import { IpmiService } from 'app/services/ipmi.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { ModalService } from 'app/services/modal.service';
import { EntityUtils } from '../../modules/entity/utils';
import { InterfacesFormComponent } from './forms/interfaces-form.component';
import { IpmiFormComponent } from './forms/ipmi-form.component';
import { OpenvpnClientComponent } from './forms/service-openvpn-client.component';
import { OpenvpnServerComponent } from './forms/service-openvpn-server.component';

@UntilDestroy()
@Component({
  selector: 'app-interfaces-list',
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
      this.showInterfacesForm();
    },
    edit: (row: NetworkInterfaceUi) => {
      this.showInterfacesForm(row.id);
    },
    delete: (row: NetworkInterfaceUi, table: TableComponent) => {
      const deleteAction = row.type === NetworkInterfaceType.Physical ? this.translate.instant('Reset configuration for ') : this.translate.instant('Delete ');
      if (this.isHaEnabled) {
        this.dialog.info(helptext.ha_enabled_edit_title, helptext.ha_enabled_edit_msg);
      } else {
        this.tableService.delete(table, row, deleteAction);
      }
    },
    afterGetData: () => {
      const state = this.navigation.extras.state as { editInterface: string };
      if (state && state.editInterface) {
        this.modalService.openInSlideIn(InterfacesFormComponent, state.editInterface);
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
        this.modalService.openInSlideIn(OpenvpnClientComponent, row.id);
      } else if (row.service === ServiceName.OpenVpnServer) {
        this.modalService.openInSlideIn(OpenvpnServerComponent, row.id);
      }
    },
    afterGetData: () => {
      const state = this.navigation.extras.state as { configureOpenVPN: string };
      if (state && state.configureOpenVPN) {
        if (state.configureOpenVPN === 'client') {
          this.modalService.openInSlideIn(OpenvpnClientComponent);
        } else {
          this.modalService.openInSlideIn(OpenvpnServerComponent);
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
    dataSourceHelper: (ipmi) => this.ipmiDataSourceHelper(ipmi),
    getActions: this.getIpmiActions.bind(this),
    isActionVisible: this.isIpmiActionVisible,
    edit: (row: IpmiRow) => {
      this.modalService.openInSlideIn(IpmiFormComponent, row.id);
    },
  };

  networkSummary: NetworkSummary;
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
    private ipmiService: IpmiService,
    private slideInService: IxSlideInService,
    private core: CoreService,
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
    });

    this.checkInterfacePendingChanges();
    this.core
      .register({ observerClass: this, eventName: 'NetworkInterfacesChanged' })
      .pipe(untilDestroyed(this))
      .subscribe((evt: NetworkInterfacesChangedEvent) => {
        if (evt && evt.data.checkin) {
          this.checkinRemaining = null;
          this.checkinWaiting = false;
          if (this.checkinInterval) {
            clearInterval(this.checkinInterval);
          }
          this.hasPendingChanges = false;
        }
      });

    if (window.localStorage.getItem('product_type') === ProductType.Enterprise) {
      this.ws
        .call('failover.licensed')
        .pipe(untilDestroyed(this))
        .subscribe((isHa) => {
          if (isHa) {
            this.ws
              .call('failover.disabled_reasons')
              .pipe(untilDestroyed(this))
              .subscribe((reasons) => {
                if (reasons.length === 0) {
                  this.isHaEnabled = true;
                }
              });
          }
        });
    }
  }

  checkInterfacePendingChanges(): void {
    if (this.interfaceTableConf.tableComponent) {
      this.interfaceTableConf.tableComponent.getData();
    }
    this.checkPendingChanges();
    this.checkWaitingCheckin();
  }

  checkPendingChanges(): void {
    this.ws
      .call('interface.has_pending_changes')
      .pipe(untilDestroyed(this))
      .subscribe((hasPendingChanges) => {
        this.hasPendingChanges = hasPendingChanges;
      });
  }

  checkWaitingCheckin(): void {
    this.ws
      .call('interface.checkin_waiting')
      .pipe(untilDestroyed(this))
      .subscribe((seconds) => {
        if (seconds != null) {
          if (seconds > 0 && this.checkinRemaining == null) {
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
      });
  }

  commitPendingChanges(): void {
    this.ws
      .call('interface.services_restarted_on_sync')
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res.length > 0) {
          const ips: string[] = [];
          res.forEach((item) => {
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
                .subscribe(
                  () => {
                    this.core.emit({
                      name: 'NetworkInterfacesChanged',
                      data: { commit: true, checkin: false },
                      sender: this,
                    });
                    this.interfaceTableConf.tableComponent.getData();
                    this.loader.close();
                    this.checkWaitingCheckin();
                  },
                  (err) => {
                    this.loader.close();
                    new EntityUtils().handleWsError(this, err, this.dialog);
                  },
                );
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
      .subscribe(
        () => {
          this.core.emit({ name: 'NetworkInterfacesChanged', data: { commit: true, checkin: true }, sender: this });
          this.loader.close();
          this.dialog.info(helptext.checkin_complete_title, helptext.checkin_complete_message, '500px', 'info');
          this.hasPendingChanges = false;
          this.checkinWaiting = false;
          clearInterval(this.checkinInterval);
          this.checkinRemaining = null;
        },
        (err) => {
          this.loader.close();
          new EntityUtils().handleWsError(this, err, this.dialog);
        },
      );
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
            .subscribe(
              () => {
                this.core.emit({ name: 'NetworkInterfacesChanged', data: { commit: false }, sender: this });
                this.interfaceTableConf.tableComponent.getData();
                this.hasPendingChanges = false;
                this.checkinWaiting = false;
                this.loader.close();
                this.dialog.info(helptext.rollback_changes_title, helptext.changes_rolled_back, '500px', 'info', true);
              },
              (err) => {
                this.loader.close();
                new EntityUtils().handleWsError(this, err, this.dialog);
              },
            );
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
              row.received = this.storageService.convertBytestoHumanReadable(evt.interfaces[row.id].received_bytes);
              row.received_bytes = evt.interfaces[row.id].received_bytes;
              row.sent = this.storageService.convertBytestoHumanReadable(evt.interfaces[row.id].sent_bytes);
              row.sent_bytes = evt.interfaces[row.id].sent_bytes;
              row.link_state = evt.interfaces[row.id].speed === null ? LinkState.Down : LinkState.Up;
            }
          });
        }
      });
  }

  interfaceDataSourceHelper(res: NetworkInterface[]): NetworkInterfaceUi[] {
    return res.map((networkInterface) => {
      const transformed = { ...networkInterface } as NetworkInterfaceUi;
      transformed['link_state'] = networkInterface['state']['link_state'];
      const addresses = new Set([]);
      transformed.aliases.forEach((alias) => {
        // TODO: See if checks can be removed or replace with enum.
        if (alias.type.startsWith('INET')) {
          addresses.add(alias.address + '/' + alias.netmask);
        }
      });

      if (transformed['ipv4_dhcp'] || transformed['ipv6_auto']) {
        transformed.state.aliases.forEach((alias) => {
          if (alias.type.startsWith('INET')) {
            addresses.add(alias.address + '/' + alias.netmask);
          }
        });
      }
      if (transformed.hasOwnProperty('failover_aliases')) {
        transformed.failover_aliases.forEach((alias) => {
          if (alias.type.startsWith('INET')) {
            addresses.add(alias.address + '/' + alias.netmask);
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
        this.ipmiService.showIdentifyDialog();
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

  showInterfacesForm(id?: string): void {
    const interfacesForm = this.modalService.openInSlideIn(InterfacesFormComponent, id);
    interfacesForm.afterModalFormClosed = this.checkInterfacePendingChanges.bind(this);
  }

  openvpnDataSourceHelper(res: any[]): any[] {
    return res.filter((item) => {
      if (item.service.includes('openvpn_')) {
        item.service_label = item.service.charAt(8).toUpperCase() + item.service.slice(9);
        return item;
      }

      return undefined;
    });
  }

  getOpenVpnActions(): AppTableAction[] {
    return [{
      icon: 'stop',
      name: 'stop',
      matTooltip: this.translate.instant('Stop'),
      onChanging: false,
      onClick: (row: any) => {
        row.onChanging = true;
        this.ws
          .call('service.stop', [row.service])
          .pipe(untilDestroyed(this))
          .subscribe(
            (res) => {
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
            (err) => {
              row.onChanging = false;
              this.dialog.errorReport(
                this.translate.instant('Error stopping service OpenVPN {serviceLabel}', {
                  serviceLabel: row.service_label,
                }),
                err.message,
                err.stack,
              );
            },
          );
      },
    },
    {
      icon: 'play_arrow',
      name: 'start',
      matTooltip: this.translate.instant('Start'),
      onClick: (row: any) => {
        row.onChanging = true;
        this.ws
          .call('service.start', [row.service])
          .pipe(untilDestroyed(this))
          .subscribe(
            (res) => {
              if (res) {
                row.state = ServiceStatus.Running;
                row.onChanging = false;
              } else {
                this.dialog.info(
                  this.translate.instant('Service failed to start'),
                  this.translate.instant('OpenVPN {serviceLabel} service failed to start.', {
                    serviceLabel: row.service_label,
                  }),
                );
                row.state = ServiceStatus.Stopped;
                row.onChanging = false;
              }
            },
            (err) => {
              row.onChanging = false;
              this.dialog.errorReport(
                this.translate.instant('Error starting service OpenVPN {serviceLabel}', {
                  serviceLabel: row.service_label,
                }),
                err.message,
                err.stack,
              );
            },
          );
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
}
