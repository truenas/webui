import {Component, ElementRef, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material';
import { Observable } from 'rxjs/Observable';

import {RestService} from '../../../../services/rest.service';
import { WebSocketService } from '../../../../services/ws.service';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { DialogService } from 'app/services';
import { EntityUtils } from '../../../common/entity/utils';
import * as moment from 'moment';
import { stringify } from '@angular/core/src/util';

@Component({
  selector : 'app-bootenv-list',
  templateUrl : './bootenv-list.component.html'
})
export class BootEnvironmentListComponent {

  @ViewChild('scrubIntervalEvent') scrubIntervalEvent: ElementRef;

  public title = "Boot Environments";
  protected resource_name: string = 'system/bootenv';
  protected queryCall = 'bootenv.query';
  protected route_delete: string[] = [ 'system', 'bootenv', 'delete' ];
  protected entityList: any;
  protected wsActivate = 'bootenv.activate';
  protected wsKeep = 'bootenv.set_attribute';
  protected loaderOpen: boolean = false;
  public busy: Subscription;
  public size_consumed: string;
  public condition: string;
  public size_boot: string;
  public percentange: string;
  public header: string;
  public scrub_msg: string;
  public scrub_interval: number; 

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

  preInit(){
    this._rest.get('system/advanced/',{}).subscribe(res=>{
      this.scrub_interval = res.data.adv_boot_scrub;
      this.ws.call('boot.get_state').subscribe(wres => {
        if (wres.scan.end_time){
          this.scrub_msg = moment(wres.scan.end_time.$date).format('MMMM Do YYYY, h:mm:ss a');
        } else{
          this.scrub_msg="Never"
        }
        this.size_consumed = wres.properties.allocated.value;
        this.condition = wres.properties.health.value;
        if (this.condition === 'DEGRADED'){
          this.condition = this.condition + ` Please check Notifications for detailed information.`
        }
        this.size_boot =  wres.properties.size.value;
        this.percentange =  wres.properties.capacity.value;
      });
    });

  }

  changeEvent(){
    Observable.fromEvent(this.scrubIntervalEvent.nativeElement, 'keyup').debounceTime(150).distinctUntilChanged()
    .subscribe(() => {
      const scrubIntervalValue: number = this.scrubIntervalEvent.nativeElement.value;
      if( scrubIntervalValue > -1){
        this._rest.put('system/advanced/',{ body: JSON.stringify(
          {'adv_boot_scrub':scrubIntervalValue})}).subscribe((res)=>{

          })

      }
      else {
        this.dialog.Info('Enter valid value', scrubIntervalValue+' is not a valid number of days.')
      }
    });
  }


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
    private dialog: DialogService, protected loader: AppLoaderService,
    public snackBar: MatSnackBar ) {}

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
    actions.push({
      label : "scrub",
      icon: "device_hub",
      onClick : () => {
        this.scrub();
      }
    });
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
  scrub() {
    this.dialog.confirm("Scrub", "Do you want to start scrub?").subscribe((res) => {
      if (res) {
        this.loader.open();
        this.loaderOpen = true;
        let data = {};
        this.busy = this.ws.call('boot.scrub').subscribe((res) => {
          this.loader.close();
          this.snackBar.open('Scrub started',"OK", {duration: 5000});
          },
          (res) => {
            this.dialog.errorReport(res.error, res.reason, res);
            this.loader.close();
          }
          );
      }
    })
  }
}
