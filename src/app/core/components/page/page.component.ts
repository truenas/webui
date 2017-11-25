import { Component } from '@angular/core';
//import { SubComponent } from '../../decorators/subcomponent';
import { Observer } from 'rxjs/Observer';
import { Subject } from 'rxjs/Subject';
import { ViewController, ViewControllerOptions } from '../view-controller/view-controller.component';
import { CoreService, CoreEvent } from '../../services/core.service';

export interface PageOptions {
  data: any[];
  events: Subject<CoreEvent>;
  url: string;
}

@Component({
  selector: 'page',
  template: '<div>This is a page!</div>'
})
export class Page extends ViewController {

  private displayList: any[]; // (This is a copy of the <viewsData>. If filtering view nodes, this is what gets altered instead of the actual viewsData)
  public url: string; // Give the page a url

  constructor(private options: PageOptions) {
    super({events:options.events, data:options.data});
    this.url = options.url;
    this.displayList = [];
  }
}
