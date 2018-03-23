import {Component, Input, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Subscription} from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import {RestService} from '../../../../services/rest.service';

import {EntityCardComponent} from './entity-card.component';
import * as _ from 'lodash';

@Component({
  selector : 'app-entity-card-actions',
  styleUrls: ['./entity-card-actions.component.scss'], 
  templateUrl : './entity-card-actions.component.html'
})
export class EntityCardActionsComponent implements OnInit {

  @Input('entity') entity: EntityCardComponent;
  @Input('row') row: any;

  public actions: any[];
  public showMenu: boolean = true;

  constructor(public translate: TranslateService) {}

  menuActionVisible(id: string) {
    if (id == 'edit' || id == 'delete') {
      false;
    }
    return true;
  }

  ngOnInit() {
    this.actions = this.entity.getCardActions(this.row);
    let removeIds = [];
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
