import {
  AfterViewChecked, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild,
} from '@angular/core';
import { MediaChange, MediaObserver } from '@angular/flex-layout';
import { MatDialog } from '@angular/material/dialog';
import { MatSidenav } from '@angular/material/sidenav';
import { NavigationEnd, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ConsolePanelModalDialog } from 'app/components/common/dialog/console-panel/console-panel-dialog.component';
import { CoreService } from 'app/core/services/core-service/core.service';
import { LayoutService } from 'app/core/services/layout.service';
import { ProductType } from 'app/enums/product-type.enum';
import { ForceSidenavEvent } from 'app/interfaces/events/force-sidenav-event.interface';
import { SidenavStatusEvent } from 'app/interfaces/events/sidenav-status-event.interface';
import { SysInfoEvent } from 'app/interfaces/events/sys-info-event.interface';
import { UserPreferencesChangedEvent } from 'app/interfaces/events/user-preferences-event.interface';
import { SubMenuItem } from 'app/interfaces/menu-item.interface';
import { WebSocketService, SystemGeneralService } from 'app/services';
import { LanguageService } from 'app/services/language.service';
import { LocaleService } from 'app/services/locale.service';
import { Theme, ThemeService } from 'app/services/theme/theme.service';

@UntilDestroy()
@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
})
export class AdminLayoutComponent implements OnInit, AfterViewChecked {
  private isMobile: boolean;
  isSidenavOpen = true;
  isSidenavCollapsed = false;
  sidenavMode = 'over';
  isShowFooterConsole = false;
  isSidenotOpen = false;
  consoleMsg = '';
  hostname: string;
  consoleMSgList: string[] = [];
  product_type = window.localStorage['product_type'] as ProductType;
  logoPath = 'assets/images/light-logo.svg';
  logoTextPath = 'assets/images/light-logo-text.svg';
  currentTheme = '';
  retroLogo = false;
  isOpen = false;
  notificPanelClosed = false;
  menuName: string;
  subs: SubMenuItem[];
  copyrightYear = this.localeService.getCopyrightYearFromBuildTime();

  readonly ProductType = ProductType;

  @ViewChild(MatSidenav, { static: false }) private sideNav: MatSidenav;
  @ViewChild('footerBarScroll', { static: true }) private footerBarScroll: ElementRef;
  freenasThemes: Theme[];

  constructor(
    private router: Router,
    public core: CoreService,
    public cd: ChangeDetectorRef,
    public themeService: ThemeService,
    private media: MediaObserver,
    protected ws: WebSocketService,
    public language: LanguageService,
    public dialog: MatDialog,
    private sysGeneralService: SystemGeneralService,
    private localeService: LocaleService,
    private layoutService: LayoutService,
  ) {
    // detect server type
    sysGeneralService.getProductType$.pipe(untilDestroyed(this)).subscribe((res) => {
      this.product_type = res as ProductType;
    });

    // Close sidenav after route change in mobile
    router.events.pipe(untilDestroyed(this)).subscribe((routeChange) => {
      if (routeChange instanceof NavigationEnd && this.isMobile) {
        this.sideNav.close();
      }
    });
    // Watches screen size and open/close sidenav
    media.media$.pipe(untilDestroyed(this)).subscribe((change: MediaChange) => {
      this.isMobile = this.layoutService.isMobile;
      this.updateSidenav();
      core.emit({ name: 'MediaChange', data: change, sender: this });
    });

    // Subscribe to Preference Changes
    core.register({
      observerClass: this,
      eventName: 'UserPreferencesChanged',
    }).pipe(untilDestroyed(this)).subscribe((evt: UserPreferencesChangedEvent) => {
      this.retroLogo = evt.data.retroLogo ? evt.data.retroLogo : false;
    });

    // Listen for system information changes
    core.register({
      observerClass: this,
      eventName: 'SysInfo',
    }).pipe(untilDestroyed(this)).subscribe((evt: SysInfoEvent) => {
      this.hostname = evt.data.hostname;
    });

    core.register({
      observerClass: this,
      eventName: 'ForceSidenav',
    }).pipe(untilDestroyed(this)).subscribe((evt: ForceSidenavEvent) => {
      this.updateSidenav(evt.data);
    });

    core.register({
      observerClass: this,
      eventName: 'SidenavStatus',
    }).pipe(untilDestroyed(this)).subscribe((evt: SidenavStatusEvent) => {
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
    this.sysGeneralService.refreshSysGeneral$.pipe(untilDestroyed(this)).subscribe(() => {
      this.checkIfConsoleMsgShows();
    });

    this.isSidenavCollapsed = this.layoutService.isMenuCollapsed;

    this.core.emit({ name: 'SysInfoRequest', sender: this });
  }

  ngAfterViewChecked(): void {
    this.scrollToBottomOnFooterBar();
  }

  updateSidenav(force?: 'open' | 'close'): void {
    if (force) {
      this.isSidenavOpen = force == 'open';
      this.isSidenotOpen = force != 'open';
      if (force == 'close') {
        this.layoutService.isMenuCollapsed = false;
      }
      return;
    }

    this.isSidenavOpen = !this.isMobile;
    this.isSidenotOpen = false;
    this.sidenavMode = this.isMobile ? 'over' : 'side';
    if (!this.isMobile) {
      // TODO: This is hack to resolve issue described here: https://jira.ixsystems.com/browse/NAS-110404
      setTimeout(() => {
        this.sideNav.open();
      });
    }

    this.layoutService.isMenuCollapsed = false;
    this.cd.detectChanges();
  }

  get sidenavWidth(): string {
    const iconified = this.layoutService.isMenuCollapsed;
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
    this.sysGeneralService.getGeneralConfig$.pipe(
      untilDestroyed(this),
    ).subscribe((res) => this.onShowConsoleFooterBar(res.ui_consolemsg));
  }

  getLogConsoleMsg(): void {
    const subName = 'filesystem.file_tail_follow:/var/log/messages:500';

    this.ws.sub(subName).pipe(untilDestroyed(this)).subscribe((res) => {
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
    const sub = dialogRef.componentInstance.onEventEmitter.pipe(untilDestroyed(this)).subscribe(() => {
      dialogRef.componentInstance.consoleMsg = this.accumulateConsoleMsg('', 500);
    });

    dialogRef.afterClosed().pipe(untilDestroyed(this)).subscribe(() => {
      clearInterval(dialogRef.componentInstance.intervalPing);
      sub.unsubscribe();
    });
  }

  onOpenNotify(): void {
    this.isSidenotOpen = true;
  }

  onCloseNotify(): void {
    this.isSidenotOpen = false;
  }

  // For the slide-in menu
  toggleMenu(menuInfo?: [string, SubMenuItem[]]): void {
    if (this.isOpen && !menuInfo || this.isOpen && menuInfo[0] === this.menuName) {
      this.isOpen = false;
      this.subs = [];
    } else if (menuInfo) {
      this.menuName = menuInfo[0];
      this.subs = menuInfo[1];
      this.isOpen = true;
    }
  }

  onMenuClosed(): void {
    this.isOpen = false;
  }
}
