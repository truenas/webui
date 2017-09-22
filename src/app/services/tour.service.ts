import 'rxjs/add/operator/map';

import { Injectable } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { Http } from '@angular/http';
import { Observable, Subject, Subscription } from 'rxjs/Rx';

import { EntityUtils } from '../pages/common/entity/utils'
import { WebSocketService } from './ws.service';
import { RestService } from './rest.service';
import * as hopscotch from 'hopscotch';
import { MdSnackBar } from '@angular/material';

@Injectable()
export class TourService {

  protected accountUserResource: string = 'account/users/1';
  constructor(
  	private router: Router,
  	private activeRoute: ActivatedRoute,
  	protected ws: WebSocketService, 
  	protected rest: RestService, 
  	public snackBar: MdSnackBar) {};

  tourSteps(): any {
    let self = this;
    return {
      id: 'hello-egret',
      showPrevButton: true,
      onEnd: function() {
        self.snackBar.open('Awesome! Now let\'s explore FreeNAS\'s cool features.', 'close', { duration: 5000 });
      },
      onClose: function() {
        self.snackBar.open('You just closed User Tour!', 'close', { duration: 3000 });
      },
      steps: [{
          title: 'Sidebar Controls',
          content: 'Control left sidebar\'s display style.',
          target: 'sidenavToggle', // Element ID
          placement: 'bottom',
          xOffset: 10
        },
        {
          title: 'Available Themes',
          content: 'Choose a color scheme.',
          target: 'schemeToggle', // Element ID
          placement: 'left',
          xOffset: 20
        },
        {
          title: 'Language',
          content: 'Choose your language.',
          target: document.querySelector('.topbar .mat-select'),
          placement: 'left',
          xOffset: 10,
          yOffset: -5
        },
        {
          title: 'Users & Groups',
          content: 'Setup Users and Groups.',
          target: document.querySelector('.sidebar-list-item .mat-list-item-ripple'),
          placement: 'right',
          yOffset: 50
        },
        {
          title: 'Volumes & Snapshots',
          content: 'Create a new Volume.',
          target: document.querySelector('.sidebar-list-item .mat-list-item-ripple'),
          placement: 'right',
          yOffset: 200
        }
      ]
    }
  }

  getUserPreference() {
    return this.rest.get(this.accountUserResource, {});
  }
}
