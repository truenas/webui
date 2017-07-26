import {Component, ElementRef, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import filesize from 'filesize';

import {GlobalState} from '../../../../global.state';
import {RestService} from '../../../../services/rest.service';

@Component({
  selector : 'app-volumes-list',
  template : `<entity-table [conf]="this"></entity-table>`
})
export class VolumesListComponent {

  protected resource_name: string = 'storage/volume/';
  protected route_add: string[] = [ 'storage', 'volumes', 'manager' ];

  constructor(
    protected _rest: RestService, 
    private _router: Router,
    protected _state: GlobalState,
    protected _eRef: ElementRef
  ) {}

  public columns: Array<any> = [
    {name : 'Name', prop : 'name'},
    {name : 'Status', prop : 'status'},
    {name : 'Available', prop : 'avail'},
    {name : 'Used', prop : 'used'},
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
  };

  rowValue(row, attr) {
    switch (attr) {
    case 'avail':
      return filesize(row[attr], {standard : "iec"});
    case 'used':
      return filesize(row[attr], {standard : "iec"}) + " (" + row['used_pct'] +
             ")";
    default:
      return row[attr];
    }
  }

  getAddActions() {
    let actions = [];
    actions.push({
      label : "Import Volumes",
      onClick : () => {
        this._router.navigate(new Array('/pages').concat(
            [ "storage", "volumes", "import_list" ]));
      }
    });
    return actions;
  }

  getActions(row) {
    let actions = [];
    if (row.vol_fstype == "ZFS") {
      actions.push({
        label : "Delete",
        onClick : (row) => {
          this._router.navigate(new Array('/pages').concat(
              [ "storage", "volumes", "delete", row.id ]));
        }
      });
    }
    if (row.type == "dataset") {
      actions.push({
        label : "Add Dataset",
        onClick : (row) => {
          this._router.navigate(new Array('/pages').concat([
            "storage", "volumes", "id", row.path.split('/')[0], "dataset",
            "add", row.path
          ]));
        }
      });
      actions.push({
        label : "Add Zvol",
        onClick : (row) => {
          this._router.navigate(new Array('/pages').concat([
            "storage", "volumes", "id", row.path.split('/')[0], "zvol", "add",
            row.path
          ]));
        }
      });
      actions.push({
        label : "Create Snapshot",
        onClick : (row) => {
          this._router.navigate(new Array('/pages').concat(
              [ "storage", "snapshots", "id", row.path.split('/')[0], "add" ]));
        }
      });
       actions.push({
        label : "Edit Options",
        onClick : (row) => {
          this._router.navigate(new Array('/pages').concat([
            "storage", "volumes", "id", row.path.split('/')[0], "dataset",
            "edit", row.path
          ]));
        }
      });

      if (row.path.indexOf('/') != -1) {
        actions.push({
          label : "Delete Dataset",
          onClick : (row) => {
            this._router.navigate(new Array('/pages').concat([
              "storage", "volumes", "id", row.path.split('/')[0], "dataset",
              "delete", row.path
            ]));
          }
        });
      }
    }
    if (row.type == "zvol") {
      actions.push({
        label : "Delete Zvol",
        onClick : (row) => {
          this._router.navigate(new Array('/pages').concat([
            "storage", "volumes", "id", row.path.split('/')[0], "zvol",
            "delete", row.path
          ]));
        }
      });
      actions.push({
        label : "Edit Zvol",
        onClick : (row) => {
          this._router.navigate(new Array('/pages').concat([
            "storage", "volumes", "id", row.path.split('/')[0], "zvol", "edit",
            row.path
          ]));
        }
      });
    }
    return actions;
  }
}
