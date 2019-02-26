import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { Router } from '@angular/router';
import { helptext_system_bootenv as helptext } from 'app/helptext/system/bootenv';
import { DialogService } from 'app/services';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { Observable } from 'rxjs/Observable';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { RestService } from '../../../../services/rest.service';
import { WebSocketService } from '../../../../services/ws.service';
import { EntityUtils } from '../../../common/entity/utils';

@Component({
  selector : 'app-bootenv-list',
  templateUrl : './bootenv-list.component.html'
})
export class BootEnvironmentListComponent {

  @ViewChild('scrubIntervalEvent') scrubIntervalEvent: ElementRef;

  public title = "Boot Environments";
  protected resource_name: string = 'system/bootenv';
  protected queryCall = 'bootenv.query';
  protected route_add: string[] = ['system', 'bootenv', 'create']
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
    {name: 'Name', prop: 'name', always_display: true},
    {name: 'Active', prop: 'active'},
    {name: 'Created', prop: 'created'},
    {name: 'Space', prop: 'space'},
    {name: 'Keep', prop: 'keep'},
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
    deleteMsg: {
      title: 'Boot Environment',
      key_props: ['name']
    },
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
          this.condition = this.condition + ` Check Notifications for more details.`
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
        this.ws.call('boot.set_scrub_interval',[scrubIntervalValue]).subscribe((res)=>{
        })

      }
      else {
        this.dialog.Info('Enter valid value', scrubIntervalValue+' is not a valid number of days.')
      }
    });
  }


  rowValue(row, attr) {
    if (attr === 'created'){
      return moment(row.created.$date).format('l LT')
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

  getActions(row) {
    let actions = [];
    if (row.active === '-'){
      actions.push({
        label : "Delete",
        id: "delete",
        onClick : (row) => {
          this.entityList.doDelete(row);
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
    this.dialog.confirm("Activate", "Activate this Boot Environment?", false, helptext.list_dialog_activate_action).subscribe((res) => {
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
      this.dialog.confirm("Keep", "Keep this Boot Environment?", false, helptext.list_dialog_keep_action).subscribe((res) => {
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
      this.dialog.confirm("Unkeep", "No longer keep this Boot Environment?", false, helptext.list_dialog_unkeep_action).subscribe((res) => {
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

  goToStatus() {
    this._router.navigate(new Array('').concat(
      [ "system", "bootenv", "status" ]));
  }

  scrub() {
    this.dialog.confirm("Scrub", "Start the scrub now?", false, helptext.list_dialog_scrub_action).subscribe((res) => {
      if (res) {
        this.loader.open();
        this.loaderOpen = true;
        let data = {};
        this.busy = this.ws.call('boot.scrub').subscribe((res) => {
          this.loader.close();
          this.snackBar.open('Scrub started',"close", {duration: 5000});
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
