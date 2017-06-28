import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { EntityTableComponent } from './entity-table.component';
import { GlobalState } from '../../../../global.state';
import { RestService } from '../../../../services/rest.service';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-entity-table-add-actions',
  template: `
    <span *ngFor="let action of actions">
      <button class="btn btn-primary btn-fab" (click)="action.onClick()">{{ action?.label }}</button>
    </span>
  `
})
export class EntityTableAddActionsComponent implements OnInit {

  @Input('entity') entity: EntityTableComponent;

  private actions: any[];

  ngOnInit() {
    this.actions = this.entity.getAddActions();
  }

}
