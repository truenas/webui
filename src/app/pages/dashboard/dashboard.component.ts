import { Component, OnInit, AfterViewInit, ViewChild,OnDestroy } from '@angular/core';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
//import { StatsService } from 'app/services/stats.service';
import { SystemProfiler } from 'app/core/classes/system-profiler';
//import { StatsUtils } from 'app/core/classes/stats-utils';

import { Subject } from 'rxjs';
import { WidgetComponent } from 'app/core/components/widgets/widget/widget.component'; // POC
import { WidgetPoolComponent } from 'app/core/components/widgets/widgetpool/widgetpool.component';

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
  //public statsData: StatsUtils;
  private statsEvents: any;
  private statsEventsTC: any;
  public tcStats: any;

  public isFooterConsoleOpen: boolean;

  // For widgetpool
  public system: any;
  public system_product: string = "Generic";
  public pools: any[] = [];
  //public volumes: VolumeData[] = [];
  //public disks:Disk[] = [];

  public nics: any[] = [];

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
    //this.ws.unsub();
    //this.statsEvents.unsubscribe();
    this.statsEvents.complete();
    this.statsEventsTC.complete();
    //this.statsEventsTC.unsubscribe();
    this.statsDataEvents.complete();
    this.core.unregister({observerClass:this});
  }

  init(){

    this.statsEvents = this.ws.sub("reporting.realtime").subscribe((evt)=>{
      if(evt.memory_summary){
        console.log("LEAK!!");
        return;
      }
      
      if(evt.cpu){
        this.statsDataEvents.next({name:"CpuStats", data:evt.cpu});
      }
      if(evt.virtual_memory){
        this.statsDataEvents.next({name:"MemoryStats", data:evt.virtual_memory});
      }
    });

    this.statsEventsTC = this.ws.sub("trueview.stats:10").subscribe((evt)=>{
      if(evt.virtual_memory){return;}// TC and MW subscriptions leak into each other.
        
      evt.network_usage.forEach((item, index) => {
        this.statsDataEvents.next({name:"NetTraffic_" + item.name, data:item});
      });

      if(evt.memory_summary){

      } 
    });

    this.core.register({observerClass:this,eventName:"NicInfo"}).subscribe((evt:CoreEvent) => {
      let clone = Object.assign([],evt.data);
      let removeNics = {};

      // Store keys for fast lookup
      let nicKeys = {};
      evt.data.forEach((item, index) => {
        nicKeys[item.name] = index.toString();
      });
        
      // Process Vlans (attach vlans to their parent)
      evt.data.forEach((item, index) => {
        if(item.type !== "VLAN" && !clone[index].state.vlans){
          clone[index].state.vlans = [];
        }

        if(item.type == "VLAN"){
          let parentIndex = parseInt(nicKeys[item.state.parent]);
          if(!clone[parentIndex].state.vlans) {
            clone[parentIndex].state.vlans = [];
          }

          clone[parentIndex].state.vlans.push(item.state);
          removeNics[item.name] = index;
        }
      })

      // Process LAGGs
      evt.data.forEach((item, index) => {
        if(item.type == "LINK_AGGREGATION" ){
          clone[index].state.lagg_ports = item.lag_ports;
          item.lag_ports.forEach((nic) => {
            // Consolidate addresses 
            clone[index].state.aliases.forEach((item) => { item.interface = nic});
            clone[index].state.aliases = clone[index].state.aliases.concat(clone[nicKeys[nic]].state.aliases);

            // Consolidate vlans
            clone[index].state.vlans.forEach((item) => { item.interface = nic});
            clone[index].state.vlans = clone[index].state.vlans.concat(clone[nicKeys[nic]].state.vlans);
            
            // Mark interface for removal
            removeNics[nic] = nicKeys[nic];
          });
        }
      });

      // Remove NICs from list
      for(let i = clone.length - 1; i >= 0; i--){
        if(removeNics[clone[i].name]){ 
          // Remove
          clone.splice(i, 1)
        } else {
          // Only keep INET addresses
          clone[i].state.aliases = clone[i].state.aliases.filter(address => address.type == "INET");
        }
      }
      
      // Update NICs array
      this.nics = clone;
    });

    this.core.emit({name:"VolumeDataRequest"});
    //this.core.emit({name:"DisksInfoRequest"});
    this.core.emit({name:"NicInfoRequest"});
    this.getDisksData();
  }

  getDisksData(){

    this.core.register({observerClass: this, eventName: 'PoolData'}).subscribe((evt:CoreEvent) => {
      //this.system.pools = evt.data;
      this.pools = evt.data;
    });

    this.core.register({observerClass: this, eventName: 'SysInfo'}).subscribe((evt:CoreEvent) => {
      this.core.emit({name: 'PoolDataRequest', sender: this});
    });
    this.core.emit({name: 'SysInfoRequest', sender: this});
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
