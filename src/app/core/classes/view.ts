import { Subject } from 'rxjs';
import { CoreEvent } from 'app/interfaces/events';

export abstract class View {
  superView = false; // if this is the top level view in the ViewController
  viewController: Subject<CoreEvent>;// (Send actions back to ViewController via this Subject)
  abstract get data(): any;
  abstract set data(value: any);
}
