import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, input, output, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatNavList, MatListItem } from '@angular/material/list';
import { MatTooltip } from '@angular/material/tooltip';
import { NavigationEnd, Router, RouterLinkActive, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { filter } from 'rxjs';
import { AlertBadgeType } from 'app/enums/alert-badge-type.enum';
import { MenuItem, MenuItemType, SubMenuItem } from 'app/interfaces/menu-item.interface';
import { AlertNavBadgeService } from 'app/modules/alerts/services/alert-nav-badge.service';
import { SidenavService } from 'app/modules/layout/sidenav.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { NavigationService } from 'app/services/navigation/navigation.service';

@Component({
  selector: 'ix-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatNavList,
    MatListItem,
    RouterLinkActive,
    RouterLink,
    MatTooltip,
    TnIconComponent,
    AsyncPipe,
    TranslateModule,
    TestDirective,
  ],
})
export class NavigationComponent {
  private navService = inject(NavigationService);
  private alertNavBadgeService = inject(AlertNavBadgeService);

  protected readonly AlertBadgeType = AlertBadgeType;
  protected readonly MenuItemType = MenuItemType;
  private sidenavService = inject(SidenavService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  readonly isSidenavCollapsed = input(false);

  readonly menuToggled = output<[string, SubMenuItem[]]>();
  readonly menuClosed = output();

  menuItems = this.navService.menuItems;

  // Alert badge counts for all menu paths
  badgeCounts = this.alertNavBadgeService.getBadgeCountsSignal();

  constructor() {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed(),
    ).subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  toggleMenu(state: string, sub: SubMenuItem[]): void {
    this.menuToggled.emit([state, sub]);
  }

  closeMenu(): void {
    this.menuClosed.emit();
  }

  protected isSlideOutActive(state: string): boolean {
    return this.router.isActive(state, {
      paths: 'subset',
      queryParams: 'ignored',
      fragment: 'ignored',
      matrixParams: 'ignored',
    });
  }

  protected isMenuExpanded(state: string): boolean {
    return this.sidenavService.isOpenSecondaryMenu && this.sidenavService.menuName === state;
  }

  getItemName(item: MenuItem): string {
    return `${item.name.replace(' ', '_')}-menu`;
  }

  getRouterLink(url: string): string[] {
    return ['/', ...url.split('/')];
  }

  /**
   * Get badge count for a menu item
   */
  getBadgeCount(item: MenuItem): number {
    const pathArray = item.state.split('/').filter((segment) => segment);
    return this.alertNavBadgeService.getBadgeCountForPath(pathArray, this.badgeCounts());
  }

  /**
   * Check if menu item has critical alerts (for badge color)
   */
  hasCriticalAlerts(item: MenuItem): boolean {
    const pathArray = item.state.split('/').filter((segment) => segment);
    return this.alertNavBadgeService.hasCriticalAlerts(pathArray, this.badgeCounts());
  }

  /**
   * Get badge type (critical, warning, or info) for styling
   */
  getBadgeType(item: MenuItem): AlertBadgeType {
    const pathArray = item.state.split('/').filter((segment) => segment);
    return this.alertNavBadgeService.getBadgeTypeForPath(pathArray, this.badgeCounts());
  }

  /**
   * Get badge tooltip for accessibility
   */
  getBadgeTooltip(item: MenuItem): string {
    const pathArray = item.state.split('/').filter((segment) => segment);
    return this.alertNavBadgeService.getBadgeTooltip(pathArray, this.badgeCounts());
  }

  /**
   * Get icon for badge based on alert type
   */
  getBadgeIcon(item: MenuItem): string {
    const badgeType = this.getBadgeType(item);
    return this.alertNavBadgeService.getBadgeIconForType(badgeType);
  }
}
