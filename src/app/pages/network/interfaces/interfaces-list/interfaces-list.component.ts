import {Component, OnDestroy} from '@angular/core';
import {Router} from '@angular/router';
import {interval} from 'rxjs';

import { WebSocketService, NetworkService, DialogService } from '../../../../services';
import { T } from '../../../../translate-marker';
import helptext from '../../../../helptext/network/interfaces/interfaces-list';
import { EntityUtils } from '../../../common/entity/utils';
import { CoreEvent } from 'app/core/services/core.service';
import { ViewControllerComponent } from 'app/core/components/viewcontroller/viewcontroller.component';

@Component({
  selector : 'app-interfaces-list',
  templateUrl : './interfaces-list.component.html',
  styleUrls : [ './interfaces-list.component.css' ],
})
export class InterfacesListComponent extends ViewControllerComponent implements OnDestroy {

  public title = "Interfaces";
  //protected resource_name: string = 'network/interface/';
  protected queryCall = 'interface.query';
  protected wsDelete = 'interface.delete';
  protected route_add: string[] = [ 'network', 'interfaces', 'add' ];
  protected route_add_tooltip: string = "Add Interface";
  protected route_edit: string[] = [ 'network', 'interfaces', 'edit' ];
  protected confirmDeleteDialog = {
    message: helptext.delete_dialog_text,
  }
  protected hasDetails = true;
  protected entityList: any;
  public hasPendingChanges = false;
  public checkinWaiting = false;
  public checkin_timeout = 60;
  public checkin_timeout_pattern = /\d+/;
  public checkin_remaining = null;
  checkin_interval;
  public ha_enabled = false;
  public helptext = helptext

  public columns: Array<any> = [
    {name : T('Name'), prop : 'name', always_display: true },
    {name : T('Type'), prop : 'type' },
    {name : T('Link State'), prop : 'link_state'},
    {name : T('DHCP'), prop : 'ipv4_dhcp'},
    {name : T('IPv6 Auto Configure'), prop: 'ipv6_auto'},
    {name : T('IP Addresses'), prop : 'addresses'},,
    {name : T('Description'), prop : 'description', hidden: true},
    {name : T('Active Media Type'), prop: 'active_media_type', hidden: true},
    {name : T('Active Media Subtype'), prop: 'active_media_subtype', hidden: true},
    {name : T('VLAN Tag'), prop: 'vlan_tag', hidden: true},
    {name : T('VLAN Parent Interface'), prop: 'vlan_parent_interface', hidden: true},
    {name : T('Bridge Members'), prop: 'bridge_members', hidden: true},
    {name : T('LAGG Ports'), prop: 'lagg_ports', hidden: true},
    {name : T('LAGG Protocol'), prop: 'lagg_protocol', hidden: true},
    {name : T('MAC Address'), prop: 'mac_address', hidden: true}
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
    deleteMsg: {
      title: 'Interface',
      key_props: ['name']
    },
  };

  constructor(private ws: WebSocketService, private router: Router, private networkService: NetworkService,
              private dialog: DialogService) {
                super();
              }

  dataHandler(res) {
    const rows = res.rows;
    for (let i=0; i<rows.length; i++) {
      rows[i]['link_state'] = rows[i]['state']['link_state'].replace('LINK_STATE_', '');
      const addresses = new Set([]);
      for (let j=0; j<rows[i]['aliases'].length; j++) {
        const alias = rows[i]['aliases'][j];
        if (alias.type.startsWith('INET')) {
          addresses.add(alias.address + '/' + alias.netmask);
        }
      }
      if (rows[i]['ipv4_dhcp']) {
        for (let j = 0; j < rows[i]['state']['aliases'].length; j++) {
          const alias = rows[i]['state']['aliases'][j];
          if (alias.type.startsWith('INET')) {
            addresses.add(alias.address + '/' + alias.netmask);
          }
        }
      }
      if (rows[i].hasOwnProperty('failover_aliases')) {
        for (let j=0; j<rows[i]['failover_aliases'].length; j++) {
          const alias = rows[i]['failover_aliases'][j];
          if (alias.type.startsWith('INET')) {
            addresses.add(alias.address + '/' + alias.netmask);
          }
        }
      }
      rows[i]['addresses'] = Array.from(addresses).join(', ');
      if (rows[i].type === "PHYSICAL") {
        rows[i].active_media_type = rows[i]["state"]["active_media_type"];
        rows[i].active_media_subtype = rows[i]["state"]["active_media_subtype"];
      } else if (rows[i].type === "VLAN") {
        rows[i].vlan_tag = rows[i]["vlan_tag"];
        rows[i].vlan_parent_interface = rows[i]["state"]["vlan_parent_interface"];
      } else if (rows[i].type === "BRIDGE") {
        rows[i].bridge_members = rows[i]["bridge_members"];
      } else if (rows[i].type === "LINK_AGGREGATION") {
        rows[i].lagg_ports = rows[i]["lag_ports"];
        rows[i].lagg_protocol = rows[i]["lag_protocol"];
      }
      rows[i].mac_address = rows[i]['state']['link_address'];
    }

  }

  getActions(row) {
    return [{
      id: row.name,
      icon: 'edit',
      name: "edit",
      label: T("Edit"),
      onClick: (rowinner) => { 
        if(this.ha_enabled) {
          this.dialog.Info(helptext.ha_enabled_edit_title, helptext.ha_enabled_edit_msg);
        } else {
          this.entityList.doEdit(rowinner.id);
        }
      },
    }, {
      id: row.name,
      icon: 'delete',
      name: "delete",
      label: T("Delete"),
      onClick: (rowinner) => {
        if(this.ha_enabled) {
          this.dialog.Info(helptext.ha_enabled_delete_title, helptext.ha_enabled_delete_msg);
        } else {
          this.entityList.doDelete(rowinner);
        }
      },
    }]
  }

  preInit(entityList) {
    this.entityList = entityList;

    this.checkPendingChanges();
    this.checkWaitingCheckin();
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

    if (window.localStorage.getItem('is_freenas') === 'false') {
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
    this.entityList.dialogService.confirm(
      helptext.commit_changes_title,
      helptext.commit_changes_warning,
      false, helptext.commit_button).subscribe(confirm => {
        if (confirm) {
          this.entityList.loader.open();
          this.entityList.loaderOpen = true;
          this.ws.call('interface.commit', [{checkin_timeout: this.checkin_timeout}]).subscribe(res => {
            this.core.emit({name: "NetworkInterfacesChanged", data: {commit:true, checkin:false}, sender:this});
            this.entityList.loader.close();
            this.entityList.loaderOpen = false;
            // can't decide if this is worth keeping since the checkin happens intantaneously
            //this.dialog.Info(helptext.commit_changes_title, helptext.changes_saved_successfully, '300px', "info", true);
            this.checkWaitingCheckin();
          }, err => {
            this.entityList.loader.close();
            this.entityList.loaderOpen = false;
            new EntityUtils().handleWSError(this.entityList, err, this.entityList.dialogService);
          });
        }
      });
  }

  checkInNow() {
    this.entityList.dialogService.confirm(
      helptext.checkin_title,
      helptext.checkin_message,
      true, helptext.checkin_button).subscribe(res => {
        if (res) {
          this.entityList.loader.open();
          this.entityList.loaderOpen = true;
          this.ws.call('interface.checkin').subscribe((success) => {
            this.core.emit({name: "NetworkInterfacesChanged", data: {commit:true, checkin:true}, sender:this});
            this.entityList.loader.close();
            this.entityList.dialogService.Info(
              helptext.checkin_complete_title,
              helptext.checkin_complete_message);
            this.hasPendingChanges = false;
            this.checkinWaiting = false;
            clearInterval(this.checkin_interval);
            this.checkin_remaining = null;
          }, (err) => {
            this.entityList.loader.close();
            new EntityUtils().handleWSError(this.entityList, err, this.entityList.dialogService);
          });
        }
      }
    );
  }

  rollbackPendingChanges() {
    this.entityList.dialogService.confirm(
      helptext.rollback_changes_title,
      helptext.rollback_changes_warning,
      false, helptext.rollback_button).subscribe(confirm => {
        if (confirm) {
          this.entityList.loader.open();
          this.entityList.loaderOpen = true;
          this.ws.call('interface.rollback').subscribe(res => {
            this.core.emit({name: "NetworkInterfacesChanged", data: {commit:false}, sender:this});
            this.entityList.loader.close();
            this.entityList.loaderOpen = false;
            this.hasPendingChanges = false;
            this.checkinWaiting = false;
            this.dialog.Info(helptext.rollback_changes_title, helptext.changes_rolled_back, '300px', "info", true);
          }, err => {
            this.entityList.loader.close();
            this.entityList.loaderOpen = false;
            new EntityUtils().handleWSError(this.entityList, err);
          });
        }
      });
  }

  goToHA() {
    this.router.navigate(new Array('/').concat('system', 'failover'));
  }
  
  ngOnDestroy() {
    this.core.unregister({observerClass:this});
  }
}
