import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { EntityTableAction } from 'app/modules/entity/entity-table/entity-table.interface';

@Injectable({
  providedIn: 'root',
})
export class EntityTableService {
  private addActionsUpdaterSubject$ = new Subject<EntityTableAction[]>();

  get addActionsUpdater$(): Observable<EntityTableAction[]> {
    return this.addActionsUpdaterSubject$.asObservable();
  }
}
