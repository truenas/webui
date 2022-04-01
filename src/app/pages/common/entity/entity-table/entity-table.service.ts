import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable()
export class EntityTableService {
  private addActionsUpdaterSubject$: Subject<unknown> = new Subject();

  get addActionsUpdater$(): Subject<unknown> {
    return this.addActionsUpdaterSubject$;
  }
}
