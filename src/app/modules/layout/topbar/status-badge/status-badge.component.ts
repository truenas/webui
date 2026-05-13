import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TnIconComponent } from '@truenas/ui-components';

export type StatusBadgeKind = 'success' | 'error' | 'warning' | 'tier-foundation' | 'tier-plus' | 'tier-business';

export interface StatusBadge {
  icon?: string;
  label?: string;
  kind: StatusBadgeKind;
}

@Component({
  selector: 'ix-status-badge',
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TnIconComponent],
  host: {
    'aria-hidden': 'true',
    '[class.success]': 'kind() === "success"',
    '[class.error]': 'kind() === "error"',
    '[class.warning]': 'kind() === "warning"',
    '[class.tier-foundation]': 'kind() === "tier-foundation"',
    '[class.tier-plus]': 'kind() === "tier-plus"',
    '[class.tier-business]': 'kind() === "tier-business"',
  },
})
export class StatusBadgeComponent {
  readonly icon = input<string | null>(null);
  readonly label = input<string | null>(null);
  readonly kind = input.required<StatusBadgeKind>();
}
