//import { Component } from '@angular/core';
import { CoreEvent } from 'app/core/services/core.service';
import { Subject } from 'rxjs/Subject';

export abstract class View {

  public superView: boolean = false; // if this is the top level view in the ViewController
  public subViews?: any[]; // Component reference to child components
  public viewController:Subject<CoreEvent>;// (Send actions back to ViewController via this Subject)
  public data: any = <any>{};

  constructor() {}
}
