import { Component, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material';

import { RestService } from '../../../../services/rest.service';
import { WebSocketService } from '../../../../services/ws.service';
import { DialogService } from '../../../../services/';
import { debug } from 'util';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { EntityJobComponent } from '../../../common/entity/entity-job/entity-job.component';


@Component({
  selector : 'app-bootstatus-list',
  template : `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class BootStatusListComponent {

  public title = "Boot Status";
  protected queryCall = 'boot.get_state';
  protected entityList: any;
  public busy: Subscription;

  public columns: Array<any> = [
    { name: 'Name', prop: 'name' },
    { name: 'type', prop: 'type' },    
    { name: 'Read', prop: 'read_errors' },
    { name: 'Write', prop: 'write_errors' },
    { name: 'Checksum', prop: 'checksum_errors' },
    { name: 'Status', prop: 'status' },
  ];
  public config: any = {
    paging : true,
    sorting : { columns : this.columns },
  };

  constructor(_rest: RestService, private _router: Router, private ws: WebSocketService,
    private dialog:DialogService, protected loader: AppLoaderService, public snackBar: MatSnackBar,) {}

  afterInit(entityList: any) {
    this.entityList = entityList;
  }

  rowValue(row, attr) {
    if (attr === 'name'){
      return row.name;
    }
    else if(attr === 'status'){
      return row.groups.data[0].status;
    }
    else if(attr === 'read_errors'){
      return row.read_errors;
    }
    else if(attr === 'checksum_errors'){
      return row.checksum_errors;
    }
    else if(attr === 'write_errors'){
      return row.write_errors;
    }
    else if(attr === 'type'){
      return row.type;
    }
  }

  getActions(row) {
    let actions = [];
    if (row.name === 'freenas-boot'){
      actions.push({
        label : "attach",
        id: "attach",
        onClick : (row) => {
          this._router.navigate(new Array('').concat(
              [ "system", "bootenv", "attach", row.name ]));
        }
      });
    }
    else {
      actions.push({
        label : "replace",
        id: "replace",
        onClick : (row) => {
          this._router.navigate(new Array('').concat(
              [ "system", "bootenv", "replace", row.name ]));
        }
      });
      
      actions.push({
        label : "detach",
        id: "attach",
        onClick : (row) => {
          [this.detach(row.name)];
        }
      });
    }

    return actions;
  }
  
  resourceTransformIncomingRestData(data:any): any {
    data.path = []
    data.read_errors  = data.groups.data[0].stats.read_errors;
    data.write_errors  = data.groups.data[0].stats.write_errors;
    data.checksum_errors  = data.groups.data[0].stats.checksum_errors;
    data.type = data.groups.data[0].type;

    if (data.type === 'mirror')
    {
      for (let cindex = 0; cindex < data.groups.data[0].children.length; cindex++){
        data.path.push(data.groups.data[0].children[cindex].path);
      }
    } else {
      data.type = 'stripe';
      data.path.push(data.groups.data[0].path);
    }
    return data;
  };
  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action , {
      duration: 5000
    });
  }

  detach(disk:any){
    disk = disk.substring(5, disk.length);
    this.loader.open();
    this.busy = this.ws.call('boot.detach', [disk]).subscribe(
      (res) => {
        this.loader.close();
        this._router.navigate(
          new Array('').concat('system','bootenv')
        );
        this.openSnackBar("Device successfully detached", "Success");
      },
      (res) => {
        this.loader.close();
        this.dialog.errorReport(res.error, res.reason, res.trace.formatted);
      });
  }

  addRows(rows: any){
    this.ws.call(this.queryCall).subscribe((res)=>{
      const transformedData = this.resourceTransformIncomingRestData(res);

      for(let transformedDataIdx=0; transformedDataIdx <transformedData.path.length; transformedDataIdx++){
        this.entityList.pushNewRow(
          {
            "name":transformedData.path[transformedDataIdx],
            "status":transformedData.status,
            "read_errors":transformedData.read_errors,
            "write_errors":transformedData.write_errors,
            "checksum_errors":transformedData.checksum_errors,
            "type":transformedData.type
        });
      }
    })
  }

}
