import { Injectable } from '@angular/core';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { ApiService } from 'app/core/services/api.service';

interface StatSource {
  name:string;
  prefix:string;
  keys: string[];
  properties: string[];
  available:string[];
  listeners: ListenerRegistration[];
  realtime:boolean;
  messages?:any;
}

interface ListenerRegistration {
  name:string;
  obj:any; // The component trying to register
  key?:string; // No key means you want everything
  message?:CoreEvent;
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

  // Master Sources List
  private sources:StatSource[] = [
    {
      name:"CpuAggregate",
      prefix: "aggregation-cpu-",
      keys:["average", "max","min","num","stddev","sum"],
      properties:[],
      available:[],
      realtime:false,
      listeners:[]
    },
    {
      name:"Cpu",
      prefix: "cpu-",
      keys:["any"],
      properties:[],
      available:[],
      realtime:true,
      listeners:[]
    },
    {
      name:"CpuTemp",
      prefix: "cputemp-",
      keys:["any"],
      properties:[],
      available:[],
      realtime:true,
      listeners:[]
    },
    {
      name:"Devices",
      prefix: "ctl-",
      keys:["any"],
      properties:[],
      available:[],
      realtime:false,
      listeners:[]
    },
    {
      name:"Mounts",
      prefix: "df-mnt",
      keys:["any"],
      properties:[],
      available:[],
      realtime:false,
      listeners:[]
    },
    {
      name:"Disks",
      prefix: "disk-",
      keys:["any"],
      properties:[],
      available:[],
      realtime:true,
      listeners:[]
    },
    {
      name:"DiskTemps",
      prefix: "disktemp-",
      keys:["any"],
      properties:[],
      available:[],
      realtime:true,
      listeners:[]
    },
    {
      name:"GEOM",
      prefix: "geom_",
      keys:["stat"],
      properties:[],
      available:[],
      realtime:false,
      listeners:[]
    },
    {
      name:"NIC",
      prefix: "interface-",
      keys:["any"],
      properties:[],
      available:[],
      realtime:false,
      listeners:[]
    },
    {
      name:"System",
      prefix: "",
      keys:["load", "processes", "uptime","swap"],
      properties:[],
      available:[],
      realtime:true,
      listeners:[]
    },
    {
      name:"Memory",
      prefix: "",
      keys:["memory"],
      properties:[],
      available:[],
      realtime:false,
      listeners:[]
    },
    {
      name:"FileSystem",
      prefix: "zfs_",
      keys:["any"],
      properties:[],
      available:[],
      realtime:false,
      listeners:[]
    }
  ];

  //private sourcesRealtime: StatSource[] = [];
  //private sources: StatSource[] = [];
  private messages: any[] = [];
  private messagesRealtime: any[] = [];
  private listeners: any[] = [];
  private queue:any[] = [];
  private started:boolean = false;
  private bufferSize:number = 15000;// milliseconds
  private bufferSizeRealtime:number = 1000;// milliseconds
  private broadcastId:number;
  private broadcastRealtimeId:number;

  constructor(private core:CoreService, private api:ApiService) {
    console.log("*** New Instance of Stats Service ***");

    this.core.emit({name:"StatsSourcesRequest"});

    this.core.register({observerClass:this,eventName:"StatsAddListener"}).subscribe((evt:CoreEvent) => {
      this.addListener(evt.data);
    });

    this.core.register({observerClass:this,eventName:"StatsRemoveListener"}).subscribe((evt:CoreEvent) => {
      this.removeListener(evt.data.obj);
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
      //this.core.emit({ name:"StatsRequest", data:[[{source:'aggregation-cpu-sum',type:'cpu-user', 'dataset':'value'}],{step:'10',start:'now-10m'}] });
      }); 

  }

  setupBroadcast(){
    this.core.emit({name:"StatsSourcesRequest"});
  }

  startBroadcast(){
    console.log("Starting Broadcast...");
    console.log(this.messages);
    console.log(this.messagesRealtime);
    //if(this.sources.length > 0){
    this.broadcast(this.messages, this.bufferSize);
    //}
    //if(this.sourcesRealtime.length > 0){
    this.broadcast(this.messagesRealtime, this.bufferSizeRealtime);
    //}
    }

  stopBroadcast(messageList?){
    if(messageList && messageList == this.messagesRealtime){
      clearInterval(this.broadcastRealtimeId);
    } else if(messageList && messageList == this.messages){
      clearInterval(this.broadcastId);
    } else {
      clearInterval(this.broadcastRealtimeId);
      clearInterval(this.broadcastId);
    }
  }

  broadcast(messages:CoreEvent[],buffer){
    // Recurring loop
    let i = 1;
    let intervalId =  setInterval(()=>{
      // Reset Counter
      if(i < messages.length){
        i++
      } else {
        i = 1;
      }
      let index = i-1;
      // Avoid error
      let job = messages[index];
      if(index < messages.length){
        //console.log(messages);
        if(buffer == 15000){
          console.warn(job);
        } else {
          console.log(job);
        }
        //console.log(job);
        /*for(let jobIndex = 0; jobIndex < job.length; job++){
          let message = job[jobIndex];
          //console.log(message);
        }*/
      }
    },buffer);

    // Store interval id so we can stop it later.
    if(messages == this.messages){
      this.broadcastId == intervalId;
    } else if(messages == this.messagesRealtime){
      this.broadcastRealtimeId == intervalId;
    }
  }

  buildMessage(key,source):CoreEvent{
    let options = {step:'10',start:'now-10m'}
    let dataList = [];
    let src = source.prefix + key;
    if(source.keys[0] == "any"){
      src = key;
    }
    for(let prop in source.properties){
      dataList.push({
        source:src,//"aggregation-cpu-sum",
        type:source.properties[prop],
        dataset:"value"
      });
    }
    let message =  { name:"StatsRequest", data:[ [dataList, options ] ]};
    return message;
  }

  checkAvailability(){
  }

  updateSources(data:any){
    let dataSources = Object.keys(data);
    // Clear message lists
    this.started = false;
    this.stopBroadcast();
    this.messages = [];
    this.messagesRealtime = [];

    for(let i = 0; i < this.sources.length; i++){
      //DEBUG: console.log("UpdateSources Loop");
      let source = this.sources[i];
      let available = [];

      source.keys.forEach((item,index) => {
        // WildCard
        if(source.keys[0] == "any"){
          let matches = dataSources.filter((x)=> {
            return x.startsWith(source.prefix);
          });
          //DEBUG: console.warn(matches);
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
         //DEBUG: console.log("UpdateSources Setting Properties");
         source.properties = data[source.available[0]];
       }

       // Generate Messages
       this.updateListeners(source);
    }

    //this.startBroadcast();
    if(this.started){
      this.startBroadcast();
    }

  }

  // Updates listeners in this.sources with messages
  updateListeners(source:StatSource){
    for(let i = 0; i < source.listeners.length; i++){
      let reg = source.listeners[i];

      // Abort if data source not available
      if(reg.key && source.keys.indexOf(reg.key) == -1){
        reg.message = null;
        continue;
      }
      
      let keychain = [];
      if(!reg.key){
        keychain = source.available;
      } else {
        keychain.push(reg.key.toLowerCase());
      }

      let messageList; 
      if(source.realtime){
        messageList = this.messagesRealtime;
      } else {
        messageList = this.messages;
      }

      let job: CoreEvent[] = [];
      for(let i = 0; i < keychain.length; i++){
        let message = this.buildMessage(keychain[i], source);
        reg.message = message;
  
        if(job.indexOf(message) == -1){
         job.push(message);
        }
      }
      messageList.push(job);
    }

    if(source.listeners.length > 0){
      this.started = true;
    }
  }

  addListener(reg: ListenerRegistration){
    let index = this.findSource(reg.name);
    let source = this.sources[this.findSource(reg.name)];

    // Make sure listener registration is unique
    if(source.listeners.indexOf(reg) == -1){
      source.listeners.push(reg);
    }

  }

  removeListener(obj:any){
    console.warn("REMOVING LISTENER")
    console.log(obj);
    let messageList;
     // Remove from sources
     for(let i = 0; i < this.sources.length; i++){
       for(let index = 0; index < this.sources[i].listeners.length; index++){
         if(this.sources[i].listeners[index].obj == obj){
           this.sources[i].listeners.splice(index,1);
           if(this.sources[i].realtime){
            messageList = this.messagesRealtime;
           } else {
            messageList = this.messages;
           }
         }
       }
     }

     if(messageList.length = 0){
       this.stopBroadcast(messageList);
     }
  }

  findListener(obj:any, listeners:ListenerRegistration[]){
    let index:number;
    for(let i = 0; i < listeners.length; i++){
      if(listeners[i].obj == obj){ index = i;}
    }
    if(!index){
      return -1;
    } else {
      return index;
    }
  }

  findSource(name:string){
    let index:number;
    for(let i = 0; i < this.sources.length; i++){
      if(name == this.sources[i].name){ 
        index = i;
      }
    }
    if(index || index == 0){
      return index;
    } else {
      return -1;
    }
  }

}
