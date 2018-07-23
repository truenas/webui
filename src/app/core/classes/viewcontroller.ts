import { Component, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { CoreEvent } from '../services/core.service';
import { View } from './view';
import { Action } from './viewcontrol';

export interface ViewControllerOptions {
  //data: any[];
  events: Subject<CoreEvent>;
  //actions?: Action[];
}

export abstract class ViewController implements OnDestroy {

  public name: string = "ViewController";
  protected controlEvents: Subject<CoreEvent>;

  constructor(options?: ViewControllerOptions) {
    console.log(this.name + ' Class Constructor'); 
    if(options){
      this.setControlEvents(options.events);
    } else {
      this.setControlEvents();
    }
  }

  public setControlEvents(subj?:Subject<CoreEvent>){
    if(subj){
      this.controlEvents = subj;
    } else {
      this.controlEvents = new Subject();
    }
  }

  ngOnDestroy(){}
}
