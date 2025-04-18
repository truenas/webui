import { AsyncPipe } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  MatDrawerMode, MatSidenav, MatSidenavContainer, MatSidenavContent,
} from '@angular/material/sidenav';
import { MatTooltip } from '@angular/material/tooltip';
import { RouterOutlet } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { map } from 'rxjs';
import { exploreNasEnterpriseLink } from 'app/constants/explore-nas-enterprise-link.constant';
import { productTypeLabels } from 'app/enums/product-type.enum';
import { hashMessage } from 'app/helpers/hash-message';
import { SubMenuItem } from 'app/interfaces/menu-item.interface';
import { AlertsPanelComponent } from 'app/modules/alerts/components/alerts-panel/alerts-panel.component';
import { alertPanelClosed } from 'app/modules/alerts/store/alert.actions';
import { selectIsAlertPanelOpen } from 'app/modules/alerts/store/alert.selectors';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { LanguageService } from 'app/modules/language/language.service';
import { ConsoleFooterComponent } from 'app/modules/layout/console-footer/console-footer.component';
import { CopyrightLineComponent } from 'app/modules/layout/copyright-line/copyright-line.component';
import { NavigationComponent } from 'app/modules/layout/navigation/navigation.component';
import { SecondaryMenuComponent } from 'app/modules/layout/secondary-menu/secondary-menu.component';
import { SidenavService } from 'app/modules/layout/sidenav.service';
import { TopbarComponent } from 'app/modules/layout/topbar/topbar.component';
import { TruenasLogoComponent } from 'app/modules/layout/topbar/truenas-logo/truenas-logo.component';
import { DefaultPageHeaderComponent } from 'app/modules/page-header/default-page-header/default-page-header.component';
import { SlideInControllerComponent } from 'app/modules/slide-ins/components/slide-in-controller/slide-in-controller.component';
import { ThemeService } from 'app/modules/theme/theme.service';
import { SentryConfigurationService } from 'app/services/errors/sentry-configuration.service';
import { SessionTimeoutService } from 'app/services/session-timeout.service';
import { AppState } from 'app/store';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';
import { selectHasConsoleFooter } from 'app/store/system-config/system-config.selectors';
import {
  selectCopyrightHtml, selectProductType, waitForSystemInfo,
} from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatSidenavContainer,
    MatSidenav,
    IxIconComponent,
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
    SlideInControllerComponent,
    AsyncPipe,
    TranslateModule,
    TruenasLogoComponent,
  ],
})
export class AdminLayoutComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren(MatSidenav) private sideNavs: QueryList<MatSidenav>;

  protected readonly iconMarker = iconMarker;
  readonly hostname$ = this.store$.pipe(waitForSystemInfo, map(({ hostname }) => hostname));
  readonly isAlertPanelOpen$ = this.store$.select(selectIsAlertPanelOpen);
  readonly hasConsoleFooter$ = this.store$.select(selectHasConsoleFooter);
  readonly copyrightHtml = toSignal(this.store$.select(selectCopyrightHtml));
  readonly productType = toSignal(this.store$.select(selectProductType));
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

  constructor(
    private themeService: ThemeService,
    private sidenavService: SidenavService,
    private store$: Store<AppState>,
    private languageService: LanguageService,
    private sessionTimeoutService: SessionTimeoutService,
    private sentryService: SentryConfigurationService,
  ) {}

  ngOnInit(): void {
    performance.mark('Admin Init');
    performance.measure('Login', 'Login Start', 'Admin Init');
    this.sessionTimeoutService.start();
    this.themeService.loadTheme$.next('');
    this.sentryService.init();
    this.store$.pipe(waitForPreferences, untilDestroyed(this)).subscribe((config) => {
      this.languageService.setLanguage(config.language);
    });
    this.listenForSidenavChanges();
  }

  ngAfterViewInit(): void {
    this.sidenavService.setSidenav(this.sideNavs?.first);
  }

  ngOnDestroy(): void {
    this.sessionTimeoutService.stop();
  }

  listenForSidenavChanges(): void {
    this.sideNavs?.changes.pipe(untilDestroyed(this)).subscribe(() => {
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
