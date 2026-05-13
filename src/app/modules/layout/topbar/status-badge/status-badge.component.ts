import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TnIconComponent } from '@truenas/ui-components';

export interface StatusBadge {
  icon?: string;
  label?: string;
  background: string;
  spinning?: boolean;
}

@Component({
  selector: 'ix-status-badge',
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TnIconComponent],
  host: {
    'aria-hidden': 'true',
    '[class.spinning]': 'spinning()',
    '[style.background]': 'background()',
  },
})
export class StatusBadgeComponent {
  readonly icon = input<string | null>(null);
  readonly label = input<string | null>(null);
  readonly background = input.required<string>();
  readonly spinning = input(false);
}
