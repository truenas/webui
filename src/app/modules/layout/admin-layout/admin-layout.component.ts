import { NgClass, AsyncPipe, LowerCasePipe } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
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
import { RouterLink, RouterOutlet } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { map } from 'rxjs';
import { productTypeLabels } from 'app/enums/product-type.enum';
import { SubMenuItem } from 'app/interfaces/menu-item.interface';
import { AlertsModule } from 'app/modules/alerts/alerts.module';
import { alertPanelClosed } from 'app/modules/alerts/store/alert.actions';
import { selectIsAlertPanelOpen } from 'app/modules/alerts/store/alert.selectors';
import { IxChainedSlideInComponent } from 'app/modules/forms/ix-forms/components/ix-slide-in/components/ix-chained-slide-in/ix-chained-slide-in.component';
import { IxSlideInComponent } from 'app/modules/forms/ix-forms/components/ix-slide-in/ix-slide-in.component';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { ConsoleFooterComponent } from 'app/modules/layout/console-footer/console-footer.component';
import { CopyrightLineComponent } from 'app/modules/layout/copyright-line/copyright-line.component';
import { NavigationComponent } from 'app/modules/layout/navigation/navigation.component';
import { SecondaryMenuComponent } from 'app/modules/layout/secondary-menu/secondary-menu.component';
import { TopbarComponent } from 'app/modules/layout/topbar/topbar.component';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { LanguageService } from 'app/services/language.service';
import { SentryService } from 'app/services/sentry.service';
import { SidenavService } from 'app/services/sidenav.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { ThemeService } from 'app/services/theme/theme.service';
import { TokenLifetimeService } from 'app/services/token-lifetime.service';
import { AppsState } from 'app/store';
import { selectHasConsoleFooter, waitForGeneralConfig } from 'app/store/system-config/system-config.selectors';
import { selectBuildYear, waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatSidenavContainer,
    MatSidenav,
    NgClass,
    RouterLink,
    TestIdModule,
    IxIconModule,
    NavigationComponent,
    SecondaryMenuComponent,
    MatTooltip,
    CopyrightLineComponent,
    MatSidenavContent,
    TopbarComponent,
    PageHeaderModule,
    RouterOutlet,
    ConsoleFooterComponent,
    AlertsModule,
    IxSlideInComponent,
    IxChainedSlideInComponent,
    AsyncPipe,
    LowerCasePipe,
    TranslateModule,
    MapValuePipe,
  ],
})
export class AdminLayoutComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren(MatSidenav) private sideNavs: QueryList<MatSidenav>;

  readonly hostname$ = this.store$.pipe(waitForSystemInfo, map(({ hostname }) => hostname));
  readonly isAlertPanelOpen$ = this.store$.select(selectIsAlertPanelOpen);
  readonly hasConsoleFooter$ = this.store$.select(selectHasConsoleFooter);
  readonly productType$ = this.sysGeneralService.getProductType$;
  readonly copyrightYear = toSignal(this.store$.select(selectBuildYear));
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

  get isOpenSecondaryMenu(): boolean {
    return this.sidenavService.isOpenSecondaryMenu;
  }

  get subs(): SubMenuItem[] {
    return this.sidenavService.subs;
  }

  get menuName(): string {
    return this.sidenavService.menuName;
  }

  constructor(
    private themeService: ThemeService,
    private sysGeneralService: SystemGeneralService,
    private sidenavService: SidenavService,
    private store$: Store<AppsState>,
    private languageService: LanguageService,
    private tokenLifetimeService: TokenLifetimeService,
    private sentryService: SentryService,
  ) {}

  ngOnInit(): void {
    performance.mark('Admin Init');
    performance.measure('Login', 'Login Start', 'Admin Init');
    this.tokenLifetimeService.start();
    this.themeService.loadTheme$.next('');
    this.sentryService.init();
    this.store$.pipe(waitForGeneralConfig, untilDestroyed(this)).subscribe((config) => {
      this.languageService.setLanguage(config.language);
    });
    this.listenForSidenavChanges();
  }

  ngAfterViewInit(): void {
    this.sidenavService.setSidenav(this.sideNavs?.first);
  }

  ngOnDestroy(): void {
    this.tokenLifetimeService.stop();
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
