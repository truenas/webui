import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { WebSocketService, NetworkService, DialogService, StorageService, 
  AppLoaderService, ServicesService } from '../../services';
import { T } from '../../translate-marker';
import helptext from '../../helptext/network/interfaces/interfaces-list';
import { CardWidgetConf } from './card-widget/card-widget.component';
import { ModalService } from '../../services/modal.service';
import { ConfigurationComponent } from './forms/configuration.component';
import { InterfacesFormComponent } from './forms/interfaces-form.component';
import { StaticRouteFormComponent } from './forms/staticroute-form.component';
import { IPMIFromComponent } from './forms/ipmi-form.component';
import { OpenvpnClientComponent } from './forms/service-openvpn-client.component';
import { OpenvpnServerComponent } from './forms/service-openvpn-server.component';
import { CoreEvent } from 'app/core/services/core.service';
import { ViewControllerComponent } from 'app/core/components/viewcontroller/viewcontroller.component';
import { EntityUtils } from '../../pages/common/entity/utils';
import * as ipRegex from 'ip-regex';

@Component({
  selector: 'app-interfaces-list',
  templateUrl: './network.component.html',
  styleUrls: ['./network.component.css']
})
export class NetworkComponent extends ViewControllerComponent implements OnInit, OnDestroy {
  protected summayCall = 'network.general.summary';
  protected configCall = 'network.configuration.config';

  protected reportEvent;
  public formEvents: Subject<CoreEvent>;

  public ha_enabled = false;
  public hasPendingChanges = false;
  public checkinWaiting = false;
  public checkin_timeout = 60;
  public checkin_timeout_pattern = /\d+/;
  public checkin_remaining = null;
  private uniqueIPs = [];
  private affectedServices = [];
  checkin_interval;

  private navigation: any;
  public helptext = helptext

  public interfaceTableConf = {
    title: T('Interfaces'),
    queryCall: 'interface.query',
    deleteCall: 'interface.delete',
    name: 'interfaces',
    columns: [
      { name: T('Name'), prop: 'name', state: { prop: 'link_state' }},
      { name: T('IP Addresses'), prop: 'addresses', listview: true },
    ],
    dataSourceHelper: this.interfaceDataSourceHelper,
    getInOutInfo: this.getInterfaceInOutInfo.bind(this),
    parent: this,
    tableComponent: undefined,
    add: function() {
      this.parent.modalService.open('slide-in-form', this.parent.interfaceComponent);
    },
    edit: function(row) {
      this.parent.modalService.open('slide-in-form', this.parent.interfaceComponent, row.id);
    },
    delete: function(row, table) {
      const deleteAction = row.type === "PHYSICAL" ? T("Reset configuration for ") : T("Delete ");
      if(this.parent.ha_enabled) {
        this.parent.dialog.Info(helptext.ha_enabled_edit_title, helptext.ha_enabled_edit_msg);
      } else {
        table.tableService.delete(table, row, deleteAction);
      }
    },
    afterGetData: function(res) {
      const state = this.parent.navigation.extras.state as {editInterface: string};
      if(state && state.editInterface) {
        this.parent.modalService.open('slide-in-form', this.parent.interfaceComponent, state.editInterface);
      }
    },
    afterDelete: this.afterDelete.bind(this),
    deleteMsg: {
      title: 'interfaces',
      key_props: ['name'],
    },
    confirmDeleteDialog: {
      buildTitle: intf => {
        if (intf.type === "PHYSICAL"){
          return T("Reset Configuration")
        } else {
          return T("Delete")
        }
      },
      buttonMsg: intf => {
        if (intf.type === "PHYSICAL"){
          return T("Reset Configuration")
        } else {
          return T("Delete")
        }
      },
      message: helptext.delete_dialog_text,
    }
  }

  public staticRoutesTableConf = {
    title: T('Static Routes'),
    queryCall: 'staticroute.query',
    deleteCall: 'staticroute.delete',
    name: 'staticRoutes',
    columns: [
      { name: T('Destination'), prop: 'destination', always_display: true },
      { name: T('Gateway'), prop: 'gateway' },
    ],
    parent: this,
    tableComponent: undefined,
    add: function() {
      this.parent.modalService.open('slide-in-form', this.parent.staticRouteFormComponent);
    },
    edit: function(row) {
      this.parent.modalService.open('slide-in-form', this.parent.staticRouteFormComponent, row.id);
    },
    deleteMsg: {
      title: 'static route',
      key_props: ['destination', 'gateway'],
    }
  }

  public globalSettingsWidget: CardWidgetConf = {
    title: T('Global Configuration'),
    data: {},
    parent: this,
    icon: 'router',
    showGroupTitle: true,
    name: 'globalSettings',
    onclick: function() {
      this.parent.modalService.open('slide-in-form', this.parent.addComponent);
    },
  }
  
  public openvpnTableConf = {
    title: T('OpenVPN'),
    queryCall: 'service.query',
    name: 'openVPN',
    columns: [
      { name: T('Service'), prop: 'service_label' },
      { name: T('State'), prop: 'state' },
    ],
    hideHeader: true,
    parent: this,
    dataSourceHelper: this.openvpnDataSourceHelper,
    getActions: this.getOpenVpnActions.bind(this),
    isActionVisible: this.isOpenVpnActionVisible,
    edit: function(row) {
      if (row.service === 'openvpn_client') {
        this.parent.modalService.open('slide-in-form', this.parent.openvpnClientComponent, row.id);
      } else if (row.service === 'openvpn_server') {
        this.parent.modalService.open('slide-in-form', this.parent.openvpnServerComponent, row.id);
      }
    },
  }

  public ipmiTableConf = {
    title: "IPMI",
    queryCall: 'ipmi.query',
    columns: [
      { name: T('Channel'), prop: 'channel_lable' },
    ],
    hideHeader: true,
    parent: this,
    dataSourceHelper: this.ipmiDataSourceHelper,
    getActions: this.getIpmiActions.bind(this),
    isActionVisible: this.isIpmiActionVisible,
    edit: function(row) {
      this.parent.modalService.open('slide-in-form', this.parent.impiFormComponent, row.id);
    },
  }


  public networkSummary;
  public impiEnabled: boolean;

  protected addComponent: ConfigurationComponent;
  protected interfaceComponent: InterfacesFormComponent;
  protected staticRouteFormComponent: StaticRouteFormComponent;
  protected openvpnClientComponent: OpenvpnClientComponent;
  protected openvpnServerComponent: OpenvpnServerComponent;
  protected impiFormComponent: IPMIFromComponent;

  public hasConsoleFooter: false;
  constructor(
    private ws: WebSocketService,
    private router: Router,
    private aroute: ActivatedRoute,
    private networkService: NetworkService,
    private dialog: DialogService,
    private storageService: StorageService,
    private loader: AppLoaderService,
    private modalService: ModalService,
    private servicesService: ServicesService,
    private translate: TranslateService) {
      super();
      this.getGlobalSettings();
      this.navigation = this.router.getCurrentNavigation();
  }

  getGlobalSettings() {
    this.ws.call(this.configCall).subscribe(
      (config_res) => {
        this.ws.call(this.summayCall).subscribe(
          (res) => {
            this.networkSummary = res;
            this.globalSettingsWidget.data.nameserver = res.nameservers.map(item => {
              switch(item) {
                case config_res.nameserver1:
                  return {label: 'Nameserver 1', value: item};
                case config_res.nameserver2:
                  return {label: 'Nameserver 2', value: item};
                case config_res.nameserver3:
                  return {label: 'Nameserver 3', value: item};
                default:
                  return {label: 'Nameserver (DHCP)', value: item};
              }
            });
            this.globalSettingsWidget.data.ipv4 = res.default_routes.filter(item => ipRegex.v4().test(item));
            this.globalSettingsWidget.data.ipv6 = res.default_routes.filter(item => ipRegex.v6().test(item));

            this.globalSettingsWidget.data.hostname = config_res.hostname;
            this.globalSettingsWidget.data.domain = config_res.domain;
            this.globalSettingsWidget.data.netwait = config_res.netwait_enabled ? T('ENABLED') : T('DISABLED');
            let tempArr = [];
            if (config_res.service_announcement.netbios) {
              tempArr.push(T('NETBIOS-NS'));
            }
            if (config_res.service_announcement.mdns) {
              tempArr.push(T('mDNS'));
            }
            if (config_res.service_announcement.wsd) {
              tempArr.push(T('WS-DISCOVERY'))
            }
            this.globalSettingsWidget.data.service_announcement = tempArr.join(', ');
            this.globalSettingsWidget.data.additional_domains = config_res.domains.length > 0 ?
              config_res.domains.join(', ') : '---';
            this.globalSettingsWidget.data.httpproxy = config_res.httpproxy !== '' ? config_res.httpproxy : '---';
            this.globalSettingsWidget.data.hostnameDB = config_res.hosts !== '' ? config_res.hosts : '---';

            if(config_res.activity.type === 'DENY') {
              this.globalSettingsWidget.data.outbound =  T('Allow All');
            } else if (config_res.activity.activities.length === 0) {
              this.globalSettingsWidget.data.outbound =  T('Deny All');
            } else {
              this.globalSettingsWidget.data.outbound = T('Allow ') + config_res.activity.activities.join(', ');
            }
          }
        );
      }
    );

    this.ws.call('ipmi.is_loaded').subscribe((res)=>{
      this.impiEnabled = res;
    });
  }

  ngOnInit() {
    this.refreshNetworkForms();
    this.modalService.refreshForm$.subscribe(() => {
      this.refreshNetworkForms();
    });

    this.ws.call('system.advanced.config').subscribe(res => {
      this.hasConsoleFooter = res.consolemsg;
    });

    this.checkInterfacePendingChanges();
    this.core.register({observerClass: this, eventName:"NetworkInterfacesChanged"}).subscribe((evt:CoreEvent) => {
      if (evt && evt.data.checkin) {
        this.checkin_remaining = null;
        this.checkinWaiting = false;
        if (this.checkin_interval) {
          clearInterval(this.checkin_interval);
        }
        this.hasPendingChanges = false;
      }
    });

    if (window.localStorage.getItem('product_type') === 'ENTERPRISE') {
      this.ws.call('failover.licensed').subscribe((is_ha) => {
        if (is_ha) {
          this.ws.call('failover.disabled_reasons').subscribe((failover_disabled) => {
            if (failover_disabled.length === 0) {
              this.ha_enabled = true;
            }
          });
        }
      });
    }
  }

  checkInterfacePendingChanges() {
    if (this.interfaceTableConf.tableComponent) {
      this.interfaceTableConf.tableComponent.getData();
    }
    this.checkPendingChanges();
    this.checkWaitingCheckin();
  }

  checkPendingChanges() {
    this.ws.call('interface.has_pending_changes').subscribe(res => {
      this.hasPendingChanges = res;
    });
  }

  checkWaitingCheckin() {
    this.ws.call('interface.checkin_waiting').subscribe(res => {
      if (res != null) {
        const seconds = res.toFixed(0);
        if (seconds > 0 && this.checkin_remaining == null) {
          this.checkin_remaining = seconds;
          this.checkin_interval = setInterval(() => {
            if (this.checkin_remaining > 0) {
              this.checkin_remaining -= 1;
            } else {
              this.checkin_remaining = null;
              this.checkinWaiting = false;
              clearInterval(this.checkin_interval);
              window.location.reload(); // should just refresh after the timer goes off
            }
          }, 1000);
        }
        this.checkinWaiting = true;
      } else {
        this.checkinWaiting = false;
        this.checkin_remaining = null;
        if (this.checkin_interval) {
          clearInterval(this.checkin_interval);
        }
      }
    });
  }

  commitPendingChanges() {
    this.ws.call('interface.services_restarted_on_sync').subscribe(res => {
      if (res.length > 0) {
        let ips = [];
        res.forEach(item => {
          if (item['system-service']) {
            this.affectedServices.push(item['system-service']);

          }
          if (item['service']) {
            this.affectedServices.push(item['service']);
          }
          item.ips.forEach(ip => {
            ips.push(ip);
          })
        })

        ips.forEach(ip => {
          if (!this.uniqueIPs.includes(ip)) {
            this.uniqueIPs.push(ip);
          }
        })
      }
      this.dialog.confirm(
        helptext.commit_changes_title,
        helptext.commit_changes_warning,
        false, helptext.commit_button).subscribe(confirm => {
          if (confirm) {
            this.loader.open();
            this.ws.call('interface.commit', [{checkin_timeout: this.checkin_timeout}]).subscribe(res => {
              this.core.emit({name: "NetworkInterfacesChanged", data: {commit:true, checkin:false}, sender:this});
              this.interfaceTableConf.tableComponent.getData();
              this.loader.close();
              // can't decide if this is worth keeping since the checkin happens intantaneously
              //this.dialog.Info(helptext.commit_changes_title, helptext.changes_saved_successfully, '300px', "info", true);
              this.checkWaitingCheckin();
            }, err => {
              this.loader.close();
              new EntityUtils().handleWSError(this, err, this.dialog);
            });
          }
        });
    })

  }

  checkInNow() {
    if (this.affectedServices.length > 0) {
      this.translate.get(helptext.services_restarted.message_a).subscribe(msgA => {
        this.translate.get(helptext.services_restarted.message_b).subscribe(msgB => {
          this.dialog.confirm(helptext.services_restarted.title, msgA + ' ' + 
          this.uniqueIPs.join(', ') +  ' ' + msgB + ' ' + this.affectedServices.join(', '), 
          true, helptext.services_restarted.button).subscribe(res => {
       if (res) {
         this.finishCheckin();
       }
        })
      })
   })
    } else {
      this.dialog.confirm(
        helptext.checkin_title,
        helptext.checkin_message,
        true, helptext.checkin_button).subscribe(res => {
          if (res) {
            this.finishCheckin();
          }
        })
    }
  }

  finishCheckin() {
    this.loader.open();
    this.ws.call('interface.checkin').subscribe((success) => {
      this.core.emit({name: "NetworkInterfacesChanged", data: {commit:true, checkin:true}, sender:this});
      this.loader.close();
      this.dialog.Info(
        helptext.checkin_complete_title,
        helptext.checkin_complete_message);
      this.hasPendingChanges = false;
      this.checkinWaiting = false;
      clearInterval(this.checkin_interval);
      this.checkin_remaining = null;
    }, (err) => {
      this.loader.close();
      new EntityUtils().handleWSError(this, err, this.dialog);
    });
  }

  rollbackPendingChanges() {
    this.dialog.confirm(
      helptext.rollback_changes_title,
      helptext.rollback_changes_warning,
      false, helptext.rollback_button).subscribe(confirm => {
        if (confirm) {
          this.loader.open();
          this.ws.call('interface.rollback').subscribe(res => {
            this.core.emit({name: "NetworkInterfacesChanged", data: {commit:false}, sender:this});
            this.interfaceTableConf.tableComponent.getData();
            this.hasPendingChanges = false;
            this.checkinWaiting = false;
            this.loader.close();
            this.dialog.Info(helptext.rollback_changes_title, helptext.changes_rolled_back, '500px', "info", true);
          }, err => {
            this.loader.close();
            new EntityUtils().handleWSError(this, err, this.dialog);
          });
        }
      });
  }

  afterDelete() {
    this.hasPendingChanges = true;
    this.core.emit({name: "NetworkInterfacesChanged", data: {commit:false, checkin: false}, sender:this});
  }

  goToHA() {
    this.router.navigate(new Array('/').concat('system', 'failover'));
  }

  refreshNetworkForms() {
    this.addComponent = new ConfigurationComponent(this.router,this.ws);
    this.addComponent.afterModalFormClosed = this.getGlobalSettings.bind(this); // update global config card
    this.interfaceComponent = new InterfacesFormComponent(this.router, this.aroute, this.networkService, this.dialog, this.ws);
    this.interfaceComponent.afterModalFormClosed = this.checkInterfacePendingChanges.bind(this);
    this.staticRouteFormComponent = new StaticRouteFormComponent(this.aroute, this.ws, this.networkService);
    if (this.staticRoutesTableConf.tableComponent) {
      this.staticRouteFormComponent.afterModalFormClosed = this.staticRoutesTableConf.tableComponent.getData();
    }
    this.openvpnClientComponent = new OpenvpnClientComponent(this.servicesService);
    this.openvpnServerComponent = new OpenvpnServerComponent(this.servicesService, this.dialog, this.loader, this.ws, this.storageService);
    this.impiFormComponent = new IPMIFromComponent(this.ws, this.dialog, this.loader);
  }

  ngOnDestroy() {
    if (this.reportEvent) {
      this.reportEvent.complete();
    }

    if (this.formEvents) {
      this.formEvents.complete();
    }
    this.core.unregister({observerClass:this});
  }

  getInterfaceInOutInfo(tableSource) {
    this.reportEvent = this.ws.sub("reporting.realtime").subscribe((evt)=>{
      if(evt.interfaces){
        tableSource.map(row => {
          row.received = this.storageService.convertBytestoHumanReadable(evt.interfaces[row.id].received_bytes);
          row.received_bytes = evt.interfaces[row.id].received_bytes;
          row.sent = this.storageService.convertBytestoHumanReadable(evt.interfaces[row.id].sent_bytes);
          row.sent_bytes = evt.interfaces[row.id].sent_bytes;
          return row;
        });
      }
    });
  }

  interfaceDataSourceHelper(res) {
    const rows = res;
    for (let i = 0; i < rows.length; i++) {
      rows[i]['link_state'] = rows[i]['state']['link_state'].replace('LINK_STATE_', '');
      const addresses = new Set([]);
      for (let j = 0; j < rows[i]['aliases'].length; j++) {
        const alias = rows[i]['aliases'][j];
        if (alias.type.startsWith('INET')) {
          addresses.add(alias.address + '/' + alias.netmask);
        }
      }

      if (rows[i]['ipv4_dhcp'] || rows[i]['ipv6_auto']) {
        for (let j = 0; j < rows[i]['state']['aliases'].length; j++) {
          const alias = rows[i]['state']['aliases'][j];
          if (alias.type.startsWith('INET')) {
            addresses.add(alias.address + '/' + alias.netmask);
          }
        }
      }
      if (rows[i].hasOwnProperty('failover_aliases')) {
        for (let j = 0; j < rows[i]['failover_aliases'].length; j++) {
          const alias = rows[i]['failover_aliases'][j];
          if (alias.type.startsWith('INET')) {
            addresses.add(alias.address + '/' + alias.netmask);
          }
        }
      }
      rows[i]['addresses'] = Array.from(addresses);
      if (rows[i].type === "PHYSICAL") {
        rows[i].active_media_type = rows[i]["state"]["active_media_type"];
        rows[i].active_media_subtype = rows[i]["state"]["active_media_subtype"];
      } else if (rows[i].type === "VLAN") {
        rows[i].vlan_tag = rows[i]["vlan_tag"];
        rows[i].vlan_parent_interface = rows[i]["vlan_parent_interface"];
      } else if (rows[i].type === "BRIDGE") {
        rows[i].bridge_members = rows[i]["bridge_members"];
      } else if (rows[i].type === "LINK_AGGREGATION") {
        rows[i].lagg_ports = rows[i]["lag_ports"];
        rows[i].lagg_protocol = rows[i]["lag_protocol"];
      }
      rows[i].mac_address = rows[i]['state']['link_address'];
    }
    return res;
  }

  ipmiDataSourceHelper(res) {
    for (const item of res) {
      item.channel_lable = 'Channel' + item.channel;
    }
    return res;
  }

  getIpmiActions() {
    return [{
      icon: 'highlight',
      name: "identify",
      label: T("Identify Light"),
      onClick: (rowinner) => {
        this.dialog.select(
          'IPMI Identify',this.impiFormComponent.options,'IPMI flash duration','ipmi.identify','seconds', "IPMI identify command issued");
        event.stopPropagation();
      },
    }, {
      icon: 'launch',
      name: "manage",
      label: T("Manage"),
      onClick: (rowinner) => {
        window.open(`http://${rowinner.ipaddress}`);
        event.stopPropagation();
      },
    }]
  }

  showConfigForm() {
    this.modalService.open('slide-in-form', this.addComponent);
  }

  openvpnDataSourceHelper(res) {
    return res.filter(item => {
      if (item.service.includes('openvpn_')) {
        item.service_label = item.service.charAt(8).toUpperCase() + item.service.slice(9);
        return item;
      }
    });
  }

  getOpenVpnActions() {
    return [{
      icon: 'stop',
      name: "stop",
      label: T("Stop"),
      onChanging: false,
      onClick: (rowinner) => {
        rowinner['onChanging'] = true;
        this.ws.call('service.stop', [rowinner.service]).subscribe(
          (res) => {
            if (res) {
              this.dialog.Info(T("Service failed to stop"), T("OpenVPN ") + rowinner.service_label + " " +  T("service failed to stop."));
              rowinner.state = 'RUNNING';
              rowinner['onChanging'] = false;
            } else {
              rowinner.state = 'STOPPED';
              rowinner['onChanging'] = false;
            }
          },
          (err) => {
            rowinner['onChanging'] = false;
            this.dialog.errorReport(T("Error stopping service OpenVPN ") + rowinner.service_label , err.message, err.stack);
          }
        )
        event.stopPropagation();
      },
    }, {
      icon: 'play_arrow',
      name: "start",
      label: T("Start"),
      onClick: (rowinner) => {
        rowinner['onChanging'] = true;
        this.ws.call('service.start', [rowinner.service]).subscribe(
          (res) => {
            if (res) {
              rowinner.state = 'RUNNING';
              rowinner['onChanging'] = false;
            } else {
              this.dialog.Info(T("Service failed to start"), T("OpenVPN ") + rowinner.service_label + " " +  T("service failed to start."));
              rowinner.state = 'STOPPED';
              rowinner['onChanging'] = false;
            }
          },
          (err) => {
            rowinner['onChanging'] = false;
            this.dialog.errorReport(T("Error starting service OpenVPN ") + rowinner.service_label , err.message, err.stack);
          }
        )
        event.stopPropagation();
      },
    }];
  }

  isOpenVpnActionVisible(name, row) {
    if ((name === 'start' && row.state === 'RUNNING') || (name === 'stop' && row.state === 'STOPPED')) {
      return false;
    }
    return true;
  }

  isIpmiActionVisible(name, row) {
    if (name === 'manage' && row.ipaddress === '0.0.0.0') {
      return false;
    }
    return true;
  }
}
