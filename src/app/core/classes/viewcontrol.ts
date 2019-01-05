import { CoreEvent } from 'app/core/services/core.service';
import { Subject } from 'rxjs/Subject';

export interface Action {
  coreEvent: CoreEvent;
}

export abstract class ViewControl {

  public action: CoreEvent;
  public target:Subject<CoreEvent>;// (Send actions back to ViewController via this Subject)
  public isEnabled: boolean = true;
  public layout:any; 

  constructor() {}

  sendAction(){
    this.target.next(this.action);
  }
}
