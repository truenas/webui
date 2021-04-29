import {
  AfterViewChecked, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild,
} from '@angular/core';
import { MediaChange, MediaObserver } from '@angular/flex-layout';
import { MatDialog } from '@angular/material/dialog';
import { MatSidenav } from '@angular/material/sidenav';
import { NavigationEnd, Router } from '@angular/router';
import { CoreEvent, CoreService } from 'app/core/services/core.service';
import { Subscription } from 'rxjs';
import { ProductType } from '../../../../enums/product-type.enum';
import * as domHelper from '../../../../helpers/dom.helper';
import { RestService, WebSocketService, SystemGeneralService } from '../../../../services';
import { LanguageService } from '../../../../services/language.service';
import { ThemeService } from '../../../../services/theme/theme.service';
import { ModalService } from '../../../../services/modal.service';
import { ConsolePanelModalDialog } from '../../dialog/consolepanel/consolepanel-dialog.component';
import globalHelptext from '../../../../helptext/global-helptext';
import { LocaleService } from 'app/services/locale.service';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.template.html',
  styleUrls: ['./admin-layout.component.css'],
})
export class AdminLayoutComponent implements OnInit, AfterViewChecked {
  private isMobile: boolean;
  screenSizeWatcher: Subscription;
  getAdvancedConfig: Subscription;
  isSidenavOpen: Boolean = true;
  isSidenavCollapsed = false;
  sidenavMode = 'over';
  isShowFooterConsole: Boolean = false;
  isSidenotOpen: Boolean = false;
  consoleMsg: String = '';
  hostname: string;
  consoleMSgList: any[] = [];
  product_type = window.localStorage['product_type'] as ProductType;
  logoPath = 'assets/images/light-logo.svg';
  logoTextPath = 'assets/images/light-logo-text.svg';
  currentTheme = '';
  retroLogo = false;
  isOpen = false;
  notificPanelClosed = false;
  menuName: string;
  subs: any[];
  copyrightYear = this.localeService.getCopyrightYearFromBuildTime();

  readonly ProductType = ProductType;

  @ViewChild(MatSidenav, { static: false }) private sideNave: MatSidenav;
  @ViewChild('footerBarScroll', { static: true }) private footerBarScroll: ElementRef;
  freenasThemes: any;

  get sidenavWidth(): string {
    return this.getSidenavWidth();
  }

  constructor(private router: Router,
    public core: CoreService,
    public cd: ChangeDetectorRef,
    public themeService: ThemeService,
    private media: MediaObserver,
    protected rest: RestService,
    protected ws: WebSocketService,
    public language: LanguageService,
    public modalService: ModalService,
    public dialog: MatDialog, private sysGeneralService: SystemGeneralService,
    private localeService: LocaleService) {
    // detect server type
    sysGeneralService.getProductType.subscribe((res) => {
      this.product_type = res as ProductType;
    });

    // Close sidenav after route change in mobile
    router.events.subscribe((routeChange) => {
      if (routeChange instanceof NavigationEnd && this.isMobile) {
        this.sideNave.close();
      }
    });
    // Watches screen size and open/close sidenav
    this.screenSizeWatcher = media.media$.subscribe((change: MediaChange) => {
      this.isMobile = window.innerWidth < 960;
      // this.isMobile = (change.mqAlias == 'xs') || (change.mqAlias == 'sm');
      this.updateSidenav();
      core.emit({ name: 'MediaChange', data: change, sender: this });
    });

    // Subscribe to Theme Changes
    core.register({
      observerClass: this,
      eventName: 'ThemeChanged',
      sender: themeService,
    }).subscribe((evt: CoreEvent) => {
      const theme = evt.data;
      // this.logoPath = theme.logoPath;
      // this.logoTextPath = theme.logoTextPath;
    });

    // Subscribe to Preference Changes
    core.register({
      observerClass: this,
      eventName: 'UserPreferencesChanged',
    }).subscribe((evt: CoreEvent) => {
      this.retroLogo = evt.data.retroLogo ? evt.data.retroLogo : false;
    });

    // Listen for system information changes
    core.register({
      observerClass: this,
      eventName: 'SysInfo',
    }).subscribe((evt: CoreEvent) => {
      this.hostname = evt.data.hostname;
    });

    core.register({
      observerClass: this,
      eventName: 'ForceSidenav',
    }).subscribe((evt: CoreEvent) => {
      this.updateSidenav(evt.data);
    });

    core.register({
      observerClass: this,
      eventName: 'SidenavStatus',
    }).subscribe((evt: CoreEvent) => {
      this.isSidenavOpen = evt.data.isOpen;
      this.sidenavMode = evt.data.mode;
      this.isSidenavCollapsed = evt.data.isCollapsed;
    });
  }

  ngOnInit(): void {
    this.freenasThemes = this.themeService.allThemes;
    this.currentTheme = this.themeService.currentTheme().name;
    const navigationHold = document.getElementById('scroll-area');

    // Allows for one-page-at-a-time scrolling in sidenav on Windows
    if (window.navigator.platform.toLowerCase() === 'win32') {
      navigationHold.addEventListener('wheel', (e) => {
        // deltaY is 1 for page scrolling and 33.3 per line for regular scrolling; default is 100, or 3 lines at a time
        if (e.deltaY === 1 || e.deltaY === -1) {
          navigationHold.scrollBy(0, e.deltaY * window.innerHeight);
        }
      });
    }

    if (this.media.isActive('xs') || this.media.isActive('sm')) {
      this.isSidenavOpen = false;
    }
    this.checkIfConsoleMsgShows();

    this.core.emit({ name: 'SysInfoRequest', sender: this });
  }

  ngAfterViewChecked(): void {
    this.scrollToBottomOnFooterBar();
  }

  updateSidenav(force?: string): void {
    if (force) {
      this.isSidenavOpen = force == 'open';
      this.isSidenotOpen = force != 'open';
      if (force == 'close') {
        domHelper.removeClass(document.body, 'collapsed-menu');
      }
      return;
    }

    this.isSidenavOpen = !this.isMobile;
    this.isSidenotOpen = false;
    this.sidenavMode = this.isMobile ? 'over' : 'side';
    if (this.isMobile) {
      domHelper.removeClass(document.body, 'collapsed-menu');
    }
    this.cd.detectChanges();
  }

  getSidenavWidth(): string {
    const iconified = domHelper.hasClass(document.body, 'collapsed-menu');
    if (this.isSidenavOpen && iconified && this.sidenavMode == 'side') {
      return '48px';
    } if (this.isSidenavOpen && !iconified && this.sidenavMode == 'side') {
      return '240px';
    }
    return '0px';
  }

  scrollToBottomOnFooterBar(): void {
    try {
      this.footerBarScroll.nativeElement.scrollTop = this.footerBarScroll.nativeElement.scrollHeight;
    } catch (err) { }
  }

  checkIfConsoleMsgShows(): void {
    this.getAdvancedConfig = this.sysGeneralService.getAdvancedConfig
      .subscribe((res) => this.onShowConsoleFooterBar(res.consolemsg));
  }

  getLogConsoleMsg(): void {
    const subName = 'filesystem.file_tail_follow:/var/log/messages:500';

    this.ws.sub(subName).subscribe((res) => {
      if (res && res.data && typeof res.data === 'string') {
        this.consoleMsg = this.accumulateConsoleMsg(res.data, 3);
      }
    });
  }

  accumulateConsoleMsg(msg: string, num: number): string {
    let msgs = '';
    const msgarr = msg.split('\n');

    // consoleMSgList will store just 500 messages.
    for (let i = 0; i < msgarr.length; i++) {
      if (msgarr[i] !== '') {
        this.consoleMSgList.push(msgarr[i]);
      }
    }
    while (this.consoleMSgList.length > 500) {
      this.consoleMSgList.shift();
    }
    if (num > 500) {
      num = 500;
    }
    if (num > this.consoleMSgList.length) {
      num = this.consoleMSgList.length;
    }
    for (let i = this.consoleMSgList.length - 1; i >= this.consoleMSgList.length - num; --i) {
      msgs = this.consoleMSgList[i] + '\n' + msgs;
    }

    return msgs;
  }

  onShowConsoleFooterBar(data: boolean): void {
    if (data && this.consoleMsg == '') {
      this.getLogConsoleMsg();
    }

    this.isShowFooterConsole = data;
  }

  onShowConsolePanel(): void {
    const dialogRef = this.dialog.open(ConsolePanelModalDialog, {});
    const sub = dialogRef.componentInstance.onEventEmitter.subscribe(() => {
      dialogRef.componentInstance.consoleMsg = this.accumulateConsoleMsg('', 500);
    });

    dialogRef.afterClosed().subscribe((result) => {
      clearInterval(dialogRef.componentInstance.intervalPing);
      sub.unsubscribe();
    });
  }

  onOpenNav(): void {
    this.isSidenavOpen = true;
  }

  onCloseNav(): void {
    this.isSidenavOpen = false;
  }

  onOpenNotify(): void {
    this.isSidenotOpen = true;
  }

  onCloseNotify(): void {
    this.isSidenotOpen = false;
  }

  changeState($event: any): void {
    if ($event.transfer) {
      if (this.media.isActive('xs') || this.media.isActive('sm')) {
        this.sideNave.close();
      }
    }
  }

  openModal(id: string): void {
    this.modalService.open(id, {});
  }

  closeModal(id: string): void {
    this.modalService.close(id);
  }

  // For the slide-in menu
  toggleMenu(menuInfo?: any): void {
    if (this.isOpen && !menuInfo || this.isOpen && menuInfo[0] === this.menuName) {
      this.isOpen = false;
    } else if (menuInfo) {
      this.menuName = menuInfo[0];
      this.subs = menuInfo[1];
      this.isOpen = true;
    }
  }
}
