import { Component, OnInit, AfterViewInit, ViewChild,OnDestroy } from '@angular/core';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
//import { StatsService } from 'app/services/stats.service';
import { SystemProfiler } from 'app/core/classes/system-profiler';
import { StatsUtils } from 'app/core/classes/stats-utils';

import { Subject } from 'rxjs';
import { WidgetComponent } from 'app/core/components/widgets/widget/widget.component'; // POC
import { Disk, VolumeData } from 'app/core/components/widgets/widgetpool/widgetpool.component';

import {RestService,WebSocketService} from '../../services/';

@Component({
  selector: 'dashboard',
  templateUrl:'./dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class DashboardComponent implements OnInit,OnDestroy {
 
  public large: string = "lg";
  public medium: string = "md";
  public small: string = "sm";
  public zPoolFlex:string = "100";
  public noteFlex:string = "23";

  public statsDataEvents:Subject<CoreEvent>;
  public statsData: StatsUtils;
  private statsEvents: any;
  private statsEventsTC: any;

  public isFooterConsoleOpen: boolean;

  // For widgetpool
  public volumes: VolumeData[] = [];
  public disks:Disk[] = [];

  public animation = "stop";
  public shake = false;

  public showSpinner: boolean = true;

  constructor(protected core:CoreService, /*stats: StatsService,*/ protected ws: WebSocketService){
    //this.core.emit({name:"StatsAddListener", data:{name:"CpuAggregate", key:"sum", obj:this }});
    //this.core.emit({name:"StatsAddListener", data:{name:"CpuAggregate", key:"average", obj:this }});
    //this.core.emit({name:"StatsAddListener", data:{name:"CpuAggregate", key:"test", obj:this }});
    /*this.core.emit({name:"StatsAddListener", data:{name:"Cpu", obj:this }});
    setTimeout(() => {
      this.core.emit({name:"StatsRemoveListener", data:{name:"Cpu", obj:this} });
    }, 20000);*/

    this.statsDataEvents = new Subject<CoreEvent>();
  }

  ngOnInit(){

    this.init();

    this.ws.call('system.advanced.config').subscribe((res)=> {
      if (res) {
        this.isFooterConsoleOpen = res.consolemsg;
      }
    });

  }

  ngOnDestroy(){
    //this.core.emit({name:"StatsKillAll", sender:this});
    this.statsEvents.unsubscribe();
    this.statsEventsTC.unsubscribe();
    this.statsDataEvents.complete();
    this.core.unregister({observerClass:this});
  }

  init(){
    this.statsData = new StatsUtils();

    //this.statsEvents = this.ws.job("reporting.realtime",[{"name": "cpu", "identifier": null}]).subscribe((evt)=>{
    this.statsEvents = this.ws.sub("reporting.realtime").subscribe((evt)=>{
      if(!evt.virtual_memory){return;}
      //console.log(evt);
      //this.statsDataEvents.next({name:"CpuStats", data:evt.cpu});
      //this.statsDataEvents.next({name:"MemoryStats", data:evt.virtual_memory});
    });

    this.statsEventsTC = this.ws.sub("trueview.stats:10").subscribe((evt)=>{
      if(evt.memory_summary){
        //console.log(evt);

        //this.statsData.updateStats(evt);
        //let cpuLoad = this.statsData.cpuLoad();
        //console.log(cpuLoad);
      } else if(evt.virtual_memory){
        //console.log(evt);
        this.statsDataEvents.next({name:"CpuStats", data:evt.cpu});
      }
    });

    this.core.register({observerClass:this,eventName:"VolumeData"}).subscribe((evt:CoreEvent) => {
      this.setPoolData(evt);
    });

    this.core.register({observerClass:this,eventName:"DisksInfo"}).subscribe((evt:CoreEvent) => {
      this.setDisksData(evt);
    });

    this.core.emit({name:"VolumeDataRequest"});
    this.core.emit({name:"DisksInfoRequest"});
  }

  parseStats(data){
  }

  setDisksData(evt:CoreEvent){
    //DEBUG: console.log("******** DISKS INFO ********");
    //DEBUG: console.log(evt);
    for(let i in evt.data){
      let disk:Disk = {
        name:evt.data[i].name,
        smart_enabled:evt.data[i].togglesmart,
        size:Number(evt.data[i].size),
        description: evt.data[i].description,
        model: evt.data[i].model,
        enclosure_slot: evt.data[i].enclosure_slot,
        expiretime: evt.data[i].expiretime,
        hddstandby: evt.data[i].hddstandby,
        serial: evt.data[i].serial,
        smartoptions: evt.data[i].smartoptions
      }

      this.disks.push(disk);
    }
    this.showSpinner = false;
  }

  setPoolData(evt:CoreEvent){
    //DEBUG: console.log("******** ZPOOL DATA ********");
    //DEBUG: console.log(evt.data);
    let result = [];
    for(let i in evt.data){
      let avail = null;
      if (evt.data[i].children && evt.data[i].children[0]) {
        avail = evt.data[i].children[0].avail;
      }
      let zvol = {
        avail: avail,
        id:evt.data[i].id,
        is_decrypted:evt.data[i].is_decrypted,
        is_upgraded:evt.data[i].is_upgraded,
        mountpoint:evt.data[i].mountpoint,
        name:evt.data[i].name,
        status:evt.data[i].status, // RETURNS HEALTHY, LOCKED, UNKNOWN, DEGRADED, FAULTED, OFFLINE, REMOVED
        used:evt.data[i].used,
        used_pct:evt.data[i].used_pct,
        vol_encrypt:evt.data[i].vol_encrypted,
        vol_encryptkey:evt.data[i].vol_encryptkey,
        vol_guid:evt.data[i].vol_guid,
        vol_name:evt.data[i].vol_name
      }

      result.push(zvol);
    }
    this.volumes = result.sort(function(a,b){
    	var x = a.name.toLowerCase();
        var y = b.name.toLowerCase();
        if(x < y){ return -1}
        if(x > y){ return 1}
        return 0;
    });
    // this.showSpinner = false;
  }

  toggleShake(){
    if(this.shake){
      this.shake = false;
    } else if(!this.shake){
      this.shake= true;
    }
  }

  updateData(data){
    // Do Something
    }

  updateDataAll(data){
  }
}
