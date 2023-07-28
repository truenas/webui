import { TemplatePortal } from '@angular/cdk/portal';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { MatDrawerMode, MatSidenav } from '@angular/material/sidenav';
import {
  NavigationEnd, Router,
} from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { filter, take } from 'rxjs/operators';
import { productTypeLabels } from 'app/enums/product-type.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { SidenavStatusData } from 'app/interfaces/events/sidenav-status-event.interface';
import { SubMenuItem } from 'app/interfaces/menu-item.interface';
import { alertPanelClosed } from 'app/modules/alerts/store/alert.actions';
import { selectIsAlertPanelOpen } from 'app/modules/alerts/store/alert.selectors';
import { LanguageService } from 'app/services/language.service';
import { LayoutService } from 'app/services/layout.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { ThemeService } from 'app/services/theme/theme.service';
import { TokenLifetimeService } from 'app/services/token-lifetime.service';
import { AppState } from 'app/store';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';
import { selectHasConsoleFooter, waitForGeneralConfig } from 'app/store/system-config/system-config.selectors';
import { waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
})
export class AdminLayoutComponent implements OnInit, AfterViewInit, OnDestroy {
  private isMobile: boolean;
  isSidenavOpen = true;
  isSidenavCollapsed = false;
  sidenavMode: MatDrawerMode = 'over';
  hostname: string;
  isOpen = false;
  menuName: string;
  subs: SubMenuItem[];
  copyrightYear$ = this.sysGeneralService.getCopyrightYear$;

  protected headerPortalOutlet: TemplatePortal = null;

  readonly productTypeLabels = productTypeLabels;

  isAlertPanelOpen$ = this.store$.select(selectIsAlertPanelOpen);
  hasConsoleFooter$ = this.store$.select(selectHasConsoleFooter);

  @ViewChild(MatSidenav, { static: false }) private sideNav: MatSidenav;
  productType$ = this.sysGeneralService.getProductType$;

  constructor(
    private router: Router,
    public themeService: ThemeService,
    private media: MediaObserver,
    private sysGeneralService: SystemGeneralService,
    private layoutService: LayoutService,
    private store$: Store<AppState>,
    private viewContainerRef: ViewContainerRef,
    private cdr: ChangeDetectorRef,
    private languageService: LanguageService,
    private tokenLifetimeService: TokenLifetimeService,
    @Inject(WINDOW) private window: Window,
  ) {
    // Close sidenav after route change in mobile
    this.router.events.pipe(untilDestroyed(this)).subscribe((routeChange) => {
      if (routeChange instanceof NavigationEnd && this.isMobile) {
        this.sideNav.close();
      }
    });

    // Watches screen size and open/close sidenav
    this.media.asObservable().pipe(untilDestroyed(this)).subscribe(() => {
      this.isMobile = this.layoutService.isMobile;
      this.updateSidenav();
    });

    this.store$.pipe(waitForSystemInfo, untilDestroyed(this)).subscribe((sysInfo) => {
      this.hostname = sysInfo.hostname;
    });
  }

  ngOnInit(): void {
    this.themeService.loadTheme$.next('');
    const navigationHold = document.getElementById('scroll-area');

    // Allows for one-page-at-a-time scrolling in sidenav on Windows
    if (this.window.navigator.platform.toLowerCase() === 'win32') {
      navigationHold.addEventListener('wheel', (event) => {
        // deltaY is 1 for page scrolling and 33.3 per line for regular scrolling; default is 100, or 3 lines at a time
        if (event.deltaY === 1 || event.deltaY === -1) {
          navigationHold.scrollBy(0, event.deltaY * this.window.innerHeight);
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

    this.tokenLifetimeService.start();
  }

  ngOnDestroy(): void {
    this.tokenLifetimeService.stop();
  }

  ngAfterViewInit(): void {
    this.renderPageHeader();
  }

  onSidenavStatusChange(sidenav: SidenavStatusData): void {
    this.isSidenavOpen = sidenav.isOpen;
    this.sidenavMode = sidenav.mode;
    this.isSidenavCollapsed = sidenav.isCollapsed;
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
    this.cdr.detectChanges();
  }

  get sidenavWidth(): string {
    const iconified = this.layoutService.isMenuCollapsed;
    if (this.isSidenavOpen && iconified && this.sidenavMode === 'side') {
      return '48px';
    }
    if (this.isSidenavOpen && !iconified && this.sidenavMode === 'side') {
      return '240px';
    }
    return '0px';
  }

  // For the slide-in menu
  toggleMenu(menuInfo?: [string, SubMenuItem[]]): void {
    const [state, subItems] = menuInfo || [];
    if ((this.isOpen && !menuInfo) || (this.isOpen && state === this.menuName)) {
      this.isOpen = false;
      this.subs = [];
    } else if (menuInfo) {
      this.menuName = state;
      this.subs = subItems;
      this.isOpen = true;
    }
  }

  onMenuClosed(): void {
    this.isOpen = false;
  }

  onAlertsPanelClosed(): void {
    this.store$.dispatch(alertPanelClosed());
  }

  private renderPageHeader(): void {
    this.layoutService.pageHeaderUpdater$
      .pipe(untilDestroyed(this))
      .subscribe((headerContent) => {
        try {
          if (headerContent) {
            this.headerPortalOutlet = new TemplatePortal(headerContent, this.viewContainerRef);
            this.cdr.detectChanges();
          } else {
            this.headerPortalOutlet = null;
          }
        } catch (error: unknown) {
          // Prevents an error on one header from breaking headers on all pages.
          console.error('Error when rendering page header template', error);
          this.headerPortalOutlet = null;
        }
      });
  }
}
