// import { Component } from '@angular/core';
import { CoreEvent } from 'app/core/services/core.service';
import { Subject } from 'rxjs';

export abstract class View {
  superView = false; // if this is the top level view in the ViewController
  subViews?: any[]; // Component reference to child components
  viewController: Subject<CoreEvent>;// (Send actions back to ViewController via this Subject)
  data: any = <any>{};

  constructor() {}
}
