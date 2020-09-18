import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { WebSocketService, NetworkService, DialogService, StorageService, AppLoaderService, ServicesService } from '../../services';
import { T } from '../../translate-marker';
import helptext from '../../helptext/network/interfaces/interfaces-list';
import { CardWidgetConf } from './card-widget/card-widget.component';
import { TableConfig } from '../common/entity/entity-table/entity-table.component';
import { ModalService } from '../../services/modal.service';
import { ConfigurationComponent } from './forms/configuration.component';
import { InterfacesFormComponent } from './forms/interfaces-form.component';
import { StaticRouteFormComponent } from './forms/staticroute-form.component';
import { NameserverFormComponent } from './forms/nameserver-form.component';
import { DefaultRouteFormComponent } from './forms/default-route-form.component';
import { IPMIFromComponent } from './forms/ipmi-form.component';
import { OpenvpnClientComponent } from './forms/service-openvpn-client.component';
import { OpenvpnServerComponent } from './forms/service-openvpn-server.component';

@Component({
  selector: 'app-interfaces-list',
  templateUrl: './network.component.html',
  styleUrls: ['./network.component.css']
})
export class NetworkComponent implements OnInit, OnDestroy {
  protected summayCall = 'network.general.summary';
  protected configCall = 'network.configuration.config';

  protected reportEvent;
  public interfaceTableConf = {
    title: "Interfaces",
    queryCall: 'interface.query',
    deleteCall: 'interface.delete',
    columns: [
      { name: T('Name'), prop: 'name', state: { prop: 'link_state' }},
      { name: T('IP Addresses'), prop: 'addresses', listview: true },
    ],
    ha_enabled: false,
    dataSourceHelper: this.interfaceDataSourceHelper,
    getInOutInfo: this.getInterfaceInOutInfo.bind(this),
    parent: this,
    add: function() {
      this.parent.modalService.open('slide-in-form', this.parent.interfaceComponent);
    },
    edit: function(row) {
      this.parent.modalService.open('slide-in-form', this.parent.interfaceComponent, row.id);
    },
    deleteMsg: {
      title: 'interfaces',
      key_props: ['name'],
    }
  }

  public staticRoutesTableConf = {
    title: "Static Routes",
    queryCall: 'staticroute.query',
    deleteCall: 'staticroute.delete',
    columns: [
      { name: T('Destination'), prop: 'destination', always_display: true },
      { name: T('Gateway'), prop: 'gateway' },
    ],
    parent: this,
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

  public nameserverWidget: CardWidgetConf = {
    title: "Nameserver",
    data: {},
    parent: this,
    showGroupTitle: false,
    onclick: function() {
      this.parent.modalService.open('slide-in-form', this.parent.nameserverFormComponent);
    },
  }

  public defaultRoutesWidget: CardWidgetConf = {
    title: "Default Route",
    data: {},
    parent: this,
    icon: 'router',
    showGroupTitle: true,
    onclick: function() {
      this.parent.modalService.open('slide-in-form', this.parent.defaultRouteFormComponent);
    }
  }
  
  public openvpnTableConf = {
    title: "OpenVPN",
    queryCall: 'service.query',
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
      console.log(row);
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
  protected nameserverFormComponent: NameserverFormComponent;
  protected defaultRouteFormComponent: DefaultRouteFormComponent;
  protected openvpnClientComponent: OpenvpnClientComponent;
  protected openvpnServerComponent: OpenvpnServerComponent;
  protected impiFormComponent: IPMIFromComponent;

  constructor(
    private ws: WebSocketService,
    private router: Router,
    private aroute: ActivatedRoute,
    private networkService: NetworkService,
    private dialog: DialogService,
    private storageService: StorageService,
    private loader: AppLoaderService,
    private modalService: ModalService,
    private servicesService: ServicesService) {
      this.getNameserverDefaultRouteInfo();
  }

  getNameserverDefaultRouteInfo() {
    this.ws.call(this.configCall).subscribe(
      (config_res) => {
        this.ws.call(this.summayCall).subscribe(
          (res) => {
            this.networkSummary = res;
            this.nameserverWidget.data.nameserver = res.nameservers.map(item => {
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
            this.defaultRoutesWidget.data.ipv4 = res.default_routes;
          }
        );
      }
    );

    this.ws.call('ipmi.is_loaded').subscribe((res)=>{
      this.impiEnabled = res;
    });
  }

  getNetworkSummary() {
    this.ws.call(this.summayCall).subscribe(
      (res) => {
        this.networkSummary = res;
        this.defaultRoutesWidget.data.ipv4 = res.default_routes;
      }
    );
  }
  ngOnInit() {
    this.refreshNetworkForms();
    this.modalService.refreshForm$.subscribe(() => {
      this.refreshNetworkForms();
    })
  }

  refreshNetworkForms() {
    this.addComponent = new ConfigurationComponent(this.router,this.ws);
    this.addComponent.afterModalFormClosed = this.getNameserverDefaultRouteInfo.bind(this); // update nameserver, default route info
    this.interfaceComponent = new InterfacesFormComponent(this.router, this.aroute, this.networkService, this.dialog, this.ws);
    this.staticRouteFormComponent = new StaticRouteFormComponent(this.aroute, this.ws, this.networkService);
    this.nameserverFormComponent = new NameserverFormComponent(this.aroute, this.ws, this.networkService);
    this.nameserverFormComponent.afterModalFormClosed = this.getNameserverDefaultRouteInfo.bind(this); // update nameserver info
    this.defaultRouteFormComponent = new DefaultRouteFormComponent(this.aroute, this.ws, this.networkService);
    this.defaultRouteFormComponent.afterModalFormClosed = this.getNetworkSummary.bind(this); // update default route info
    this.openvpnClientComponent = new OpenvpnClientComponent(this.servicesService);
    this.openvpnServerComponent = new OpenvpnServerComponent(this.servicesService, this.dialog, this.loader, this.ws, this.storageService);
    this.impiFormComponent = new IPMIFromComponent(this.ws, this.dialog, this.loader);
  }

  ngOnDestroy() {
    if (this.reportEvent) {
      this.reportEvent.complete();
    }
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

  networkSetting() {
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
            console.log(res);
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
