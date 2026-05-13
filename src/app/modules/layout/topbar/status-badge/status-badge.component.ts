import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TnIconComponent } from '@truenas/ui-components';

export type StatusBadgeKind = 'success' | 'error';

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
  },
})
export class StatusBadgeComponent {
  readonly icon = input.required<string>();
  readonly kind = input.required<StatusBadgeKind>();
}
