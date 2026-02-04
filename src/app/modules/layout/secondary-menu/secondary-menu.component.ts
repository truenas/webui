import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, inject, input, output,
} from '@angular/core';
import { MatList, MatListItem } from '@angular/material/list';
import { MatTooltip } from '@angular/material/tooltip';
import { RouterLinkActive, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { HasAccessDirective } from 'app/directives/has-access/has-access.directive';
import { AlertBadgeType } from 'app/enums/alert-badge-type.enum';
import { SubMenuItem } from 'app/interfaces/menu-item.interface';
import { AlertNavBadgeService } from 'app/modules/alerts/services/alert-nav-badge.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-secondary-menu',
  templateUrl: './secondary-menu.component.html',
  styleUrls: ['./secondary-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxIconComponent,
    MatList,
    MatListItem,
    MatTooltip,
    RouterLinkActive,
    RouterLink,
    AsyncPipe,
    TranslateModule,
    HasAccessDirective,
    TestDirective,
  ],
})
export class SecondaryMenuComponent {
  private alertNavBadgeService = inject(AlertNavBadgeService);

  protected readonly AlertBadgeType = AlertBadgeType;

  readonly menuName = input<string>();
  readonly subMenuItems = input<SubMenuItem[]>();

  readonly toggleMenu = output();

  // Alert badge counts for all menu paths
  badgeCounts = this.alertNavBadgeService.getBadgeCountsSignal();

  /**
   * Get badge count for a submenu item
   */
  getBadgeCount(subItem: SubMenuItem): number {
    const menuNameValue = this.menuName();
    if (!menuNameValue) return 0;

    const pathArray = [menuNameValue, subItem.state];
    return this.alertNavBadgeService.getBadgeCountForPath(pathArray, this.badgeCounts());
  }

  /**
   * Check if submenu item has critical alerts (for badge color)
   */
  hasCriticalAlerts(subItem: SubMenuItem): boolean {
    const menuNameValue = this.menuName();
    if (!menuNameValue) return false;

    const pathArray = [menuNameValue, subItem.state];
    return this.alertNavBadgeService.hasCriticalAlerts(pathArray, this.badgeCounts());
  }

  /**
   * Get badge type (critical, warning, or info) for styling
   */
  getBadgeType(subItem: SubMenuItem): AlertBadgeType {
    const menuNameValue = this.menuName();
    if (!menuNameValue) return AlertBadgeType.Info;

    const pathArray = [menuNameValue, subItem.state];
    return this.alertNavBadgeService.getBadgeTypeForPath(pathArray, this.badgeCounts());
  }

  /**
   * Get badge tooltip for accessibility
   */
  getBadgeTooltip(subItem: SubMenuItem): string {
    const menuNameValue = this.menuName();
    if (!menuNameValue) return '';

    const pathArray = [menuNameValue, subItem.state];
    return this.alertNavBadgeService.getBadgeTooltip(pathArray, this.badgeCounts());
  }

  /**
   * Get icon for badge based on alert type
   */
  getBadgeIcon(subItem: SubMenuItem): string {
    const badgeType = this.getBadgeType(subItem);
    return this.alertNavBadgeService.getBadgeIconForType(badgeType);
  }
}
