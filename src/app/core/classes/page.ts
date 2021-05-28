// import { SubComponent } from '../../decorators/subcomponent';
import { Observer } from 'rxjs';
import { Subject } from 'rxjs';
import { CoreEvent } from 'app/interfaces/events';
import { ViewController, ViewControllerOptions } from './viewcontroller';

export interface PageOptions {
  events: Subject<CoreEvent>;
  url: string;
}

export abstract class Page extends ViewController {
  name = 'Page';
  private url: string; // Give the page a url
  // private displayList: any[]; // (This is a copy of the <viewsData>. If filtering view nodes, this is what gets altered instead of the actual viewsData)

  constructor(options?: PageOptions) {
    super();
    if (options) {
      this.setControlEvents(options.events);
    }
  }
}
