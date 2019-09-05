import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Observer } from 'rxjs';
import { Subject } from 'rxjs';

/*
 * Heavily influenced by Objective C's NSNotificationCenter
 * Methodology has been altered to incorporate RxJS Subjects 
 * to leverage built in functionality of Angular. 
 *
 * ObjectiveC uses a "selector" a.k.a. callback that NSNotificationCenter
 * would call directly. This CoreService instead returns an RxJS Observable that
 * the component/service can subscribe to.
 *
 * If you're interested check out the link below:
 * https://developer.apple.com/documentation/foundation/nsnotificationcenter
 *
 * NSNotification = CoreEvent
 * addObserver() = register()
 * postNotification() = emit()
 * 
 *
 * */

export interface CoreEvent {
  name: string;
  sender?: any;
  data?: any;
}

interface Registration {
  observerClass:object; // The component/service listening for the event
  observable?: Subject<CoreEvent>; // The Subject that provides the Observable to the observerClass
  eventName?: string; // If undefined, your class will react to everything
  sender?:object; // Only listen for events from a specific sender
}

@Injectable()
export class CoreService {
  public coreEvents: Subject<CoreEvent>;
  private debug:boolean;
  debug_show_subscription_type:boolean;
  debug_show_dispatch_table:boolean;
  debug_show_emit_logs:boolean;
  //private debug_show_data:boolean
  constructor() {
    /////////////////////////////
    //Set Debug options here
    this.debug = false;
    this.debug_show_emit_logs = false;
    this.debug_show_subscription_type = false;
    this.debug_show_dispatch_table = false;
    /////////////////////////////
    if(this.debug){
      console.log("*** New Instance of Core Service ***");
    }
    this.coreEvents = new Subject();
    this.coreEvents.subscribe(
      (evt:CoreEvent) => {
	// Do Stuff
	//DEBUG: console.log("*** CoreEvent: " + evt.name);
      },
      (err) =>{
	console.log(err);
      });
  }

  private dispatchTable = [];

  public register(reg:Registration){
    reg.observable = new Subject();
    this.dispatchTable.push(reg);
    return reg.observable;
  }

  public unregister(reg: Registration){
    if(this.debug){
      console.log("CoreService: Unregistering the following ObserverClass...")
      console.log(reg.observerClass);
    }
    let clone = [];// New Dispatch Table
    if(!reg.eventName){
      for(var i = 0; i < this.dispatchTable.length; i++){
	let registration = this.dispatchTable[i];
	if(registration.observerClass == reg.observerClass){
	  continue;
	} else {
          clone.push(registration)
        }
      }
    } else {
      for(var i = 0; i < this.dispatchTable.length; i++){
	let registration = this.dispatchTable[i];
	if(registration.observerClass == reg.observerClass && registration.eventName == reg.eventName){
          continue;
	} else {
	  clone.push(registration);
        }
      }
    }
    this.dispatchTable = clone;
    if(this.debug && this.debug_show_dispatch_table){
      console.log("UNREGISTER: DISPATCH = ");
      console.log(this.dispatchTable);
    }
  }

  public emit(evt: CoreEvent){
    if(evt.name == "SysInfoRequest")console.log(evt.sender);
    if(this.debug && this.debug_show_emit_logs){ 
      console.log("*******************************************************");
      console.log("CORESERVICE: Emitting " + evt.name);
      if(this.debug_show_dispatch_table){
        console.log("CORESERVICE: dispatchTable...");
        console.log(this.dispatchTable)
      }
    }
    //avoid matching null values
    if(!evt.name){
      evt.name = "null";
    }
    if(!evt.sender){
      evt.sender = "null";
    }

    for(var i=0; i < this.dispatchTable.length; i++){
      let reg = this.dispatchTable[i]; // subscription

      let subscriptionType:string = "any";
      if(reg.eventName && reg.sender){
        subscriptionType = "NameSender";
      } else if(reg.eventName){
        subscriptionType = "Name";
      } else if(reg.sender){
        subscriptionType = "Sender";
      }

      if(this.debug && this.debug_show_subscription_type){
        console.log(i + ":CoreService: Subscription type = " + subscriptionType);
      }

      if(reg.eventName == evt.name && reg.sender == evt.sender && subscriptionType == "NameSender"){
        if(this.debug && this.debug_show_emit_logs){
          console.log(">>>>>>>>");
          console.log("Matched name and sender");
          console.log(reg.observerClass);
          console.log(evt);
          console.log("<<<<<<<<");
        }
	reg.observable.next(evt);
      } else if(evt.name && reg.eventName == evt.name && subscriptionType == "Name"){
        if(this.debug && this.debug_show_emit_logs){
          console.log(">>>>>>>>");
          console.log("Matched name only");
          console.log(reg.observerClass);
          console.log(evt);
          console.log("<<<<<<<<");
        }
	reg.observable.next(evt);
      } else if(evt.sender && reg.sender == evt.sender && subscriptionType == "Sender"){
        if(this.debug && this.debug_show_emit_logs){
          console.log(">>>>>>>>");
          console.log("Matched sender only");
          console.log(reg.observerClass);
          console.log(evt);
          console.log("<<<<<<<<");
        }
	reg.observable.next(evt);
      } else {
        //DEBUG: console.log("No match found");
      }
    }
    if(this.debug && this.debug_show_emit_logs){ 
      console.log("*******************************************************");
    }
    return this;
  }

}
