import {Component, Input, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Subscription} from 'rxjs';

import {GlobalState} from '../../../../global.state';
import {RestService} from '../../../../services/rest.service';

import {EntityTableComponent} from './entity-table.component';
import * as _ from 'lodash';

@Component({
  selector : 'app-entity-table-actions',
  styleUrls: ['./entity-table-actions.component.scss'], 
  template : `
    <i 
      *ngIf="(editAction && iconActionVisible(editAction.id)) &&
        (!entity.conf.isActionVisible 
        || entity.conf.isActionVisible.bind(entity.conf)(editAction.id, row))"
      (click)="editAction.onClick(row)"
      class='ion-wrench'>
    </i>
    <i
      *ngIf="(deleteAction && iconActionVisible(deleteAction.id)) &&
        (!entity.conf.isActionVisible 
        || entity.conf.isActionVisible.bind(entity.conf)(deleteAction.id, row))"
      (click)="deleteAction.onClick(row)"
      class='ion-trash-a'>
    </i>
    <ng2-dropdown *ngIf="showMenu">
      <ng2-dropdown-button [showCaret]="false" class="ng2-dropdown-button--icon">
        <a class='ion-android-more-vertical' ng2-menu-item-icon></a>
      </ng2-dropdown-button>
      <ng2-dropdown-menu [width]="1" [offset]="'74 -205'">
        <span *ngFor="let action of actions">
          <ng2-menu-item
            *ngIf="!iconActionVisible(action.id) &&
            (!entity.conf.isActionVisible 
              || entity.conf.isActionVisible.bind(entity.conf)(action.id, row))"
              (click)="action.onClick(this.row)">
            <span>{{ action?.label }}</span>
          </ng2-menu-item>
        </span>
      </ng2-dropdown-menu>
    </ng2-dropdown>
  `
})
export class EntityTableActionsComponent implements OnInit {

  @Input('entity') entity: EntityTableComponent;
  @Input('row') row: any;

  public actions: any[];
  public editAction: any;
  public deleteAction: any;
  public actionIconsVisible: number = 0;
  public showMenu: boolean = true;

  iconActionVisible(id: string) {
    if (id == 'edit' || id == 'delete') {
      return this.actionIconsVisible > 0;      
    } 
    return false;
  }

  menuActionVisible(id: string) {
    if (id == 'edit' || id == 'delete') {
      false;
    }
    return true;
  }

  ngOnInit() {
    this.actions = this.entity.getActions(this.row);
    let removeIds = [];
    for (let i = 0; i < this.actions.length; i++) {
      if (this.entity.conf.isActionVisible) {
        this.actions[i].visible = this.entity.conf.isActionVisible.bind(
            this.entity.conf)(this.actions[i].id, this.row);
      } else {
        this.actions[i].visible = true;
      }
      
      if (this.actions[i].id == 'delete') {
        this.deleteAction = this.actions[i];
        this.actionIconsVisible += 1;
      }
      if (this.actions[i].id == 'edit') {
        this.editAction = this.actions[i];
        this.actionIconsVisible += 1;
      }

    }
    if (this.actionIconsVisible >= this.actions.length) {
      this.showMenu = false;
    }
  }
}
