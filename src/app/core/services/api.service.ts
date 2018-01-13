import { Injectable, OnInit } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { WebSocketService } from '../../services/ws.service';
import { RestService } from '../../services/rest.service';
import { CoreService, CoreEvent } from './core.service';

interface ApiCall {
  namespace: string; // namespace for ws and path for rest
  args?: any;
  operation?: string;
  responseEvent ?: any;// The event name of the response this service will send
}

interface ApiDefinition { 
  apiCall: ApiCall;
  preProcessor?: (def:ApiCall) => ApiCall;
  postProcessor?: (def:ApiCall) => ApiCall;
}

@Injectable()
export class ApiService {

  private apiDefinitions = {
    PoolDataRequest:{
      apiCall:{
        protocol:"rest",
        version:"1.0",
        operation: "get",
        namespace: "storage/volume/",
        responseEvent: "PoolData"
      }
    },
    /*VmProfilesRequest:{
     protocol:"websocket",
     version:"1",
     namespace: "vm.query",
     //args: [],
     responseEvent: "VmProfiles"
    },*/
    VmProfilesRequest:{
      apiCall:{
        protocol:"rest",
        version:"1.0",
        operation: "get",
        namespace: "vm/vm",
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
    VmStart:{
      apiCall:{
        protocol:"websocket",
        version:"1",
        namespace:"vm.start",
        args:[],
        responseEvent:"VmStarted"
      }
    },
    VmStop:{
      apiCall:{
        protocol:"websocket",
        version:"1",
        namespace:"vm.stop",
        args:[],
        responseEvent:"VmStopped"
      }
    },
    VmDelete:{
      apiCall:{
        protocol:"websocket",
        version:"1",
        namespace:"vm.delete",
        args:[],
        responseEvent:"VmDeleted"
      }
    },
    StatsRequest:{
      apiCall:{
        protocol:"websocket",
        version:"1",
        namespace:"stats.get_data",
        args:[],
        responseEvent:"StatsData"
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
      postProcessor(res){
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
    }
  } 

    constructor(protected core: CoreService, protected ws: WebSocketService,protected     rest: RestService) {
      console.log("*** New Instance of API Service ***");
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
          //DEBUG: console.log("*** API Response:");
          //DEBUG: console.log(res)

          // PostProcess
          if(def.postProcessor){
            res = def.postProcessor(res);
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
          //DEBUG: console.log("*** API Response:");
          //DEBUG: console.log(call);

          // PostProcess
          if(def.postProcessor){
            res = def.postProcessor(res);
          }

          this.core.emit({name:call.responseEvent,data:res.data, sender: evt.data});
        });
      }

    }

    private callWebsocket(evt:CoreEvent,def){
      let cloneDef = Object.assign({}, def);

      if(evt.data){
        cloneDef.apiCall.args = evt.data;

        // PreProcessor: ApiDefinition manipulates call to be sent out.
        if(def.preProcessor){
          cloneDef.apiCall = def.preProcessor(def.apiCall);
        }

        let call = cloneDef.apiCall;//this.parseEventWs(evt);
        this.ws.call(call.namespace, call.args).subscribe((res) => {
          //DEBUG: console.log("*** API Response:");
          //DEBUG: console.log(call)

          // PostProcess
          if(def.postProcessor){
            res = def.postProcessor(res);
          }

          this.core.emit({name:call.responseEvent, data:res, sender: evt.data});
        });
      } else {
        // PreProcessor: ApiDefinition manipulates call to be sent out.
        if(def.preProcessor){
          cloneDef.apiCall = def.preProcessor(def.apiCall);
        }

        let call = cloneDef.apiCall;//this.parseEventWs(evt);
        this.ws.call(call.namespace).subscribe((res) => {
          //DEBUG: console.log("*** API Response:");
          //DEBUG: console.log(call);

          // PostProcess
          if(def.postProcessor){
            res = def.postProcessor(res);
          }

          this.core.emit({name:call.responseEvent, data:res, sender:evt.data });
        });
      }
    }

}
