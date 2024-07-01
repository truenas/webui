import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';

@Component({
  selector: 'ix-mini-pools',
  templateUrl: './mini-pools.component.html',
  styleUrl: './mini-pools.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MiniPoolsComponent {
  readonly slots = input.required<DashboardEnclosureSlot[]>();
}
