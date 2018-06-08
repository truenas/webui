import { Injectable } from '@angular/core';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { ApiService } from 'app/core/services/api.service';

interface StatSource {
  name:string;
  prefix:string;
  legendPrefix?: string;
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
      legendPrefix:"/cpu-",
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
      name:"DiskTemp",
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
      name:"Load",
      prefix: "",
      keys:["load"],
      properties:[],
      available:[],
      realtime:false,
      listeners:[]
    },
    {
      name:"Processes",
      prefix: "",
      legendPrefix:"/ps_state-",
      keys:["processes"],
      properties:[],
      available:[],
      realtime:false,
      listeners:[]
    },
    {
      name:"Memory",
      prefix: "",
      legendPrefix:"/memory-",
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
  private debug:boolean = false;
  private messages: any[] = [];
  private messagesRealtime: any[] = [];
  private listeners: any[] = [];
  private queue:any[] = [];
  private started:boolean = false;
  private bufferSize:number = 60000;// milliseconds
  private bufferSizeRealtime:number = 15000;// milliseconds
  private broadcastId:number;
  private broadcastRealtimeId:number;

  constructor(private core:CoreService, private api:ApiService) {
    //DEBUG: .log("*** New Instance of Stats Service ***");

    this.core.emit({name:"StatsSourcesRequest"});

    this.core.register({observerClass:this,eventName:"StatsAddListener"}).subscribe((evt:CoreEvent) => {
      this.addListener(evt.data);
    });

    this.core.register({observerClass:this,eventName:"StatsRemoveListener"}).subscribe((evt:CoreEvent) => {
      this.removeListener(evt.data.obj);
    });

    this.core.register({observerClass:this,eventName:"StatsData"}).subscribe((evt:CoreEvent) => {
      //DEBUG: .log(evt);
    });

    this.core.register({observerClass:this,eventName:"StatsSources"}).subscribe((evt:CoreEvent) => {
      //this.checkAvailability(evt.data);
      this.updateSources(evt.data);
      if(this.debug){
        //DEBUG: .log("**** StatsSources ****");
        //DEBUG: .log(evt.data);
        //DEBUG: .warn(this.sources);
      }
      //this.core.emit({ name:"StatsRequest", data:[[{source:'aggregation-cpu-sum',type:'cpu-user', 'dataset':'value'}],{step:'10',start:'now-10m'}] });
      }); 

  }

  setupBroadcast(){
    this.core.emit({name:"StatsSourcesRequest"});
  }

  startBroadcast(){
    this.started = true;
    if(this.debug){
      //DEBUG: .log("Starting Broadcast...");
    }
    
    this.broadcast(this.messages, this.bufferSize); 
    this.broadcast(this.messagesRealtime, this.bufferSizeRealtime); 
  }

  stopBroadcast(messageList?){
    this.started = false;
    if(this.debug){
      //DEBUG: .log("Stopping Broadcast!");
    }
    if(messageList && messageList == this.messagesRealtime){
      clearInterval(this.broadcastRealtimeId);
    } else if(messageList && messageList == this.messages){
      clearInterval(this.broadcastId);
      //DEBUG: .log(this.broadcastId);
    } else {
      clearInterval(this.broadcastRealtimeId);
      clearInterval(this.broadcastId);
    }

  }

  broadcast(messages:CoreEvent[],buffer){
    if(messages.length == 0){
      //DEBUG: .warn("Timer only runs when message list is not empty");
      return ;
    }

    // B4 looping dispatch all messages
    this.dispatchAllMessages(messages);

    // Recurring loop
    let i = 1;
    let id;
    if(messages == this.messages){
      this.broadcastId =  setInterval(()=>{
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
            //console.warn(job);
            this.jobExec(job);
          } else {
            //console.log(job);
            this.jobExec(job);
          }
        }
      },buffer);
    } else if(messages == this.messagesRealtime) {
      this.broadcastRealtimeId =  setInterval(()=>{
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
            //console.warn(job);
            this.jobExec(job);
          } else {
            //console.log(job);
            this.jobExec(job);
          }
        }
      },buffer);
    }
  }

  dispatchAllMessages(messages){
    for(let i = 0; i < messages.length; i++){
      let job = messages[i];
      this.jobExec(job);
    }
  }

  buildMessage(key,source):CoreEvent{
    let options = {step:'10',start:'now-10m'}
    let dataList = [];
    let src = source.prefix + key;
    let eventName;
    if(source.keys[0] == "any"){
      src = key;
      let spl = key.split(source.prefix);
      let suffix = spl[1];
      eventName = source.name + suffix;
    } else if(source.name == this.capitalize(key)){
      eventName = source.name;
    } else {
      eventName = source.name + this.capitalize(key);
    }
    for(let prop in source.properties){
      // Filter this because it's never wanted
      // If more props need to be filtered,
      // move to dedicated method.
      if(source.properties[prop] == "cpu-idle" || source.properties[prop] == "ps_state-idle"){
        continue;
      }
      dataList.push({
        source:src,//"aggregation-cpu-sum",
        type:source.properties[prop],
        dataset:"value"
      });
    } 
    let messageData;
    if(source.legendPrefix){
      messageData = {responseEvent:eventName, legendPrefix: src + source.legendPrefix, args: [dataList, options ]};
    } else {
      messageData = {responseEvent:eventName, args: [dataList, options ]};
    }
    let message =  { name:"StatsRequest", data: messageData};
    return message;
  }

  capitalize(str:string){
    let cap = str[0].toUpperCase();
    let restOfWord = str.substring(1, str.length);
    return cap + restOfWord;
  }

  jobExec(job){
    if(this.debug){
      //DEBUG: .log("JOB STARTING...");
    }
    for(let i  = 0; i < job.length; i++){
      let message = job[i];
      if(this.debug){
        //DEBUG: .log(message);
      }
      this.core.emit(message);
    }
    if(this.debug){
      //DEBUG: .log("JOB FINISHED")
    }
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
    if(this.messages.length > 0 || this.messagesRealtime.length > 0){
      this.startBroadcast();
    }

  }

  // Updates listeners in this.sources with messages
  updateListeners(source:StatSource, removed?){
    for(let i = 0; i < source.listeners.length; i++){
      let messageList; 
      if(source.realtime){
        messageList = this.messagesRealtime;
      } else {
        messageList = this.messages;
      }

      if(source.listeners.length > 0){
        let oldJobIndex:number;
        if(removed){
          let removedIndex = source.listeners.indexOf(removed);
          oldJobIndex = this.findJob(messageList, removed.message);
          source.listeners.splice(removedIndex, 1);
        } else {
          oldJobIndex = this.findJob(messageList, source.listeners[0].message);
        }
        // If there is a previous job 
        // from this source then remove it
        if(oldJobIndex != -1){
          messageList.splice(oldJobIndex, 1);
        }
        if(source.listeners.length == 0){
          return ;
        }
      }
      
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
    let test = this.hasListeners();
    if(!this.started && !test){
      this.setupBroadcast();
    }

    let index = this.findSource(reg.name);
    let source = this.sources[this.findSource(reg.name)];

    // Make sure listener registration is unique
    if(source.listeners.indexOf(reg) == -1){
      source.listeners.push(reg);
      this.updateListeners(source);
    }    
  }

  removeListener(obj:any){
    if(this.debug){
      //DEBUG: .warn("REMOVING LISTENER")
      //DEBUG: .log(obj);
    }
    let messageList;
     // Remove from sources
     for(let i = 0; i < this.sources.length; i++){
       for(let index = 0; index < this.sources[i].listeners.length; index++){
         if(this.sources[i].listeners[index].obj == obj){
           //this.sources[i].listeners.splice(index,1);
           if(this.sources[i].realtime){
            messageList = this.messagesRealtime;
           } else {
            messageList = this.messages;
           }
           this.updateListeners(this.sources[i], this.sources[i].listeners[index]);
         }
       }
     }

     if(messageList.length == 0){
       //DEBUG: .log("REMOVE LISTENER METHOD STOPPING BROADCAST");
       this.stopBroadcast(messageList);
     }
  }

  hasListeners():boolean{
    for(let i = 0; i > this.sources.length; i++){
      if(this.sources[i].listeners.length > 0){
        return true;
      }
    }
    return false;
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

  findJob(messageList, message){
    for(let i = 0; i < messageList.length; i++){
      let job = messageList[i];
      if(job.indexOf(message) != -1){
        return i;
      }
    }
    return -1;
  }

}
