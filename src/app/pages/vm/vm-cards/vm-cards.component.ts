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
  protected showActions = false;
  protected hasDetails = true;
  protected rowDetailComponent = VmDetailsComponent;

  protected entityTable: EntityTableComponent;

  public columns: Array<any> = [
    {name : T('Name'), prop : 'name', always_display: true },
    {name : T('State'), prop : 'state', always_display: true, toggle: true },
    {name : T('Autostart'), prop : 'autostart',hidden: false, selectable: true},
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
