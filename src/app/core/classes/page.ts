import { Subject } from 'rxjs';
import { ViewController } from 'app/core/classes/view-controller';
import { CoreEvent } from 'app/interfaces/events';

export interface PageOptions {
  events$: Subject<CoreEvent>;
  url: string;
}

export abstract class Page extends ViewController {
  name = 'Page';
  private url: string; // Give the page a url

  constructor(options?: PageOptions) {
    super();
    if (options) {
      this.setControlEvents(options.events$);
    }
  }
}
