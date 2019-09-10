import {Component, Input, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Subscription} from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import {RestService} from '../../../../services/rest.service';

import {EntityTableComponent} from './entity-table.component';
import { interval } from 'rxjs';
import * as _ from 'lodash';

@Component({
  selector : 'app-entity-table-actions',
  styleUrls: ['./entity-table-actions.component.scss'], 
  templateUrl : './entity-table-actions.component.html'
})
export class EntityTableActionsComponent implements OnInit {

  @Input('entity') entity: EntityTableComponent & { conf: any };
  @Input('row') row: any;
  @Input('icon_name') icon_name = "more_vert";

  public actions: any[];
  public showMenu = true;
  public key_prop: string;

  constructor(protected translate: TranslateService) { }

  menuActionVisible(id: string) {
    if (id === 'edit' || id === 'delete') {
      return false;
    }
    return true;
  }

  ngOnInit() {
    if (this.entity.conf.config && this.entity.conf.config.deleteMsg) {
      this.key_prop = this.entity.conf.config.deleteMsg.key_props[0];
    } else if (this.entity.filterColumns) {
      this.key_prop = this.entity.filterColumns[0].prop;
    }
    this.actions = this.entity.getActions(this.row);
    
    interval(5000).subscribe((val) => {
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
     });
  }
}
