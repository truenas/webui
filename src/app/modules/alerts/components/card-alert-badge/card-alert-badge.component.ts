import {
  ChangeDetectionStrategy, Component, computed, inject, input,
} from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { AlertNavBadgeService } from 'app/modules/alerts/services/alert-nav-badge.service';

@Component({
  selector: 'ix-card-alert-badge',
  templateUrl: './card-alert-badge.component.html',
  styleUrls: ['./card-alert-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatTooltip,
    TranslateModule,
  ],
})
export class CardAlertBadgeComponent {
  private alertNavBadgeService = inject(AlertNavBadgeService);

  readonly menuPath = input.required<string[]>();

  private readonly badgeCounts = this.alertNavBadgeService.getBadgeCountsSignal();

  protected readonly count = computed(() => {
    return this.alertNavBadgeService.getBadgeCountForPath(this.menuPath(), this.badgeCounts());
  });

  protected readonly hasCritical = computed(() => {
    return this.alertNavBadgeService.hasCriticalAlerts(this.menuPath(), this.badgeCounts());
  });

  protected readonly tooltip = computed(() => {
    const badgeCount = this.count();
    const isCritical = this.hasCritical();

    if (badgeCount === 0) return '';

    if (isCritical) {
      return badgeCount === 1 ? '1 critical alert' : `${badgeCount} critical alerts`;
    }
    return badgeCount === 1 ? '1 warning' : `${badgeCount} warnings`;
  });
}
