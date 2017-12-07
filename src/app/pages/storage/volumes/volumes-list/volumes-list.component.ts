import {Component, ElementRef, OnInit} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import { RestService } from '../../../../services/';
import { TourService } from '../../../../services/tour.service';
import filesize from 'filesize';
import { debug } from 'util';
import { EntityUtils } from '../../../common/entity/utils';

@Component({
  selector : 'app-volumes-list',
  template : `<entity-group-table [title]="title" [conf]="this"></entity-group-table>`
})
export class VolumesListComponent implements OnInit {

  public title = "Volumes";
  protected flattenedVolData: any;
  protected resource_name: string = 'storage/volume/';
  protected route_add: string[] = [ 'storage', 'volumes', 'manager' ];
  protected route_add_tooltip: string = "Volume Manager";
  public dataset_data: any;

  constructor(
    protected _rest: RestService,
    private _router: Router,
    protected _eRef: ElementRef,
    private tour: TourService,
    
  ) {}

  public columns: Array<any> = [
    {name : 'Name', prop : 'path'},
    {name : 'Used', prop : 'used'},
    {name : 'Available', prop : 'avail'},
    {name : 'Type', prop : 'type'},
    {name : 'Status', prop : 'status'},
    {name : 'Compression', prop : 'compression'},
    {name : 'Readonly', prop : 'readonly'},
    {name : 'Dedup', prop : 'dedup'},

    
    
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
    this._rest.get('storage/dataset/',{}).subscribe((res)=>{
      this.dataset_data = res;
    })
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
    if (row.type === 'zpool') {
      actions.push({
        label : "Delete",
        onClick : (row) => {
          this._router.navigate(new Array('/').concat(
              [ "storage", "volumes", "delete", row.id ]));
        }
      });
      actions.push({
        label : "Status",
        onClick : (row) => {
          this._router.navigate(new Array('/').concat(
            [ "storage", "volumes", "status", row.id ]));
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
  resourceTransformIncomingRestData(data:any): any {
    data = new EntityUtils().flattenData(data);
    for (let i= 0; i<data.length; i++){
      if (data[i].status !== '-'){
        data[i].type = 'zpool'
        data[i].path = data[i].name
      }
      if (data[i].type === 'dataset'  && typeof(this.dataset_data) !== "undefined" && typeof(this.dataset_data.data) !== "undefined" ) {
        for (let k = 0; k< this.dataset_data.data.length;k++){
          if (this.dataset_data.data[k].name === data[i].path){
            data[i].compression = this.dataset_data.data[k].compression;
            data[i].readonly = this.dataset_data.data[k].readonly;
            data[i].dedup = this.dataset_data.data[k].dedup;
          }
          
        }
      }
    }
    return data;
  };
}
