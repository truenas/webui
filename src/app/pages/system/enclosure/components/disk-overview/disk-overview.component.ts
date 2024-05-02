import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';

@Component({
  selector: 'ix-disk-overview',
  templateUrl: './disk-overview.component.html',
  styleUrls: ['./disk-overview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiskOverviewComponent {
  slot = input.required<DashboardEnclosureSlot | null>();
}
