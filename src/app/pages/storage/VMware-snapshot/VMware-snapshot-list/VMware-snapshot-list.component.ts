import {Component, ElementRef} from '@angular/core';
import {Router} from '@angular/router';

import {RestService} from '../../../../services/rest.service';
import { T } from '../../../../translate-marker';

@Component({
  selector : 'vmware-snapshot-list',
  template : `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class VMwareSnapshotListComponent {

  public title = "VMware Snapshots";
  protected resource_name: string = 'storage/vmwareplugin';
  protected route_add: string[] = ["storage", "vmware-Snapshots", "add"];
  protected route_add_tooltip = "Add VMware Snapshot";
  protected entityList: any;

  public columns: Array<any> = [
    {name : 'Hostname', prop : 'hostname', always_display: true }, {name : 'Username', prop : 'username'},
    {name : 'filesystem', prop : 'filesystem'}, {name : 'datastore', prop : 'datastore'}
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
    deleteMsg: {
      title: 'VMware Snapshot',
      key_props: ['hostname', 'filesystem']
    },
  };

  constructor(_rest: RestService, private _router: Router,
              _eRef: ElementRef) {}

  isActionVisible(actionId: string, row: any) {
    if (actionId == 'edit' || actionId == 'add') {
      return false;
    }
    return true;
  }

  getActions(row) {
    let actions = [];
    actions.push({
      id: row.hostname,
      icon: 'delete',
      name: 'delete',
      label : T("Delete"),
      onClick : (row) => {
        this.entityList.doDelete(row);
      }
    });
      actions.push({
        id: row.hostname,
        icon: 'edit',
        name: 'edit',
        label : T("Edit"),
        onClick : (row) => {
          this._router.navigate(new Array('/').concat(
              [ "storage", "vmware-Snapshots", "edit", row.id ]));
        }
      });
    return actions;
  }

  afterInit(entityList: any) {
    this.entityList = entityList;
  }
}
