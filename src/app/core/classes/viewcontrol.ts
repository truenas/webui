import { CoreEvent } from 'app/core/services/core.service';
import { Subject } from 'rxjs';

export interface Action {
  coreEvent: CoreEvent;
}

export abstract class ViewControl {
  action: CoreEvent;
  target: Subject<CoreEvent>;// (Send actions back to ViewController via this Subject)
  isEnabled = true;
  layout: any;

  sendAction(): void {
    this.target.next(this.action);
  }
}
