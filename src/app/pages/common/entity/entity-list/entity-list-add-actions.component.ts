import {Component, Input, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Subscription} from 'rxjs';

import {GlobalState} from '../../../../global.state';
import {RestService} from '../../../../services/rest.service';

import {EntityListComponent} from './entity-list.component';

@Component({
  selector : 'app-entity-list-add-actions',
  template : `
    <span *ngFor="let action of actions">
      <button class="btn btn-primary btn-fab fab-bottom-right-2" (click)="action.onClick()">{{ action?.label }}</button>
    </span>
  `
})
export class EntityListAddActionsComponent implements OnInit {

  @Input('entity') entity: EntityListComponent;

  public actions: any[];

  ngOnInit() { this.actions = this.entity.getAddActions(); }
}
