import { AsyncPipe } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, computed, DestroyRef, OnDestroy, OnInit, QueryList, ViewChildren, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  MatDrawerMode, MatSidenav, MatSidenavContainer, MatSidenavContent,
} from '@angular/material/sidenav';
import { MatTooltip } from '@angular/material/tooltip';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { filter, map } from 'rxjs';
import { exploreNasEnterpriseLink } from 'app/constants/explore-nas-enterprise-link.constant';
import { productTypeLabels } from 'app/enums/product-type.enum';
import { hashMessage } from 'app/helpers/hash-message';
import { SubMenuItem } from 'app/interfaces/menu-item.interface';
import { AlertsPanelComponent } from 'app/modules/alerts/components/alerts-panel/alerts-panel.component';
import { alertPanelClosed } from 'app/modules/alerts/store/alert.actions';
import { selectIsAlertPanelOpen } from 'app/modules/alerts/store/alert.selectors';
import { searchDelayConst } from 'app/modules/global-search/constants/delay.const';
import { UiSearchDirectivesService } from 'app/modules/global-search/services/ui-search-directives.service';
import { LanguageService } from 'app/modules/language/language.service';
import { ConsoleFooterComponent } from 'app/modules/layout/console-footer/console-footer.component';
import { CopyrightLineComponent } from 'app/modules/layout/copyright-line/copyright-line.component';
import { NavigationComponent } from 'app/modules/layout/navigation/navigation.component';
import { SecondaryMenuComponent } from 'app/modules/layout/secondary-menu/secondary-menu.component';
import { SidenavService } from 'app/modules/layout/sidenav.service';
import { TopbarComponent } from 'app/modules/layout/topbar/topbar.component';
import { TruenasLogoComponent } from 'app/modules/layout/topbar/truenas-logo/truenas-logo.component';
import { DefaultPageHeaderComponent } from 'app/modules/page-header/default-page-header/default-page-header.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ThemeService } from 'app/modules/theme/theme.service';
import { SessionTimeoutService } from 'app/services/session-timeout.service';
import { AppState } from 'app/store';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';
import { selectHasConsoleFooter } from 'app/store/system-config/system-config.selectors';
import {
  selectCopyrightHtml, selectIsEnterprise, selectProductType, waitForSystemInfo,
} from 'app/store/system-info/system-info.selectors';

@Component({
  selector: 'ix-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TestDirective,
    MatSidenavContainer,
    MatSidenav,
    TnIconComponent,
    NavigationComponent,
    SecondaryMenuComponent,
    MatTooltip,
    CopyrightLineComponent,
    MatSidenavContent,
    TopbarComponent,
    DefaultPageHeaderComponent,
    RouterOutlet,
    ConsoleFooterComponent,
    AlertsPanelComponent,
    AsyncPipe,
    TranslateModule,
    TruenasLogoComponent,
  ],
})
export class AdminLayoutComponent implements OnInit, AfterViewInit, OnDestroy {
  private themeService = inject(ThemeService);
  private sidenavService = inject(SidenavService);
  private store$ = inject<Store<AppState>>(Store);
  private languageService = inject(LanguageService);
  private sessionTimeoutService = inject(SessionTimeoutService);
  private router = inject(Router);
  private searchDirectives = inject(UiSearchDirectivesService);
  private destroyRef = inject(DestroyRef);

  @ViewChildren(MatSidenav) private sideNavs: QueryList<MatSidenav>;

  readonly hostname$ = this.store$.pipe(waitForSystemInfo, map(({ hostname }) => hostname));
  readonly isAlertPanelOpen$ = this.store$.select(selectIsAlertPanelOpen);
  readonly hasConsoleFooter$ = this.store$.select(selectHasConsoleFooter);
  readonly copyrightHtml = toSignal(this.store$.select(selectCopyrightHtml));
  readonly productType = toSignal(this.store$.select(selectProductType));
  readonly isEnterprise = toSignal(this.store$.select(selectIsEnterprise));
  // angular tooltips are unable to display HTML content, so we just remove the `<br>` tags
  // credit <https://github.com/JackW6809> for the replace pattern!
  readonly copyrightText = computed(() => this.copyrightHtml().replace(/<br\s*\/?>/gi, '\n'));

  protected currentMessageHref = computed(() => `${exploreNasEnterpriseLink}?m=${hashMessage(this.productType())}`);

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

  get isOpenSecondaryMenu(): boolean {
    return this.sidenavService.isOpenSecondaryMenu;
  }

  get subs(): SubMenuItem[] {
    return this.sidenavService.subs;
  }

  get menuName(): string {
    return this.sidenavService.menuName;
  }

  get productTypeText(): string {
    const productType = this.productType();
    if (!productType) {
      return '';
    }

    return productTypeLabels.get(productType) || productType;
  }

  ngOnInit(): void {
    performance.mark('Admin Init');
    performance.measure('Login', 'Login Start', 'Admin Init');
    this.sessionTimeoutService.start();
    this.themeService.loadTheme$.next('');
    this.store$.pipe(waitForPreferences, takeUntilDestroyed(this.destroyRef)).subscribe((config) => {
      this.languageService.setLanguage(config.language);
    });
    this.listenForSidenavChanges();
    this.setupGlobalHighlightHandler();
  }

  /**
   * Global handler for pending UI highlights from alert navigation.
   * Listens to router navigation events and automatically handles pending highlights
   * after navigation completes and components have rendered.
   */
  private setupGlobalHighlightHandler(): void {
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      // Wait for components to render and register their directives
      setTimeout(() => this.handlePendingHighlight(), searchDelayConst);
    });
  }

  private handlePendingHighlight(): void {
    const pendingElement = this.searchDirectives.pendingUiHighlightElement;
    if (!pendingElement) {
      return;
    }

    // Try to find the directive immediately
    const directive = this.searchDirectives.get(pendingElement);

    if (directive) {
      directive.highlight(pendingElement);
      this.searchDirectives.setPendingUiHighlightElement(null);
    } else {
      // Directive not found yet (table data still loading) - wait for it to be registered
      const subscription = this.searchDirectives.directiveAdded$.pipe(
        filter((added) => !!added),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe(() => {
        const foundDirective = this.searchDirectives.get(pendingElement);
        if (foundDirective) {
          foundDirective.highlight(pendingElement);
          this.searchDirectives.setPendingUiHighlightElement(null);
          subscription.unsubscribe();
        }
      });

      // Set a timeout to clean up if directive is never found
      setTimeout(() => {
        if (this.searchDirectives.pendingUiHighlightElement === pendingElement) {
          this.searchDirectives.setPendingUiHighlightElement(null);
          subscription.unsubscribe();
        }
      }, 10000); // 10 second timeout
    }
  }

  ngAfterViewInit(): void {
    this.sidenavService.setSidenav(this.sideNavs?.first);
    this.disableSidenavFocusTrap();
  }

  private disableSidenavFocusTrap(): void {
    this.sideNavs?.forEach((sidenav) => {
      const sidenavWithFocusTrap = sidenav as unknown as { _focusTrap?: { enabled: boolean } };
      if (sidenavWithFocusTrap._focusTrap) {
        sidenavWithFocusTrap._focusTrap.enabled = false;
      }
    });

    // Also remove any focus trap anchors from DOM
    const focusTrapAnchors = document.querySelectorAll('.cdk-focus-trap-anchor');
    focusTrapAnchors.forEach((anchor) => anchor.remove());
  }

  ngOnDestroy(): void {
    this.sessionTimeoutService.stop();
  }

  private listenForSidenavChanges(): void {
    this.sideNavs?.changes.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.sidenavService.setSidenav(this.sideNavs.first);
    });
  }

  toggleMenu(menuInfo?: [string, SubMenuItem[]]): void {
    this.sidenavService.toggleSecondaryMenu(menuInfo);
  }

  onMenuClosed(): void {
    this.sidenavService.closeSecondaryMenu();
  }

  onAlertsPanelClosed(): void {
    this.store$.dispatch(alertPanelClosed());
  }
}
