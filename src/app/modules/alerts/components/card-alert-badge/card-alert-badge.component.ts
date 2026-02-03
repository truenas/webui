import {
  ChangeDetectionStrategy, Component, computed, inject, input,
} from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AlertBadgeType } from 'app/enums/alert-badge-type.enum';
import { AlertNavBadgeService } from 'app/modules/alerts/services/alert-nav-badge.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';

@Component({
  selector: 'ix-card-alert-badge',
  templateUrl: './card-alert-badge.component.html',
  styleUrls: ['./card-alert-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxIconComponent,
    MatTooltip,
    TranslateModule,
  ],
})
export class CardAlertBadgeComponent {
  private alertNavBadgeService = inject(AlertNavBadgeService);
  private translate = inject(TranslateService);

  protected readonly AlertBadgeType = AlertBadgeType;

  readonly menuPath = input.required<string[]>();

  private readonly badgeCounts = this.alertNavBadgeService.getBadgeCountsSignal();

  protected readonly count = computed(() => {
    return this.alertNavBadgeService.getBadgeCountForPath(this.menuPath(), this.badgeCounts());
  });

  protected readonly hasCritical = computed(() => {
    return this.alertNavBadgeService.hasCriticalAlerts(this.menuPath(), this.badgeCounts());
  });

  protected readonly badgeType = computed((): AlertBadgeType => {
    return this.alertNavBadgeService.getBadgeTypeForPath(this.menuPath(), this.badgeCounts());
  });

  protected readonly tooltip = computed(() => {
    const badgeCount = this.count();
    const counts = this.badgeCounts().get(this.menuPath().join('.'));

    if (badgeCount === 0 || !counts) return '';

    const parts: string[] = [];
    if (counts.critical > 0) {
      parts.push(this.translate.instant(
        '{count, plural, =1 {1 critical alert} other {# critical alerts}}',
        { count: counts.critical },
      ));
    }
    if (counts.warning > 0) {
      parts.push(this.translate.instant(
        '{count, plural, =1 {1 warning} other {# warnings}}',
        { count: counts.warning },
      ));
    }
    if (counts.info > 0) {
      parts.push(this.translate.instant(
        '{count, plural, =1 {1 info alert} other {# info alerts}}',
        { count: counts.info },
      ));
    }

    return parts.join(', ');
  });

  protected getIconForBadgeType(): string {
    return this.alertNavBadgeService.getBadgeIconForType(this.badgeType());
  }
}
