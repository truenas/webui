import { Injectable, OnInit } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { WebSocketService } from '../../services/ws.service';
import { RestService } from '../../services/rest.service';
import { CoreService, CoreEvent } from './core.service';

interface ApiCall {
  namespace: string;
  args?: any;
  responseEvent ?: any;// The event name of the response this service will send
}

@Injectable()
export class ApiService {

  private apiDefinitions = {
    VmProfilesRequest:{
      protocol:"websocket",
      version:"1",
      namespace: "vm.query",
      //args: [],
      responseEvent: "VmProfiles"
    },
    VmProfileRequest:{
      protocol:"websocket",
      version:"1",
      namespace:"vm.query",
      args:[],
      responseEvent: "VmProfile"
    },
    VmStartRequest:{
      protocol:"websocket",
      version:"1",
      namespace:"vm.start",
      args:[],
      responseEvent:"VmStarted"
    },
    VmStopRequest:{
      protocol:"websocket",
      version:"1",
      namespace:"vm.stop",
      args:[],
      responseEvent:"VmStopped"
    },
  } 

  private apiCallBuffer: ApiCall[] = [];
  private isRegistered: boolean = false
  constructor(protected core: CoreService, protected ws: WebSocketService,protected     rest: RestService) {
    console.log("*** New Instance of API Service ***");
    this.registerDefinitions();
  }

  registerDefinitions(){
    console.log("APISERVICE: Registering API Definitions");
    for(var def in this.apiDefinitions){
      console.log("def = " + def);
      this.core.register({observerClass:this, eventName:def}).subscribe(
	(evt:CoreEvent) => {
	  //Process Event if CoreEvent is in the api definitions list
	  if(this.apiDefinitions[evt.name]){
	    //console.log(evt);
	    let call = this.parseCoreEvent(evt);
	    if(call.args){
	      this.ws.call(call.namespace, call.args).subscribe((res) => {
		console.log("*** API Response:");
		console.log(res)
		//this.core.coreEvents.next({name:call.responseEvent,data:res})
		this.core.emit({name:call.responseEvent,data:res});
	      });
	    } else {
	      this.ws.call(call.namespace).subscribe((res) => {
		console.log("*** API Response:");
		//console.log(res);
		console.log(call);
		//this.core.coreEvents.next({name:call.responseEvent,data:res})
		this.core.emit({name:call.responseEvent,data:res});
	      });
	    }
	  }
	},
	(err) => {
	  console.log(err)
	});
    }
  }

  parseCoreEvent(evt:CoreEvent){
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
