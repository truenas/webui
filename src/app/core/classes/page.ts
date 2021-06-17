import { Subject } from 'rxjs';
import { CoreEvent } from 'app/interfaces/events';
import { ViewController } from './viewcontroller';

export interface PageOptions {
  events: Subject<CoreEvent>;
  url: string;
}

export abstract class Page extends ViewController {
  name = 'Page';
  private url: string; // Give the page a url

  constructor(options?: PageOptions) {
    super();
    if (options) {
      this.setControlEvents(options.events);
    }
  }
}
