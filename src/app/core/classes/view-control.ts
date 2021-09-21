import { Subject } from 'rxjs';
import { CoreEvent } from 'app/interfaces/events';

export interface Action {
  coreEvent: CoreEvent;
}

export abstract class ViewControl {
  action: CoreEvent;
  target: Subject<CoreEvent>;// (Send actions back to ViewController via this Subject)
  isEnabled = true;

  sendAction(): void {
    this.target.next(this.action);
  }
}
