import { Component, OnDestroy, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Router } from '@angular/router';
import { CoreEvent, CoreService } from 'app/core/services/core.service';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/observable/interval';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/map';
import { Subject } from 'rxjs/Subject';
import globalHelptext from '../../../helptext/global-helptext';
import { RestService, WebSocketService } from '../../../services/';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { DialogService } from '../../../services/dialog.service';
import { T } from '../../../translate-marker';
import { EntityTableComponent } from '../../common/entity/entity-table/';
import { VmDetailsComponent } from './vm-details.component';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';

@Component({
  selector: 'app-vm-cards',
  template: `
  <vm-summary></vm-summary>
  <entity-table #table [title]="title" [conf]="this"></entity-table>`
})
export class VmCardsComponent  implements OnDestroy {

  @ViewChild('table', { static: true}) table:EntityTableComponent;
  protected queryCall = 'vm.query';
  protected route_add: string[] = [ 'vm', 'wizard' ];
  protected route_add_tooltip = "Add VM";
  protected route_edit: string[] = [ 'vm', 'edit' ];
  protected runnningState = "RUNNING";
  protected toggleProp = "state";
  protected toggleStart = "vm.start";
  protected toggleStop = "vm.stop";
  public title = "Virtual Machines";
  public controlEvents:Subject<CoreEvent> = new Subject();
  public actions = [];
  public showSpinner = true;

  protected entityTable: EntityTableComponent;

  public columns: Array<any> = [
    {name : T('Name'), prop : 'name', always_display: true },
    {name : T('State'), prop : 'state', always_display: true, toggle: true },
    {name : T('Autostart'), prop : 'autostart',hidden: false, selectable: true},
    { name: T("Virtual CPUs"), prop: 'vcpus', hidden: true },
    { name: T("Memory Size (MiB)"), prop: 'memory', hidden: true },
    { name: T("Boot Loader Type"), prop: 'bootloader', hidden: true },
    {name : 'System Clock', prop : 'time', hidden: true},
    { name: T("VNC Port"), prop: 'port', hidden: true },
    { name: T("Com Port"), prop: 'com_port', hidden: true }
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
    deleteMsg: {
      title: 'Name',
      key_props: ['name']
    },
  };

  constructor(public router: Router, protected rest: RestService, public ws: WebSocketService,
              public core:CoreService,public dialog: DialogService,protected loader: AppLoaderService,
              protected matdialog: MatDialog
              ) {}

  resourceTransformIncomingRestData(vms) {
    for (let vm_index = 0; vm_index<vms.length; vm_index++){
      vms[vm_index]['state'] = vms[vm_index]['status']['state'];
      vms[vm_index]['com_port'] = `/dev/nmdm${vms[vm_index]['id']}B`;
      if (this.checkVnc(vms[vm_index])) {
        vms[vm_index]['port'] = this.vncPort(vms[vm_index]);
      } else {
        vms[vm_index]['port'] = 'N/A';
      if (vms[vm_index]['vm_type'] === "Container Provider") 
        vms[vm_index]['vm_type'] = globalHelptext.dockerhost;
      };
    }
    return vms;
  }

  getActions(row) {
    const actions = [];
    const localCore = this.core;
    if (row["status"]["state"] === "RUNNING") {
      actions.push({
        name: this.config.name,
        id: "poweroff",
        icon: "power_settings_new",
        label: T("Power Off"),
        onClick: power_off_row => {
          const eventName = "VmPowerOff";
          this.core.emit({ name: eventName, data: [power_off_row.id] });
          this.setTransitionState("POWERING OFF", power_off_row);
        }
      });
      actions.push({
        name: this.config.name,
        id: "stop",
        icon: "stop",
        label: T("Stop"),
        onClick: power_stop_row => {
          const eventName = "VmStop";
          this.core.emit({ name: eventName, data: [power_stop_row.id] });
          this.setTransitionState("STOPPING", power_stop_row);
        }
      });
      actions.push({
        name: this.config.name,
        id: "restart",
        icon: "replay",
        label: T("Restart"),
        onClick: power_restart_row => {
          const eventName = "VmRestart";
          this.core.emit({ name: eventName, data: [power_restart_row.id] });
          this.setTransitionState("RESTARTING", power_restart_row);
        }
      });
    } else {
      actions.push({
        name: this.config.name,
        id: "start",
        icon: "play_arrow",
        label: T("Start"),
        onClick: start_row => {
          const eventName = "VmStart";
          const args = [start_row.id];
          const overcommit = [{ overcommit: false }];
          const dialogText = T(
            "Memory overcommitment allows multiple VMs to be launched when there is not enough free memory for configured RAM of all VMs. Use with caution."
          );
          const startDialog = this.dialog.confirm(
            T("Power"),
            undefined,
            true,
            T("Power On"),
            true,
            T("Overcommit Memory?"),
            undefined,
            overcommit,
            dialogText
          );
          startDialog.afterClosed().subscribe(res => {
            if (res) {
              const checkbox = startDialog.componentInstance.data[0].overcommit;
              args.push({ overcommit: checkbox });
              this.core.emit({ name: eventName, data: args });
              this.setTransitionState("STARTING", start_row);
            }
          });
        }
      });
    }
    actions.push({
      name: this.config.name,
      label: T("Edit"),
      icon: "edit",
      onClick: edit_row => {
        this.router.navigate(new Array("").concat(["vm", "edit", edit_row.id]));
      }
    });
    actions.push({
      name: this.config.name,
      label: T("Delete"),
      icon: "delete",
      onClick: delete_row => {
        const eventName = "VmDelete";
        const args = [delete_row.id];
        const deleteDialog = this.dialog.confirm("Delete VM", "Delete VM " + delete_row.name + " ?");
        deleteDialog.subscribe(res => {
          if (res) {
            this.core.emit({ name: eventName, data: args });
            this.setTransitionState("DELETING", delete_row);
          }
        });
      }
    });
    actions.push({
      name: this.config.name,
      label: T("Devices"),
      icon: "device_hub",
      onClick: devices_row => {
        this.router.navigate(new Array("").concat(["vm", devices_row.id, "devices", devices_row.name]));
      }
    });
    actions.push({
      name: this.config.name,
      label: T("Clone"),
      icon: "filter_none",
      onClick: clone_row => {
        const conf: DialogFormConfiguration = {
          title: T("Name"),
          fieldConfig: [
            {
              type: "input",
              inputType: "text",
              name: "name",
              placeholder: T("Enter a Name (optional)"),
              required: false
            }
          ],
          saveButtonText: T("Clone"),
          customSubmit: function(entityDialog) {
            const eventName = "VmClone";
            entityDialog.formValue.name
              ? localCore.emit({ name: eventName, data: [clone_row.id, entityDialog.formValue.name] })
              : localCore.emit({ name: eventName, data: [clone_row.id] });
            entityDialog.dialogRef.close(true);
          }
        };
        this.dialog.dialogForm(conf);
      }
    });

    if (row["status"]["state"] === "RUNNING") {
      if (this.checkVnc(row)) {
        actions.push({
          name: this.config.name,
          label: T("VNC"),
          icon: "settings_ethernet",
          onClick: vnc_vm => {
            this.ws.call("vm.get_vnc_web", [vnc_vm.id]).subscribe(res => {
              for (const vnc_port in res) {
                window.open(res[vnc_port]);
              }
            });
          }
        });
      }
      actions.push({
        name: this.config.name,
        label: T("Serial"),
        icon: "keyboard_arrow_right",
        onClick: vm => {
          this.router.navigate(new Array("").concat(["vm", "serial", vm.id]));
        }
      });
    }

    return actions;
  }

  afterInit(entityTable: EntityTableComponent) {
    this.entityTable = entityTable;
    this.core.emit({name: "VmProfilesRequest"});
     this.core.register({observerClass:this,eventName:"VmStartFailure"}).subscribe((evt:CoreEvent) => {
       this.entityTable.getData();
       this.dialog.errorReport(T("Error"),evt.data.reason,evt.data.trace.formatted);
     })
     this.core.register({observerClass:this,eventName:"VmStopFailure"}).subscribe((evt:CoreEvent) => {
      this.entityTable.getData();
      this.dialog.errorReport(T("Error"),evt.data.reason,evt.data.trace.formatted);
    })
    this.core.register({observerClass:this,eventName:"VmCloneFailure"}).subscribe((evt:CoreEvent) => {
      this.entityTable.getData();
      this.dialog.errorReport(T("Error"),evt.data.reason,evt.data.trace.formatted);
    })
    this.core.register({observerClass:this,eventName:"VmDeleteFailure"}).subscribe((evt:CoreEvent) => {
      this.entityTable.getData();
      this.dialog.errorReport(T("Error"),evt.data.reason,evt.data.trace.formatted);
    })
    this.core.register({observerClass:this,eventName:"VmProfiles"}).subscribe((evt:CoreEvent) => {
      this.entityTable.getData();
    });

    this.controlEvents.subscribe((evt:CoreEvent) => {
      console.log(evt);
    });
  }

  checkVnc(vm){
    const devices = vm.devices
    if(!devices || devices.length === 0){
      return false;
    };
    if(vm.bootloader === 'GRUB' || vm.bootloader === "UEFI_CSM" ){
      return false;
    };
    for(let i=0; i < devices.length; i++){
      if(devices && devices[i].dtype === "VNC") {
        return true;
      }
    }
  }

  setTransitionState(str:string, vm:any){
    let index = this.table.rows.indexOf(vm);
    this.table.rows[index].state = str;
  }

  vncPort(vm){
    const devices = vm.devices
    if(!devices || devices.length === 0){
      return false;
    };
    if(vm.bootloader === 'GRUB' || vm.bootloader === "UEFI_CSM" ){
      return false;
    };
    for(let i=0; i < devices.length; i++){
      if(devices && devices[i].dtype === "VNC") {
        return devices[i].attributes.vnc_port;
      }
    }
  }

  onCheckboxChange(row) {
    row.autostart = !row.autostart;
    this.ws.call('vm.update', [row.id, {'autostart': row.autostart}] )
    .subscribe((res) => {
      if (!res) {
        row.autostart = !row.autostart;
      }
    });
  }

  onSliderChange(row) {
    if(row['status']['state'] === "RUNNING") {
      const eventName = "VmStop";
      this.core.emit({name: eventName, data:[row.id]});
      this.setTransitionState("STOPPING", row)
    } else {
      const eventName = "VmStart";
      let args = [row.id];
      let overcommit = [{'overcommit':false}];
      const dialogText = T("Memory overcommitment allows multiple VMs to be launched when there is not enough free memory for configured RAM of all VMs. Use with caution.")
      let startDialog = this.dialog.confirm(T("Power"), undefined, true, T("Power On"), true, T('Overcommit Memory?'), undefined, overcommit, dialogText)
      startDialog.afterClosed().subscribe((res) => {
        if (res) {
          let checkbox = startDialog.componentInstance.data[0].overcommit;
          args.push({"overcommit": checkbox});
          this.core.emit({name: eventName, data:args});
          this.setTransitionState("STARTING", row);
        } 
      });
    }
  }

  ngOnDestroy(){
    this.core.unregister({observerClass:this});
  }
}
