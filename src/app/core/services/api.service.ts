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

@Injectable()
export class ApiService {

  private apiDefinitions = {
    /*VmProfilesRequest:{
      protocol:"websocket",
      version:"1",
      namespace: "vm.query",
      //args: [],
      responseEvent: "VmProfiles"
    },*/
    VmProfilesRequest:{
     protocol:"rest",
     version:"1.0",
     operation: "get",
     namespace: "vm/vm",
     responseEvent: "VmProfiles"
    },
    VmProfileRequest:{
      protocol:"websocket",
      version:"2.0",
      namespace:"vm.query",
      args: [],// eg. [["id", "=", "foo"]]
      responseEvent: "VmProfile"
    },
    VmStart:{
      protocol:"websocket",
      version:"1",
      namespace:"vm.start",
      args:[],
      responseEvent:"VmStarted"
    },
    VmStop:{
      protocol:"websocket",
      version:"1",
      namespace:"vm.stop",
      args:[],
      responseEvent:"VmStopped"
    },
    VmDelete:{
      protocol:"websocket",
      version:"1",
      namespace:"vm.delete",
      args:[],
      responseEvent:"VmDeleted"
    }
  } 

  private apiCallBuffer: ApiCall[] = [];
  private isRegistered: boolean = false
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
              if(apiDef.protocol == 'websocket'){
                this.callWebsocket(evt,apiDef);
              } else if(apiDef.protocol == 'rest'){
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
      let baseUrl = "/api/v" + def.version + "/";
      if(evt.data){
        let cloneDef = Object.assign({},def);
        cloneDef.args = evt.data;
        let call = this.parseEventRest(evt);
        this.rest[def.operation](baseUrl + call.namespace, evt.data, false).subscribe((res) => {
          //DEBUG: console.log("*** API Response:");
          //DEBUG: console.log(res)
          this.core.emit({name:call.responseEvent,data:res.data, sender: evt.data});
        });
      } else {
        let cloneDef = Object.assign({},def);
        cloneDef.args = evt.data;
        let call = this.parseEventRest(evt);
        this.rest[def.operation](baseUrl + call.namespace,{}, false).subscribe((res) => {
          //DEBUG: console.log("*** API Response:");
          //DEBUG: console.log(call);
          this.core.emit({name:call.responseEvent,data:res.data, sender: evt.data});
        });
      }

    }

    private callWebsocket(evt:CoreEvent,def){
      if(evt.data){
        def.args = evt.data;
        let call = this.parseEventWs(evt);
        this.ws.call(call.namespace, call.args).subscribe((res) => {
          //DEBUG: console.log("*** API Response:");
          //DEBUG: console.log(res)
          this.core.emit({name:call.responseEvent, data:res, sender: evt.data});
        });
      } else {
        let call = this.parseEventWs(evt);
        this.ws.call(call.namespace).subscribe((res) => {
          //DEBUG: console.log("*** API Response:");
          //DEBUG: console.log(call);
          this.core.emit({name:call.responseEvent, data:res, sender:evt.data });
        });
      }
    }

    parseEventWs(evt:CoreEvent){
      let call: ApiCall = {
        namespace: this.apiDefinitions[evt.name].namespace,
        responseEvent: this.apiDefinitions[evt.name].responseEvent
      }

      if(evt.data){
        call.args = evt.data;
      } 
      return call;
    }

    parseEventRest(evt:CoreEvent){
      let call: ApiCall = {
        namespace: this.apiDefinitions[evt.name].namespace,
        responseEvent: this.apiDefinitions[evt.name].responseEvent
      }

      if(evt.data){
        call.args = evt.data;
      } 
      return call;
    }
}
