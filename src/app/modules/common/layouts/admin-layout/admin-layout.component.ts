import { TemplatePortal } from '@angular/cdk/portal';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
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
import { filter, take } from 'rxjs/operators';
import { productTypeLabels } from 'app/enums/product-type.enum';
import { SidenavStatusEvent } from 'app/interfaces/events/sidenav-status-event.interface';
import { SubMenuItem } from 'app/interfaces/menu-item.interface';
import { Theme } from 'app/interfaces/theme.interface';
import { alertPanelClosed } from 'app/modules/alerts/store/alert.actions';
import { selectIsAlertPanelOpen } from 'app/modules/alerts/store/alert.selectors';
import { WebSocketService, SystemGeneralService, LanguageService } from 'app/services';
import { CoreService } from 'app/services/core-service/core.service';
import { LayoutService } from 'app/services/layout.service';
import { ThemeService } from 'app/services/theme/theme.service';
import { AppState } from 'app/store';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';
import { selectHasConsoleFooter, waitForGeneralConfig } from 'app/store/system-config/system-config.selectors';
import { waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
})
export class AdminLayoutComponent implements OnInit, AfterViewInit {
  private isMobile: boolean;
  isSidenavOpen = true;
  isSidenavCollapsed = false;
  sidenavMode: MatDrawerMode = 'over';
  hostname: string;
  currentTheme = '';
  isOpen = false;
  menuName: string;
  subs: SubMenuItem[];
  copyrightYear$ = this.sysGeneralService.getCopyrightYear$;

  headerPortalOutlet: TemplatePortal = null;

  readonly productTypeLabels = productTypeLabels;

  isAlertPanelOpen$ = this.store$.select(selectIsAlertPanelOpen);
  hasConsoleFooter$ = this.store$.select(selectHasConsoleFooter);

  @ViewChild(MatSidenav, { static: false }) private sideNav: MatSidenav;
  themes: Theme[];
  productType$ = this.sysGeneralService.getProductType$;

  constructor(
    private router: Router,
    public core: CoreService,
    public cd: ChangeDetectorRef,
    public themeService: ThemeService,
    private media: MediaObserver,
    protected ws: WebSocketService,
    public dialog: MatDialog,
    private sysGeneralService: SystemGeneralService,
    private layoutService: LayoutService,
    private store$: Store<AppState>,
    private viewContainerRef: ViewContainerRef,
    private cdr: ChangeDetectorRef,
    private languageService: LanguageService,
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

    this.store$.pipe(waitForSystemInfo, untilDestroyed(this)).subscribe((sysInfo) => {
      this.hostname = sysInfo.hostname;
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
    this.themes = this.themeService.allThemes;
    this.currentTheme = this.themeService.currentTheme().name;
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

    if (this.media.isActive('xs') || this.media.isActive('sm')) {
      this.isSidenavOpen = false;
    }
    this.sysGeneralService.toggleSentryInit();

    this.store$.pipe(waitForGeneralConfig, untilDestroyed(this)).subscribe((config) => {
      this.languageService.setLanguage(config.language);
    });

    this.isSidenavCollapsed = this.layoutService.isMenuCollapsed;

    this.ws.authStatus.pipe(untilDestroyed(this)).subscribe((evt) => {
      this.core.emit({ name: 'Authenticated', data: evt, sender: this });
    });

    this.store$.dispatch(adminUiInitialized());
  }

  ngAfterViewInit(): void {
    this.layoutService.pageHeaderUpdater$
      .pipe(untilDestroyed(this))
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

  updateSidenav(): void {
    this.isSidenavOpen = !this.isMobile;
    this.sidenavMode = this.isMobile ? 'over' : 'side';
    if (!this.isMobile) {
      // TODO: This is hack to resolve issue described here: https://ixsystems.atlassian.net/browse/NAS-110404
      setTimeout(() => {
        this.sideNav.open();
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
