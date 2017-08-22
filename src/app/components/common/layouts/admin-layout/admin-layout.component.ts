import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from "rxjs/Subscription";
import { MediaChange, ObservableMedia } from "@angular/flex-layout";
import { MdSidenav } from '@angular/material';
import { TranslateService } from 'ng2-translate/ng2-translate';
import * as Ps from 'perfect-scrollbar';
import * as domHelper from '../../../../helpers/dom.helper';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.template.html'
})
export class AdminLayoutComponent implements OnInit {
  private isMobile;
  screenSizeWatcher: Subscription;
  isSidenavOpen: Boolean = false;
  @ViewChild(MdSidenav) private sideNave: MdSidenav;

  constructor(private router: Router,
    private media: ObservableMedia,
    public translate: TranslateService) {
    // Close sidenav after route change in mobile
    router.events.subscribe((routeChange) => {
      if (routeChange instanceof NavigationEnd && this.isMobile) {
        this.sideNave.close();
      }
    });
    // Watches screen size and open/close sidenav
    this.screenSizeWatcher = media.subscribe((change: MediaChange) => {
      this.isMobile = (change.mqAlias == 'xs') || (change.mqAlias == 'sm');
      this.updateSidenav();
    });
    
    // Translator init
    const browserLang: string = translate.getBrowserLang();
    translate.use(browserLang.match(/en|fr/) ? browserLang : 'en');
  }
  ngOnInit() {
    // Initialize Perfect scrollbar for sidenav
    let navigationHold = document.getElementById('scroll-area');
    Ps.initialize(navigationHold, {
      suppressScrollX: true
    });
  }
  updateSidenav() {
    var self = this;
    setTimeout(() => {
      self.isSidenavOpen = !self.isMobile;
      self.sideNave.mode = self.isMobile ? 'over' : 'side';
      if (self.isMobile)
        domHelper.removeClass(document.body, 'collapsed-menu');
    })
  }
}