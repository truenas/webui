import { Component } from '@angular/core';
import { Subject } from 'rxjs/Subject';

export interface Action {
  element: string;
  eventName: string;
}

export abstract class View {

  private actions?: Action[];
  private primaryAction?: Action;// (this should be your only FAB button in template) 
  private parent:Subject<any>;// (Send actions back to ViewController via this Subject)
  private data: any;

  constructor() { }
}
