//import { SubComponent } from '../../decorators/subcomponent';
import { Observer } from 'rxjs/Observer';
import { Subject } from 'rxjs/Subject';
import { ViewController, ViewControllerOptions } from './viewcontroller';
import { CoreService, CoreEvent } from '../services/core.service';

export interface PageOptions {
  events: Subject<CoreEvent>;
  url: string;
}

export abstract class Page extends ViewController {

  public name: string = "Page";
  private url: string; // Give the page a url
  //private displayList: any[]; // (This is a copy of the <viewsData>. If filtering view nodes, this is what gets altered instead of the actual viewsData)

  constructor(options?: PageOptions) {
    super();
    // url ??
    console.log(this.name + ' Class Constructor');
    if(options){
      this.setControlEvents(options.events);
    }
  }
}
