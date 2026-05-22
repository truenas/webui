import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { TnIconComponent } from '@truenas/ui-components';

export type StatusBadge
  = { icon: string; background: string; spinning?: boolean }
    | { label: string; background: string };

@Component({
  selector: 'ix-status-badge',
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TnIconComponent],
  host: {
    'aria-hidden': 'true',
    '[class.spinning]': 'isSpinning()',
    '[style.background]': 'badge().background',
  },
})
export class StatusBadgeComponent {
  readonly badge = input.required<StatusBadge>();

  protected iconBadge = computed(() => {
    const value = this.badge();
    return StatusBadgeComponent.isIconBadge(value) ? value : null;
  });

  protected labelBadge = computed(() => {
    const value = this.badge();
    return StatusBadgeComponent.isIconBadge(value) ? null : value;
  });

  protected isSpinning = computed(() => {
    const value = this.badge();
    return StatusBadgeComponent.isIconBadge(value) && !!value.spinning;
  });

  static isIconBadge(badge: StatusBadge): badge is Extract<StatusBadge, { icon: string }> {
    return 'icon' in badge;
  }
}
