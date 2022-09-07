import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';
import { TemplatePortal } from '@angular/cdk/portal';
import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDrawerMode, MatSidenav } from '@angular/material/sidenav';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { UUID } from 'angular2-uuid';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { filter, timeout } from 'rxjs/operators';
import { productTypeLabels } from 'app/enums/product-type.enum';
import { SubMenuItem } from 'app/interfaces/menu-item.interface';
import { alertPanelClosed } from 'app/modules/alerts/store/alert.actions';
import { selectIsAlertPanelOpen } from 'app/modules/alerts/store/alert.selectors';
import { ConsolePanelDialogComponent } from 'app/modules/common/dialog/console-panel/console-panel-dialog.component';
import { WebSocketService, SystemGeneralService, LanguageService } from 'app/services';
import { CoreService } from 'app/services/core-service/core.service';
import { LayoutService } from 'app/services/layout.service';
import { LocaleService } from 'app/services/locale.service';
import { ThemeService } from 'app/services/theme/theme.service';
import { AppState } from 'app/store';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';
import { waitForGeneralConfig } from 'app/store/system-config/system-config.selectors';
import { waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
})
export class AdminLayoutComponent implements OnInit, AfterViewChecked, AfterViewInit {
  private isMobileView = this.layoutService.isMobile;
  isSidenavCollapsed = this.layoutService.isMenuCollapsed;
  isSidenavOpen = true;
  isShowFooterConsole = false;
  consoleMsg = '';
  hostname: string;
  consoleMessages: string[] = [];
  logoPath = 'assets/images/light-logo.svg';
  logoTextPath = 'assets/images/light-logo-text.svg';
  isOpen = false;
  menuName: string;
  readonly consoleMsgsSubName = 'filesystem.file_tail_follow:/var/log/messages:500';
  consoleMsgsSubscriptionId: string = null;
  subs: SubMenuItem[];
  copyrightYear = this.localeService.getCopyrightYearFromBuildTime();

  headerPortalOutlet: TemplatePortal = null;

  readonly productTypeLabels = productTypeLabels;

  isAlertPanelOpen$ = this.store$.select(selectIsAlertPanelOpen);

  @ViewChild(MatSidenav, { static: false }) private sideNav: MatSidenav;
  @ViewChild('footerBarScroll', { static: true }) private footerBarScroll: ElementRef;
  productType$ = this.sysGeneralService.getProductType$;
  arePreferencesLoaded$ = new BehaviorSubject(false);

  get sidenavMode(): MatDrawerMode {
    return this.isMobileView ? 'over' : 'side';
  }

  constructor(
    private router: Router,
    public core: CoreService,
    public themeService: ThemeService,
    protected ws: WebSocketService,
    public dialog: MatDialog,
    private sysGeneralService: SystemGeneralService,
    private localeService: LocaleService,
    private layoutService: LayoutService,
    private store$: Store<AppState>,
    private viewContainerRef: ViewContainerRef,
    private cdr: ChangeDetectorRef,
    private breakpointObserver: BreakpointObserver,
    private languageService: LanguageService,
  ) {}

  ngOnInit(): void {
    this.detectDeviceType();
    this.listenForRouteChanges();
    this.getStoreUpdates();
    this.patchScrollOnWindows();
    this.sysGeneralService.toggleSentryInit();
    this.store$.dispatch(adminUiInitialized());
  }

  ngAfterViewChecked(): void {
    this.scrollToBottomOnFooterBar();
  }

  ngAfterViewInit(): void {
    this.pageHeaderUpdater();
  }

  listenForRouteChanges(): void {
    this.router.events.pipe(
      filter((event) => event instanceof NavigationStart || event instanceof NavigationEnd),
      untilDestroyed(this),
    ).subscribe((routeChange) => {
      if (routeChange instanceof NavigationStart) {
        this.headerPortalOutlet = null;
      }
      if (routeChange instanceof NavigationEnd && this.isMobileView) {
        this.sideNav.close();
      }
    });
  }

  detectDeviceType(): void {
    this.breakpointObserver
      .observe([Breakpoints.XSmall, Breakpoints.Small])
      .pipe(untilDestroyed(this))
      .subscribe((state: BreakpointState) => {
        this.isMobileView = state.matches;
        this.updateSidenav();
        this.cdr.markForCheck();
      });
  }

  getStoreUpdates(): void {
    this.store$.pipe(waitForSystemInfo, untilDestroyed(this)).subscribe((sysInfo) => {
      this.hostname = sysInfo.hostname;
    });

    this.store$.pipe(waitForGeneralConfig, untilDestroyed(this)).subscribe((config) => {
      this.onShowConsoleFooterBar(config.ui_consolemsg);
    });

    combineLatest([
      this.store$.pipe(waitForGeneralConfig),
      this.store$.pipe(waitForPreferences),
    ]).pipe(
      timeout(10000),
      untilDestroyed(this),
    ).subscribe(([config, preferences]) => {
      if (preferences.sidenavStatus) {
        this.isSidenavOpen = preferences.sidenavStatus.isOpen;
        this.isSidenavCollapsed = preferences.sidenavStatus.isCollapsed;
        this.layoutService.isMenuCollapsed = this.isSidenavCollapsed;
      }
      if (config.language) {
        this.languageService.setLanguage(config.language);
      }
      this.updateSidenav();
      this.arePreferencesLoaded$.next(true);
    }, () => {
      this.updateSidenav();
      this.arePreferencesLoaded$.next(true);
    });
  }

  pageHeaderUpdater(): void {
    this.layoutService.pageHeaderUpdater$
      .pipe(filter((headerContent) => !!headerContent), untilDestroyed(this))
      .subscribe((headerContent) => {
        try {
          this.headerPortalOutlet = new TemplatePortal(headerContent, this.viewContainerRef);
          this.cdr.detectChanges();
        } catch (error: unknown) {
          // Prevents an error on one header from breaking headers on all pages.
          console.error('Error when rendering page header template', error);
          this.headerPortalOutlet = null;
        }
      });
  }

  patchScrollOnWindows(): void {
    const navigationHold = document.getElementById('scroll-area');

    // Allows for one-page-at-a-time scrolling in sidenav on Windows
    if (window.navigator.platform.toLowerCase() === 'win32') {
      navigationHold.addEventListener('wheel', (event) => {
        // deltaY is 1 for page scrolling and 33.3 per line for regular scrolling; default is 100, or 3 lines at a time
        if (event.deltaY === 1 || event.deltaY === -1) {
          navigationHold.scrollBy(0, event.deltaY * window.innerHeight);
        }
      });
    }
  }

  updateSidenav(force?: 'open' | 'close'): void {
    if (force) {
      this.isSidenavOpen = force === 'open';
      if (force === 'close') {
        this.layoutService.isMenuCollapsed = false;
      }
      return;
    }

    this.isSidenavOpen = !this.isMobileView;
    if (this.isMobileView) {
      this.layoutService.isMenuCollapsed = false;
    } else {
      // TODO: This is hack to resolve issue described here: https://jira.ixsystems.com/browse/NAS-110404
      setTimeout(() => {
        this.layoutService.isMenuCollapsed = this.isSidenavCollapsed;
        this.sideNav?.open();
      });
    }
    this.cdr.markForCheck();
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
    this.ws.sub(this.consoleMsgsSubName, this.consoleMsgsSubscriptionId).pipe(untilDestroyed(this)).subscribe((log) => {
      if (log && log.data && typeof log.data === 'string') {
        this.consoleMsg = this.accumulateConsoleMsg(log.data, 3);
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

    const limit = Math.min(num, 500, this.consoleMessages.length);
    for (let i = this.consoleMessages.length - 1; i >= this.consoleMessages.length - limit; --i) {
      msgs = this.consoleMessages[i] + '\n' + msgs;
    }

    return msgs;
  }

  onShowConsoleFooterBar(isConsoleFooterEnabled: boolean): void {
    if (isConsoleFooterEnabled && this.consoleMsg === '') {
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
    if ((this.isOpen && !menuInfo) || (this.isOpen && menuInfo[0] === this.menuName)) {
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
