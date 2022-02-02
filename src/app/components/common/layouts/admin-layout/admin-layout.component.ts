import {
  AfterViewChecked, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild,
} from '@angular/core';
import { MediaChange, MediaObserver } from '@angular/flex-layout';
import { MatDialog } from '@angular/material/dialog';
import { MatDrawerMode, MatSidenav } from '@angular/material/sidenav';
import { NavigationEnd, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { UUID } from 'angular2-uuid';
import { ConsolePanelDialogComponent } from 'app/components/common/dialog/console-panel/console-panel-dialog.component';
import { ProductType } from 'app/enums/product-type.enum';
import { ForceSidenavEvent } from 'app/interfaces/events/force-sidenav-event.interface';
import { SidenavStatusEvent } from 'app/interfaces/events/sidenav-status-event.interface';
import { SysInfoEvent } from 'app/interfaces/events/sys-info-event.interface';
import { UserPreferencesChangedEvent } from 'app/interfaces/events/user-preferences-event.interface';
import { SubMenuItem } from 'app/interfaces/menu-item.interface';
import { alertPanelClosed } from 'app/modules/alerts/store/alert.actions';
import { selectIsAlertPanelOpen } from 'app/modules/alerts/store/alert.selectors';
import { WebSocketService, SystemGeneralService } from 'app/services';
import { CoreService } from 'app/services/core-service/core.service';
import { LayoutService } from 'app/services/layout.service';
import { LocaleService } from 'app/services/locale.service';
import { PreferencesService } from 'app/services/preferences.service';
import { Theme, ThemeService } from 'app/services/theme/theme.service';
import { AppState } from 'app/store';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import { waitForGeneralConfig } from 'app/store/system-config/system-config.selectors';

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
  sidenavMode: MatDrawerMode = 'over';
  isShowFooterConsole = false;
  consoleMsg = '';
  hostname: string;
  consoleMessages: string[] = [];
  productType = window.localStorage['product_type'] as ProductType;
  logoPath = 'assets/images/light-logo.svg';
  logoTextPath = 'assets/images/light-logo-text.svg';
  currentTheme = '';
  retroLogo = false;
  isOpen = false;
  menuName: string;
  readonly consoleMsgsSubName = 'filesystem.file_tail_follow:/var/log/messages:500';
  consoleMsgsSubscriptionId: string = null;
  subs: SubMenuItem[];
  copyrightYear = this.localeService.getCopyrightYearFromBuildTime();

  readonly ProductType = ProductType;

  isAlertPanelOpen$ = this.store$.select(selectIsAlertPanelOpen);

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
    public dialog: MatDialog,
    private sysGeneralService: SystemGeneralService,
    private localeService: LocaleService,
    private layoutService: LayoutService,
    private prefService: PreferencesService,
    private store$: Store<AppState>,
  ) {
    // detect server type
    this.sysGeneralService.getProductType$.pipe(untilDestroyed(this)).subscribe((res) => {
      this.productType = res as ProductType;
    });

    // Close sidenav after route change in mobile
    this.router.events.pipe(untilDestroyed(this)).subscribe((routeChange) => {
      if (routeChange instanceof NavigationEnd && this.isMobile) {
        this.sideNav.close();
      }
    });

    // Watches screen size and open/close sidenav
    this.media.media$.pipe(untilDestroyed(this)).subscribe((change: MediaChange) => {
      this.isMobile = this.layoutService.isMobile;
      this.updateSidenav();
      core.emit({ name: 'MediaChange', data: change, sender: this });
    });

    // Subscribe to Preference Changes
    this.core.register({
      observerClass: this,
      eventName: 'UserPreferencesChanged',
    }).pipe(untilDestroyed(this)).subscribe((evt: UserPreferencesChangedEvent) => {
      this.retroLogo = evt.data.retroLogo ? evt.data.retroLogo : false;
    });

    // Listen for system information changes
    this.core.register({
      observerClass: this,
      eventName: 'SysInfo',
    }).pipe(untilDestroyed(this)).subscribe((evt: SysInfoEvent) => {
      this.hostname = evt.data.hostname;
    });

    this.core.register({
      observerClass: this,
      eventName: 'ForceSidenav',
    }).pipe(untilDestroyed(this)).subscribe((evt: ForceSidenavEvent) => {
      this.updateSidenav(evt.data);
    });

    this.core.register({
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
    this.sysGeneralService.toggleSentryInit();

    this.store$.pipe(waitForGeneralConfig, untilDestroyed(this)).subscribe((config) => {
      this.onShowConsoleFooterBar(config.ui_consolemsg);
    });

    this.isSidenavCollapsed = this.layoutService.isMenuCollapsed;

    this.core.emit({ name: 'SysInfoRequest', sender: this });
    this.store$.dispatch(adminUiInitialized());
  }

  ngAfterViewChecked(): void {
    this.scrollToBottomOnFooterBar();
  }

  updateSidenav(force?: 'open' | 'close'): void {
    if (force) {
      this.isSidenavOpen = force === 'open';
      if (force === 'close') {
        this.layoutService.isMenuCollapsed = false;
      }
      return;
    }

    this.isSidenavOpen = !this.isMobile;
    this.sidenavMode = this.isMobile ? 'over' : 'side';
    if (!this.isMobile) {
      // TODO: This is hack to resolve issue described here: https://jira.ixsystems.com/browse/NAS-110404
      setTimeout(() => {
        this.sideNav.open();
      });
      this.layoutService.isMenuCollapsed = this.prefService.preferences.sidenavStatus.isCollapsed;
      this.isSidenavCollapsed = this.prefService.preferences.sidenavStatus.isCollapsed;
    } else {
      this.layoutService.isMenuCollapsed = false;
    }
    this.cd.detectChanges();
  }

  get sidenavWidth(): string {
    const iconified = this.layoutService.isMenuCollapsed;
    if (this.isSidenavOpen && iconified && this.sidenavMode === 'side') {
      return '48px';
    } if (this.isSidenavOpen && !iconified && this.sidenavMode === 'side') {
      return '240px';
    }
    return '0px';
  }

  scrollToBottomOnFooterBar(): void {
    try {
      this.footerBarScroll.nativeElement.scrollTop = this.footerBarScroll.nativeElement.scrollHeight;
    } catch (err: unknown) { }
  }

  getLogConsoleMsg(): void {
    this.consoleMsgsSubscriptionId = UUID.UUID();
    this.ws.sub(this.consoleMsgsSubName, this.consoleMsgsSubscriptionId).pipe(untilDestroyed(this)).subscribe((res) => {
      if (res && res.data && typeof res.data === 'string') {
        this.consoleMsg = this.accumulateConsoleMsg(res.data, 3);
      }
    });
  }

  accumulateConsoleMsg(msg: string, num: number): string {
    let msgs = '';
    const msgarr = msg.split('\n');

    // consoleMSgList will store just 500 messages.
    msgarr.forEach((message) => {
      if ((message) !== '') {
        this.consoleMessages.push((message));
      }
    });
    while (this.consoleMessages.length > 500) {
      this.consoleMessages.shift();
    }
    if (num > 500) {
      num = 500;
    }
    if (num > this.consoleMessages.length) {
      num = this.consoleMessages.length;
    }
    for (let i = this.consoleMessages.length - 1; i >= this.consoleMessages.length - num; --i) {
      msgs = this.consoleMessages[i] + '\n' + msgs;
    }

    return msgs;
  }

  onShowConsoleFooterBar(isConsoleFooterEnabled: boolean): void {
    if (isConsoleFooterEnabled && this.consoleMsg == '') {
      this.getLogConsoleMsg();
    } else if (!isConsoleFooterEnabled && this.consoleMsgsSubscriptionId) {
      this.ws.unsub(this.consoleMsgsSubName, this.consoleMsgsSubscriptionId);
    }

    this.isShowFooterConsole = isConsoleFooterEnabled;
  }

  onShowConsolePanel(): void {
    const dialogRef = this.dialog.open(ConsolePanelDialogComponent, {});
    const sub = dialogRef.componentInstance.onEventEmitter.pipe(untilDestroyed(this)).subscribe(() => {
      dialogRef.componentInstance.consoleMsg = this.accumulateConsoleMsg('', 500);
    });

    dialogRef.beforeClosed().pipe(untilDestroyed(this)).subscribe(() => {
      clearInterval(dialogRef.componentInstance.intervalPing);
      sub.unsubscribe();
    });
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

  onAlertsPanelClosed(): void {
    this.store$.dispatch(alertPanelClosed());
  }
}
