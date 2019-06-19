import { RestService, WebSocketService, AppLoaderService } from '../../../../services';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { Component, AfterViewChecked, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from "rxjs";
import { MediaChange, MediaObserver } from "@angular/flex-layout";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatSidenav, MatDialog, MatDialogRef } from '@angular/material';
import * as Ps from 'perfect-scrollbar';
import * as domHelper from '../../../../helpers/dom.helper';
import { ThemeService } from '../../../../services/theme/theme.service';
import { LanguageService } from '../../../../services/language.service';
import { ConsolePanelModalDialog } from '../../dialog/consolepanel/consolepanel-dialog.component';
import {UUID} from 'angular2-uuid';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.template.html',
  styleUrls: ['./admin-layout.component.css'],
})
export class AdminLayoutComponent implements OnInit, AfterViewChecked {
  private isMobile;
  screenSizeWatcher: Subscription;
  isSidenavOpen: Boolean = true;
  isShowFooterConsole: Boolean = false;
  isSidenotOpen: Boolean = false;
  consoleMsg: String = "";
  consoleMSgList: any[] = [];
  public is_freenas: Boolean = window.localStorage['is_freenas'];
  public logoPath: string = 'assets/images/light-logo.svg';
  public logoTextPath: string = 'assets/images/light-logo-text.svg';
  public currentTheme: string = "";
  // we will just have to add to this list as more languages are added

  @ViewChild(MatSidenav, { static: false}) private sideNave: MatSidenav;
  @ViewChild('footerBarScroll', { static: true}) private footerBarScroll: ElementRef;
  freenasThemes;

  constructor(private router: Router,
    public core: CoreService,
    public themeService: ThemeService,
    private media: MediaObserver,
    protected rest: RestService,
    protected ws: WebSocketService,
    public language: LanguageService,
    public dialog: MatDialog, private loader: AppLoaderService) {
    // detect server type
    ws.call('system.is_freenas').subscribe((res)=>{
      this.is_freenas = res;
    });

    // Close sidenav after route change in mobile
    router.events.subscribe((routeChange) => {
      if (routeChange instanceof NavigationEnd && this.isMobile) {
        this.sideNave.close();
      }
    });
    // Watches screen size and open/close sidenav
    this.screenSizeWatcher = media.media$.subscribe((change: MediaChange) => {
      this.isMobile = (change.mqAlias == 'xs') || (change.mqAlias == 'sm');
      this.updateSidenav();
    });

    // Translator init
    language.getMiddlewareLanguage();

    // Subscribe to Theme Changes
    core.register({
      observerClass:this, 
      eventName:"ThemeChanged", 
      sender:themeService
    }).subscribe((evt:CoreEvent)=>{
      let theme = evt.data;
      this.logoPath = theme.logoPath;
      this.logoTextPath = theme.logoTextPath;
    });
  }

  ngOnInit() {
    this.freenasThemes = this.themeService.freenasThemes;
    this.currentTheme = this.themeService.currentTheme().name;
    // Initialize Perfect scrollbar for sidenav
    let navigationHold = document.getElementById('scroll-area');

    // Delay needed to fix a init err with navbar vert scroll
    setTimeout(() => {
      Ps.initialize(navigationHold, {
        suppressScrollX: true
      });
    }, 500);

    if (this.media.isActive('xs') || this.media.isActive('sm')) {
      this.isSidenavOpen = false;
    }
    this.checkIfConsoleMsgShows();
    this.loader.open();
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
      this.onShowConsoleFooterBar(res.data['adv_consolemsg']);    
    });
  }

  getLogConsoleMsg() {
    let subName = "filesystem.file_tail_follow:/var/log/messages:500";
    let neededNumberconsoleMsg = 3; // Just 3 messages for footer bar

    this.ws.sub(subName).subscribe((res) => {
      if(res && res.data != ""){
        this.consoleMsg = this.accumulateConsoleMsg(res.data, neededNumberconsoleMsg);
      }
    });
  }

  accumulateConsoleMsg(msg, num) {
    let msgs = "";

    if(msg != "") {
      // consoleMSgList will store just 500 messages.
      this.consoleMSgList.push(msg);
      if(this.consoleMSgList.length > 500) {
        this.consoleMSgList.shift();
      }
    }    
    if(num > 500) {
      num = 500;
    }
    if(num > this.consoleMSgList.length) {
      num = this.consoleMSgList.length;
    }
    for (let i = this.consoleMSgList.length - 1; i >= this.consoleMSgList.length - num; --i) {
      msgs = this.consoleMSgList[i] + msgs;
    }

    return msgs;
  }

  onShowConsoleFooterBar(data) {
    if(data && this.consoleMsg == "") {
      this.getLogConsoleMsg();      
    }

    this.isShowFooterConsole = data;
  }

  onShowConsolePanel() {
    let dialogRef = this.dialog.open(ConsolePanelModalDialog, {});
    const sub = dialogRef.componentInstance.onEventEmitter.subscribe(() => {
      dialogRef.componentInstance.consoleMsg = this.accumulateConsoleMsg("", 500);
    })

    dialogRef.afterClosed().subscribe((result) => {
      clearInterval(dialogRef.componentInstance.intervalPing);
      sub.unsubscribe();
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
