import { Component } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { CoreEvent } from '../services/core.service';

export interface ViewControllerOptions {
  data: any[];
  events: Subject<CoreEvent>;
}

export abstract class ViewController {

  private viewsData: any[]; // (each of these are passed to view as <data> property)
  public viewsEvents: Subject<CoreEvent>;

  constructor(options?: ViewControllerOptions) {
    if(options){
      this.viewsData = options.data;
      this.viewsEvents = options.events;
    }
  }
}
