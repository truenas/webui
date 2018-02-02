import {Component, ElementRef} from '@angular/core';
import {Router} from '@angular/router';

import {RestService} from '../../../../services/rest.service';

@Component({
  selector : 'vmware-snapshot-list',
  template : `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class VMwareSnapshotListComponent {

  public title = "Snapshots";
  protected resource_name: string = 'storage/vmwareplugin';
  protected entityList: any;

  public columns: Array<any> = [
    {name : 'Hostname', prop : 'hostname'}, {name : 'Username', prop : 'username'},
    {name : 'filesystem', prop : 'filesystem'}, {name : 'datastore', prop : 'datastore'}
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
  };

  constructor(_rest: RestService, private _router: Router,
              _eRef: ElementRef) {}

  isActionVisible(actionId: string, row: any) {
    if (actionId == 'edit' || actionId == 'add') {
      return false;
    }
    return true;
  }

  getAddActions() {
    let actions = [];
    actions.push({
      label: "Add",
      icon: "card_membership",
      onClick: () => {
        this._router.navigate(
          new Array('').concat(["storage", "vmware-Snapshots", "add"]));
      }
    });
    return actions;
  }

  getActions(row) {
    let actions = [];
    actions.push({
      label : "Delete",
      onClick : (row) => {
        this.entityList.doDelete(row.id);
      }
    });
      actions.push({
        label : "Edit",
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
