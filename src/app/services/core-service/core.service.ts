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

export interface Registration {
  observerClass: unknown; // The component/service listening for the event
  observable$?: Subject<CoreEvent>; // The Subject that provides the Observable to the observerClass
  eventName?: string; // If undefined, your class will react to everything
  sender?: unknown; // Only listen for events from a specific sender
}

/**
 * @deprecated Prefer ngrx component stores or ngrx store + ngrx actions.
 */
@Injectable({
  providedIn: 'root',
})
export class CoreService {
  coreEvent$: Subject<CoreEvent>;

  constructor() {
    this.coreEvent$ = new Subject();
  }

  private dispatchTable: Registration[] = [];

  get registrations(): Registration[] {
    return this.dispatchTable;
  }

  register(reg: Registration): Observable<CoreEvent> {
    reg.observable$ = new Subject();
    this.dispatchTable.push(reg);
    return reg.observable$;
  }

  unregister(reg: Registration): void {
    let clone = [];// New Dispatch Table

    if (!reg.eventName) {
      clone = this.dispatchTable.filter((item) => item.observerClass !== reg.observerClass);
    } else {
      clone = this.dispatchTable.filter((item) => {
        return item.observerClass !== reg.observerClass || item.eventName !== reg.eventName;
      });
    }

    this.dispatchTable = clone;
  }

  emit(evt: CoreEvent): this {
    // avoid matching null values
    if (!evt.name) {
      evt.name = 'null';
    }
    if (!evt.sender) {
      evt.sender = 'null';
    }

    this.dispatchTable.forEach((reg) => {
      let subscriptionType = 'Any';
      if (reg.eventName && reg.sender) {
        subscriptionType = 'NameSender';
      } else if (reg.eventName) {
        subscriptionType = 'Name';
      } else if (reg.sender) {
        subscriptionType = 'Sender';
      }

      if (subscriptionType === 'NameSender' && reg.eventName === evt.name && reg.sender === evt.sender) {
        reg.observable$.next(evt);
      } else if (subscriptionType === 'Name' && evt.name && reg.eventName === evt.name) {
        reg.observable$.next(evt);
      } else if (subscriptionType === 'Sender' && evt.sender && reg.sender === evt.sender) {
        reg.observable$.next(evt);
      } else if (subscriptionType === 'Any') {
        reg.observable$.next(evt);
      }
    });

    return this;
  }
}
