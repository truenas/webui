import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { WebSocketService, NetworkService, DialogService } from '../../services';
import { T } from '../../translate-marker';
import helptext from '../../helptext/network/interfaces/interfaces-list';
import { CardWidgetConf } from './card-widget.component';
import { TableConfig } from '../common/entity/entity-table/entity-table.component';

@Component({
  selector: 'app-interfaces-list',
  templateUrl: './network.component.html',
  styleUrls: ['./network.component.css']
})
export class NetworkComponent {

  protected summayCall = 'network.general.summary';
  public interfaceTableConf = {
    title: "Interfaces",
    queryCall: 'interface.query',
    columns: [
      { name: T('Name'), prop: 'name', always_display: true },
      { name: T('Link State'), prop: 'link_state', state: { icon: 'fiber_manual_record' } },
      { name: T('IP Addresses'), prop: 'addresses', listview: true },
    ],
    ha_enabled: false,
    dataSourceHelper: this.dataSourceHelper,
    getActions: this.getInterfaceActions,
  }

  public staticRoutesTableConf = {
    title: "Static Routes",
    queryCall: 'staticroute.query',
    columns: [
      { name: T('Destination'), prop: 'destination', always_display: true },
      { name: T('Gateway'), prop: 'gateway' },
    ],
    getActions: this.getStaticRoutesActions,
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
  
  public networkSummary;

  constructor(
    private ws: WebSocketService,
    private router: Router,
    private networkService: NetworkService,
    private dialog: DialogService) {
      this.ws.call(this.summayCall).subscribe(
        (res) => {
          this.networkSummary = res;
          this.nameserverWidget.data.ipv4 = res.nameservers;
          this.defaultRoutesWidget.data.ipv4 = res.default_routes;
        }
      )
  }

  dataSourceHelper(res) {
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

  }

  getInterfaceActions(row) {
    return [{
      id: row.name,
      icon: 'delete',
      name: "delete",
      label: T("Delete"),
      onClick: (rowinner) => {
        if (this.interfaceTableConf.ha_enabled) {
          this.dialog.Info(helptext.ha_enabled_delete_title, helptext.ha_enabled_delete_msg);
        } else {
          // this.entityList.doDelete(rowinner);
        }
      },
    }]
  }

  getStaticRoutesActions(row) {
    return [{
      id: row.name,
      icon: 'delete',
      name: "delete",
      label: T("Delete"),
      onClick: (rowinner) => {
        // this.entityList.doDelete(rowinner);
      },
    }]
  }

  


}
