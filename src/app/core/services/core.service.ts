import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { CoreEvent } from 'app/interfaces/events';

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

interface Registration {
  observerClass: object; // The component/service listening for the event
  observable?: Subject<CoreEvent>; // The Subject that provides the Observable to the observerClass
  eventName?: string; // If undefined, your class will react to everything
  sender?: object; // Only listen for events from a specific sender
}

@Injectable()
export class CoreService {
  coreEvents: Subject<CoreEvent>;
  private debug: boolean;
  debug_show_subscription_type: boolean;
  debug_show_dispatch_table: boolean;
  debug_show_emit_logs: boolean;
  debug_filter_eventName = '';
  // private debug_show_data:boolean
  constructor() {
    /// //////////////////////////
    // Set Debug options here
    this.debug = false;
    this.debug_show_emit_logs = false;
    this.debug_show_subscription_type = false;
    this.debug_show_dispatch_table = false;
    this.debug_filter_eventName = '';
    /// //////////////////////////
    if (this.debug) {
      console.info('*** New Instance of Core Service ***');
    }
    this.coreEvents = new Subject();
  }

  private dispatchTable: any[] = [];

  register(reg: Registration): Observable<CoreEvent> {
    reg.observable = new Subject();
    this.dispatchTable.push(reg);
    return reg.observable;
  }

  unregister(reg: Registration): void {
    if (this.debug) {
      console.info('CoreService: Unregistering the following ObserverClass...');
      console.info(reg.observerClass);
    }
    const clone = [];// New Dispatch Table
    if (!reg.eventName) {
      for (var i = 0; i < this.dispatchTable.length; i++) {
        const registration = this.dispatchTable[i];
        if (registration.observerClass == reg.observerClass) {
	        continue;
        } else {
          clone.push(registration);
        }
      }
    } else {
      for (var i = 0; i < this.dispatchTable.length; i++) {
        const registration = this.dispatchTable[i];
        if (registration.observerClass == reg.observerClass && registration.eventName == reg.eventName) {
          continue;
        } else {
	  clone.push(registration);
        }
      }
    }
    this.dispatchTable = clone;
    if (this.debug && this.debug_show_dispatch_table) {
      console.info('UNREGISTER: DISPATCH = ');
      const tbl = this.debug_filter_eventName ? this.dispatchTable.filter((r) => r.eventName == this.debug_filter_eventName) : this.dispatchTable;
      console.info(tbl);
      console.info(this.dispatchTable.length + ' Observers in table.');
    }
  }

  emit(evt: CoreEvent): this {
    // DEBUG MESSAGES
    if (this.debug && this.debug_filter_eventName.length > 0 && this.debug_filter_eventName == evt.name) {
      console.info('*******************************************************');
      console.info('CORESERVICE: Emitting ' + evt.name);
      console.info(this.dispatchTable.filter((r) => r.eventName == evt.name));
    } else if (this.debug && this.debug_filter_eventName.length == 0) {
      console.info('*******************************************************');
      console.info('CORESERVICE: Emitting ' + evt.name);
      console.info(evt);
    }

    if (this.debug && this.debug_show_emit_logs) {
      if (this.debug_show_dispatch_table) {
        console.info('CORESERVICE: dispatchTable...');
        console.info(this.dispatchTable.length + ' Observers in table.');
        const tbl = this.debug_filter_eventName ? this.dispatchTable.filter((r) => r.eventName == this.debug_filter_eventName) : this.dispatchTable;
        console.info(tbl);
      }
    }

    // avoid matching null values
    if (!evt.name) {
      evt.name = 'null';
    }
    if (!evt.sender) {
      evt.sender = 'null';
    }

    for (var i = 0; i < this.dispatchTable.length; i++) {
      const reg = this.dispatchTable[i]; // subscription

      let subscriptionType = 'any';
      if (reg.eventName && reg.sender) {
        subscriptionType = 'NameSender';
      } else if (reg.eventName) {
        subscriptionType = 'Name';
      } else if (reg.sender) {
        subscriptionType = 'Sender';
      }

      if (this.debug && this.debug_show_subscription_type) {
        console.info(i + ':CoreService: Subscription type = ' + subscriptionType);
      }

      if (reg.eventName == evt.name && reg.sender == evt.sender && subscriptionType == 'NameSender') {
        if (this.debug && this.debug_show_emit_logs) {
          console.info('>>>>>>>>');
          console.info('Matched name and sender');
          console.info(reg.observerClass);
          console.info(evt);
          console.info('<<<<<<<<');
        }
        reg.observable.next(evt);
      } else if (evt.name && reg.eventName == evt.name && subscriptionType == 'Name') {
        if (this.debug && this.debug_show_emit_logs) {
          console.info('>>>>>>>>');
          console.info('Matched name only');
          console.info(reg.observerClass);
          console.info(evt);
          console.info('<<<<<<<<');
        }
        reg.observable.next(evt);
      } else if (evt.sender && reg.sender == evt.sender && subscriptionType == 'Sender') {
        if (this.debug && this.debug_show_emit_logs) {
          console.info('>>>>>>>>');
          console.info('Matched sender only');
          console.info(reg.observerClass);
          console.info(evt);
          console.info('<<<<<<<<');
        }
        reg.observable.next(evt);
      } else {
        // DEBUG: console.log("No match found");
      }
    }
    if (this.debug && this.debug_show_emit_logs) {
      console.info('*******************************************************');
    }
    return this;
  }
}
