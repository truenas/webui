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
import { MediaChange, MediaObserver } from '@angular/flex-layout';
import { MatDialog } from '@angular/material/dialog';
import { MatDrawerMode, MatSidenav } from '@angular/material/sidenav';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { UUID } from 'angular2-uuid';
import { BehaviorSubject } from 'rxjs';
import { filter, take, timeout } from 'rxjs/operators';
import { productTypeLabels } from 'app/enums/product-type.enum';
import { SubMenuItem } from 'app/interfaces/menu-item.interface';
import { alertPanelClosed } from 'app/modules/alerts/store/alert.actions';
import { selectIsAlertPanelOpen } from 'app/modules/alerts/store/alert.selectors';
import { ConsolePanelDialogComponent } from 'app/modules/common/dialog/console-panel/console-panel-dialog.component';
import { WebSocketService, SystemGeneralService } from 'app/services';
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
  private isMobile: boolean;
  isSidenavOpen = true;
  isSidenavCollapsed = false;
  sidenavMode: MatDrawerMode = 'over';
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
    private store$: Store<AppState>,
    private viewContainerRef: ViewContainerRef,
    private cdr: ChangeDetectorRef,
  ) {
    // Close sidenav after route change in mobile
    this.router.events.pipe(untilDestroyed(this)).subscribe((routeChange) => {
      if (routeChange instanceof NavigationStart) {
        this.headerPortalOutlet = null;
      }
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

    this.getStoreUpdates();
  }

  ngOnInit(): void {
    if (this.media.isActive('xs') || this.media.isActive('sm')) {
      this.isSidenavOpen = false;
    }
    this.patchScrollOnWindows();
    this.sysGeneralService.toggleSentryInit();
    this.isSidenavCollapsed = this.layoutService.isMenuCollapsed;
    this.store$.dispatch(adminUiInitialized());
  }

  ngAfterViewChecked(): void {
    this.scrollToBottomOnFooterBar();
  }

  ngAfterViewInit(): void {
    this.pageHeaderUpdater();
  }

  getStoreUpdates(): void {
    this.store$.pipe(waitForSystemInfo, untilDestroyed(this)).subscribe((sysInfo) => {
      this.hostname = sysInfo.hostname;
    });

    this.store$.pipe(waitForGeneralConfig, untilDestroyed(this)).subscribe((config) => {
      this.onShowConsoleFooterBar(config.ui_consolemsg);
    });

    this.store$.pipe(
      waitForPreferences,
      timeout(5000),
      untilDestroyed(this),
    ).subscribe((preferences) => {
      if (preferences.sidenavStatus) {
        this.isSidenavOpen = preferences.sidenavStatus.isOpen;
        this.sidenavMode = preferences.sidenavStatus.mode;
        this.isSidenavCollapsed = preferences.sidenavStatus.isCollapsed;
      }
      this.updateSidenav();
      this.arePreferencesLoaded$.next(true);
    },
    (error) => {
      console.error(error);
    },
    () => {
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

    this.isSidenavOpen = !this.isMobile;
    this.sidenavMode = this.isMobile ? 'over' : 'side';
    if (!this.isMobile) {
      // TODO: This is hack to resolve issue described here: https://jira.ixsystems.com/browse/NAS-110404
      setTimeout(() => {
        this.sideNav?.open();
      });
      this.store$.pipe(
        waitForPreferences,
        take(1),
        filter((preferences) => Boolean(preferences.sidenavStatus)),
        untilDestroyed(this),
      ).subscribe(({ sidenavStatus }) => {
        this.layoutService.isMenuCollapsed = sidenavStatus.isCollapsed;
        this.isSidenavCollapsed = sidenavStatus.isCollapsed;
      });
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
