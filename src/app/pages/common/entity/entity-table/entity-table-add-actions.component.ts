import {Component, Input, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Subscription} from 'rxjs';

import {GlobalState} from '../../../../global.state';
import {RestService} from '../../../../services/rest.service';

import {EntityTableComponent} from './entity-table.component';

@Component({
  selector : 'app-entity-table-add-actions',
  template : `
	<div *ngIf="this.entity.conf.route_add || this.actions.length > 0">
		<smd-fab-speed-dial #myFab [direction]="direction" [animationMode]="animationMode"
				(mouseenter)="myFab.open = true" (mouseleave)="myFab.open = false">
			<smd-fab-trigger [spin]="spin">
				<button md-fab><md-icon>add</md-icon></button>
			</smd-fab-trigger>

			<smd-fab-actions>
				<button *ngIf="this.entity.conf.route_add" md-mini-fab (click)="this.entity.doAdd()" mdTooltip="Add">
					<md-icon>add</md-icon>
				</button>
				<button *ngFor="let action of actions" md-mini-fab (click)="action.onClick()" mdTooltip="{{action.label}}">
					<md-icon>{{action.icon}}</md-icon>
				</button>
			</smd-fab-actions>
		</smd-fab-speed-dial>
	</div>
  `
})
export class EntityTableAddActionsComponent implements OnInit {

  @Input('entity') entity: EntityTableComponent;

  public actions: any[];

  public spin: boolean = true;
  public direction: string = 'right';
  public animationMode: string = 'fling';

  ngOnInit() { this.actions = this.entity.getAddActions(); }
}
