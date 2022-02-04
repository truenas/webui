import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CoreEvent } from 'app/interfaces/events';
import { DisplayObject } from '../classes/display-object';
import { LayoutObject } from '../classes/layout-object';
import { CoreService } from './core-service/core.service';

interface DisplayObjectRegistration {
  displayObject: DisplayObject;
  layout?: LayoutObject;
}

export interface DisplayObjectConfig {
  resizeable?: boolean;
  moveable?: boolean;
  anchored?: boolean;
  moveHandle?: string; // CSS Selector
  id: string;
}

@UntilDestroy()
@Injectable()
export class InteractionManagerService {
  private displayList: DisplayObjectRegistration[];
  private displayObjectWithFocus: DisplayObject;
  messageBus: CoreService;

  constructor(messageBus: CoreService) {
    this.messageBus = messageBus;

    messageBus.register({ observerClass: this, eventName: 'RegisterLayout' }).pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      // Expects LayoutObject and array of CSS selectors
      const collection: { [id: string]: DisplayObject } = {};
      evt.data.selectors.forEach((item: any) => {
        const displayObject = this.registerElement(item, evt.data.layout);
        collection[displayObject.id] = displayObject;
      });
      evt.data.layout.collection = collection;
      evt.data.layout.initialize();
    });

    messageBus.register({ observerClass: this, eventName: 'RegisterAsDisplayObject' }).pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      const config: DisplayObjectConfig = evt.data;
      this.registerElement(config); // Expects CSS id selector for element
    });

    messageBus.register({ observerClass: this, eventName: 'RequestDisplayObjectReference' }).pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      const element = this.getChildById(evt.data);
      messageBus.emit({ name: element.id, data: element });
    });

    messageBus.register({ observerClass: this, eventName: 'InsertIntoLayout' }).pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      const layout = this.getLayoutById(evt.data.layout);
      let element;
      const elementIsRegistered = this.displayList.some((reg) => reg.displayObject == evt.sender);
      if (!elementIsRegistered) {
        element = this.registerElement(evt.data.element, layout); // Expects CSS id selector for element
      } else {
        element = this.getChildById(evt.data.element);
      }
      if (!layout) {
        console.warn('Cannot add element to layout. No layout with that id found. Make sure your layout exists and is registered.');
      } else {
        layout.insert(element);
      }
    });

    messageBus.register({ observerClass: this, eventName: 'DisplayObjectSelected' }).pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      if (evt.sender != this.displayObjectWithFocus || !this.displayObjectWithFocus) {
        this.releaseAll();
        if (this.displayObjectWithFocus) { this.displayObjectWithFocus.hasFocus = false; }
        this.displayObjectWithFocus = evt.sender;
        this.displayObjectWithFocus.hasFocus = true;
      }
      // Does this object belong to a layout?
      const layout = this.getLayoutParent(evt.sender);
      if (layout) {
        layout.beginInteractiveMovement(evt.sender);
      }
    });

    messageBus.register({ observerClass: this, eventName: 'DisplayObjectReleased' }).pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      const layout = this.getLayoutParent(evt.sender);
      if (layout) {
        layout.endInteractiveMovement(evt.sender);
      }
    });

    this.displayList = [];
  }

  private releaseAll(): void {
    // Trying to avoid glitches with flakey pointer devices
    // unset the focus property for all DisplayObjects
    this.displayList.forEach((item) => {
      item.displayObject.hasFocus = false;
    });
  }

  registerElement(config: DisplayObjectConfig, layout?: LayoutObject): DisplayObject {
    const selector = config.id;
    const el = document.querySelector(selector);

    let tracker: DisplayObject;
    if (config.moveHandle) {
      const moveHandle = document.querySelector(config.moveHandle);
      tracker = new DisplayObject(el, this.messageBus, moveHandle);
    } else {
      tracker = new DisplayObject(el, this.messageBus);
    }

    tracker.anchored = config.anchored ? config.anchored : false;
    tracker.moveable = config.moveable ? config.moveable : true;
    tracker.resizeable = config.resizeable ? config.resizeable : true;

    const registration: DisplayObjectRegistration = { displayObject: tracker, layout: layout || null };
    this.displayList.push(registration);

    return registration.displayObject;
  }

  unregisterElement(tracker: any): void {
    tracker.interactive = false;
    const index = this.displayList.indexOf(tracker);
    this.displayList.splice(index, 1);
    tracker = null;
  }

  // Find the related Layout object for the displayObject if one exists
  getLayoutParent(displayObject: DisplayObject): LayoutObject {
    const registration = this.displayList.filter((item) => item.displayObject == displayObject);
    if (registration.length == 0) {
      console.warn('DEBUG: The DisplayObject has not been registered');
    } else if (registration.length > 1) {
      throw new Error('DisplayObject registered multiple times.');
    } else {
      return registration[0].layout;
    }
  }

  getChildById(id: string): DisplayObject {
    const registration = this.displayList.find((item) => item.displayObject.id == id);
    return registration.displayObject;
  }

  getLayoutById(id: string): LayoutObject {
    const registration = this.displayList.find((item) => {
      return item.layout.id == id;
    });
    return registration.layout;
  }
}
