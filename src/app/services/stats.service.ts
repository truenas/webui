import { Injectable } from '@angular/core';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { ApiService } from 'app/core/services/api.service';

interface StatSource {
  name:string;
  prefix:string;
  keys: string[];
  properties: string[];
  available:string[];
  listeners: any[];
}

@Injectable()
export class StatsService {

  /*
   *  !IMPORTANT
   *  For anybody that might decide to come in and refactor this code later on.
   *  Below is an example of what the call you are trying to build looks like...
   *  
   *  Example message 
   *  this.core.emit({ name:"StatsRequest", data:[ [{source:'aggregation-cpu-sum',type:'cpu-user', 'dataset':'value'}], {step:'10',start:'now-10m'} ] });
   */


  private sources:StatSource[] = [
    {
      name:"CpuAggregate",
      prefix: "aggregation-cpu-",
      keys:["average", "max","min","num","stddev","sum"],
      properties:[],
      available:[],
      listeners:[]
    },
    {
      name:"Cpu",
      prefix: "cpu-",
      keys:["any"],
      properties:[],
      available:[],
      listeners:[]
    },
    {
      name:"CpuTemp",
      prefix: "cputemp-",
      keys:["any"],
      properties:[],
      available:[],
      listeners:[]
    },
    {
      name:"Devices",
      prefix: "ctl-",
      keys:["any"],
      properties:[],
      available:[],
      listeners:[]
    },
    {
      name:"Mounts",
      prefix: "df-mnt",
      keys:["any"],
      properties:[],
      available:[],
      listeners:[]
    },
    {
      name:"Disks",
      prefix: "disk-",
      keys:["any"],
      properties:[],
      available:[],
      listeners:[]
    },
    {
      name:"DiskTemps",
      prefix: "disktemp-",
      keys:["any"],
      properties:[],
      available:[],
      listeners:[]
    },
    {
      name:"GEOM",
      prefix: "geom_",
      keys:["stat"],
      properties:[],
      available:[],
      listeners:[]
    },
    {
      name:"NIC",
      prefix: "interface-",
      keys:["any"],
      properties:[],
      available:[],
      listeners:[]
    },
    {
      name:"System",
      prefix: "",
      keys:["load", "processes", "uptime","swap"],
      properties:[],
      available:[],
      listeners:[]
    },
    {
      name:"Memory",
      prefix: "",
      keys:["memory"],
      properties:[],
      available:[],
      listeners:[]
    },
    {
      name:"FileSystem",
      prefix: "zfs_",
      keys:["any"],
      properties:[],
      available:[],
      listeners:[]
    }
  ];

  private listeners: any[] = [];
  private started:boolean = false;
  private bufferSize:number = 1000;// milliseconds

    constructor(private core:CoreService, private api:ApiService) {
      console.log("*** New Instance of Stats Service ***");

      this.core.emit({name:"StatsSourcesRequest"});

      this.core.register({observerClass:this,eventName:"StatsAddListener"}).subscribe((evt:CoreEvent) => {
        this.addListener(evt.sender, evt.data);
      });

      this.core.register({observerClass:this,eventName:"StatsData"}).subscribe((evt:CoreEvent) => {
        console.log(evt);
      });

      this.core.register({observerClass:this,eventName:"StatsSources"}).subscribe((evt:CoreEvent) => {
        //this.checkAvailability(evt.data);
        console.log("**** StatsSources ****");
        console.log(evt.data);
        this.updateSources(evt.data);
        console.warn(this.sources);

        this.core.emit({ name:"StatsRequest", data:[[{source:'aggregation-cpu-sum',type:'cpu-user', 'dataset':'value'}],{step:'10',start:'now-10m'}] });
      }); 

    }

    setupBroadcast(){
      this.core.emit({name:"StatsSourcesRequest"});
    }

    startBroadcast(source?:string){
      //if(!this.started ){}
      }

    checkAvailability(){
    }

    updateSources(data:any){
      let dataSources = Object.keys(data);

      for(let i = 0; i < this.sources.length; i++){
        let source = this.sources[i];
        let available = [];

        source.keys.forEach((item,index) => {
          // WildCard
          if(source.keys[0] == "any"){
            let matches = dataSources.filter((x)=> {
              return x.startsWith(source.prefix);
            });
            let a = matches.forEach((item) => {
              available.push(item);
            });
          } else {
            if(dataSources.indexOf(source.prefix + item) !== -1){
              available.push(source.prefix + item);
            }
          }
        });
        source.available = available;

        // Store properties
        if(source.available.length > 0){
          source.properties = data[source.available[0]];
        }
      }
    }

    matchKey(){
    }

    addListener(obj:any,sources: string[]){

      // Check to see if obj is listed
      let test = this.listeners.indexOf(obj);
      if(this.listeners.length == 0 || test == -1){
        this.listeners.push(obj);
      } else {
        console.warn("Listener already added");
      }

      if(!this.started){
        this.startBroadcast();
      }

    }

    removeListener(obj:any){
      for(let i  = 0; i < this.listeners.length; i++){
        if(this.listeners[i] == obj){
          this.listeners.splice(i,1);
        }
      }
    }

}
