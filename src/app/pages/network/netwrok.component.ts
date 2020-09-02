import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { WebSocketService, NetworkService, DialogService, StorageService } from '../../services';
import { T } from '../../translate-marker';
import helptext from '../../helptext/network/interfaces/interfaces-list';
import { CardWidgetConf } from './card-widget.component';
import { TableConfig } from '../common/entity/entity-table/entity-table.component';
import { ModalService } from '../../services/modal.service';
import { ConfigurationComponent } from './configuration/configuration.component';
import { InterfacesFormComponent } from './interfaces/interfaces-form/interfaces-form.component';

@Component({
  selector: 'app-interfaces-list',
  templateUrl: './network.component.html',
  styleUrls: ['./network.component.css']
})
export class NetworkComponent implements OnInit, OnDestroy {
  protected summayCall = 'network.general.summary';

  protected reportEvent;
  public interfaceTableConf = {
    title: "Interfaces",
    queryCall: 'interface.query',
    columns: [
      { name: T('Name'), prop: 'name', always_display: true },
      { name: T('Link State'), prop: 'link_state', state: { icon: 'fiber_manual_record' } },
      { name: T('IP Addresses'), prop: 'addresses', listview: true },
    ],
    ha_enabled: false,
    dataSourceHelper: this.interfaceDataSourceHelper,
    getActions: this.getInterfaceActions,
    getInOutInfo: this.getInterfaceInOutInfo.bind(this),
    parent: this,
    add: function() {
      this.parent.modalService.open('slide-in-form', this.parent.interfaceComponent);
    },
    edit: function(row) {
      this.parent.modalService.open('slide-in-form', this.parent.interfaceComponent, row.id);
    }
  }

  public staticRoutesTableConf = {
    title: "Static Routes",
    queryCall: 'staticroute.query',
    columns: [
      { name: T('Destination'), prop: 'destination', always_display: true },
      { name: T('Gateway'), prop: 'gateway' },
    ],
    getActions: this.getStaticRoutesActions,
    add: function() {
      console.log('add static routes');
    },
  }

  public nameserverWidget: CardWidgetConf = {
    title: "Nameserver",
    data: {},
    parent: this,
    icon: 'dns',
    onclick: function() {
      console.log('edit nameserver', this.parent.networkSummary.nameservers);
    },
  }

  public defaultRoutesWidget: CardWidgetConf = {
    title: "Default Route",
    data: {},
    parent: this,
    icon: 'router',
    onclick: function() {
      console.log('edit default routes', this.parent.networkSummary.default_routes);
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
    dataSourceHelper: this.openvpnDataSourceHelper,
    getActions: this.getOpenVpnActions,
    isActionVisible: this.isOpenVpnActionVisible,
  }

  public ipmiTableConf = {
    title: "IPMI",
    queryCall: 'ipmi.query',
    columns: [
      { name: T('Channel'), prop: 'channel_lable' },
    ],
    hideHeader: true,
    dataSourceHelper: this.ipmiDataSourceHelper,
    getActions: this.getIpmiActions,
  }


  public networkSummary;

  protected addComponent: ConfigurationComponent;
  protected interfaceComponent: InterfacesFormComponent;


  constructor(
    private ws: WebSocketService,
    private router: Router,
    private aroute: ActivatedRoute,
    private networkService: NetworkService,
    private dialog: DialogService,
    private storageService: StorageService,
    private modalService: ModalService,) {
      this.ws.call(this.summayCall).subscribe(
        (res) => {
          this.networkSummary = res;
          this.nameserverWidget.data.ipv4 = res.nameservers;
          this.defaultRoutesWidget.data.ipv4 = res.default_routes;
        }
      );
  }

  ngOnInit() {
    this.refreshUserForm();
    this.modalService.refreshForm$.subscribe(() => {
      this.refreshUserForm();
    })
  }

  refreshUserForm() {
    this.addComponent = new ConfigurationComponent(this.router,this.ws);
    this.interfaceComponent = new InterfacesFormComponent(this.router, this.aroute, this.networkService, this.dialog, this.ws);
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
          row.sent = this.storageService.convertBytestoHumanReadable(evt.interfaces[row.id].sent_bytes);
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

  getInterfaceActions() {
    return [{
      icon: 'delete',
      name: "delete",
      label: T("Delete"),
      onClick: (rowinner) => {
        console.log('delete interface', rowinner);
        
        // if (this.interfaceTableConf.ha_enabled) {
        //   this.dialog.Info(helptext.ha_enabled_delete_title, helptext.ha_enabled_delete_msg);
        // } else {
        //   // this.entityList.doDelete(rowinner);
        // }
        event.stopPropagation();
      },
    }]
  }

  getStaticRoutesActions() {
    return [{
      icon: 'delete',
      name: "delete",
      label: T("Delete"),
      onClick: (rowinner) => {
        console.log('delete static routes', rowinner);
        // this.entityList.doDelete(rowinner);
        event.stopPropagation();
      },
    }]
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
        console.log('identify ligtht', rowinner);
        event.stopPropagation();
      },
    }, {
      icon: 'launch',
      name: "manage",
      label: T("Manage"),
      onClick: (rowinner) => {
        console.log('manage', rowinner);
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
      onClick: (rowinner) => {
        console.log('Stop', rowinner);
        event.stopPropagation();
      },
    }, {
      icon: 'play_arrow',
      name: "start",
      label: T("Start"),
      onClick: (rowinner) => {
        console.log('start', rowinner);
        event.stopPropagation();
      },
    }];
  }

  isOpenVpnActionVisible(name, row) {
    if ((name === 'start' && row.state === 'START') || (name === 'stop' && row.state === 'STOPPED')) {
      return false;
    }
    return true;
  }
}
