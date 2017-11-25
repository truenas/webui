import { Component, Input } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { CoreEvent } from '../../services/core.service';

export interface ViewControllerOptions {
  data: any[];
  events: Subject<CoreEvent>;
}

@Component({
  selector: 'view-controller',
  template: '<div *ngFor="let view of viewsData; let i=index">{{ view[i] }}<div>'
})
export class ViewController {

  @Input("viewsData") viewsData: any[]; // (each of these are passed to view as <data> property)
  @Input("viewsEvents") viewsEvents: Subject<CoreEvent>;

  constructor() {
    
  }
}
