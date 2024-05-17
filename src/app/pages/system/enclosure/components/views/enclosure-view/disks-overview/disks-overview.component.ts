import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';

@Component({
  selector: 'ix-disks-overview',
  templateUrl: './disks-overview.component.html',
  styleUrls: ['./disks-overview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisksOverviewComponent {
  slot = input.required<DashboardEnclosureSlot | null>();
}
