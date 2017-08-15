import {Component, Input, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Subscription} from 'rxjs';

import {GlobalState} from '../../../../global.state';
import {RestService} from '../../../../services/rest.service';

import {EntityTableComponent} from './entity-table.component';

@Component({
  selector : 'app-entity-table-add-actions',
  template : `
    <span *ngFor="let action of actions">
        <button md-mini-fab class="md-fab-bottom-right-2" (click)="action.onClick()" color="accent"><md-icon>add_circle</md-icon></button>
    </span>
  `
})
export class EntityTableAddActionsComponent implements OnInit {

  @Input('entity') entity: EntityTableComponent;

  public actions: any[];

  ngOnInit() { this.actions = this.entity.getAddActions(); }
}
