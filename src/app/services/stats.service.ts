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
  keysAsDatasets:boolean;
  datasetsType?:string; // Use this if keysAsDatasets == true 
  bidirectional?:string; // Use strings like eg. "rx/tx" or "read/write"
  merge?:boolean; // Sources like CPU temps by the core will be merged by the name property
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
   *  This Service serves three purposes:
   *  1 - Checks for sources before requests are made
   *  2 - Handles the API request (requests only! Responses are sent directly to the observers)
   *  3 - Repeats the requests at certain intervals to keep stats somewhat current
   *
   *  !IMPORTANT
   *  For anybody that might decide to come in and refactor this code later on.
   *  Below is an example of what the call you are trying to build looks like...
   *  
   *  Example message 
   *  this.core.emit({ name:"StatsRequest", data:[ [{source:'aggregation-cpu-sum',type:'cpu-user', 'dataset':'value'}], {step:'10',start:'now-10m'} ] });
   *  
   *  ABOUT DATASETS
   *  Most stats will have their type vary and the dataset equal to 'value'
   *  However, there are other cases where the type will be the same and the dataset 
   *  will vary. For example, the 'if_packets' stat has two varieties both with the
   *  type set to 'if_packets' but the dataset will be either 'tx' or 'rx'.
   *  For these cases, set the keysAsDatasets to true and set the datasetsType to 
   *  what the type value should be.
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
      listeners:[],
      keysAsDatasets: false
    },
    {
      name:"Cpu",
      prefix: "cpu-",
      keys:["any"],
      properties:[],
      available:[],
      realtime:false, // was true
      listeners:[],
      keysAsDatasets: false
    },
    {
      name:"CpuTemp",
      prefix: "cputemp-",
      keys:["any"],
      properties:[],
      available:[],
      realtime:false, // was true
      listeners:[],
      keysAsDatasets: false,
      merge: true
    },
    {
      name:"Devices",
      prefix: "ctl-",
      keys:["any"],
      properties:[],
      available:[],
      realtime:false,
      listeners:[],
      keysAsDatasets: false
    },
    {
      name:"Mounts",
      prefix: "df-mnt",
      keys:["any"],
      properties:[],
      available:[],
      realtime:false,
      listeners:[],
      keysAsDatasets: false
    },
    {
      name:"Disks",
      prefix: "disk-",
      keys:["any"],
      properties:[],
      available:[],
      realtime:false, // was true
      listeners:[],
      keysAsDatasets: false
    },
    {
      name:"DiskTemp",
      prefix: "disktemp-",
      keys:["any"],
      properties:[],
      available:[],
      realtime:false, // was true
      listeners:[],
      keysAsDatasets: false
    },
    {
      name:"GEOM",
      prefix: "geom_",
      keys:["stat"],
      properties:[],
      available:[],
      realtime:false,
      listeners:[],
      keysAsDatasets: false
    },
    {
      name:"System",
      prefix: "",
      keys:["load", "processes", "uptime","swap"],
      properties:[],
      available:[],
      realtime:false, // was true
      listeners:[],
      keysAsDatasets: false
    },
    {
      name:"Load",
      prefix: "",
      keys:["shortterm","midterm","longterm"],
      properties:[],
      available:[],
      realtime:false,
      listeners:[],
      keysAsDatasets: true,
      datasetsType:"load"
    },
    {
      name:"NIC",
      prefix: "interface-",
      keys:["any"],
      properties:[],
      available:[],
      realtime:false, // was true
      listeners:[],
      keysAsDatasets: false,
      bidirectional:"rx/tx"
    },
    {
      name:"Processes",
      prefix: "",
      legendPrefix:"/ps_state-",
      keys:["processes"],
      properties:[],
      available:[],
      realtime:false,
      listeners:[],
      keysAsDatasets: false
    },
    {
      name:"Memory",
      prefix: "",
      legendPrefix:"/memory-",
      keys:["memory"],//["inactive","wired","laundry","free","active", "cache"],
      properties:[],
      available:[],
      realtime:false,
      listeners:[],
      keysAsDatasets: false
    },
    {
      name:"FileSystem",
      prefix: "zfs_",
      keys:["any"],
      properties:[],
      available:[],
      realtime:false,
      listeners:[],
      keysAsDatasets: false
    }
  ];

  private debug:boolean = false;
  private messages: any[] = [];
  private messagesRealtime: any[] = [];
  private listeners: any[] = [];
  private queue:any[] = [];
  private started:boolean = false;
  private bufferSize:number = 4000;// milliseconds
  private broadcastId:number;

  constructor(private core:CoreService, private api:ApiService) {
    if(this.debug){
      console.log("*** New Instance of Stats Service ***");
    }

    this.core.emit({name:"StatsSourcesRequest"});

    this.core.register({observerClass:this,eventName:"StatsAddListener"}).subscribe((evt:CoreEvent) => {
      this.addListener(evt.data);
    });

    this.core.register({observerClass:this,eventName:"StatsKillAll"}).subscribe((evt:CoreEvent) => {
      if(this.debug){
        console.warn("SLEDGEHAMMER!!");
      }
      this.stopBroadcast();
      this.removeAllListeners();
      this.messages = [];
    })

    this.core.register({observerClass:this,eventName:"StatsRemoveListener"}).subscribe((evt:CoreEvent) => {
      if(this.debug){
        console.warn("SCALPEL!!");
      }
      this.removeListener(evt.data.obj);
      if(this.debug){
        console.warn("StatsRemoveListener Tasks Completed for...")
        console.log(evt.data.obj);
        console.log(this.listeners);
        console.log(this.sources);
        console.log(this.messages);
      }
    });

    this.core.register({observerClass:this,eventName:"StatsData"}).subscribe((evt:CoreEvent) => {
      console.log("**** STATSDATA ****");
      console.log(evt);
    });

    this.core.register({observerClass:this,eventName:"AllStats"}).subscribe((evt:CoreEvent) => {
      console.log("**** ALLSTATS ****");
      console.log(evt);
    });

    this.core.register({observerClass:this,eventName:"StatsSources"}).subscribe((evt:CoreEvent) => {
      this.updateSources(evt.data);
      if(this.debug){
        console.log("**** StatsSources ****");
        console.log(evt.data);
        console.warn(this.sources);
      }
    }); 

  }

  setupBroadcast(){
    this.core.emit({name:"StatsSourcesRequest"});
  }

  startBroadcast(){
    this.started = true;
    if(this.debug){
      console.log("Starting Broadcast...");
    }
    for(let i = 0; i < this.messages.length; i++){
      this.messages[i] = this.mergeMessages(this.messages[i]);
    }
    this.broadcast(this.messages, this.bufferSize); 
  }

  stopBroadcast(messageList?){
    this.started = false;
    if(this.debug){
      console.log("Stopping Broadcast!");
    }
    if(messageList && messageList == this.messages){
      clearInterval(this.broadcastId);
    } else {
      clearInterval(this.broadcastId);
    }
  }

  broadcast(messages:CoreEvent[],buffer){
    if(messages.length == 0){
      console.warn("Timer only runs when message list is not empty");
      return ;
    }

    // B4 looping dispatch all messages
    this.dispatchAllMessages(messages);
    
    this.broadcastId = setInterval(() => {
      this.dispatchAllMessages(messages);
    }, buffer);


    // Recurring loop
    let i = 1;
    let id;
    if(messages == this.messages){
    }
  }

  dispatchAllMessages(messages){
    for(let i = 0; i < messages.length; i++){
      let job = messages[i];
      this.jobExec(job);
    }
  }

  mergeMessages(messages:CoreEvent[]):CoreEvent[]{
    if(messages.length == 1) return messages;
    let options = {step: '10', start:'now-10m', end:'now-20s'}
    let argsZero = [];
    let responseEvent = messages[0].data.responseEvent;
    for(let i = 0; i < messages.length; i++){
      let arr = messages[i].data.args[0];
      argsZero = argsZero.concat(arr);
    }
    let args = [argsZero, options]

    let evt:CoreEvent =  {name: "StatsRequest", data: {args: args, responseEvent: responseEvent} };

    return [evt];
  }

  buildMessage(key,source):CoreEvent{
    let options = {step: '10', start:'now-10m', end:'now-20s'}
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
      if(source.keysAsDatasets){
        dataList.push({
          source:source.datasetsType,//"load",
          type:source.datasetsType,
          dataset:source.properties[prop]
        });
      } else if(source.bidirectional){
        // This is for rx/tx and read/write stats
        let direction = source.bidirectional.split("/");
        dataList.push({
          source:src,//"aggregation-cpu-sum",
          type:source.properties[prop],
          dataset: direction[0]
        });
        dataList.push({
          source:src,//"aggregation-cpu-sum",
          type:source.properties[prop],
          dataset:direction[1]
        });
      } else {
        dataList.push({
          source:src,//"aggregation-cpu-sum",
          type:source.properties[prop],
          dataset:"value"
        });
      }
    } 
    let messageData;
    if(source.legendPrefix){
      messageData = {responseEvent:eventName, legendPrefix: src + source.legendPrefix, args: [dataList, options ]};
    } else if(source.bidirectional) {
      messageData = {responseEvent:eventName, args: [dataList, options]};
    } else {
      messageData = {responseEvent:eventName, args: [dataList, options ]};
    }

    if(source.merge){
      messageData.responseEvent = source.name;
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
      console.log("JOB STARTING...");
    }
    for(let i  = 0; i < job.length; i++){
      let message = job[i];
      if(this.debug){
        console.log(message);
      }
      this.core.emit(message);
    }
    if(this.debug){
      console.log("JOB FINISHED")
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

    for(let i = 0; i < this.sources.length; i++){
      let source = this.sources[i];
      let available = [];

      if(source.keysAsDatasets && dataSources.indexOf(source.datasetsType) !== -1){
        available.push(source.datasetsType);
        source.properties = source.keys;
      } 
     
        source.keys.forEach((item,index) => {
          // WildCards
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
       if(source.available.length > 0 && !source.keysAsDatasets){
         source.properties = data[source.available[0]];
       }

       // Generate Messages
       this.updateListeners(source);
    }

    //this.startBroadcast();
    if(this.messages.length > 0){
      this.startBroadcast();
    }

  }

  // Updates listeners in this.sources with messages
  updateListeners(source:StatSource, removed?){
    for(let i = source.listeners.length - 1; i >= 0 ; i--){
      let messageList; 
      let removedIndex: number;
      let oldJobIndex:number;

        messageList = this.messages;

      if(source.listeners.length > 0){
        //let oldJobIndex:number;
        if(removed){
          removedIndex = source.listeners.indexOf(removed);
          oldJobIndex = this.findJob(messageList, removed.message);
          // don't splice until all the other tasks are done
          //source.listeners.splice(removedIndex, 1);
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

      if(source.bidirectional){
        source.keys = this.keysFromAvailable(source);
      }
      
      if(removed && removedIndex){ 
        //Now that all tasks are completed, remove the listener
        source.listeners.splice(removedIndex, 1);
      }
      
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

  removeAllListeners(){
    // This is called when after the listeners OnDestroy() has been called
    // but some of them might still be registered in this.sources.
    this.listeners = [];
    this.sources.map((item) => {item.listeners = []});
  }
  
  removeListener(obj:any){
    if(this.debug){
      console.warn("REMOVING LISTENER")
      console.log(obj);
    }
    let messageList;
     // Remove from sources
     for(let i = this.sources.length - 1; i >= 0; i--){
       for(let index = 0; index < this.sources[i].listeners.length; index++){
         if(this.sources[i].listeners[index].obj == obj){
            messageList = this.messages;
           this.updateListeners(this.sources[i], this.sources[i].listeners[index]);
         } 
       } 
     }

     if(!messageList || messageList.length == 0){
       this.stopBroadcast(messageList);
     }

     if(this.debug){
       console.log("Listener removed with " + this.listeners.length + " listeners remaining.")
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

  keysFromAvailable(source){
    let clone= Object.assign([], source.available);
    let keychain = clone.map((x) =>{
        if(source.prefix){
          return x.replace(source.prefix,"");
        }
      });
    return keychain;
  }

}
