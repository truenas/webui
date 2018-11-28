import {Component, Input, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Subscription} from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import {RestService} from '../../../../services/rest.service';

import {EntityTableComponent} from './entity-table.component';

@Component({
  selector : 'app-entity-table-add-actions',
  template : `
  	<div *ngIf="this.entity.conf.route_add || this.actions.length > 0">
		<smd-fab-speed-dial id="myFab" #myFab [direction]="direction" [animationMode]="animationMode"
				(mouseenter)="myFab.open = true" (mouseleave)="myFab.open = false">
			<smd-fab-trigger [spin]="!this.entity.conf.route_add">
				<button id="add_action_button" *ngIf="this.entity.conf.route_add; else elseBlock" mat-fab (click)="this.entity.doAdd()" matTooltip="{{this.entity.conf.route_add_tooltip | translate}}">
					<mat-icon>add</mat-icon>
				</button>
				<ng-template #elseBlock>
					<button mat-fab><mat-icon>list</mat-icon></button>
				</ng-template>
			</smd-fab-trigger>
			<smd-fab-actions>
				<button id="add_action_button_{{action?.label}}" *ngFor="let action of actions" mat-mini-fab (click)="action.onClick()" matTooltip="{{action.label | translate}}">
					<mat-icon>{{action.icon}}</mat-icon>
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
  public direction: string = 'left';
  public animationMode: string = 'fling';

  constructor(protected translate: TranslateService) { }

  ngOnInit() { 
		this.actions = this.entity.getAddActions(); 
	}
}
