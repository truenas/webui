import {Component, Input, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Subscription} from 'rxjs';

import {RestService} from '../../../../services/rest.service';

import {EntityTableComponent} from './entity-table.component';
import * as _ from 'lodash';

@Component({
  selector : 'app-entity-table-actions',
  styleUrls: ['./entity-table-actions.component.scss'], 
  templateUrl : './entity-table-actions.component.html'
})
export class EntityTableActionsComponent implements OnInit {

  @Input('entity') entity: EntityTableComponent;
  @Input('row') row: any;
  @Input('icon_name') icon_name = "more_vert";

  public actions: any[];
  public showMenu: boolean = true;

  menuActionVisible(id: string) {
    if (id === 'edit' || id === 'delete') {
      return false;
    }
    return true;
  }

  ngOnInit() {
    this.actions = this.entity.getActions(this.row);
    const removeIds = [];
    for (let i = 0; i < this.actions.length; i++) {
      if (this.entity.conf.isActionVisible) {
        this.actions[i].visible = this.entity.conf.isActionVisible.bind(
            this.entity.conf)(this.actions[i].id, this.row);
      } else {
        this.actions[i].visible = true;
      }
    }
  }
}
