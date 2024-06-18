import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';

@Component({
  selector: 'ix-disk-topology-description',
  styleUrl: './disk-topology-description.component.scss',
  templateUrl: './disk-topology-description.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiskTopologyDescriptionComponent {
  selectedSlot = input.required<DashboardEnclosureSlot>();
}
