import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EntityTableService {
  private addActionsUpdaterSubject$: Subject<unknown> = new Subject();

  get addActionsUpdater$(): Observable<unknown> {
    return this.addActionsUpdaterSubject$.asObservable();
  }

  triggerActionsUpdate(actions: unknown): void {
    this.addActionsUpdaterSubject$.next(actions);
  }
}
