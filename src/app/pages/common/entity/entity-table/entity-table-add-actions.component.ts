import {Component, Input, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Subscription} from 'rxjs';

import {RestService} from '../../../../services/rest.service';

import {EntityTableComponent} from './entity-table.component';

@Component({
  selector : 'app-entity-table-add-actions',
  template : `
	<div *ngIf="this.entity.conf.route_add || this.actions.length > 0">
		<smd-fab-speed-dial id="myFab" #myFab [direction]="direction" [animationMode]="animationMode"
				(mouseenter)="myFab.open = true" (mouseleave)="myFab.open = false">
			<smd-fab-trigger [spin]="spin">
				<button md-fab><md-icon>list</md-icon></button>
			</smd-fab-trigger>

			<smd-fab-actions>
				<button  id="add_action_button" *ngIf="this.entity.conf.route_add" md-mini-fab (click)="this.entity.doAdd()" mdTooltip="{{this.entity.conf.route_add_tooltip}}">
					<md-icon>add</md-icon>
				</button>
				<button id="add_action_button_{{action?.label}}" *ngFor="let action of actions" md-mini-fab (click)="action.onClick()" mdTooltip="{{action.label}}">
					<md-icon>{{action.icon}}</md-icon>
				</button>
			</smd-fab-actions>
		</smd-fab-speed-dial>
	</div>
  `
})
export class EntityTableAddActionsComponent implements OnInit {

  @Input('entity') entity: any;

  public actions: any[];

  public spin: boolean = true;
  public direction: string = 'right';
  public animationMode: string = 'fling';

  ngOnInit() { 
		this.actions = this.entity.getAddActions(); 
	}
}
