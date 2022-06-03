import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { EntityTableAction } from 'app/modules/entity/entity-table/entity-table.interface';

@Injectable({
  providedIn: 'root',
})
export class EntityTableService {
  private addActionsUpdaterSubject$: Subject<EntityTableAction[]> = new Subject();

  get addActionsUpdater$(): Observable<EntityTableAction[]> {
    return this.addActionsUpdaterSubject$.asObservable();
  }
}
