import {Component, ElementRef} from '@angular/core';
import {Router} from '@angular/router';
import filesize from 'filesize';
import { Subscription } from 'rxjs';

import {RestService} from '../../../../services/rest.service';
import { WebSocketService } from '../../../../services/ws.service';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { DialogService } from 'app/services';
import { EntityUtils } from '../../../common/entity/utils';

@Component({
  selector : 'app-bootenv-list',
  template : `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class BootEnvironmentListComponent {

  public title = "Boot Environments";
  protected resource_name: string = 'system/bootenv';
  protected queryCall = 'bootenv.query';
  protected route_delete: string[] = [ 'system', 'bootenv', 'delete' ];
  protected entityList: any;
  protected wsActivate = 'bootenv.activate';
  protected wsKeep = 'bootenv.set_attribute';
  protected loaderOpen: boolean = false;
  public busy: Subscription;

  public columns: Array<any> = [
    {name: 'Name', prop: 'name'},
    {name: 'Active', prop: 'active'},
    {name: 'Created', prop: 'created'},
    {name: 'Space', prop: 'space'},
    {name: 'Keep', prop: 'keep'},
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
  };



  rowValue(row, attr) {
    if (attr === 'created'){
      return row.created.$date
    }
    if (attr === 'active'){
      if (row.active === 'N'){
        return "Now";
      } else if(row.active === 'R'){
        return "Reboot";
      } else if(row.active === 'NR'){
        return "Now/Reboot";
      }
      return row.active

    }
    return row[attr];
  }

  constructor(private _rest: RestService, private _router: Router, private ws: WebSocketService, 
    private dialog: DialogService, protected loader: AppLoaderService ) {}

  afterInit(entityList: any) {
    this.entityList = entityList;
  }

  isActionVisible(actionId: string, row: any) {
    if (actionId == 'edit' || actionId == 'add') {
      return false;
    }
    return true;
  }
  getAddActions() {
    let actions = [];
    actions.push({
      label : "create",
      icon: "album",
      onClick : () => {
         this._router.navigate(new Array('').concat(
            [ "system", "bootenv", "create" ]));
       }
    });
    // uncommit me when we have a fix for #26779
    // actions.push({
    //   label : "scrub",
    //   icon: "device_hub",
    //   onClick : () => {
    //     this.entityList.scrub();
    //   }
    // });
    actions.push({
      label : "status",
      icon: "local_laundry_service",
      onClick : () => {
        this._router.navigate(new Array('').concat(
            [ "system", "bootenv", "status" ]));
      }
    });
    return actions;
  }
  getActions(row) {
    let actions = [];
    if (row.active === '-'){
      actions.push({
        label : "Delete",
        id: "delete",
        onClick : (row) => {
          this.entityList.doDelete(row.id);
        }
      });
    }
    actions.push({
      label : "Clone",
      id: "clone",
      onClick : (row) => {
        this._router.navigate(new Array('').concat(
            [ "system", "bootenv", "clone", row.id ]));
      }
    });
    actions.push({
      label : "Rename",
      id: "rename",
      onClick : (row) => {
        this._router.navigate(new Array('').concat(
            [ "system", "bootenv", "rename", row.id ]));
      }
    });
    actions.push({
      label : "Activate",
      id: "activate",
      onClick : (row) => {
        this.doActivate(row.id);
      }
    });
    if (row.keep === true){
      actions.push({
        label : "Unkeep",
        id: "keep",
        onClick : (row) => {
          this.toggleKeep(row.id, row.keep);
        }
      });

    } else {
      actions.push({
        label : "Keep",
        id: "keep",
        onClick : (row) => {
          this.toggleKeep(row.id, row.keep);
        }
      });
    }

    return actions;
  }

  doActivate(id) {
    this.dialog.confirm("Activate", "Are you sure you want to activate it?").subscribe((res) => {
      if (res) {
        this.loader.open();
        this.loaderOpen = true;
        let data = {};
        this.busy = this.ws.call(this.wsActivate, [id]).subscribe(
          (res) => { 
            this.entityList.getData();
            this.loader.close(); },
          (res) => {
            new EntityUtils().handleError(this, res);
            this.loader.close();
          }
          );
      }
    })
  }
  toggleKeep(id, status) {
    if (!status){
      this.dialog.confirm("Keep", "Do you want to set keep flag in this boot environment?").subscribe((res) => {
        if (res) {
          this.loader.open();
          this.loaderOpen = true;
          let data = {};
          this.busy = this.ws.call(this.wsKeep, [id, { "keep" : true }]).subscribe(
            (res) => { this.entityList.getData();
              this.loader.close(); 
            },
            (res) => {
              new EntityUtils().handleError(this, res);
              this.loader.close();
            }
            );
        }
      })
    } else {
      this.dialog.confirm("Unkeep", "Do you want to remove keep flag in this boot environment?").subscribe((res) => {
        if (res) {
          this.loader.open();
          this.loaderOpen = true;
          let data = {};
          this.busy = this.ws.call(this.wsKeep, [id, { "keep" : false }]).subscribe(
            (res) => { this.entityList.getData();
              this.loader.close();
            },
            (res) => {
              new EntityUtils().handleError(this, res);
              this.loader.close();
            }
            );
        }
      })

    }

  }
  // scrub() {
  //   this.dialog.confirm("Scrub", "Do you want to start scrub?").subscribe((res) => {
  //     if (res) {
  //       this.loader.open();
  //       this.loaderOpen = true;
  //       let data = {};
  //       this.busy = this._rest.post('', {}).subscribe((res) => {
  //         this.loader.close();
  //         },
  //         (res) => {
  //           this.dialog.errorReport(res.error, res.reason, res);
  //           this.loader.close();
  //         }
  //         );
  //     }
  //   })
  // }
}
