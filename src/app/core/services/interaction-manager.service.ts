import { Injectable } from '@angular/core';
import { DisplayObject } from '../classes/display-object';
import { LayoutObject } from '../classes/layout-object';
import { CoreService, CoreEvent } from './core.service';
import { 
  tween, 
  styler, 
  listen, 
  pointer, 
  value, 
  decay,
  spring,
  physics,
  multicast,
  action,
  transform,
} from '../popmotion';

const transformMap = transform.transformMap;
const { clamp } = transform

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

@Injectable()
export class InteractionManagerService {
  private displayList: DisplayObjectRegistration[];
  private displayObjectWithFocus: DisplayObject;
  private desktop;
  public messageBus: CoreService;

  constructor(messageBus:CoreService){
    this.messageBus = messageBus;

    messageBus.register({observerClass:this, eventName:"RegisterLayout"}).subscribe((evt:CoreEvent) => {
      // Expects LayoutObject and array of CSS selectors
      //let collection: DisplayObject[] = [];
      let collection: any = {};
      evt.data.selectors.forEach((item) => {
        let displayObject = this.registerElement(item, evt.data.layout);
        //collection.push(displayObject);
        collection[displayObject.id] = displayObject;
      });
      evt.data.layout.collection = collection;
      evt.data.layout.initialize();
    });

    messageBus.register({observerClass:this, eventName:"RegisterAsDisplayObject"}).subscribe((evt:CoreEvent) => {
      console.log(evt)
      const config: DisplayObjectConfig = evt.data;
      this.registerElement(config); // Expects CSS id selector for element
    });

    messageBus.register({observerClass:this, eventName:"RequestDisplayObjectReference"}).subscribe((evt:CoreEvent) => {   
      const element = this.getChildById(evt.data);
      messageBus.emit({name:element.id, data:element});
    });

    messageBus.register({observerClass:this, eventName:"InsertIntoLayout"}).subscribe((evt:CoreEvent) => {
      console.log("Inserting into layout...")
      let layout = this.getLayoutById(evt.data.layout);
      let element;
      let elementIsRegistered = this.displayList.some((reg) => reg.displayObject == evt.sender)
      if(!elementIsRegistered){
        element = this.registerElement(evt.data.element, layout); // Expects CSS id selector for element
      } else {
        element = this.getChildById(evt.data.element);
      }
      //console.log(element)
      //console.log(layout)
      if(!layout){
        console.warn("Cannot add element to layout. No layout with that id found. Make sure your layout exists and is registered.")
      } else {
        layout.insert(element);
      }
    });

    messageBus.register({observerClass:this, eventName:"DisplayObjectSelected"}).subscribe((evt:CoreEvent) => {
      if(evt.sender != this.displayObjectWithFocus || !this.displayObjectWithFocus){
        this.releaseAll();
        if(this.displayObjectWithFocus){ this.displayObjectWithFocus.hasFocus = false;}
        this.displayObjectWithFocus = evt.sender;
        this.displayObjectWithFocus.hasFocus = true;
        
      }
      // Does this object belong to a layout?
      let layout = this.getLayoutParent(evt.sender);
      if(layout){
        layout.beginInteractiveMovement(evt.sender);
      } 
    });

    messageBus.register({observerClass:this, eventName:"DisplayObjectReleased"}).subscribe((evt:CoreEvent) => {
      console.log("DisplayObjectReleased")
      let layout = this.getLayoutParent(evt.sender);
      if(layout){
        //console.log("This belongs to a layout");
        //console.log(this.displayList);
        layout.endInteractiveMovement(evt.sender); 
      }
      if(this.displayObjectWithFocus && this.displayObjectWithFocus == evt.sender){  
        //this.displayObjectWithFocus.hasFocus = false;
        //this.displayObjectWithFocus = null;
      }
      //evt.sender.hasFocus = false;
    });

    this.displayList = [];
  }

  private releaseAll(){
        // Trying to avoid glitches with flakey pointer devices
        // unset the focus property for all DisplayObjects
        this.displayList.forEach((item, index) => {
          item.displayObject.hasFocus = false;
        })
  }

  registerElement(config, layout?:LayoutObject){
     const selector = config.id;
     const observable = multicast();
     const el = (<any>document).querySelector(selector);
     const resizeHandleTop = (<any>document).querySelector(selector + ' .resize-handle-top');
     const resizeHandleRight = (<any>document).querySelector(selector + ' .resize-handle-right');
     const resizeHandleBottom = (<any>document).querySelector(selector + ' .resize-handle-bottom');
     const resizeHandleLeft = (<any>document).querySelector(selector + ' .resize-handle-left');
     
     let tracker: DisplayObject;
     if(config.moveHandle){
      const moveHandle = (<any>document).querySelector(config.moveHandle);
      tracker = new DisplayObject(el, observable, this.messageBus, moveHandle);
     } else {
      tracker = new DisplayObject(el, observable, this.messageBus);
     }
     
     tracker.anchored = config.anchored ? config.anchored : false;
     tracker.moveable = config.moveable ? config.moveable : true;
     tracker.resizeable = config.resizeable ? config.resizeable : true;


     let registration: DisplayObjectRegistration = {displayObject: tracker, layout: layout ? layout : null};
     this.displayList.push(registration) 

     return registration.displayObject;
  }

  unregisterElement(tracker){
    tracker.interactive = false;
    let index = this.displayList.indexOf(tracker);
    this.displayList.splice(index, 1);
    tracker = null;
  }

  // Find the related Layout object for the displayObject if one exists
  getLayoutParent(displayObject:DisplayObject):LayoutObject{
    //let index = this.displayList.indexOf(displayObject);
    const registration: DisplayObjectRegistration[] = this.displayList.filter(item => item.displayObject == displayObject);
    if(registration.length == 0){
      console.warn("DEBUG: The DisplayObject has not been registered");
    } else if(registration.length > 1){
      throw "DisplayObject registered multiple times."
    } else {
      return registration[0].layout
    }
  }

  getChildById(id:string):DisplayObject{
    let registration = this.displayList.find((item) => {
      return item.displayObject.id == id;
    });
    return registration.displayObject;
  }

  getLayoutById(id: string):LayoutObject{
    let registration = this.displayList.find((item) => {
      console.log(item.layout)
      return item.layout.id == id;
    });
    return registration.layout
  }

  private startCollisionDetection(dragTarget:DisplayObject, targets: any[]){
    dragTarget.updateStream.subscribe((position) => {
      //console.log(position.y);
      let collisionTarget = targets.forEach((target) => {
        let found = this.detectCollision(target, dragTarget);
        if(found){
          let index = targets.indexOf(target)
          console.log("item index is " + index);
          return;
        }
      })
      /*if(collisionTarget){
        console.log(collisionTarget)
      }*/
      
    })
  }

  // Collision Detection Goes Here...
  private detectCollision(a, b) {
      return !(
          ((a.y + a.height) < (b.y)) ||
          (a.y > (b.y + b.height)) ||
          ((a.x + a.width) < b.x) ||
          (a.x > (b.x + b.width))
      );
  }

}
