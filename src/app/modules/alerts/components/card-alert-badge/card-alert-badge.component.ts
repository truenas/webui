import {
  ChangeDetectionStrategy, Component, computed, inject, input,
} from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { AlertBadgeType } from 'app/enums/alert-badge-type.enum';
import { AlertNavBadgeService } from 'app/modules/alerts/services/alert-nav-badge.service';

@Component({
  selector: 'ix-card-alert-badge',
  templateUrl: './card-alert-badge.component.html',
  styleUrls: ['./card-alert-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TnIconComponent,
    MatTooltip,
    TranslateModule,
  ],
})
export class CardAlertBadgeComponent {
  private alertNavBadgeService = inject(AlertNavBadgeService);

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
    return this.alertNavBadgeService.getBadgeTooltip(this.menuPath(), this.badgeCounts());
  });

  protected getIconForBadgeType(): string {
    return this.alertNavBadgeService.getBadgeIconForType(this.badgeType());
  }
}
