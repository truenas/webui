import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { Subject } from 'rxjs/Subject';

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
  constructor() {
    //DEBUG: console.log("*** New Instance of Core Service ***");
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
    //DEBUG: console.log("CORESERVICE: New Registration");
    //DEBUG: console.log(reg);
    return reg.observable;
  }

  public unregister(reg: Registration){
    if(!reg.eventName){
      for(var i = 0; i < this.dispatchTable.length; i++){
	let registration = this.dispatchTable[i];
	if(registration.observerClass == reg.observerClass){
	  this.dispatchTable.splice(i,1);
	}
      }
    } else {
      for(var i = 0; i < this.dispatchTable.length; i++){
	let registration = this.dispatchTable[i];
	if(registration.observerClass == reg.observerClass && registration.eventName == reg.eventName){
	  this.dispatchTable.splice(i,1);
	}
      }
    }
  }

  public emit(evt: CoreEvent){
    //console.log("CORESERVICE: Emitting " + evt.name);
    //console.log(this.dispatchTable)

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
      //DEBUG: console.log(i + ":CoreService: Subscription type = " + subscriptionType);

      if(reg.eventName == evt.name && reg.sender == evt.sender && subscriptionType == "NameSender"){
	//DEBUG:
        //DEBUG: console.log("Matched name and sender");
        //DEBUG: console.log(reg.observerClass);
        //DEBUG: console.log(evt);
	reg.observable.next(evt);
        //return this;
      } else if(evt.name && reg.eventName == evt.name && subscriptionType == "Name"){
	//DEBUG:
        //DEBUG: console.log("Matched name only");
        //DEBUG: console.log(reg.observerClass);
        //DEBUG: console.log(evt);
	reg.observable.next(evt);
        //return this;
      } else if(evt.sender && reg.sender == evt.sender && subscriptionType == "Sender"){
	//DEBUG: 
        //DEBUG: console.log("Matched sender only");
        //DEBUG: console.log(reg.observerClass);
        //DEBUG: console.log(evt);
	reg.observable.next(evt);
        //return this;
      } else {
	//DEBUG: 
        //DEBUG: console.log("No match found");
      }
    }
    return this;
  }

}
