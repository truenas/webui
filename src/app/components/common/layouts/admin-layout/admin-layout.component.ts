import { RestService } from '../../../../services';
import { Component, AfterViewChecked, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from "rxjs/Subscription";
import { MediaChange, ObservableMedia } from "@angular/flex-layout";
import { MdSidenav, MdDialog, MdDialogRef } from '@angular/material';
import { TranslateService } from 'ng2-translate/ng2-translate';
import * as Ps from 'perfect-scrollbar';
import * as domHelper from '../../../../helpers/dom.helper';
import { ThemeService } from '../../../../services/theme/theme.service';
import { ConsolePanelModalDialog } from '../../dialog/consolepanel/consolepanel-dialog.component';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.template.html'
})
export class AdminLayoutComponent implements OnInit, AfterViewChecked {
  private isMobile;
  screenSizeWatcher: Subscription;
  isSidenavOpen: Boolean = true;
  isShowFooterConsole: Boolean = false;
  isSidenotOpen: Boolean = false;

  @ViewChild(MdSidenav) private sideNave: MdSidenav;
  @ViewChild('footerBarScroll') private footerBarScroll: ElementRef;
  freenasThemes;

  constructor(private router: Router,
    public themeService: ThemeService,
    private media: ObservableMedia,
    protected rest: RestService,
    public translate: TranslateService,
    public dialog: MdDialog) {
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
    this.freenasThemes = this.themeService.freenasThemes;
    // Initialize Perfect scrollbar for sidenav
    let navigationHold = document.getElementById('scroll-area');
    Ps.initialize(navigationHold, {
      suppressScrollX: true
    });
    if (this.media.isActive('xs') || this.media.isActive('sm')) {
      this.isSidenavOpen = false;
    }
    this.checkIfConsoleMsgShows();
  }

  ngAfterViewChecked() {
    this.scrollToBottomOnFooterBar();
  }

  updateSidenav() {
    let self = this;
    setTimeout(() => {
      self.isSidenavOpen = !self.isMobile;
      self.isSidenotOpen = false;
      self.sideNave.mode = self.isMobile ? 'over' : 'side';
      if (self.isMobile) {
        domHelper.removeClass(document.body, 'collapsed-menu');
      }

    }, -1);

  }

  scrollToBottomOnFooterBar(): void {
    try {
      this.footerBarScroll.nativeElement.scrollTop = this.footerBarScroll.nativeElement.scrollHeight;
    } catch(err) { }
  }

  checkIfConsoleMsgShows() {
    this.rest.get('system/advanced', { limit: 0 }).subscribe((res) => {
      this.isShowFooterConsole = res.data['adv_consolemsg'];
      this.getLogConsoleMsg();
    });
  }

  getLogConsoleMsg() {
    // Adding console messages API here
  }

  onShowConsolePanel() {
    let dialogRef = this.dialog.open(ConsolePanelModalDialog, {
      width: '600px'
    });
  }

  public onOpenNav($event) {
    this.isSidenavOpen = true;
  }

  public onCloseNav($event) {
    this.isSidenavOpen = false;
  }

  public onOpenNotify($event) {
    this.isSidenotOpen = true;
  }

  public onCloseNotify($event) {
    this.isSidenotOpen = false;
  }

  changeState($event) {
    if ($event.transfer) {
      if (this.media.isActive('xs') || this.media.isActive('sm')) {
        this.sideNave.close();
      }
    }
  }
}
