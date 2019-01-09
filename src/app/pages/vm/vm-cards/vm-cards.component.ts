import { Component} from '@angular/core';
import { Router } from '@angular/router';
import { WebSocketService, RestService } from '../../../services/';
import { DialogService } from '../../../services/dialog.service';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';




import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { MatDialog } from '@angular/material';
import 'rxjs/add/observable/interval';
import {EntityTableComponent} from '../../common/entity/entity-table/';

@Component({
  selector: 'app-vm-cards',
  template: `
  <vm-summary></vm-summary>
  <entity-table [title]="title" [conf]="this"></entity-table>`
})
export class VmCardsComponent  {

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
    {name : 'Name', prop : 'name', always_display: true },
    {name : 'State', prop : 'state', always_display: true },
    {name : 'VNC Port', prop : 'port', hidden: true},
    {name : 'Type', prop : 'vm_type', hidden: false},
    {name : 'Description', prop : 'description', hidden: true },
    {name : 'Virtual CPUs', prop : 'vcpus', hidden: false},
    {name : 'Memory Size (MiB)', prop : 'memory',hidden: false}, 
    {name : 'Boot Loader Type', prop : 'bootloader', hidden: true },
    {name: 'Autostart', prop : 'autostart',hidden: false},
    
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
  };
  

  constructor(protected router: Router, protected rest: RestService, protected ws: WebSocketService,
              private core:CoreService,private dialog: DialogService,protected loader: AppLoaderService,
              protected matdialog: MatDialog
              ) {}


  resourceTransformIncomingRestData(vms) {
    for (let vm_index = 0; vm_index<vms.length; vm_index++){
      vms[vm_index]['state'] = vms[vm_index]['status']['state'];
      vms[vm_index]['pid'] = vms[vm_index]['status']['pid'];
      if (this.checkVnc(vms[vm_index])) {
        vms[vm_index]['port'] = this.vncPort(vms[vm_index]);
      } else {
        vms[vm_index]['port'] = 'N/A';

      };
    }
    return vms;
  }

  afterInit(entityTable: EntityTableComponent) { 
    this.entityTable = entityTable;
    Observable.interval(5000).subscribe(() => {
      this.entityTable.getData();
     });
  }

  getActions(row) {
    const actions = [];
    if(row['status']['state'] === "RUNNING"){
      actions.push({
        id : "poweroff",
        label : "Power Off",
        onClick : (row) => {
          const eventName = "VmPowerOff";
          this.core.emit({name: eventName, data:[row.id]});
        }
      });
      actions.push({
        id : "stop",
        label : "Stop",
        onClick : (row) => {
          const eventName = "VmStop";
          this.core.emit({name: eventName, data:[row.id]});
        }
      });
    } else {
      actions.push({
        id : "start",
        label : "Start",
        onClick : (row) => {
          const eventName = "VmStart";
          this.core.emit({name: eventName, data:[row.id]});
        }
      });
    }
    actions.push({
      label : "Edit",
      onClick : (row) => {
        this.router.navigate(
            new Array('').concat([ "vm", "edit", row.id ]));
      }
    });
    actions.push({
      label : "Delete",
      onClick : (row) => {
        this.core.emit({name:"VmDelete", data:[row.id,row]});
      },
    });
    actions.push({
      label : "Devices",
      onClick : (row) => {
        this.router.navigate(
            new Array('').concat([ "vm", row.id, "devices", row.name ]));
      }
    });
    if(row['status']['state'] === "RUNNING"){
      if (this.checkVnc(row)) {
        actions.push({
        label : "VNC",
        onClick : (vnc_vm) => {
          this.ws.call('vm.get_vnc_web', [ vnc_vm.id ]).subscribe((res) => {
            for (const vnc_port in res){
              window.open(res[vnc_port])
              }
            });
          }
        });
      }
      actions.push({
        label : "Serial",
        onClick : (vm) => {
          this.router.navigate(
            new Array('').concat([ "vm","serial", vm.id])
          );
        }
      });

    }

    return actions;
  }
  getAddActions() {
    return [{
        label: "Add Docker Container",
        onClick: () => {
          this.router.navigate(
            new Array('').concat(["vm", "dockerwizard"]));
        }
      }]
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
}
