import { TemplatePortal } from '@angular/cdk/portal';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
  ViewContainerRef,
} from '@angular/core';
import { MatDrawerMode, MatSidenav } from '@angular/material/sidenav';
import {
  NavigationEnd, Router,
} from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { filter, map } from 'rxjs';
import { productTypeLabels } from 'app/enums/product-type.enum';
import { SubMenuItem } from 'app/interfaces/menu-item.interface';
import { alertPanelClosed } from 'app/modules/alerts/store/alert.actions';
import { selectIsAlertPanelOpen } from 'app/modules/alerts/store/alert.selectors';
import { LanguageService } from 'app/services/language.service';
import { LayoutService } from 'app/services/layout.service';
import { SidenavService } from 'app/services/sidenav.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { ThemeService } from 'app/services/theme/theme.service';
import { TokenLifetimeService } from 'app/services/token-lifetime.service';
import { AppState } from 'app/store';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import { selectHasConsoleFooter, waitForGeneralConfig } from 'app/store/system-config/system-config.selectors';
import { waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
})
export class AdminLayoutComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren(MatSidenav) private sideNavs: QueryList<MatSidenav>;
  isOpenSecondaryMenu = false;
  menuName: string;
  subs: SubMenuItem[];

  protected headerPortalOutlet: TemplatePortal = null;
  readonly hostname$ = this.store$.pipe(waitForSystemInfo, map(({ hostname }) => hostname));
  readonly isAlertPanelOpen$ = this.store$.select(selectIsAlertPanelOpen);
  readonly hasConsoleFooter$ = this.store$.select(selectHasConsoleFooter);
  readonly productType$ = this.sysGeneralService.getProductType$;
  readonly copyrightYear$ = this.sysGeneralService.getCopyrightYear$;
  readonly productTypeLabels = productTypeLabels;

  get sidenavWidth(): string {
    return this.sidenavService.sidenavWidth;
  }

  get isSidenavCollapsed(): boolean {
    return this.sidenavService.isCollapsed;
  }

  get sidenavMode(): MatDrawerMode {
    return this.sidenavService.mode;
  }

  get isSidenavOpen(): boolean {
    return this.sidenavService.isOpen;
  }

  get isDefaultTheme(): boolean {
    return this.themeService.isDefaultTheme;
  }

  constructor(
    private router: Router,
    private themeService: ThemeService,
    private sysGeneralService: SystemGeneralService,
    private layoutService: LayoutService,
    private sidenavService: SidenavService,
    private store$: Store<AppState>,
    private viewContainerRef: ViewContainerRef,
    private cdr: ChangeDetectorRef,
    private languageService: LanguageService,
    private tokenLifetimeService: TokenLifetimeService,
  ) {
    this.listenToRouteChange();
  }

  ngOnInit(): void {
    this.tokenLifetimeService.start();
    this.themeService.loadTheme$.next('');
    this.sysGeneralService.toggleSentryInit();
    this.store$.pipe(waitForGeneralConfig, untilDestroyed(this)).subscribe((config) => {
      this.languageService.setLanguage(config.language);
    });
    this.store$.dispatch(adminUiInitialized());
    this.listenToSidenavChanges();
  }

  ngOnDestroy(): void {
    this.tokenLifetimeService.stop();
  }

  ngAfterViewInit(): void {
    this.sidenavService.setSidenav(this.sideNavs?.first);
    this.renderPageHeader();
  }

  listenToSidenavChanges(): void {
    this.sideNavs?.changes.pipe(untilDestroyed(this)).subscribe(() => {
      this.sidenavService.setSidenav(this.sideNavs.first);
    });
  }

  // For the slide-in menu
  toggleMenu(menuInfo?: [string, SubMenuItem[]]): void {
    const [state, subItems] = menuInfo || [];
    if ((this.isOpenSecondaryMenu && !menuInfo) || (this.isOpenSecondaryMenu && state === this.menuName)) {
      this.isOpenSecondaryMenu = false;
      this.subs = [];
    } else if (menuInfo) {
      this.menuName = state;
      this.subs = subItems;
      this.isOpenSecondaryMenu = true;
    }
  }

  onMenuClosed(): void {
    this.isOpenSecondaryMenu = false;
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

  private listenToRouteChange(): void {
    this.router.events.pipe(
      filter((routeChange) => routeChange instanceof NavigationEnd && this.sidenavService.isMobile),
      untilDestroyed(this),
    ).subscribe(() => {
      this.sideNavs?.first?.close();
    });
  }
}
