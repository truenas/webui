import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { EntityTableComponent } from './entity-table.component';
import { GlobalState } from '../../../../global.state';
import { RestService } from '../../../../services/rest.service';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-entity-table-actions',
  template: `
    <span *ngFor="let action of entity.getActions(row)" class="btn-group">
      <button *ngIf="!entity.conf.isActionVisible || entity.conf.isActionVisible.bind(entity.conf)(action.id, row)" class="btn btn-lg btn-block btn-raised btn-primary" (click)="action.onClick(this.row)">{{ action?.label }}</button>
    </span>
  `
})
export class EntityTableActionsComponent implements OnInit {

  @Input('entity') entity: EntityTableComponent;
  @Input('row') row: any;

  private actions: any[];

  ngOnInit() {
    this.actions = this.entity.getActions(this.row);
    this.actions.forEach((action) => {
      if (this.entity.conf.isActionVisible) {
        action.visible = this.entity.conf.isActionVisible.bind(this.entity.conf)(action.id, this.row);
      } else {
        action.visible = true;
      }
    });
  }

}
