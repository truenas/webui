import { Subject } from 'rxjs';
import { CoreEvent } from 'app/interfaces/events';

export abstract class View {
  superView = false; // if this is the top level view in the ViewController
  subViews?: any[]; // Component reference to child components
  viewController: Subject<CoreEvent>;// (Send actions back to ViewController via this Subject)
  data: any = <any>{};
}
