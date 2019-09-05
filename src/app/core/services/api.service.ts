import { Injectable, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { WebSocketService } from '../../services/ws.service';
import { RestService } from '../../services/rest.service';
import { CoreService, CoreEvent } from './core.service';
import { DialogService } from '../../services';
//import { DataService } from './data.service';

interface ApiCall {
  namespace: string; // namespace for ws and path for rest
  args?: any;
  operation?: string;
  responseEvent ?: any;// The event name of the response this service will send
  errorResponseEvent ?: any;// The event name of the response this service will send in case it fails
}

interface ApiDefinition { 
  apiCall: ApiCall;
  preProcessor?: (def:ApiCall) => ApiCall;
  postProcessor?: (res:ApiCall, callArgs:any) => ApiCall;
}

@Injectable()
export class ApiService {

  public debug:boolean = false;

  private apiDefinitions = {
    UserDataRequest:{
      apiCall:{
        protocol:"websocket",
        version:"2.0",
        namespace:"user.query",
        args: [],// eg. [["id", "=", "foo"]]
        responseEvent: "UserData"
      },
      preProcessor(def:ApiCall){ 
        //console.log("API SERVICE: USER DATA REQUESTED");
        return def
      }
    },
    UserDataUpdate:{
      apiCall:{
        protocol:"websocket",
        version:"2.0",
        namespace:"user.set_attribute",
        args: [],// eg. [["id", "=", "foo"]]
        //responseEvent: null
      },
      preProcessor(def:ApiCall){
        //console.log("USER DATA PREPROCESSOR");
        let uid:number = 1;
        let redef = Object.assign({}, def);
        //console.log(def.args)
        //Do some stuff here
        // [1,{attributes:{usertheme:theme.name}}]
        redef.args =  [ uid, "preferences",def.args ] ;
        return redef;
      },
      postProcessor(res,callArgs,core){
        //console.log("USER DATA POSTPROCESSOR");
        //console.log(res);
        //console.log(callArgs);
        let cloneRes = Object.assign({},res);
        //cloneRes = {callArgs:callArgs ,data: res}
        if(res == 1){
          core.emit({name:"UserDataRequest", data: [[[ "id", "=", 1 ]]] });
        }
        return cloneRes;
      }
    },
    VolumeDataRequest:{
      apiCall:{
        protocol:"rest",
        version:"1.0",
        operation: "get",
        namespace: "storage/volume/",
        responseEvent: "VolumeData"
      }
    },
    DisksRequest:{
      apiCall:{
        protocol:"websocket",
        version:"2.0",
        args: [],
        namespace: "disk.query",
        responseEvent: "DisksData"
      }
    },
    MultipathRequest:{
      apiCall:{
        protocol:"websocket",
        version:"2.0",
        args: [],
        namespace: "multipath.query",
        responseEvent: "MultipathData"
      }
    },
    EnclosureDataRequest:{
      apiCall:{
        protocol:"websocket",
        version:"2.0",
        args: [],
        namespace: "enclosure.query",
        responseEvent: "EnclosureData"
      }
    },
    SetEnclosureSlotStatus:{
      apiCall:{
        protocol:"websocket",
        version:"2.0",
        args: [],
        namespace: "enclosure.set_slot_status",
        responseEvent: "EnclosureSlotStatusChanged"
      }
    },
    PoolDataRequest:{
      apiCall:{
        protocol:"websocket",
        version:"2.0",
        args: [],
        namespace: "pool.query",
        responseEvent: "PoolData"
      }
    },
    PoolDisksRequest:{
      apiCall:{
        protocol:"websocket",
        version:"2.0",
        namespace:"pool.get_disks",
        args: [],
        responseEvent: "PoolDisks"
      },
      preProcessor(def:ApiCall){
        let redef = Object.assign({}, def);
        redef.responseEvent = def.args.length > 0 ? def.responseEvent + def.args.join() : def.responseEvent ;
        return redef;
      },
      postProcessor(res,callArgs){
        //DEBUG: console.warn("POOLDISKS POSTPROCESSOR");
        //DEBUG: console.log(res);
        //DEBUG: console.log(callArgs);
        let cloneRes = Object.assign({},res);
        cloneRes = {callArgs:callArgs ,data: res}
        return cloneRes;
      }
    },
    PrimaryNicInfoRequest:{
      apiCall:{
        protocol:"websocket",
        version:"2.0",
        namespace:"interface.websocket_interface",
        args: [],
        responseEvent: "PrimaryNicInfo"
      }
    },
    NicInfoRequest:{
      apiCall:{
        protocol:"websocket",
        version:"2.0",
        namespace:"interface.query",
        args: [],
        responseEvent: "NicInfo"
      }
    },
    NetInfoRequest:{
      apiCall:{
        protocol:"websocket",
        version:"2.0",
        namespace:"network.general.summary",
        args: [],
        responseEvent: "NetInfo"
      }
    },
    UpdateCheck:{
      apiCall:{
        protocol:"websocket",
        version:"2.0",
        namespace:"update.check_available",
        args: [],
        responseEvent: "UpdateChecked"
      }
    },
    VmProfilesRequest:{
      apiCall:{
        protocol:"websocket",
        version:"2.0", // Middleware returns device info but no status
        namespace: "vm.query",
        args: [],
        responseEvent: "VmProfiles"
      }
    },
    VmProfileRequest:{
      apiCall:{
        protocol:"websocket",
        version:"2.0",
        namespace:"vm.query",
        args: [],// eg. [["id", "=", "foo"]]
        responseEvent: "VmProfile"
      }
    },
    VmProfileUpdate:{
      apiCall:{
        protocol:"websocket",
        version:"2.0",
        namespace:"vm.update",
        args: [],// eg. [25, {"name": "Fedora", "description": "Linux", "vcpus": 1, "memory": 2048, "bootloader": "UEFI", "autostart": true}]
        responseEvent: "VmProfileRequest"
      },
      postProcessor(res,callArgs){
        //DEBUG: console.log(res);
        let cloneRes = Object.assign({},res);
        cloneRes = [[["id","=",res]]];// eg. [["id", "=", "foo"]]
        return cloneRes;
      }
    },
    VmStatusRequest:{
      apiCall:{
        protocol:"websocket",
        version:"2.0",
        namespace:"vm.query",
        args: [],// eg. [["id", "=", "foo"]]
        responseEvent: "VmStatus"
      },
      postProcessor(res,callArgs){
        const cloneRes = [];
        for (const vmstatus of res) {
          cloneRes.push({id:vmstatus.id ,state: vmstatus.status.state})
        }
        return cloneRes;
      }
    },
    VmStart:{
      apiCall:{
        protocol:"websocket",
        version:"1",
        namespace:"vm.start",
        args:[],
        responseEvent:"VmProfiles",
        errorResponseEvent: "VmStartFailure"
      },
      postProcessor(res,callArgs){
        let cloneRes = Object.assign({},res);
        cloneRes = {id:callArgs[0] ,state: res} // res:boolean
        return cloneRes;
      }
    },
    VmRestart:{
      apiCall:{
        protocol:"websocket",
        version:"1",
        namespace:"vm.restart",
        args:[],
        responseEvent:"VmProfiles",
        errorResponseEvent: "VmStartFailure"
      },
      postProcessor(res,callArgs){
        let cloneRes = Object.assign({},res);
        cloneRes = {id:callArgs[0] ,state: res} // res:boolean
        return cloneRes;
      }
    },
    VmStop:{
      apiCall:{
        protocol:"websocket",
        version:"1",
        namespace:"vm.stop",
        args:[],
        responseEvent:"VmProfiles",
        errorResponseEvent: "VmStopFailure"
      },
      postProcessor(res,callArgs){
        //DEBUG: console.log(res);
        let cloneRes = Object.assign({},res);
        cloneRes = {id:callArgs[0]} // res:boolean
        return cloneRes;
      }
    },
    VmPowerOff:{
      apiCall:{
        protocol:"websocket",
        version:"2",
        namespace:"vm.stop",
        args:[],
        responseEvent:"VmProfiles",
        errorResponseEvent: "VmStopFailure"
      },
      preProcessor(def:ApiCall){
        let uid:number = 1;
        let redef = Object.assign({}, def);
        redef.args.push(true);
        return redef;
      },
      postProcessor(res,callArgs){
        let cloneRes = Object.assign({},res);
        cloneRes = {id:callArgs[0]} // res:boolean
        return cloneRes;
      }
    },
    VmCreate:{
      apiCall:{
        protocol:"websocket",
        version:"1",
        namespace:"vm.create",
        args:[],
        responseEvent:"VmProfiles"
      }
    },
    VmClone:{
      apiCall:{
        protocol:"websocket",
        version:"2",
        namespace:"vm.clone",
        args:[],
        responseEvent:"VmProfiles",
        errorResponseEvent: "VmCloneFailure"
      },
      postProcessor(res,callArgs){
        let cloneRes = Object.assign({},res);
        cloneRes = null; 
        return cloneRes;
      }
    },
    VmDelete:{
      apiCall:{
        protocol:"websocket",
        version:"1",
        namespace:"vm.delete",
        args:[],
        errorResponseEvent: "VmDeleteFailure",
        responseEvent:"VmProfiles",
      },
    },
    /*SysInfoRequest:{
      apiCall:{
        protocol:"websocket",
        version:"1",
        namespace:"system.info",
        args:[],
        responseEvent:"SysInfo"
      }
    },*/
    // Used by stats service!!
    StatsRequest:{
      apiCall:{
        protocol:"websocket",
        version:"2",
        namespace:"stats.get_data",
        args:{},
        responseEvent:"StatsData"
      },
      preProcessor(def:ApiCall){
        let redef = Object.assign({}, def);
        redef.responseEvent = "Stats" + def.args.responseEvent;
        redef.args = def.args.args; 
        return redef;
      },
      postProcessor(res,callArgs){
        let cloneRes = Object.assign({},res);
        let legend = res.meta.legend;
        let l = [];
        for(let i in legend){
          if(callArgs.legendPrefix){
            let spl = legend[i].split(callArgs.legendPrefix);
            l.push(spl[1]);
          } else {
            l.push(legend[i]);
          }
        }
        cloneRes.meta.legend = l;
        return cloneRes;
      }
    },
    // Used by stats service!!
    StatsSourcesRequest:{
      apiCall:{
        protocol:"websocket",
        version:"1",
        namespace:"stats.get_sources",
        args:[],
        responseEvent:"StatsSources"
      }
    },
    ReportingGraphsRequest:{
      apiCall:{
        protocol:"websocket",
        version:"2",
        namespace:"reporting.graphs",
        args:[],
        responseEvent:"ReportingGraphs"
      }
    },
    StatsCpuRequest:{
      apiCall:{
        protocol:"websocket",
        version:"1",
        namespace:"stats.get_data",
        args:[],
        responseEvent:"StatsData"
      },
      preProcessor(def:ApiCall){
        let redef = Object.assign({}, def);
        //Do some stuff here
        let dataList = [];
        let oldDataList = redef.args[0];
        let options = redef.args[1];

        for(let i in oldDataList){
          dataList.push({
            source:"aggregation-cpu-sum",
            type:"cpu-" + oldDataList[i],
            dataset:"value"
          });
        }

        redef.args = [dataList,options];
        redef.responseEvent = 'StatsCpuData';
        return redef;
      },
      postProcessor(res,callArgs){
        let cloneRes = Object.assign({},res);
        let legend = res.meta.legend;
        let l = [];
        for(let i in legend){
          let spl = legend[i].split("aggregation-cpu-sum/cpu-");
          l.push(spl[1]);
        }
        cloneRes.meta.legend = l;
        return cloneRes;
      }
    },
    StatsMemoryRequest:{
      apiCall:{
        protocol:"websocket",
        version:"1",
        namespace:"stats.get_data",
        args:[],
        responseEvent:"StatsData"
      },
      preProcessor(def:ApiCall){
        let redef = Object.assign({}, def);
        //Do some stuff here

        let dataList = [];
        let oldDataList = redef.args[0];
        let options = redef.args[1];

        for(let i in oldDataList){
          dataList.push({
            source:"memory",
            type:"memory-" + oldDataList[i],
            dataset:"value"
          });
        }

        redef.args = [dataList,options];
        redef.responseEvent = 'StatsMemoryData';
        return redef;
      },
      postProcessor(res,callArgs){
        //DEBUG: console.log("******** MEM STAT RESPONSE ********");
        //DEBUG: console.log(res);

        let cloneRes = Object.assign({},res);
        let legend = res.meta.legend;
        let l = [];
        for(let i in legend){
          let spl = legend[i].split("memory/memory-");
          l.push(spl[1]);
        }
        cloneRes.meta.legend = l;
        return cloneRes;
      }
    },
    StatsDiskTempRequest:{
      apiCall:{
        protocol:"websocket",
        version:"2",
        namespace:"stats.get_data",
        args:[],
        responseEvent:"StatsData"
      },
      preProcessor(def:ApiCall){
        //Clone the object
        let redef = Object.assign({}, def);
        let dataList = [];
        let oldDataList = redef.args[0];

        for(let i in oldDataList){
          dataList.push({
            source:"disktemp-" + oldDataList,// disk name
            type:"temperature",
            dataset:"value"
          });
        }

        redef.args = [dataList];
        redef.responseEvent = 'StatsDiskTemp';
        return redef;
      },
      postProcessor(res,callArgs){
        //DEBUG: console.log("******** DISK TEMP RESPONSE ********");
        //DEBUG: console.log(res);
        //DEBUG: console.log(callArgs);

        let cloneRes = Object.assign({},res);
        let legend = res.meta.legend;
        let l = [];
        for(let i in legend){
          let spl = legend[i];
          l.push(spl[1]);
        }
        cloneRes.meta.legend = l;
        return {callArgs:callArgs, data:cloneRes};
      }
    },
    StatsLoadAvgRequest:{
      apiCall:{
        protocol:"websocket",
        version:"1",
        namespace:"stats.get_data",
        args:[],
        responseEvent:"StatsData"
      },
      preProcessor(def:ApiCall){
        let redef = Object.assign({}, def);
        //Do some stuff here
        let dataList = [];
        let oldDataList = redef.args[0];
        let options = redef.args[1];

        for(let i in oldDataList){
          dataList.push({
            source:"processes",
            type:"ps_" + oldDataList[i],
            dataset:"value"
          });
        }

        redef.args = [dataList,options];
        redef.responseEvent = 'StatsLoadAvgData';
        return redef;
      },
      postProcessor(res,call){
        //DEBUG: console.log("******** LOAD STAT RESPONSE ********");
        //DEBUG: console.log(res);
        //return res;

        let cloneRes = Object.assign({},res);
        let legend = res.meta.legend;
        let l = [];
        for(let i in legend){
          let spl = legend[i].split("processes/ps_state-");
          l.push(spl[1]);
        }
        cloneRes.meta.legend = l;
        return cloneRes;
      }
    },
    StatsVmemoryUsageRequest:{
      apiCall:{
        protocol:"websocket",
        version:"2.0",
        namespace:"vm.get_vmemory_in_use",
        args: [],// eg. [["id", "=", "foo"]]
        responseEvent: "StatsVmemoryUsage"
      }
    },
    DisksInfoRequest:{
      apiCall:{
        protocol:"websocket",
        version:"2.0",
        namespace:"disk.query",
        args: [],
        responseEvent: "DisksInfo"
      }
    },
  } 

  constructor(
    protected core: CoreService, 
    protected ws: WebSocketService,
    protected rest: RestService, 
    private dialog:DialogService, 
    //protected cache: DataService
  ) {
    this.ws.authStatus.subscribe((evt:any) =>{
      this.core.emit({ name:"UserDataRequest",data:[[["id", "=", 1]]]});
      this.core.emit({name:"Authenticated",data:evt,sender:this});
    });
    this.registerDefinitions();
  }

  registerDefinitions(){
    //DEBUG: console.log("APISERVICE: Registering API Definitions");
    for(var def in this.apiDefinitions){
      //DEBUG: console.log("def = " + def);
      this.core.register({observerClass:this, eventName:def}).subscribe(
        (evt:CoreEvent) => {
          //Process Event if CoreEvent is in the api definitions list
          if(this.apiDefinitions[evt.name]){
            //DEBUG: console.log(evt);
            let apiDef = this.apiDefinitions[evt.name];
            //DEBUG: console.log(apiDef)
            //let call = this.parseCoreEvent(evt);
            if(apiDef.apiCall.protocol == 'websocket'){
              this.callWebsocket(evt,apiDef);
            } else if(apiDef.apiCall.protocol == 'rest'){
              this.callRest(evt,apiDef);
            }
          }
        },
        (err) => {
          //DEBUG: console.log(err)
          });
    }
  }

  private callRest(evt,def){
    let baseUrl = "/api/v" + def.apiCall.version + "/";
    let cloneDef = Object.assign({},def);
    if(evt.data){
      // PreProcessor: ApiDefinition manipulates call to be sent out.
      if(def.preProcessor){
        cloneDef.apiCall = def.preProcessor(def.apiCall);
      }

      let call = cloneDef.apiCall;//this.parseEventRest(evt);
      call.args = evt.data;
      this.rest[call.operation](baseUrl + call.namespace, evt.data, false).subscribe((res) => {
        if(this.debug){
          console.log("*** API Response:");
          console.log(res)
        }

        // PostProcess
        if(def.postProcessor){
          res = def.postProcessor(res,evt.data,this.core);
        }

        this.core.emit({name:call.responseEvent,data:res.data, sender: evt.data});
      });
    } else {
      // PreProcessor: ApiDefinition manipulates call to be sent out.
      if(def.preProcessor){
        cloneDef.apiCall = def.preProcessor(def.apiCall);
      }

      let call = cloneDef.apiCall;//this.parseEventRest(evt);
      call.args = evt.data;
      this.rest[call.operation](baseUrl + call.namespace,{}, false).subscribe((res) => {
        if(this.debug){
          console.log("*** API Response:");
          console.log(call);
        }

        // PostProcess
        if(def.postProcessor){
          res = def.postProcessor(res,evt.data,this.core);
        }

        this.core.emit({name:call.responseEvent,data:res.data, sender: evt.data});
      });
    }

  }

  async callWebsocket(evt:CoreEvent,def){
    let cloneDef = Object.assign({}, def);
    const async_calls = [
      "vm.start",
      "vm.delete"
    ]

    if(evt.data){
      cloneDef.apiCall.args = evt.data;

      if(def.preProcessor && !async_calls.includes(def.apiCall.namespace)){
        cloneDef.apiCall =  def.preProcessor(def.apiCall, this);
      }
      
      // PreProcessor: ApiDefinition manipulates call to be sent out.
      if(def.preProcessor && async_calls.includes(def.apiCall.namespace)) {
        cloneDef.apiCall =  await def.preProcessor(def.apiCall, this);
        if (!cloneDef.apiCall) {
          this.core.emit({name:"VmStopped", data:{id:evt.data[0]}});
          return;
        }
      };


      let call = cloneDef.apiCall;//this.parseEventWs(evt);
      this.ws.call(call.namespace, call.args).subscribe((res) => {
        if(this.debug){
          console.log("*** API Response:");
          console.log(call)
        }

        // PostProcess
        if(def.postProcessor){
          res = def.postProcessor(res,evt.data,this.core);
        }
        if(this.debug){
          console.log(call.responseEvent);
          console.log(res);
        }
        //this.core.emit({name:call.responseEvent, data:res, sender: evt.data}); // OLD WAY
        if(call.responseEvent){
          this.core.emit({name:call.responseEvent, data:res, sender: this});
        }
      },
      (error)=>{
          error.id = call.args;
          if (call.errorResponseEvent){
            this.core.emit({name:call.errorResponseEvent, data:error, sender: this});
          }
          this.core.emit({name:call.responseEvent, data:error, sender: this});
      });
    } else {
      // PreProcessor: ApiDefinition manipulates call to be sent out.
      if(def.preProcessor){
        cloneDef.apiCall = def.preProcessor(def.apiCall);
      }

      let call = cloneDef.apiCall;//this.parseEventWs(evt);
      this.ws.call(call.namespace).subscribe((res) => {
        if(this.debug){
          console.log("*** API Response:");
          console.log(call);
        }

        // PostProcess
        if(def.postProcessor){
          res = def.postProcessor(res,evt.data,this.core);
        }

        //this.core.emit({name:call.responseEvent, data:res, sender:evt.data }); // OLD WAY
        if(call.responseEvent){
          this.core.emit({name:call.responseEvent, data:res, sender:this });
        }
      },(error)=>{
        console.log(error);
        if(call.responseFailedEvent){
          error.id = call.args;
          this.core.emit({name:call.responseFailedEvent, data:error, sender: this});
        }
        
      });
    }
  }

}
