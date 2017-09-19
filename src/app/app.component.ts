import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, NavigationEnd, ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';

import { RoutePartsService } from "./services/route-parts/route-parts.service";
import { MdSnackBar } from '@angular/material';
import * as hopscotch from 'hopscotch';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  appTitle = 'FreeNAS Material UI';
  pageTitle = '';

  constructor(public title: Title, 
    private router: Router, 
    private activeRoute: ActivatedRoute,
    private routePartsService: RoutePartsService,
    public snackBar: MdSnackBar) { }

  ngOnInit() {
    this.changePageTitle();
    setTimeout(() => {
      hopscotch.startTour(this.tourSteps());
    }, 2000);
  }

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
      steps: [
        {
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

  changePageTitle() {
    this.router.events.filter(event => event instanceof NavigationEnd).subscribe((routeChange) => {
      const routeParts = this.routePartsService.generateRouteParts(this.activeRoute.snapshot);
      if (!routeParts.length) {
        return this.title.setTitle(this.appTitle);
      }
      // Extract title from parts;
      this.pageTitle = routeParts
                      .map((part) => part.title )
                      .reduce((partA, partI) => {return `${partA} > ${partI}`});
      this.pageTitle += ` | ${this.appTitle}`;
      this.title.setTitle(this.pageTitle);
    });
  }
}
