
import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { Router } from '@angular/router';
import { helptext_system_bootenv } from 'app/helptext/system/bootenv';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table';
import { DialogService } from 'app/services';
import * as moment from 'moment';
import { fromEvent as observableFromEvent, Subscription } from 'rxjs';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { RestService } from '../../../../services/rest.service';
import { WebSocketService } from '../../../../services/ws.service';
import { StorageService } from '../../../../services/storage.service';
import { EntityUtils } from '../../../common/entity/utils';
import { T } from '../../../../translate-marker';
import { DialogFormConfiguration } from '../../../common/entity/entity-dialog/dialog-form-configuration.interface';

@Component({
  selector : 'app-bootenv-list',
  template : `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class BootEnvironmentListComponent {

  @ViewChild('scrubIntervalEvent', { static: true}) scrubIntervalEvent: ElementRef;

  public title = "Boot Environments";
  protected resource_name: string = 'system/bootenv';
  protected queryCall = 'bootenv.query';
  protected route_add: string[] = ['system', 'boot', 'create']
  protected route_delete: string[] = [ 'system', 'boot', 'delete' ];
  protected wsDelete = 'bootenv.delete';
  protected wsMultiDelete = 'core.bulk';
  protected entityList: EntityTableComponent;
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

  constructor(private _rest: RestService, private _router: Router, public ws: WebSocketService,
    public dialog: DialogService, protected loader: AppLoaderService, private storage: StorageService,
    public snackBar: MatSnackBar ) {}

  public columns: Array<any> = [
    {name: 'Name', prop: 'name', always_display: true},
    {name: 'Active', prop: 'active'},
    {name: 'Created', prop: 'created'},
    {name: 'Space', prop: 'rawspace'},
    {name: 'Keep', prop: 'keep'},
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
    multiSelect: true,
    deleteMsg: {
      title: 'Boot Environment',
      key_props: ['name']
    },
  };

  preInit() {
    this._rest.get('system/advanced/',{}).subscribe(res=>{
      this.scrub_interval = res.data.adv_boot_scrub;
      this.updateBootState();
    });
  }

  dataHandler(entityList: any) {
    entityList.rows.forEach((row) => {
      if (row.active !== '-') {
        row.hideCheckbox = true;
      }
      row.rawspace = this.storage.convertBytestoHumanReadable(row.rawspace);

    })
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
    const actions = [];
    if (row.active === '-'){
   actions.push({
      label : T("Activate"),
      id: "activate",
      onClick : (row) => {
        this.doActivate(row.id);
      }
    });
  }

    if (!row.active.includes('Reboot')) {
      actions.push({
        label : T("Activate"),
        id: "activate",
        onClick : (row) => {
          this.doActivate(row.id);
        }
      });
     } 

    actions.push({
      label : T("Clone"),
      id: "clone",
      onClick : (row) => {
        this._router.navigate(new Array('').concat(
            [ "system", "boot", "clone", row.id ]));
      }
    });

    actions.push({
      label : T("Rename"),
      id: "rename",
      onClick : (row) => {
        this._router.navigate(new Array('').concat(
            [ "system", "boot", "rename", row.id ]));
      }
    });
    
      actions.push({
        label: T("Delete"),
        id: "delete",
        onClick: row =>
          this.entityList.doDeleteJob(row).subscribe(
            success => {
              if (!success) {
                this.snackBar.open(
                  helptext_system_bootenv.snackbar_delete_failure_message,
                  helptext_system_bootenv.snackbar_action_dismiss,
                  { duration: 2000 }
                );
              }
            },
            console.error,
            () => {
              this.entityList.getData();
              this.updateBootState();
            }
          )
      });

    if (row.keep === true){
      actions.push({
        label : T("Unkeep"),
        id: "keep",
        onClick : (row) => {
          this.toggleKeep(row.id, row.keep);
        }
      });

    } else {
      actions.push({
        label : T("Keep"),
        id: "keep",
        onClick : (row) => {
          this.toggleKeep(row.id, row.keep);
        }
      });
    }

    return actions;
  }

  // tslint:disable-next-line: member-ordering
  public multiActions: Array < any > = [{
    id: "mdelete",
    label: T("Delete"),
    icon: "delete",
    enable: true,
    ttpos: "above",
    onClick: (selected) => {
      for(let i = selected.length -1; i >= 0 ; i--) {
        if(selected[i].active !== '-') {
           selected.splice(i, 1);
        }
      }
      this.entityList.doMultiDelete(selected);
    }
  }];

  getSelectedNames(selectedBootenvs)  {
    let selected: any = [];
    for (let i in selectedBootenvs) {
      if (selectedBootenvs[i].active ==='-') {
        selected.push([selectedBootenvs[i].id]);
      }
    }
    return selected;
  }

  wsMultiDeleteParams(selected: any) {
    let params: Array<any> = ['bootenv.do_delete'];
    params.push(this.getSelectedNames(selected));
    return params;
  }

  doActivate(id) {
    this.dialog.confirm(T("Activate"), T("Activate this Boot Environment?"), false, helptext_system_bootenv.list_dialog_activate_action).subscribe((res) => {
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

  updateBootState(): void {
    this.ws.call("boot.get_state").subscribe(wres => {
      if (wres.scan.end_time) {
        this.scrub_msg = moment(wres.scan.end_time.$date).format("MMMM Do YYYY, h:mm:ss a");
      } else {
        this.scrub_msg = T("Never");
      }
      this.size_consumed = this.storage.convertBytestoHumanReadable(wres.properties.allocated.parsed);
      this.condition = wres.properties.health.value;
      if (this.condition === "DEGRADED") {
        this.condition = this.condition + T(` Check Notifications for more details.`);
      }
      this.size_boot = this.storage.convertBytestoHumanReadable(wres.properties.size.parsed);
      this.percentange = wres.properties.capacity.value;
    });
  }

  toggleKeep(id, status) {
    if (!status){
      this.dialog.confirm(T("Keep"), T("Keep this Boot Environment?"), false, helptext_system_bootenv.list_dialog_keep_action).subscribe((res) => {
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
      this.dialog.confirm(T("Unkeep"), T("No longer keep this Boot Environment?"), false, helptext_system_bootenv.list_dialog_unkeep_action).subscribe((res) => {
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

  getAddActions() {
    return [{
        label: T("Stats/Settings"),
        onClick: () => {
          this._rest.get('system/advanced/',{}).subscribe(res=>{
            this.scrub_interval = res.data.adv_boot_scrub;
            let localWS = this.ws,
            localSnackBar = this.snackBar,
            localDialog = this.dialog;
            let statusConfigFieldConf: FieldConfig[] = [
              {
                type: 'paragraph',
                name: 'condition',
                paraText: T(`<b>Boot Pool Condition:</b> ${this.condition}`),
              },
              {
                type: 'paragraph',
                name: 'size_boot',
                paraText: T(`<b>Size:</b> ${this.size_boot}`)
              },
              {
                type: 'paragraph',
                name: 'size_consumed',
                paraText: T(`<b>Used:</b> ${this.size_consumed}`)
              },
              {
                type: 'paragraph',
                name: 'scrub_msg',
                paraText: T(`<b>Last Scrub Run:</b> ${this.scrub_msg}<br /><br />`)
              },
              {
                type: 'input',
                name: 'new_scrub_interval',
                placeholder: T('Scrub interval (in days)'),
                inputType: 'number',
                value: this.scrub_interval,
                required: true
              },
            ];

            let statusSettings: DialogFormConfiguration = {
              title: T('Stats/Settings'),
              fieldConfig: statusConfigFieldConf,
              saveButtonText: T('Update Interval'),
              cancelButtonText: T('Close'),
              parent: this,
              customSubmit: function(entityDialog) {
                const scrubIntervalValue: number = parseInt(entityDialog.formValue.new_scrub_interval);
                if( scrubIntervalValue > 0){
                  localWS.call('boot.set_scrub_interval',[scrubIntervalValue]).subscribe((res)=>{
                    localSnackBar.open(T(`Scrub interval set to ${scrubIntervalValue} days`), ('Close'), { duration: 4000});
                    localDialog.closeAllDialogs();
                  })

                }
                else {
                  localDialog.Info(T('Enter valid value'), T(scrubIntervalValue+' is not a valid number of days.'))
                }
              }
            }
            this.dialog.dialogForm(statusSettings)
          })
        }
      },{
        label: T("Boot Pool Status"),
        onClick: () => {
          this.goToStatus();
        }
      },
      {
        label: T("Scrub Boot Pool"),
        onClick: () => {
          this.scrub();
        }
      }
    ]
  }

  goToStatus() {
    this._router.navigate(new Array('').concat(
      [ "system", "boot", "status" ]));
  }

  scrub() {
    this.dialog.confirm(T("Scrub"), T("Start the scrub now?"), false, helptext_system_bootenv.list_dialog_scrub_action).subscribe((res) => {
      if (res) {
        this.loader.open();
        this.loaderOpen = true;
        let data = {};
        this.busy = this.ws.call('boot.scrub').subscribe((res) => {
          this.loader.close();
          this.snackBar.open(T('Scrub started'), T("Close"), {duration: 5000});
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
