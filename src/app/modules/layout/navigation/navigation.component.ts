import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output, inject } from '@angular/core';
import { MatNavList, MatListItem } from '@angular/material/list';
import { MatTooltip } from '@angular/material/tooltip';
import { RouterLinkActive, RouterLink } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { MenuItem, MenuItemType, SubMenuItem } from 'app/interfaces/menu-item.interface';
import { AlertNavBadgeService } from 'app/modules/alerts/services/alert-nav-badge.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { NavigationService } from 'app/services/navigation/navigation.service';

@UntilDestroy()
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
    IxIconComponent,
    AsyncPipe,
    TranslateModule,
    TestDirective,
  ],
})
export class NavigationComponent {
  private navService = inject(NavigationService);
  private alertNavBadgeService = inject(AlertNavBadgeService);

  readonly isSidenavCollapsed = input(false);

  readonly menuToggled = output<[string, SubMenuItem[]]>();
  readonly menuClosed = output();

  menuItems = this.navService.menuItems;
  isHighlighted: string;

  readonly MenuItemType = MenuItemType;

  // Alert badge counts for all menu paths
  badgeCounts = this.alertNavBadgeService.getBadgeCountsSignal();

  toggleMenu(state: string, sub: SubMenuItem[]): void {
    this.menuToggled.emit([state, sub]);
  }

  closeMenu(): void {
    this.menuClosed.emit();
  }

  updateHighlightedClass(state: string): void {
    this.isHighlighted = state;
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
   * Get badge tooltip for accessibility
   */
  getBadgeTooltip(item: MenuItem): string {
    const count = this.getBadgeCount(item);
    const isCritical = this.hasCriticalAlerts(item);

    if (count === 0) {
      return '';
    }

    if (isCritical) {
      return count === 1 ? '1 critical alert' : `${count} critical alerts`;
    }
    return count === 1 ? '1 warning' : `${count} warnings`;
  }
}
