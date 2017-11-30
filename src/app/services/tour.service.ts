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
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class TourService {
  constructor(
    private router: Router,
    private activeRoute: ActivatedRoute,
    protected ws: WebSocketService,
    protected rest: RestService,
    public snackBar: MdSnackBar,
    public translate: TranslateService) {};

  public GeneralSteps: any;
  public UserTour: any;
  public StorageTour: any;
  public SharingTour: any;


  getTour(steps ? ): any {
    let self = this;
    return {
      id: "hello-egret",
      i18n: {
        nextBtn: this.translate.instant("Next"),
        prevBtn: this.translate.instant("Back"),
        doneBtn: this.translate.instant("Done"),
        skipBtn: this.translate.instant("Skip"),
        closeTooltip: this.translate.instant("Close"),
      },
      showPrevButton: true,
      onEnd: function() {
        self.snackBar.open(self.translate.instant("Awesome! Now let's explore FreeNAS's cool features."), self.translate.instant("close"), { duration: 5000 });
      },
      onClose: function() {
        self.snackBar.open(self.translate.instant("You just closed User Tour!"), self.translate.instant("close"), { duration: 3000 });
      },
      steps: steps
    }
  }

  startTour(url: string): any {
    let self = this;
    this.GeneralSteps = [{
        title: this.translate.instant("Sidebar Controls"),
        content: this.translate.instant("Control left sidebar's display style."),
        target: "sidenavToggle", // Element ID
        placement: "bottom",
        xOffset: 10
      },
      {
        title: this.translate.instant("Available Themes"),
        content: this.translate.instant("Choose a color scheme."),
        target: "schemeToggle", // Element ID
        placement: "left",
        xOffset: 20
      },
      {
        title: this.translate.instant("Language"),
        content: this.translate.instant("Choose your language."),
        target: "currentLang",
        placement: "left",
        xOffset: 10,
        yOffset: -5
      },
      {
        title: this.translate.instant("Users & Groups"),
        content: this.translate.instant("Setup Users and Groups."),
        target: "Dashboard",
        placement: "right",
        xOffset: 200,
        yOffset: 20
      },
      {
        title: this.translate.instant("Volumes & Snapshots"),
        content: this.translate.instant("Create a new Volume."),
        target: document.querySelector(".sidebar-list-item .mat-list-item-ripple"),
        placement: "right",
        yOffset: 200
      }
    ]

    this.UserTour = [{
        title: this.translate.instant("User Controls"),
        content: this.translate.instant("Control left sidebar's display style."),
        target: "sidenavToggle", // Element ID
        placement: "bottom",
        xOffset: 10
      },
      {
        title: this.translate.instant("Available Themes"),
        content: this.translate.instant("Choose a color scheme."),
        target: "schemeToggle", // Element ID
        placement: "left",
        xOffset: 20
      },
      {
        title: this.translate.instant("Language"),
        content: this.translate.instant("Choose your language."),
        target: document.querySelector(".topbar .mat-select"),
        placement: "left",
        xOffset: 10,
        yOffset: -5
      },
      {
        title: this.translate.instant("Users & Groups"),
        content: this.translate.instant("Setup Users and Groups."),
        target: document.querySelector(".sidebar-list-item .mat-list-item-ripple"),
        placement: "right",
        yOffset: 50
      },
      {
        title: this.translate.instant("Volumes & Snapshots"),
        content: this.translate.instant("Create a new Volume."),
        target: document.querySelector(".sidebar-list-item .mat-list-item-ripple"),
        placement: "right",
        yOffset: 200
      }
    ]

    this.StorageTour = [{
        title: this.translate.instant("Storage & Groups"),
        content: this.translate.instant("list"),
        target: "ngx-datatable",
        placement: "bottom",
        yOffset: 20
      },
      {
        title: this.translate.instant("Hover to expand"),
        content: this.translate.instant("Create new Volume"),
        target: "tour-fab-buttons",
        placement: "left",
        yOffset: 220
      }
    ]

    this.SharingTour = [{
        title: this.translate.instant("Sharing Controls"),
        content: this.translate.instant("Control left sidebar's display style."),
        target: "sidenavToggle", // Element ID
        placement: "bottom",
        xOffset: 10
      },
      {
        title: this.translate.instant("Available Themes"),
        content: this.translate.instant("Choose a color scheme."),
        target: "schemeToggle", // Element ID
        placement: "left",
        xOffset: 20
      }
    ]

    switch (url) {
      case "/account/users":
        console.log("/account/users");
        return this.getTour(this.UserTour);
      case "/storage/volumes":
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
      id: "hello-egret",
      i18n: {
        nextBtn: this.translate.instant("Next"),
        prevBtn: this.translate.instant("Back"),
        doneBtn: this.translate.instant("Done"),
        skipBtn: this.translate.instant("Skip"),
        closeTooltip: this.translate.instant("Close"),
      },
      showPrevButton: true,
      onEnd: function() {
        self.snackBar.open(self.translate.instant("Awesome! Now let's explore FreeNAS's cool features."), self.translate.instant("close"), { duration: 5000 });
      },
      onClose: function() {
        self.snackBar.open(self.translate.instant("You just closed User Tour!"), self.translate.instant("close"), { duration: 3000 });
        self.router.navigate(["account","users"]);
      },
      steps: [{
          title: this.translate.instant("Sidebar Controls"),
          content: this.translate.instant("Control left sidebar's display style."),
          target: "sidenavToggle", // Element ID
          placement: "bottom",
          xOffset: 10
        },
        {
          title: this.translate.instant("Available Themes"),
          content: this.translate.instant("Choose a color scheme."),
          target: "schemeToggle", // Element ID
          placement: "left",
          xOffset: 20
        },
        {
          title: this.translate.instant("Language"),
          content: this.translate.instant("Choose your language."),
          target: "currentLang",
          placement: "left",
          xOffset: 10,
          yOffset: -5
        },
        {
          title: this.translate.instant("Users & Groups"),
          content: this.translate.instant("Setup Users and Groups."),
          target: "Dashboard",
          placement: "right",
          xOffset: 200,
          yOffset: 20
        },
        {
          title: this.translate.instant("Volumes & Snapshots"),
          content: this.translate.instant("Create a new Volume."),
          target: document.querySelector(".sidebar-list-item .mat-list-item-ripple"),
          placement: "right",
          yOffset: 200
        }
      ]
    }
  }
}
