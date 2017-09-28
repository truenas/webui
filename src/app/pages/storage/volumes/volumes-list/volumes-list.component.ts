import {Component, ElementRef, OnInit} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import { RestService } from '../../../../services/';
import { TourService } from '../../../../services/tour.service';
import filesize from 'filesize';

@Component({
  selector : 'app-volumes-list',
  template : `<entity-table [conf]="this"></entity-table>`
})
export class VolumesListComponent implements OnInit {

  protected resource_name: string = 'storage/volume/';
  protected route_add: string[] = [ 'storage', 'volumes', 'manager' ];
  protected route_add_tooltip: string = "Volume Manager";

  constructor(
    protected _rest: RestService, 
    private _router: Router,
    protected _eRef: ElementRef,
    private tour: TourService
  ) {}

  public columns: Array<any> = [
    {name : 'Name', prop : 'path'},
    {name : 'Status', prop : 'status'},
    {name : 'Available', prop : 'avail'},
    {name : 'Used', prop : 'used'},
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
  };

  ngOnInit() {
    let showTour = localStorage.getItem(this._router.url) || 'false';
    if (showTour != "true") {
      hopscotch.startTour(this.tour.startTour(this._router.url));
      localStorage.setItem(this._router.url, 'true');
    }
  }

  dataHandler(EntityTable:any) {
    for (let i=0; i<EntityTable.rows.length; i++) {
      if (!EntityTable.rows[i].path) {
        EntityTable.rows[i].path = EntityTable.rows[i].name;
      }
    }
  }

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
      icon: "vertical_align_bottom",
      onClick : () => {
        this._router.navigate(new Array('/').concat(
            [ "storage", "volumes", "import_list" ]));
      }
    });
    return actions;
  }

  getActions(row) {
    let actions = [];
    //workaround to make deleting volumes work again,  was if (row.vol_fstype == "ZFS")
    if (!row.type) {
      actions.push({
        label : "Delete",
        onClick : (row) => {
          this._router.navigate(new Array('/').concat(
              [ "storage", "volumes", "delete", row.id ]));
        }
      });
    }
    if (row.type == "dataset") {
      actions.push({
        label : "Add Dataset",
        onClick : (row) => {
          this._router.navigate(new Array('/').concat([
            "storage", "volumes", "id", row.path.split('/')[0], "dataset",
            "add", row.path
          ]));
        }
      });
      actions.push({
        label : "Add Zvol",
        onClick : (row) => {
          this._router.navigate(new Array('/').concat([
            "storage", "volumes", "id", row.path.split('/')[0], "zvol", "add",
            row.path
          ]));
        }
      });
      actions.push({
        label : "Create Snapshot",
        onClick : (row) => {
          this._router.navigate(new Array('/').concat(
              [ "storage", "snapshots", "id", row.path.split('/')[0], "add" ]));
        }
      });
       actions.push({
        label : "Edit Options",
        onClick : (row) => {
          this._router.navigate(new Array('/').concat([
            "storage", "volumes", "id", row.path.split('/')[0], "dataset",
            "edit", row.path
          ]));
        }
      });
      if (row.path.indexOf('/') != -1) {
        actions.push({
          label : "Delete Dataset",
          onClick : (row) => {
            this._router.navigate(new Array('/').concat([
              "storage", "volumes", "id", row.path.split('/')[0], "dataset",
              "delete", row.path
            ]));
          }
        });
        actions.push({
          label : "Edit Permissions",
          onClick : (row) => {
            this._router.navigate(new Array('/').concat([
              "storage", "volumes", "id", row.path.split('/')[0], "dataset",
              "permissions", row.path
            ]));
          }
        });
      }
    }
    if (row.type == "zvol") {
      actions.push({
        label : "Delete Zvol",
        onClick : (row) => {
          this._router.navigate(new Array('/').concat([
            "storage", "volumes", "id", row.path.split('/')[0], "zvol",
            "delete", row.path
          ]));
        }
      });
      actions.push({
        label : "Edit Zvol",
        onClick : (row) => {
          this._router.navigate(new Array('/').concat([
            "storage", "volumes", "id", row.path.split('/')[0], "zvol", "edit",
            row.path
          ]));
        }
      });
    }
    return actions;
  }
}
