

import { Injectable } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, Subscription } from 'rxjs';

import { EntityUtils } from '../pages/common/entity/utils'
import { WebSocketService } from './ws.service';
import { T } from '../translate-marker';
import { RestService } from './rest.service';
import * as hopscotch from 'hopscotch';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class TourService {
  constructor(
    private router: Router,
    private activeRoute: ActivatedRoute,
    protected ws: WebSocketService,
    protected rest: RestService,
    public snackBar: MatSnackBar) {};

  GeneralSteps = [{
      title: 'Sidebar Controls',
      content: T('Control left sidebar\'s display style.'),
      target: 'sidenavToggle', // Element ID
      placement: 'bottom',
      xOffset: 10
    },
    {
      title: T('Available Themes'),
      content: T('Choose a color scheme.'),
      target: 'schemeToggle', // Element ID
      placement: 'left',
      xOffset: 20
    },
    {
      title: T('Language'),
      content: T('Choose your language.'),
      target: 'currentLang',
      placement: 'left',
      xOffset: 10,
      yOffset: -5
    },
    {
      title: T('Users & Groups'),
      content: T('Setup Users and Groups.'),
      target: 'Dashboard',
      placement: 'right',
      xOffset: 200,
      yOffset: 20
    },
    {
      title: T('Pools & Snapshots'),
      content: T('Create a new Pool.'),
      target: document.querySelector('.sidebar-list-item .mat-list-item-ripple'),
      placement: 'right',
      yOffset: 200
    }
  ]

  UserTour = [{
      title: T('User Controls'),
      content: T('Control left sidebar\'s display style.'),
      target: 'sidenavToggle', // Element ID
      placement: 'bottom',
      xOffset: 10
    },
    {
      title: T('Available Themes'),
      content: T('Choose a color scheme.'),
      target: 'schemeToggle', // Element ID
      placement: 'left',
      xOffset: 20
    },
    {
      title: T('Language'),
      content: T('Choose your language.'),
      target: document.querySelector('.topbar .mat-select'),
      placement: 'left',
      xOffset: 10,
      yOffset: -5
    },
    {
      title: T('Users & Groups'),
      content: T('Setup Users and Groups.'),
      target: document.querySelector('.sidebar-list-item .mat-list-item-ripple'),
      placement: 'right',
      yOffset: 50
    },
    {
      title: T('Pools & Snapshots'),
      content: T('Create a new Pool.'),
      target: document.querySelector('.sidebar-list-item .mat-list-item-ripple'),
      placement: 'right',
      yOffset: 200
    }
  ]

  StorageTour = [{
      title: T('Storage & Groups'),
      content: T('list'),
      target: 'ngx-datatable',
      placement: 'bottom',
      yOffset: 20
    },
    {
      title: T('Hover to expand'),
      content: T('Create new Pool'),
      target: 'tour-fab-buttons',
      placement: 'left',
      yOffset: 220
    }
  ]

  SharingTour = [{
      title: T('Sharing Controls'),
      content: T('Control left sidebar\'s display style.'),
      target: 'sidenavToggle', // Element ID
      placement: 'bottom',
      xOffset: 10
    },
    {
      title: T('Available Themes'),
      content: T('Choose a color scheme.'),
      target: 'schemeToggle', // Element ID
      placement: 'left',
      xOffset: 20
    }
  ]

  getTour(steps ? ): any {
    let self = this;
    return {
      id: 'hello-egret',
      showPrevButton: true,
      onEnd: function() {
        self.snackBar.open(T('Awesome! Now let\'s explore FreeNAS\'s cool features.'), T('close'), { duration: 5000 });
      },
      // onClose: function() {
      //   self.snackBar.open(T('You just closed User Tour!'), T('close'), { duration: 3000 });
      // },
      steps: steps
    }
  }

  startTour(url: string): any {
    let self = this;
    switch (url) {
      case "/account/users":
        console.log("/account/users");
        return this.getTour(this.UserTour);
      case "/storage/pools":
        return this.getTour(this.StorageTour);
      case "/sharing/afp":
        return this.getTour(this.SharingTour);
      default:
      	// in general should use this one
        return this.getTour(this.GeneralSteps);
        // if you want to force user to redirect to another page
        // and start another tour immediately, uncomment next line.
        // return this.GeneralTour();
    }
  }

  GeneralTour(): any {
    let self = this;
    return {
      id: 'hello-egret',
      showPrevButton: true,
      onEnd: function() {
        self.snackBar.open(T('Awesome! Now let\'s explore FreeNAS\'s cool features.'), T('close'), { duration: 5000 });
      },
      // onClose: function() {
      //   self.snackBar.open(T('You just closed User Tour!'), T('close'), { duration: 3000 });
      //   self.router.navigate(['account','users']);
      // },
      steps: [{
          title: T('Sidebar Controls'),
          content: T('Control left sidebar\'s display style.'),
          target: 'sidenavToggle', // Element ID
          placement: 'bottom',
          xOffset: 10
        },
        {
          title: T('Available Themes'),
          content: T('Choose a color scheme.'),
          target: 'schemeToggle', // Element ID
          placement: 'left',
          xOffset: 20
        },
        {
          title: T('Language'),
          content: T('Choose your language.'),
          target: 'currentLang',
          placement: 'left',
          xOffset: 10,
          yOffset: -5
        },
        {
          title: T('Users & Groups'),
          content: T('Set up Users and Groups.'),
          target: 'Dashboard',
          placement: 'right',
          xOffset: 200,
          yOffset: 20
        },
        {
          title: T('Pools & Snapshots'),
          content: T('Create a new Pool.'),
          target: document.querySelector('.sidebar-list-item .mat-list-item-ripple'),
          placement: 'right',
          yOffset: 200
        }
      ]
    }
  }
}
